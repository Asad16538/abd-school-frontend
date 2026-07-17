import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { IdCard, Calendar, UserCheck, BookOpen, Printer, Palette } from 'lucide-react';

const BASE_URL = 'https://erp-api.aapschool.in';

const IDCardStudio = () => {
    // ============================================
    // 1️⃣ SARI STATES - PEHLE
    // ============================================
    const [classes] = useState([
        'Nursery', 'LKG', 'UKG',
        'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 
        'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
        'Class 11 (PCB)','Class 11 (PCM)', 'Class 11 (Commerce)', 'Class 11 (Arts)',
        'Class 12 (PCB)','Class 12 (PCM)', 'Class 12 (Commerce)', 'Class 12 (Arts)'
    ]);
    
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('All');
    const [students, setStudents] = useState([]);
    const [activeSubTab, setActiveSubTab] = useState('id-cards');
    const [loading, setLoading] = useState(false);
    const [timetableGrid, setTimetableGrid] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedSlotData, setSelectedSlotData] = useState(null);
    const [teachersList, setTeachersList] = useState([]);
    const [subjectsList, setSubjectsList] = useState([]);
    const [formSubjectId, setFormSubjectId] = useState('');
    const [formTeacherId, setFormTeacherId] = useState('');
    const [formStartTime, setFormStartTime] = useState('09:30');
    const [formEndTime, setFormEndTime] = useState('10:15');
    // Class Teacher Assignment States
    const [classTeacherClass, setClassTeacherClass] = useState('');
    const [classTeacherSection, setClassTeacherSection] = useState('A');  // ✅ YEH ADD KARO
    const [classTeacherId, setClassTeacherId] = useState('');
    const [classTeacherList, setClassTeacherList] = useState([]);

    // 🏫 MASTER TIMETABLE STATES
    const [masterTimetableData, setMasterTimetableData] = useState([]);
    const [masterFilterDay, setMasterFilterDay] = useState('All');
    const [masterFilterTeacher, setMasterFilterTeacher] = useState('All');
    const [masterFilterClass, setMasterFilterClass] = useState('All');
    const [masterStats, setMasterStats] = useState({
        totalSlots: 0,
        assignedSlots: 0,
        pendingSlots: 0,
        conflicts: 0
    });

    const [schoolSettings, setSchoolSettings] = useState({
        school_name: 'Smart School ERP',
        logo_url: 'https://via.placeholder.com/80',
        address: 'Madhya Pradesh, India',
        contact: '9876543210',
        principal_signature_url: 'https://via.placeholder.com/100x40?text=Signature'
    });
    const [selectedTemplate, setSelectedTemplate] = useState('classic-navy');
    const [configTotalPeriods, setConfigTotalPeriods] = useState(8);
    const [configLunchAfter, setConfigLunchAfter] = useState(4);

    // ============================================
    // 2️⃣ SARI FUNCTIONS - PHIR
    // ============================================
    const loadTeachersData = () => {
        axios.get(`${BASE_URL}/api/staff`)
            .then(res => { if(Array.isArray(res.data)) setTeachersList(res.data); })
            .catch(err => console.error("Faculty Sync Delay Handled Safely", err));
    };

        
    // 👨‍🏫 CLASS TEACHER ASSIGNMENT FUNCTIONS
    const handleAssignClassTeacher = async () => {
    if (!classTeacherClass || !classTeacherId) {
        alert("Class aur Teacher dono select karo!");
        return;
    }
    
    try {
        console.log("📤 Sending:", {
            class_name: classTeacherClass,
            section: classTeacherSection,  // ✅ YEH ADD KARO
            teacher_id: classTeacherId
        });
        
        const response = await axios.post(`${BASE_URL}/api/class-teacher/assign`, {
            class_name: classTeacherClass,
            section: classTeacherSection,  // ✅ YEH ADD KARO
            teacher_id: parseInt(classTeacherId)
        });
        
        console.log("📥 Response:", response.data);
        
        if (response.data.success) {
            alert(response.data.message);
            setClassTeacherClass('');
            setClassTeacherSection('A');  // ✅ YEH ADD KARO
            setClassTeacherId('');
            fetchClassTeachers();
        } else {
            alert("❌ " + response.data.error);
        }
    } catch (err) {
        console.error("❌ Error:", err.response?.data || err.message);
        alert("❌ Error: " + (err.response?.data?.error || err.message));
    }
};

    const fetchClassTeachers = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/api/class-teacher/list`);
            if (response.data.success) {
                setClassTeacherList(response.data.teachers);
            }
        } catch (err) {
            console.error("Error fetching class teachers:", err);
            setClassTeacherList([]);
        }
    };

    const removeClassTeacher = async (teacherId) => {
        if (!confirm("Kya aap is teacher ko class se hataana chahte hain?")) return;
        
        try {
            const response = await axios.delete(`${BASE_URL}/api/class-teacher/remove/${teacherId}`);
            if (response.data.success) {
                alert(response.data.message);
                fetchClassTeachers();
            }
        } catch (err) {
            alert("❌ Error: " + err.message);
        }
    };

    const handleVoiceAction = (jsonResponse) => {
        const { intent, target, payload } = typeof jsonResponse === 'string' ? JSON.parse(jsonResponse) : jsonResponse;
        if (intent === "NAVIGATE") {
            window.location.href = target; 
        } else if (intent === "ACTION") {
            if (target === "OPEN_FEE_MODAL") alert("Fee section action triggered successfully via Voice Assistant!");
            if (target === "TRIGGER_PRINT") window.print();
        } else if (intent === "WHATSAPP_MSG") {
            console.log("WhatsApp push notification queue logged:", payload?.target_group);
        }
    };

    const startVoiceCommand = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return alert("Browser voice support nahi karta bhai!");
        const recognition = new SpeechRecognition();
        recognition.lang = 'hi-IN';
        recognition.interimResults = false;
        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            console.log("User ne bola:", transcript);
            try {
                const response = await fetch(`${BASE_URL}/api/voice-command`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: transcript })
                });
                const jsonResponse = await response.json();
                handleVoiceAction(jsonResponse);
            } catch (err) {
                console.error("Voice command fail ho gaya:", err);
            }
        };
        recognition.start();
    };

    const handleSaveSlotSubmit = (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedSlotData) return;

    // ✅ Class name directly send karo, backend handle kar lega
    const payload = {
        class_id: selectedClass,  // "Class 10th" hi bhejo
        section: selectedSection === 'All' ? 'A' : selectedSection,
        day: selectedSlotData.day,
        period: selectedSlotData.period,
        start_time: formStartTime,
        end_time: formEndTime,
        subject_id: formSubjectId,
        teacher_id: formTeacherId || null
    };

    console.log("📤 Sending payload:", payload);

    axios.post(`${BASE_URL}/api/timetable/save-slot`, payload)
        .then(res => {
            if (res.data.success) {
                alert("🎉 Routine Matrix Saved Directly!");
                setShowModal(false);
                fetchTimetableSheet();
            }
        })
        .catch(err => {
            console.error("❌ Error:", err.response?.data || err.message);
            alert(err.response?.data?.error || "Matrix Network Error!");
        });
};

    const fetchTimetableSheet = () => {
        if (!selectedClass) return alert("Bhai pehle Class select karo!");
        const targetSection = selectedSection === 'All' ? 'A' : selectedSection;
        axios.get(`${BASE_URL}/api/timetable/fetch?class_id=${encodeURIComponent(selectedClass)}&section=${targetSection}`)
            .then(res => {
                if (res.data.success) {
                    setTimetableGrid(res.data.timetable);
                } else {
                    alert("Routine load nahi ho payi bhai!");
                }
            })
            .catch(err => console.error("Timetable Fetch Network Error:", err));
    };

    const fetchStudentsForCards = () => {
        if (!selectedClass) return alert('Bhai pehle Target Class select karo!');
        setLoading(true);
        axios.get(`${BASE_URL}/api/academic/class-students-cards?class_name=${encodeURIComponent(selectedClass)}&section=${selectedSection}`)
            .then(res => {
                if (res.data.success) {
                    setStudents(res.data.students);
                } else {
                    alert('Bhai records nahi mil paye!');
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    // 🏫 MASTER TIMETABLE FUNCTIONS
    const fetchMasterTimetable = () => {
        setLoading(true);
        axios.get(`${BASE_URL}/api/timetable/master-view`)
            .then(res => {
                if (res.data.success) {
                    let data = res.data.timetable || [];
                    if (masterFilterDay !== 'All') {
                        data = data.filter(slot => slot.day === masterFilterDay);
                    }
                    if (masterFilterTeacher !== 'All') {
                        data = data.filter(slot => slot.teacher_id === masterFilterTeacher);
                    }
                    if (masterFilterClass !== 'All') {
                        data = data.filter(slot => slot.class_name === masterFilterClass);
                    }
                    setMasterTimetableData(data);
                    calculateMasterStats(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Master timetable fetch error:", err);
                setLoading(false);
            });
    };

    const checkTeacherConflict = (slot) => {
        if (!slot.teacher_id) return false;
        return masterTimetableData.some(s =>
            s.teacher_id === slot.teacher_id &&
            s.day === slot.day &&
            s.period === slot.period &&
            s.id !== slot.id
        );
    };

    const calculateMasterStats = (data) => {
        const total = data.length;
        const assigned = data.filter(s => s.teacher_id).length;
        const pending = total - assigned;
        const conflicts = data.filter(s => checkTeacherConflict(s)).length;
        setMasterStats({
            totalSlots: total,
            assignedSlots: assigned,
            pendingSlots: pending,
            conflicts: conflicts
        });
    };

    const handlePrint = () => {
        window.print();
    };

    // 📊 EXPORT TO EXCEL
    const exportToExcel = (data, filename) => {
        if (!data || data.length === 0) {
            alert("Bhai pehle data load karo! Excel export nahi ho paayega.");
            return;
        }

        // Data ko format karo
        const exportData = data.map((slot, index) => ({
            'S.No': index + 1,
            'Day': slot.day || '',
            'Period': slot.period ? `Period ${slot.period}` : '',
            'Class': slot.class_name || '',
            'Section': slot.section ? `Section ${slot.section}` : '',
            'Subject': slot.subject || '—',
            'Teacher': slot.teacher_name || 'Not Assigned',
            'Start Time': slot.start_time || '',
            'End Time': slot.end_time || '',
            'Status': slot.teacher_id ? 'Assigned' : 'Pending'
        }));

        // Worksheet banayein
        const ws = XLSX.utils.json_to_sheet(exportData);
    
        // Column width set karein
        ws['!cols'] = [
            { wch: 6 },  // S.No
            { wch: 12 }, // Day
            { wch: 10 }, // Period
            { wch: 18 }, // Class
            { wch: 10 }, // Section
            { wch: 20 }, // Subject
            { wch: 25 }, // Teacher
            { wch: 12 }, // Start Time
            { wch: 12 }, // End Time
            { wch: 12 }  // Status
        ];

        // Workbook banayein
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Timetable');

        // Excel file generate karo
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    
        // Download karo
        saveAs(dataBlob, `${filename}.xlsx`);
    };

    // ============================================
    // 3️⃣ useEffect HOOKS - SAB KE BAAD
    // ============================================
    useEffect(() => {
        const loadInitialBranding = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/api/settings`);
                if (res.data) {
                    setSchoolSettings(prev => ({
                        ...prev,
                        school_name: res.data.school_name || prev.school_name,
                        logo_url: res.data.school_logo || prev.logo_url,
                        address: res.data.school_address || prev.address,
                        contact: res.data.school_mobile || prev.contact,
                        principal_signature_url: res.data.school_signature || prev.principal_signature_url
                    }));
                }
            } catch (err) {
                console.log("Branding metadata loop controlled safely");
            }
        };
        loadInitialBranding();
    }, []);

    useEffect(() => {
        if (activeSubTab === 'master-timetable') {
            fetchMasterTimetable();
        }
    }, [masterFilterDay, masterFilterTeacher, masterFilterClass]);

        // 👨‍🏫 CLASS TEACHER - Fetch on tab change
    useEffect(() => {
        if (activeSubTab === 'class_teacher') {
            fetchClassTeachers();
            loadTeachersData();
        }
    }, [activeSubTab]);

    // ============================================
    // 4️⃣ TEMPLATES & CALCULATIONS
    // ============================================
    const templates = {
        'classic-navy': { id: 'classic-navy', name: '🔵 Classic Navy Corporate', primary: '#1e3a8a', accent: '#3b82f6', text: '#ffffff', bg: '#ffffff', borderRadius: '0px', photoStyle: 'square' },
        'emerald-curve': { id: 'emerald-curve', name: '🟢 Emerald Modern Curve', primary: '#065f46', accent: '#10b981', text: '#ffffff', bg: '#ffffff', borderRadius: '0px 0px 14px 0px', photoStyle: 'rounded' },
        'ruby-vibrant': { id: 'ruby-vibrant', name: '🔴 Ruby Dynamic Creative', primary: '#9f1239', accent: '#f43f5e', text: '#ffffff', bg: '#ffffff', borderRadius: '0px', photoStyle: 'square' },
        'gold-luxury': { id: 'gold-luxury', name: '🟡 Premium Charcoal Gold', primary: '#111827', accent: '#b45309', text: '#ffffff', bg: '#fafafa', borderRadius: '0px', photoStyle: 'rounded' },
        'star-playful': { id: 'star-playful', name: '⭐ Star Kids Green Theme', primary: '#3f6212', accent: '#a3e635', text: '#ffffff', bg: '#f1fbf0', borderRadius: '0px', photoStyle: 'star-frame' },
        'narmada-flat': { id: 'narmada-flat', name: '🏢 Narmada Corporate Ribbon', primary: '#7c2d12', accent: '#ea580c', text: '#ffffff', bg: '#fffbeb', borderRadius: '0px', photoStyle: 'square' },
        'sky-badge': { id: 'sky-badge', name: '🌤️ Sky Blue Modern Minimalist', primary: '#0369a1', accent: '#0ea5e9', text: '#ffffff', bg: '#ffffff', borderRadius: '8px', photoStyle: 'rounded' },
        'violet-royal': { id: 'violet-royal', name: '🟪 Royal Violet Accent', primary: '#5b21b6', accent: '#8b5cf6', text: '#ffffff', bg: '#fbf7ff', borderRadius: '0px 20px 0px 20px', photoStyle: 'rounded' },
        'geo-texture': { id: 'geo-texture', name: '📐 Geometric Textured Grey', primary: '#374151', accent: '#4b5563', text: '#ffffff', bg: '#f3f4f6', borderRadius: '0px', photoStyle: 'square', texture: 'geo' },
        'clean-border': { id: 'clean-border', name: '🛡️ Clean Minimal Borderline', primary: '#0f172a', accent: '#334155', text: '#ffffff', bg: '#ffffff', borderRadius: '0px', photoStyle: 'square' }
    };
    const activeStyle = templates[selectedTemplate];

    const totalSlotsNeeded = 6;
    const filledSlots = students.length;
    const emptySlotsCount = filledSlots > 0 && filledSlots < totalSlotsNeeded ? totalSlotsNeeded - filledSlots : 0;
    const blankPlotsArray = Array.from({ length: emptySlotsCount });

    // ============================================
    // 5️⃣ RETURN - JSX (TUMHARA ORIGINAL JSX WAISA HI)
    // ============================================
    return (
        <div className="w-full bg-gray-50 min-h-screen font-sans">
            {/* 🟢 SINGLE CONTROLS HUB */}
            <div className="no-print flex flex-wrap gap-2 mb-6 bg-white p-2.5 rounded-2xl border border-gray-200/80 shadow-sm">
                <button onClick={() => setActiveSubTab('id-cards')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeSubTab === 'id-cards' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-gray-500 hover:bg-gray-100'}`}><IdCard className="w-4 h-4" /><span>🪪 ID Card Studio</span></button>
                <button onClick={() => setActiveSubTab('timetable')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeSubTab === 'timetable' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-gray-500 hover:bg-gray-100'}`}><Calendar className="w-4 h-4" /><span>📅 Class Timetable</span></button>
                <button onClick={() => setActiveSubTab('teachers')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeSubTab === 'teachers' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-gray-500 hover:bg-gray-100'}`}><UserCheck className="w-4 h-4" /><span>👨‍🏫 Teacher Assign</span></button>
                <button onClick={() => setActiveSubTab('subjects')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeSubTab === 'subjects' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-gray-500 hover:bg-gray-100'}`}><BookOpen className="w-4 h-4" /><span>📚 Subject Assign</span></button>
                <button onClick={() => setActiveSubTab('class_teacher')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeSubTab === 'class_teacher' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-gray-500 hover:bg-gray-100'}`}><UserCheck className="w-4 h-4" /><span>👨‍🏫 Class Teacher</span></button>
                <button onClick={() => setActiveSubTab('master-timetable')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeSubTab === 'master-timetable' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-gray-500 hover:bg-gray-100'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>🏫 Master Timetable</span>
                </button>
            </div>

            {/* 🎙️ Voice Assistant */}
            <div className="flex items-center justify-end px-6 mb-4 no-print">
                <button onClick={startVoiceCommand} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-2.5 px-5 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 group cursor-pointer">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 group-hover:scale-110 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 0 3-3V4.5a3 3 0 1 0-6 0v8.25a3 3 0 0 0 3 3Z" />
                    </svg>
                    <span className="text-[12px] tracking-wide uppercase font-black">बोलो भाई (Voice Assistant)</span>
                </button>
            </div>

            {/* ===== ID CARDS MODULE ===== */}
            {activeSubTab === 'id-cards' && (
                <div className="id-cards-active-print-job-parent w-full">
                    <div className="id-cards-active-print-job w-full">
                        <div className="no-print bg-white p-6 rounded-2xl shadow-sm border border-gray-200/60 mb-6">
                            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-4">Batch Identity Production Desk</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Target Class</label>
                                    <select className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                                        <option value="">-- Select Class Room --</option>
                                        {classes.map((c, i) => <option key={i} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Section</label>
                                    <select className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
                                        <option value="All">All Sections (Bulk)</option>
                                        <option value="A">Section A</option>
                                        <option value="B">Section B</option>
                                        <option value="C">Section C</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1"><Palette className="w-3 h-3 inline mr-1" />Design Theme Studio Engine</label>
                                    <select className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                                        {Object.values(templates).map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={fetchStudentsForCards} className="flex-grow bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider p-3 rounded-xl transition shadow-md cursor-pointer">{loading ? 'Loading...' : '🔍 Load Cards'}</button>
                                    <button onClick={handlePrint} disabled={students.length === 0} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black text-xs uppercase tracking-wider p-3 rounded-xl transition shadow-md cursor-pointer"><Printer className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                        <div className="master-studio-grid">
                            {students.length === 0 ? (
                                <div className="no-print bg-white border border-dashed p-12 text-center rounded-2xl text-gray-400 font-bold text-sm w-full" style={{ gridColumn: 'span 2' }}>
                                    🪪 Class select karke "Load Cards" par click karein. Ab ek page par exact 6 cards portrait structure me lock milenge bhai!
                                </div>
                            ) : (
                                <>
                                    {students.map((student) => {
                                        const classNameClean = student.class ? String(student.class).trim() : '';
                                        const sectionClean = student.section ? String(student.section).trim() : '';
                                        const rollNoClean = student.roll_no ? String(student.roll_no).trim() : '';
                                        const folderName = `${classNameClean}_${sectionClean}`;
                                        const fileName = `${rollNoClean}.JPG`;
                                        const studentPhotoUrl = `${BASE_URL}/static/student_photos/${encodeURIComponent(folderName)}/${encodeURIComponent(fileName)}`;
                                        return (
                                            <div key={student.id || student.admission_no} className={`unbreakable-portrait-card template-${activeStyle.id}`} style={{ width: '220px', maxWidth: '220px', minWidth: '220px', height: '320px', maxHeight: '320px', minHeight: '320px', display: 'block', position: 'relative', boxSizing: 'border-box', background: activeStyle.bg }}>
                                                {activeStyle.texture === 'geo' && <div className="geo-background-layer" />}
                                                <div className="strict-header-box" style={{ backgroundColor: activeStyle.primary, color: activeStyle.text, width: '217px', height: '54px', boxSizing: 'border-box', position: 'relative', borderRadius: activeStyle.borderRadius }}>
                                                    <div style={{ position: 'absolute', top: '7px', left: '8px', width: '34px', height: '34px', background: '#ffffff', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                        <img src={schoolSettings.logo_url} alt="Logo" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                                                    </div>
                                                    <div style={{ marginLeft: '44px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '160px', height: '100%', overflow: 'hidden' }}>
                                                        <div style={{ fontSize: '10.5px', fontWeight: '900', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '0', padding: '0', lineHeight: '1.2', width: '100%' }}>{schoolSettings.school_name}</div>
                                                        <span style={{ display: 'inline-block', fontSize: '6.5px', fontWeight: '900', backgroundColor: activeStyle.accent, padding: '1px 6px', borderRadius: '3px', letterSpacing: '0.5px', marginTop: '3px', color: '#fff', whiteSpace: 'nowrap' }}>STUDENT ID CARD</span>
                                                    </div>
                                                </div>
                                                <div style={{ width: '217px', height: '232px', padding: '6px 12px 0 12px', display: 'block', position: 'relative', boxSizing: 'border-box', overflow: 'hidden' }}>
                                                    {schoolSettings.logo_url && (
                                                        <img src={schoolSettings.logo_url} alt="Watermark" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90px', height: 'auto', opacity: '0.045', pointerEvents: 'none', zIndex: '1', display: 'block', mixBlendMode: 'multiply' }} />
                                                    )}
                                                    <div className={`photo-style-${activeStyle.photoStyle}`} style={{ width: '74px', height: '86px', margin: '0 auto', border: `1.5px solid ${activeStyle.primary}`, overflow: 'hidden', zIndex: '10', position: 'relative', background: '#f8fafc' }}>
                                                        <img src={studentPhotoUrl} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                            onError={(e) => {
                                                                if (e.target.src === studentPhotoUrl) {
                                                                    e.target.src = `${BASE_URL}/static/student_photos/${encodeURIComponent(folderName)}/${encodeURIComponent(rollNoClean)}.jpg`;
                                                                } else {
                                                                    e.target.onerror = null;
                                                                    e.target.src = "https://via.placeholder.com/74x86?text=No+Photo";
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <div style={{ fontSize: '11.5px', fontWeight: '900', textAlign: 'center', textTransform: 'uppercase', margin: '4px 0 3px 0', color: activeStyle.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', zIndex: '10', position: 'relative' }}>
                                                        {student.name ? student.name.toUpperCase() : 'STUDENT NAME'}
                                                    </div>
                                                    <div style={{ width: '100%', borderTop: '1px solid #f1f5f9', paddingTop: '3px', display: 'flex', flexDirection: 'column', gap: '1.5px', zIndex: '10', position: 'relative' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr', textAlign: 'left', fontSize: '9.5px', lineHeight: '1.1' }}>
                                                            <span style={{ fontWeight: '900', color: '#9ca3af', fontSize: '7.5px' }}>CLASS:</span>
                                                            <span style={{ fontWeight: '800', color: '#1f2937' }}>{classNameClean} - {sectionClean}</span>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr', textAlign: 'left', fontSize: '9.5px', lineHeight: '1.1' }}>
                                                            <span style={{ fontWeight: '900', color: '#9ca3af', fontSize: '7.5px' }}>ROLL NO:</span>
                                                            <span style={{ fontWeight: '800', color: '#1f2937' }}>{rollNoClean || 'N/A'}</span>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr', textAlign: 'left', fontSize: '9.5px', lineHeight: '1.1' }}>
                                                            <span style={{ fontWeight: '900', color: '#9ca3af', fontSize: '7.5px' }}>FATHER:</span>
                                                            <span style={{ fontWeight: '700', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.father_name || 'N/A'}</span>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr', textAlign: 'left', fontSize: '9.5px', lineHeight: '1.1' }}>
                                                            <span style={{ fontWeight: '900', color: '#9ca3af', fontSize: '7.5px' }}>CONTACT:</span>
                                                            <span style={{ fontWeight: '800', color: '#1f2937' }}>{student.phone || 'N/A'}</span>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr', textAlign: 'left', fontSize: '9.5px', lineHeight: '1.1' }}>
                                                            <span style={{ fontWeight: '900', color: '#9ca3af', fontSize: '7.5px' }}>ADDRESS:</span>
                                                            <span style={{ color: '#6b7280', fontSize: '9px', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{student.address || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                    <div style={{ position: 'absolute', bottom: '2px', left: '12px', right: '12px', height: '22px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', zIndex: '10' }}>
                                                        <div style={{ width: '105px', height: '18px', border: `1px solid ${activeStyle.primary}`, borderRadius: '3px', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1px 1px', overflow: 'hidden', boxSizing: 'border-box' }}>
                                                            <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%', height: '11px', justifyContent: 'center', gap: '0px' }}>
                                                                {`${student.admission_no || '10'}${rollNoClean}48291047582019485730291048572019485730`.split('').map((char, index) => {
                                                                    const num = parseInt(char, 10) || index;
                                                                    const barWidth = num % 4 === 0 ? '0.75px' : num % 4 === 1 ? '1.5px' : num % 4 === 2 ? '1px' : '2px';
                                                                    const spaceWidth = index % 2 === 0 ? '0.5px' : '0.75px';
                                                                    return (
                                                                        <div key={index} style={{ display: 'flex', height: '100%', alignItems: 'flex-end' }}>
                                                                            <div style={{ width: barWidth, height: '100%', backgroundColor: '#000000' }} />
                                                                            <div style={{ width: spaceWidth, height: '100%', backgroundColor: 'transparent' }} />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            <div style={{ fontSize: '5.5px', color: '#4b5563', fontWeight: '900', letterSpacing: '0.8px', transform: 'scale(0.8)', lineHeight: '1', marginTop: '0.5px' }}>
                                                                *{student.admission_no || rollNoClean || '0000'}*
                                                            </div>
                                                        </div>
                                                        <div style={{ position: 'relative', width: '60px', textAlign: 'center' }}>
                                                            <img src={schoolSettings.principal_signature_url} alt="Signature" style={{ height: '13px', maxWidth: '55px', objectFit: 'contain', mixBlendMode: 'multiply', margin: '0 auto' }} />
                                                            <div style={{ fontSize: '6px', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', borderTop: '1px solid #e2e8f0', paddingTop: '0.5px', marginTop: '0.5px', lineHeight: '1' }}>Principal</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ backgroundColor: activeStyle.primary, color: activeStyle.text, height: '32px', padding: '2px 8px', textAlign: 'center', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRadius: activeStyle.borderRadius ? '20px 0px 0px 0px' : '0px' }}>
                                                    <div style={{ fontWeight: '800', fontSize: '7.5px', width: '190px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '1.2' }}>{schoolSettings.address}</div>
                                                    <div style={{ fontSize: '7px', fontWeight: '800', marginTop: '0.5px', lineHeight: '1.1' }}>📞 {schoolSettings.contact}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {blankPlotsArray.map((_, index) => (
                                        <div key={`blank-plot-${index}`} className="strict-blank-plot-placeholder" style={{ width: '220px', maxWidth: '220px', minWidth: '220px', height: '320px', maxHeight: '320px', minHeight: '320px', border: '2px dashed #94a3b8', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafafa', position: 'relative', boxSizing: 'border-box' }}>
                                            <div style={{ fontSize: '9px', fontWeight: '900', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>EMPTY PLOT BOX {filledSlots + index + 1}</div>
                                            <div style={{ fontSize: '8px', color: '#e2e8f0', marginTop: '3px' }}>Ready for production layout</div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MASTER TIMETABLE MODULE ===== */}
            {activeSubTab === 'master-timetable' && (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm no-print m-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">🏫 Master Timetable - School Overview</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Complete school class management: Teacher allocation, room tracking, and conflict detection</p>
                        </div>
                        <button onClick={fetchMasterTimetable} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider p-2.5 px-5 rounded-xl transition shadow-md cursor-pointer">🔄 Refresh Master View</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Filter by Day</label>
                            <select className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-xs font-bold" value={masterFilterDay} onChange={(e) => setMasterFilterDay(e.target.value)}>
                                <option value="All">All Days</option>
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Filter by Teacher</label>
                            <select className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-xs font-bold" value={masterFilterTeacher} onChange={(e) => setMasterFilterTeacher(e.target.value)}>
                                <option value="All">All Teachers</option>
                                {teachersList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Filter by Class</label>
                            <select className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-xs font-bold" value={masterFilterClass} onChange={(e) => setMasterFilterClass(e.target.value)}>
                                <option value="All">All Classes</option>
                                {classes.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2 items-end">
    <button onClick={() => window.print()} className="bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-wider p-2.5 px-5 rounded-xl transition shadow-md cursor-pointer">
        🖨️ PDF
    </button>
    <button 
        onClick={() => {
            if (masterTimetableData.length === 0) {
                alert("Bhai pehle 'Refresh Master View' click karo!");
                return;
            }
            const filterText = masterFilterDay !== 'All' ? `_${masterFilterDay}` : '';
            const classText = masterFilterClass !== 'All' ? `_${masterFilterClass}` : '';
            exportToExcel(masterTimetableData, `Master_Timetable${filterText}${classText}`);
        }}
        disabled={masterTimetableData.length === 0}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black text-xs uppercase tracking-wider p-2.5 px-5 rounded-xl transition shadow-md cursor-pointer"
    >
        📊 Excel
    </button>
</div>
                    </div>
                    {masterTimetableData.length === 0 ? (
                        <div className="p-12 text-center border border-dashed rounded-xl text-gray-400 font-bold text-xs">📊 "Refresh Master View" click karein. Saare classes ka complete schedule ek jagah dekhein!</div>
                    ) : (
                        <div className="overflow-x-auto border border-gray-100 rounded-xl">
                            <table className="w-full text-left text-xs font-medium border-collapse">
                                <thead>
                                    <tr className="bg-gray-100/80 text-gray-600 uppercase tracking-wider text-[9px] font-black border-b border-gray-200">
                                        <th className="p-3 border-r border-gray-200/60">Day</th>
                                        <th className="p-3 border-r border-gray-200/60">Period</th>
                                        <th className="p-3 border-r border-gray-200/60">Class</th>
                                        <th className="p-3 border-r border-gray-200/60">Section</th>
                                        <th className="p-3 border-r border-gray-200/60">Subject</th>
                                        <th className="p-3 border-r border-gray-200/60">Teacher</th>
                                        <th className="p-3 border-r border-gray-200/60">Time</th>
                                        <th className="p-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700 font-semibold">
                                    {masterTimetableData.map((slot, idx) => {
                                        const isConflict = checkTeacherConflict(slot);
                                        return (
                                            <tr key={idx} className={`hover:bg-gray-50/60 transition-colors ${isConflict ? 'bg-red-50/50' : ''}`}>
                                                <td className="p-3 font-black text-slate-800 uppercase text-[10px]">{slot.day}</td>
                                                <td className="p-3 text-center">Period {slot.period}</td>
                                                <td className="p-3 font-bold text-indigo-700">{slot.class_name}</td>
                                                <td className="p-3 text-gray-500">Section {slot.section}</td>
                                                <td className="p-3 font-bold text-slate-800">{slot.subject || '—'}</td>
                                                <td className="p-3">
                                                    <span className={isConflict ? 'text-red-600 font-black' : 'text-gray-700'}>
                                                        {slot.teacher_name || '⚠️ Not Assigned'}
                                                    </span>
                                                    {isConflict && <span className="ml-2 text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-black">⚠️ CONFLICT</span>}
                                                </td>
                                                <td className="p-3 text-gray-600 font-mono">{slot.start_time} - {slot.end_time}</td>
                                                <td className="p-3">
                                                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${slot.teacher_id ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {slot.teacher_id ? '✅ Assigned' : '🟡 Pending'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                            <div className="text-2xl font-black text-indigo-700">{masterStats.totalSlots}</div>
                            <div className="text-[9px] font-black text-indigo-500 uppercase">Total Scheduled Slots</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                            <div className="text-2xl font-black text-green-700">{masterStats.assignedSlots}</div>
                            <div className="text-[9px] font-black text-green-500 uppercase">Teacher Assigned</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                            <div className="text-2xl font-black text-yellow-700">{masterStats.pendingSlots}</div>
                            <div className="text-[9px] font-black text-yellow-500 uppercase">Pending Assignment</div>
                        </div>
                        <div className={`p-4 rounded-xl border ${masterStats.conflicts > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className={`text-2xl font-black ${masterStats.conflicts > 0 ? 'text-red-700' : 'text-gray-400'}`}>{masterStats.conflicts}</div>
                            <div className={`text-[9px] font-black uppercase ${masterStats.conflicts > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                {masterStats.conflicts > 0 ? '⚠️ Teacher Conflicts Detected' : '✅ No Conflicts'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== CLASS TIMETABLE MODULE ===== */}
            {activeSubTab === 'timetable' && (
                <div className="timetable-active-print-job-parent w-full">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm m-6 printable-timetable-zone timetable-active-print-job">
                        <div className="flex flex-wrap justify-between items-center gap-4 mb-6 no-print">
                            <div>
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">📅 Class Routine Scheduling Board</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Custom software configuration powered by A.B.Digital Work framework.</p>
                            </div>
                            <div className="flex items-center gap-3 bg-indigo-50/50 p-2 rounded-xl border border-indigo-100">
                                <div>
                                    <label className="block text-[8px] font-black text-indigo-600 uppercase mb-0.5">Total Periods</label>
                                    <select className="p-1 text-[11px] font-bold bg-white border border-indigo-200 rounded-lg" value={window.configTotalPeriods || 6} onChange={(e) => { window.configTotalPeriods = parseInt(e.target.value); setTimetableGrid([]); }}>
                                        <option value="6">6 Periods</option>
                                        <option value="7">7 Periods</option>
                                        <option value="8">8 Periods</option>
                                    </select>
                                </div>
                                <div className="border-l border-indigo-200 h-6 mx-1"></div>
                                <div>
                                    <label className="block text-[8px] font-black text-indigo-600 uppercase mb-0.5">Lunch Interval After</label>
                                    <select className="p-1 text-[11px] font-bold bg-white border border-indigo-200 rounded-lg" value={window.configLunchAfter || 3} onChange={(e) => { window.configLunchAfter = parseInt(e.target.value); setTimetableGrid([]); }}>
                                        <option value="3">3rd Period</option>
                                        <option value="4">4th Period</option>
                                        <option value="5">5th Period</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 no-print">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Target Class Room</label>
                                <select className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-xs font-bold" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                                    <option value="">-- Select Class --</option>
                                    {classes.map((c, i) => <option key={i} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Specific Section</label>
                                <select className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-xs font-bold" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
                                    <option value="All">Section A</option>
                                    <option value="B">Section B</option>
                                    <option value="C">Section C</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button onClick={fetchTimetableSheet} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider p-3 rounded-xl transition shadow-md cursor-pointer">🔄 Load Schedule Sheet</button>
                            </div>
                            
                            <div className="flex items-end gap-2">
    <button onClick={() => window.print()} disabled={!selectedClass} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black text-xs uppercase tracking-wider p-3 rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-2">
        🖨️ PDF
    </button>
    <button 
        onClick={() => {
            if (timetableGrid.length === 0) {
                alert("Bhai pehle 'Load Schedule Sheet' click karo!");
                return;
            }
            const className = selectedClass || 'class';
            const sectionName = selectedSection === 'All' ? 'All' : selectedSection;
            exportToExcel(timetableGrid, `${className}_Section${sectionName}_Timetable`);
        }}
        disabled={!selectedClass || timetableGrid.length === 0}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black text-xs uppercase tracking-wider p-3 rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-2"
    >
        📊 Excel
    </button>
</div>
                        </div>
                        {selectedClass && (
                            <div className="print-only-header hidden w-full mb-6 items-center border-b-2 border-slate-300 pb-4">
                                <div className="w-1/4 text-left">
                                    <img src={schoolSettings.logo_url} alt="Logo" className="h-16 w-16 object-contain rounded-lg" />
                                </div>
                                <div className="w-2/4 text-center flex flex-col justify-center items-center">
                                    <h1 className="text-xl font-black text-indigo-900 uppercase tracking-wide leading-tight">{schoolSettings.school_name}</h1>
                                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mt-1">WEEKLY TIME-TABLE</h2>
                                    <span className="text-xs font-black bg-slate-100 text-slate-700 px-4 py-0.5 rounded-full uppercase mt-1.5 border border-slate-200">Class Room: {selectedClass} — Section {selectedSection === 'All' ? 'A' : selectedSection}</span>
                                </div>
                                <div className="w-1/4 text-right opacity-0"></div>
                            </div>
                        )}
                        {!selectedClass ? (
                            <div className="p-12 text-center border border-dashed rounded-xl text-gray-400 font-bold text-xs no-print">📊 Kripya upar se "Target Class Room" select karke load karein taaki weekly time-matrix block active ho sake bhai!</div>
                        ) : (
                            <div className="overflow-x-auto border border-gray-100 rounded-xl printable-table-wrapper">
                                <table className="w-full text-left text-xs font-medium border-collapse page-break-avoid">
                                    <thead>
                                        <tr className="bg-gray-100/80 text-gray-600 uppercase tracking-wider text-[10px] font-black border-b border-gray-200">
                                            <th className="p-3.5 border-r border-gray-200/60 w-28 bg-gray-100">📅 Day / Week</th>
                                            {Array.from({ length: window.configTotalPeriods || 6 }).map((_, index) => {
                                                const pNum = index + 1;
                                                return (
                                                    <React.Fragment key={index}>
                                                        <th className="p-3.5 text-center border-r border-gray-200/60">Period {pNum}</th>
                                                        {pNum === (window.configLunchAfter || 4) && <th className="p-3.5 text-center border-r border-gray-200/60 bg-yellow-50 text-yellow-800 font-black">☕ Break</th>}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-gray-700 font-semibold">
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors print:bg-white page-break-avoid">
                                                <td className="p-3.5 font-black text-gray-800 bg-gray-50/80 border-r border-gray-200/60 uppercase text-[10px] tracking-wider print:bg-slate-50">{day}</td>
                                                {Array.from({ length: window.configTotalPeriods || 6 }).map((_, pIdx) => {
                                                    const p = pIdx + 1;
                                                    const slot = Array.isArray(timetableGrid) ? timetableGrid.find(t => t.day === day && t.period === p) : null;
                                                    let finalSubjectText = 'Empty Slot';
                                                    if (slot) {
                                                        if (slot.subject && slot.subject !== 'No Subject') finalSubjectText = slot.subject;
                                                        else if (slot.subject_name && slot.subject_name !== 'No Subject') finalSubjectText = slot.subject_name;
                                                        else if (slot.subject_id && slot.subject_id !== 'No Subject') finalSubjectText = slot.subject_id;
                                                        else {
                                                            const validStr = Object.keys(slot).find(key => {
                                                                const val = slot[key];
                                                                return typeof val === 'string' && val !== day && !val.includes(':') && val !== slot.teacher_name && key !== 'day' && key !== 'teacher_id';
                                                            });
                                                            finalSubjectText = validStr ? slot[validStr] : 'Assigned';
                                                        }
                                                    }
                                                    return (
                                                        <React.Fragment key={pIdx}>
                                                            <td className="p-2 border-r border-gray-200/60 text-center">
                                                                <div onClick={() => { loadTeachersData(); setSelectedSlotData({ day, period: p }); setFormSubjectId(slot ? (slot.subject || slot.subject_name || slot.subject_id || '') : ''); setFormTeacherId(slot ? slot.teacher_id || '' : ''); setFormStartTime(slot ? slot.start_time || '09:30' : '09:30'); setFormEndTime(slot ? slot.end_time || '10:15' : '10:15'); setShowModal(true); }} className={`p-2 rounded-lg shadow-2xs transition-all cursor-pointer group min-w-[110px] border ${slot ? 'bg-indigo-50/40 border-indigo-200 hover:border-indigo-400 print:bg-slate-50/50' : 'bg-white border-gray-200 hover:border-indigo-400'}`}>
                                                                    <div className={`font-black text-[10px] uppercase tracking-wider mb-0.5 ${slot ? 'text-indigo-700' : 'text-gray-400'}`}>{slot ? finalSubjectText : 'Empty Slot'}</div>
                                                                    <div className={`text-[9px] font-bold ${slot ? 'text-slate-700' : 'text-gray-500'}`}>{slot ? slot.teacher_name : 'No Faculty'}</div>
                                                                    <div className="text-[9px] text-slate-500 font-black mt-0.5 bg-slate-100/60 px-1 py-0.5 rounded print:text-slate-600">{slot ? `${slot.start_time} - ${slot.end_time}` : '00:00 - 00:00'}</div>
                                                                </div>
                                                            </td>
                                                            {p === (window.configLunchAfter || 4) && (
                                                                <td className="p-2 border-r border-gray-200/60 text-center bg-yellow-50/20 font-black text-yellow-700/80 tracking-widest uppercase text-[9px] print:bg-amber-50/40 align-middle">Interval</td>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {showModal && selectedSlotData && (
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                                <div className="bg-white w-full max-w-md rounded-2xl border border-gray-100 shadow-2xl overflow-hidden">
                                    <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-wider">⚡ Setup Period Routine</h4>
                                            <p className="text-[10px] text-indigo-200 mt-0.5">{selectedSlotData.day} — Period {selectedSlotData.period}</p>
                                        </div>
                                        <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white font-bold text-sm cursor-pointer">✕</button>
                                    </div>
                                    <form onSubmit={handleSaveSlotSubmit} className="p-5 space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Assign Subject Text</label>
                                            <input type="text" required className="w-full p-2 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold" placeholder="e.g., Mathematics, English, Science" value={formSubjectId} onChange={(e) => setFormSubjectId(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Assign Class Faculty</label>
                                            <select className="w-full p-2 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold" value={formTeacherId} onChange={(e) => setFormTeacherId(e.target.value)} required>
                                                <option value="">-- Select Available Teacher --</option>
                                                {teachersList.map((t) => (
                                                    <option key={t.id} value={t.id}>{t.name} ({t.designation || 'Staff'})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Start Time</label>
                                                <input type="time" className="w-full p-2 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">End Time</label>
                                                <input type="time" className="w-full p-2 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="pt-2 flex gap-2">
                                            <button type="button" onClick={() => setShowModal(false)} className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider p-2.5 rounded-xl transition cursor-pointer">Cancel</button>
                                            <button type="submit" className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider p-2.5 rounded-xl transition shadow-md cursor-pointer">💾 Save Schedule</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== TEACHERS MODULE ===== */}
            {activeSubTab === 'teachers' && (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm no-print m-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-3">➕ Add New Class Faculty</h3>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const name = e.target.elements.t_name.value;
                                const des = e.target.elements.t_designation.value;
                                const mob = e.target.elements.t_mobile.value;
                                const sal = e.target.elements.t_salary.value;
                                axios.post(`${BASE_URL}/api/staff`, { name, designation: des, mobile: mob, base_salary: sal })
                                    .then(res => {
                                        if (res.data.success) {
                                            alert("🎉 Teacher Successfully Registered!");
                                            e.target.reset();
                                            loadTeachersData();
                                        }
                                    }).catch(err => alert("Error saving teacher details"));
                            }} className="space-y-3">
                                <div>
                                    <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Full Name</label>
                                    <input type="text" name="t_name" required className="w-full p-2 border border-gray-200 rounded-xl bg-white text-xs font-bold" placeholder="e.g., Prof. Asad Ali" />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Designation</label>
                                    <input type="text" name="t_designation" required className="w-full p-2 border border-gray-200 rounded-xl bg-white text-xs font-bold" placeholder="e.g., PGT Mathematics" />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Mobile Number</label>
                                    <input type="text" name="t_mobile" required className="w-full p-2 border border-gray-200 rounded-xl bg-white text-xs font-bold" placeholder="10 digit number" />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Base Monthly Salary (₹)</label>
                                    <input type="number" name="t_salary" required className="w-full p-2 border border-gray-200 rounded-xl bg-white text-xs font-bold" placeholder="e.g., 25000" />
                                </div>
                                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider p-2.5 rounded-xl transition shadow-md cursor-pointer">💾 Save Faculty Profile</button>
                            </form>
                        </div>
                        <div className="md:grid-cols-1 md:col-span-2">
                            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-3">📋 Active Faculty Directory ({teachersList.length})</h3>
                            <div className="overflow-x-auto border border-gray-100 rounded-xl max-h-[360px] overflow-y-auto">
                                <table className="w-full text-left text-xs font-medium border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100/80 text-gray-600 uppercase tracking-wider text-[9px] font-black border-b border-gray-200">
                                            <th className="p-3">Faculty Name</th>
                                            <th className="p-3">Designation</th>
                                            <th className="p-3">Mobile No</th>
                                            <th className="p-3 text-right">Base Salary</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-gray-700 font-semibold">
                                        {teachersList.length === 0 ? (
                                            <tr><td colSpan="4" className="p-6 text-center text-gray-400 font-bold text-xs">⚠️ Koi teacher register nahi hai bhai, left panel se add karo!</td></tr>
                                        ) : (
                                            teachersList.map((t) => (
                                                <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                                                    <td className="p-3 font-black text-slate-800 uppercase text-[10px]">{t.name}</td>
                                                    <td className="p-3 text-gray-500">{t.designation || 'N/A'}</td>
                                                    <td className="p-3 text-gray-600 font-mono">{t.mobile}</td>
                                                    <td className="p-3 text-right text-green-600 font-mono">₹{t.base_salary}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== SUBJECTS MODULE ===== */}
            {activeSubTab === 'subjects' && (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm no-print m-6">
                    <div className="p-12 text-center border border-dashed rounded-xl text-gray-400 font-bold text-xs bg-slate-50/50">
                        📚 <span className="text-slate-700 uppercase font-black text-[11px] block mb-1">A.B.Digital Work Subject Framework</span>
                        Bhai, aapka timetable system ab direct subject text entry par map ho chuka hai (aap modal form popup mein direct Subject ka naam type karke save kar sakte hain). Is tab ka separate dropdown lock karne ki ab koi zaroorat nahi hai, aap direct timetable tab se handle kijiye!
                    </div>
                </div>
            )}

            {/* ===================================================================== */}
{/* MODULE 6: 👨‍🏫 CLASS TEACHER ASSIGNMENT */}
{/* ===================================================================== */}
{activeSubTab === 'class_teacher' && (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm no-print m-6">
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-4">👨‍🏫 Class Teacher Assignment</h3>
        
        {/* Assignment Form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
            <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Select Class</label>
                <select 
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-xs font-bold"
                    value={classTeacherClass}
                    onChange={(e) => setClassTeacherClass(e.target.value)}
                >
                    <option value="">-- Select Class --</option>
                    {classes.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Select Section</label>
                <select 
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-xs font-bold"
                    value={classTeacherSection}
                    onChange={(e) => setClassTeacherSection(e.target.value)}
                >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                </select>
            </div>
            <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Assign Teacher</label>
                <select 
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-xs font-bold"
                    value={classTeacherId}
                    onChange={(e) => setClassTeacherId(e.target.value)}
                >
                    <option value="">-- Select Teacher --</option>
                    {teachersList.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.name} ({t.designation || 'Teacher'})
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex items-end gap-2">
                <button 
                    onClick={handleAssignClassTeacher}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider p-2.5 rounded-xl transition shadow-md cursor-pointer"
                >
                    💾 Assign Class Teacher
                </button>
                <button 
                    onClick={fetchClassTeachers}
                    className="bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-wider p-2.5 rounded-xl transition shadow-md cursor-pointer"
                >
                    🔄
                </button>
            </div>
        </div>
        
        {/* Assigned Teachers List */}
        <div>
            <h4 className="text-xs font-black text-gray-600 uppercase tracking-wider mb-3">
                📋 Assigned Class Teachers ({classTeacherList.length})
            </h4>
            <div className="overflow-x-auto border border-gray-100 rounded-xl max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-xs font-medium border-collapse">
                    <thead>
                        <tr className="bg-gray-100/80 text-gray-600 uppercase tracking-wider text-[9px] font-black border-b border-gray-200">
                            <th className="p-3">Teacher Name</th>
                            <th className="p-3">Designation</th>
                            <th className="p-3">Assigned Class</th>
                            <th className="p-3">Section</th>
                            <th className="p-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700 font-semibold">
                        {classTeacherList.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-6 text-center text-gray-400 font-bold text-xs">
                                    ⚠️ No class teacher assigned yet
                                </td>
                            </tr>
                        ) : (
                            classTeacherList.map((item) => (
                                <tr key={item.teacher_id} className="hover:bg-gray-50/60 transition-colors">
                                    <td className="p-3 font-bold text-slate-800">{item.name}</td>
                                    <td className="p-3 text-gray-500">{item.designation || 'Teacher'}</td>
                                    <td className="p-3 font-bold text-indigo-700">{item.class}</td>
                                    <td className="p-3 text-gray-500">{item.section}</td>
                                    <td className="p-3">
                                        <button 
                                            onClick={() => removeClassTeacher(item.teacher_id)}
                                            className="bg-red-500 hover:bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded"
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
)}

            {/* ===== STYLES ===== */}
            <style>{`
                .master-studio-grid {
                    display: grid !important;
                    grid-template-columns: repeat(2, 224px) !important;
                    grid-template-rows: repeat(3, 320px) !important;
                    gap: 15px 30px !important;
                    justify-content: center !important;
                    padding: 20px !important;
                    width: fit-content !important;
                    margin: 0 auto !important;
                    background: transparent !important;
                }
                .unbreakable-portrait-card {
                    border: 2px dashed #cbd5e1 !important; 
                    border-radius: 12px !important;
                    overflow: hidden !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03) !important;
                }
                .strict-header-box {
                    padding: 6px 10px !important;
                    display: block !important;
                    box-sizing: border-box !important;
                    overflow: hidden !important;
                    position: relative !important;
                }
                .photo-style-square { border-radius: 5px !important; }
                .photo-style-rounded { border-radius: 50% !important; width: 80px !important; height: 80px !important; }
                .photo-style-star-frame {
                    clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%) !important;
                    width: 86px !important;
                    height: 86px !important;
                }
                .geo-background-layer {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.08;
                    background-image: linear-gradient(30deg, #000 12%, transparent 12.5%, transparent 87%, #000 87.5%, #000),
                                    linear-gradient(150deg, #000 12%, transparent 12.5%, transparent 87%, #000 87.5%, #000),
                                    linear-gradient(300deg, #000 12%, transparent 12.5%, transparent 87%, #000 87.5%, #000);
                    background-size: 10px 18px; z-index: 0;
                }
                @media print {
                    .no-print { display: none !important; }
                    @page { size: A4 landscape !important; margin: 5mm 6mm !important; }
                    body, html {
                        background: #ffffff !important; margin: 0 !important; padding: 0 !important;
                        width: 100% !important; height: 100% !important; overflow: hidden !important;
                        box-sizing: border-box !important;
                        -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
                    }
                    .id-cards-active-print-job-parent { display: block !important; width: 100% !important; }
                    .id-cards-active-print-job-parent .master-studio-grid {
                        display: grid !important; grid-template-columns: repeat(3, 220px) !important;
                        grid-template-rows: repeat(2, 310px) !important; gap: 10px 25px !important;
                        justify-content: center !important; margin: 0 auto !important;
                        margin-top: 5mm !important; box-sizing: border-box !important;
                    }
                    .timetable-active-print-job-parent {
                        display: flex !important; flex-direction: column !important;
                        width: 100% !important; height: 100% !important; box-sizing: border-box !important;
                    }
                    .print-only-header, div.flex.justify-between.items-center.border-b, header {
                        display: flex !important; visibility: visible !important; opacity: 1 !important;
                        width: 100% !important; box-sizing: border-box !important; margin-bottom: 3mm !important;
                    }
                    .printable-table-wrapper {
                        border: 2px solid #cbd5e1 !important; border-radius: 12px !important;
                        overflow: hidden !important; width: 100% !important; max-width: 100% !important;
                        flex-grow: 1 !important; display: flex !important; flex-direction: column !important;
                        background: #ffffff !important; box-sizing: border-box !important;
                    }
                    table {
                        width: 100% !important; height: 100% !important; flex-grow: 1 !important;
                        table-layout: fixed !important; border-collapse: collapse !important;
                        box-sizing: border-box !important;
                    }
                    th {
                        padding: 8px 1px !important; font-size: 9.5px !important; font-weight: 900 !important;
                        background-color: #f8fafc !important; border: 1px solid #cbd5e1 !important;
                        text-align: center !important; box-sizing: border-box !important;
                    }
                    td {
                        padding: 4px 2px !important; font-size: 8.5px !important;
                        border: 1px solid #cbd5e1 !important; vertical-align: middle !important;
                        box-sizing: border-box !important;
                    }
                    td div.group {
                        display: block !important; padding: 5px 1px !important; border-radius: 6px !important;
                        background-color: #f8fafc !important; border: 1px solid #e2e8f0 !important;
                        box-sizing: border-box !important; width: 100% !important; max-width: 100% !important;
                        min-width: 0 !important; margin: 0 auto !important; overflow: hidden !important;
                    }
                    td div.group div {
                        font-size: 8px !important; line-height: 1.2 !important; text-align: center !important;
                        width: 100% !important; overflow: hidden !important; text-overflow: ellipsis !important;
                        white-space: nowrap !important; margin: 0 !important; padding: 0 !important;
                        box-sizing: border-box !important;
                    }
                    td div.group div:last-child {
                        font-size: 7.5px !important; font-weight: bold !important;
                        color: #475569 !important; margin-top: 1px !important;
                    }
                    .page-break-avoid { page-break-inside: avoid !important; break-inside: avoid !important; }
                }
            `}</style>
        </div>
    );
};

export default IDCardStudio;
