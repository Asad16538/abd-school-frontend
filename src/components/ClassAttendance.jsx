import React, { useState } from 'react';
import axios from 'axios';
import { Calendar, ShieldAlert, CheckCircle, Search, Save, AlertCircle, RefreshCw } from 'lucide-react';

const ClassAttendance = () => {
    const BASE_URL = 'https://erp-api.aapschool.in';

    // States
    const [className, setClassName] = useState('');
    const [sectionName, setSectionName] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [loading, setLoading] = useState(false);
    
    // Status Tracker: 'INIT' (Shuruat), 'OPEN' (Normal Day), 'LOCKED' (Sunday/Holiday)
    const [dayStatus, setDayStatus] = useState('INIT'); 
    const [lockMessage, setLockMessage] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    const classesList = [
        'Nursery', 'LKG', 'UKG',
        'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 
        'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
        'Class 11 (PCB)','Class 11 (PCM)', 'Class 11 (Commerce)', 'Class 11 (Arts)',
        'Class 12 (PCB)','Class 12 (PCM)', 'Class 12 (Commerce)', 'Class 12 (Arts)',
        'Class 12th (PCB)','Class 12th (PCM)', 'Class 12th (Commerce)', 'Class 12th (Arts)'
    ];
    const sectionsList = ['A', 'B', 'C'];

    // 🔍 1. Fetch Students & Check Holiday Status (WITH RETRY LOGIC)
    const fetchStudents = async () => {
        if (!className || !sectionName) {
            setMessage({ type: 'error', text: 'Bhai, pehle Class aur Section select karo!' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });
        setStudents([]);
        setDayStatus('INIT');

        // ✅ RETRY LOGIC: 3 attempts with 2-second delay
        let lastError = null;
        let success = false;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`🔄 Attempt ${attempt}/3: Fetching students...`);

                const response = await axios.get(`${BASE_URL}/api/attendance/students`, {
                    params: { class: className, section: sectionName, date: selectedDate },
                    timeout: 15000  // 15 second timeout
                });

                // ✅ SUCCESS - Handle response
                if (response.data.status === 'LOCKED') {
                    // Sunday ya Holiday hai
                    setDayStatus('LOCKED');
                    setLockMessage(response.data.message);
                    setMessage({ type: 'info', text: response.data.message });
                } else {
                    // Normal Working Day
                    setDayStatus('OPEN');
                    const fetchedStudents = response.data.students || [];
                    setStudents(fetchedStudents);

                    // Default status everyone 'Present'
                    const initialAttendance = {};
                    fetchedStudents.forEach(student => {
                        initialAttendance[student.id] = 'Present';
                    });
                    setAttendanceRecords(initialAttendance);

                    if (fetchedStudents.length === 0) {
                        setMessage({ 
                            type: 'info', 
                            text: `Is Class (${className} - ${sectionName}) mein koi student register nahi hai. Pehle student register karo.` 
                        });
                    } else {
                        setMessage({ 
                            type: 'success', 
                            text: `✅ ${fetchedStudents.length} students mil gaye. Ab attendance mark karo.` 
                        });
                    }
                }

                success = true;
                break;  // ✅ Exit retry loop on success

            } catch (error) {
                lastError = error;
                console.warn(`❌ Attempt ${attempt} failed:`, error.message);

                // Agar last attempt nahi hai, toh 2 second wait karo
                if (attempt < 3) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }

        // ✅ Agar teeno attempt fail ho gaye
        if (!success) {
            let errorMsg = 'Server se connect nahi ho paya. ';

            if (lastError?.code === 'ECONNABORTED' || lastError?.message?.includes('timeout')) {
                errorMsg += 'Server response slow hai. Thodi der baad try karo.';
            } else if (lastError?.code === 'ERR_NETWORK' || lastError?.message?.includes('Network')) {
                errorMsg += 'Internet connection check karo ya backend server restart karo.';
            } else if (lastError?.response?.data?.error) {
                errorMsg = lastError.response.data.error;
            } else {
                errorMsg += '3 baar try kiya, phir bhi fail. Backend server down ho sakta hai.';
            }

            setMessage({ type: 'error', text: errorMsg });
        }

        setLoading(false);
    };

    // 🔄 2. Individual Student Status Change
    const handleStatusChange = (studentId, newStatus) => {
        setAttendanceRecords(prev => ({ ...prev, [studentId]: newStatus }));
    };

    // 💾 3. Submit Attendance Records (WITH RETRY LOGIC)
    const handleSubmitAttendance = async () => {
        if (students.length === 0 || dayStatus === 'LOCKED') return;

        setLoading(true);
        setMessage({ type: '', text: '' });

        const recordsArray = Object.keys(attendanceRecords).map(id => ({
            student_id: parseInt(id),
            status: attendanceRecords[id]
        }));

        // ✅ RETRY LOGIC for submit
        let lastError = null;
        let success = false;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`🔄 Submit attempt ${attempt}/3...`);

                const response = await axios.post(`${BASE_URL}/api/attendance/submit`, {
                    class: className,
                    section: sectionName,
                    date: selectedDate,
                    records: recordsArray
                }, {
                    timeout: 15000
                });

                setMessage({ 
                    type: 'success', 
                    text: response.data.message || '✅ Attendance successfully save ho gayi!' 
                });
                success = true;
                break;

            } catch (error) {
                lastError = error;
                console.warn(`❌ Submit attempt ${attempt} failed:`, error.message);

                if (attempt < 3) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }

        if (!success) {
            setMessage({ 
                type: 'error', 
                text: lastError?.response?.data?.error || 
                      'Attendance save nahi ho payi. 3 baar try kiya. Server check karo.' 
            });
        }

        setLoading(false);
    };

    return (
        <div className="p-4 max-w-5xl mx-auto">
            {/* Module Banner */}
            <div className="mb-6 bg-gradient-to-r from-slate-800 to-indigo-900 p-5 rounded-2xl text-white shadow-md flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black tracking-tight flex items-center gap-2">📋 Student Attendance Panel</h2>
                    <p className="text-[11px] text-indigo-200 font-bold uppercase tracking-wider">A.B.Digital Work • Live Operational Gateway</p>
                </div>
                <Calendar className="w-8 h-8 text-indigo-300 opacity-60" />
            </div>

            {/* Filter Panel */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Class</label>
                    <select 
                        value={className} 
                        onChange={(e) => setClassName(e.target.value)} 
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">-- Select Class --</option>
                        {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Section</label>
                    <select 
                        value={sectionName} 
                        onChange={(e) => setSectionName(e.target.value)} 
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">-- Select Section --</option>
                        {sectionsList.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Target Date</label>
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)} 
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500" 
                    />
                </div>

                <div className="flex items-end gap-2">
                    <button 
                        onClick={fetchStudents} 
                        disabled={loading} 
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" /> Checking...
                            </>
                        ) : (
                            <>
                                <Search className="w-4 h-4" /> Search Roster
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Notification/Alert Container */}
            {message.text && (
                <div className={`p-4 rounded-xl mb-6 text-xs font-bold text-center flex items-center justify-center gap-2 border ${
                    message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 
                    message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 
                    'bg-blue-50 border-blue-200 text-blue-700'
                }`}>
                    {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* 🔒 DAY LOCK SCREEN BANNER (Sunday / Holiday) */}
            {dayStatus === 'LOCKED' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center shadow-sm max-w-xl mx-auto my-4 flex flex-col items-center justify-center gap-3">
                    <ShieldAlert className="w-12 h-12 text-amber-500 animate-bounce" />
                    <h3 className="text-base font-black text-amber-900 uppercase tracking-wide">Operation Restricted</h3>
                    <p className="text-xs font-bold text-amber-700">{lockMessage}</p>
                    <p className="text-[10px] text-amber-600 mt-2">
                        💡 Tip: Working day (Monday-Saturday) ki date select karo.
                    </p>
                </div>
            )}

            {/* 📝 WORKING STUDENT ATTENDANCE TABLE */}
            {dayStatus === 'OPEN' && students.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-medium">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b">
                                    <th className="p-4 w-24">Roll No</th>
                                    <th className="p-4">Student Name</th>
                                    <th className="p-4 text-center w-80">Attendance Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {students.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50/60 transition-all">
                                        <td className="p-4 font-black text-gray-500">{student.roll_no || '-'}</td>
                                        <td className="p-4 font-black text-gray-800 text-sm">{student.name}</td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-1.5">
                                                {['Present', 'Absent', 'Leave', 'Late'].map((status) => {
                                                    const colorMap = {
                                                        Present: 'bg-green-600 text-white shadow-md shadow-green-200',
                                                        Absent: 'bg-red-600 text-white shadow-md shadow-red-200',
                                                        Leave: 'bg-amber-500 text-white shadow-md shadow-amber-200',
                                                        Late: 'bg-orange-500 text-white shadow-md shadow-orange-200'
                                                    };
                                                    const isActive = attendanceRecords[student.id] === status;
                                                    return (
                                                        <button
                                                            key={status}
                                                            onClick={() => handleStatusChange(student.id, status)}
                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer ${
                                                                isActive ? colorMap[status] : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            {status === 'Present' ? 'P' : status === 'Absent' ? 'A' : status === 'Leave' ? 'L' : 'Late'}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Submit Panel Footer */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={handleSubmitAttendance}
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-black text-xs uppercase tracking-wider py-3 px-8 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" /> Commit Attendance
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* 📭 EMPTY STATE: No students found */}
            {dayStatus === 'OPEN' && students.length === 0 && !loading && (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-8 text-center">
                    <p className="text-sm font-bold text-gray-600 mb-2">📭 Koi student nahi mila</p>
                    <p className="text-xs text-gray-500">
                        Is Class ({className}) aur Section ({sectionName}) mein abhi tak koi student register nahi hua.
                    </p>
                    <p className="text-[10px] text-gray-400 mt-3">
                        💡 Tip: Pehle "Student Register" tab se student add karo, phir yahan attendance mark karo.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ClassAttendance;
