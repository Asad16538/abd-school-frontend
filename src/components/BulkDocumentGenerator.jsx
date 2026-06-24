// src/components/BulkDocumentGenerator.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = 'https://abd-school-backend.onrender.com';

const BulkDocumentGenerator = () => {
    const [classes, setClasses] = useState([
        '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th',
        '11th (Science)', '11th (Commerce)', '11th (Arts)',
        '12th (Science)', '12th (Commerce)', '12th (Arts)'
    ]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('A');
    const [documentType, setDocumentType] = useState('id-card');
    const [students, setStudents] = useState([]);
    const [photos, setPhotos] = useState({});
    const [loading, setLoading] = useState(false);
    const [schoolSettings, setSchoolSettings] = useState({
        school_name: 'Smart School ERP',
        logo_url: 'https://via.placeholder.com/80',
        address: 'Madhya Pradesh, India',
        contact: '9876543210',
        principal_signature_url: 'https://via.placeholder.com/100x40?text=Signature'
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/api/settings`);
                if (res.data) {
                    setSchoolSettings({
                        school_name: res.data.school_name || 'Smart School ERP',
                        logo_url: res.data.school_logo || 'https://via.placeholder.com/80',
                        address: res.data.school_address || 'Madhya Pradesh, India',
                        contact: res.data.school_mobile || '989326067',
                        principal_signature_url: res.data.school_signature || 'https://via.placeholder.com/100x40?text=Signature'
                    });
                }
            } catch (err) {
                console.log('Settings fetch error, using defaults');
            }
        };
        fetchSettings();
    }, []);

    const fetchStudents = async () => {
        if (!selectedClass) {
            alert('Please select a class first!');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/api/academic/class-students-cards`, {
                params: {
                    class_name: selectedClass,
                    section: selectedSection
                }
            });

            if (res.data.success) {
                setStudents(res.data.students || []);
                setPhotos({});
            } else {
                alert('No students found for this class!');
                setStudents([]);
            }
        } catch (err) {
            console.error('Error fetching students:', err);
            alert('Failed to load students. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkPhotoUpload = (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const photoMap = {};
        let processed = 0;

        for (let file of files) {
            let fileName = file.name.split('.')[0];
            let rollNo = fileName.replace(/[^0-9]/g, '');
            
            if (rollNo) {
                photoMap[rollNo] = URL.createObjectURL(file);
                processed++;
            }
        }

        setPhotos(prev => ({ ...prev, ...photoMap }));
        
        if (processed > 0) {
            alert(`✅ ${processed} photos uploaded successfully! (Local only, not saved to database)`);
        } else {
            alert('⚠️ No valid photos found. Make sure file names contain roll numbers (e.g., "1.jpg", "2.jpg")');
        }

        e.target.value = '';
    };

    const handleSinglePhotoUpload = (rollNo, file) => {
        if (!file) return;
        
        const cleanRoll = String(rollNo).trim();
        const photoMap = { ...photos };
        
        if (photoMap[cleanRoll]) {
            URL.revokeObjectURL(photoMap[cleanRoll]);
        }
        
        photoMap[cleanRoll] = URL.createObjectURL(file);
        setPhotos(photoMap);
    };

    const handleRemovePhoto = (rollNo) => {
        const photoMap = { ...photos };
        if (photoMap[rollNo]) {
            URL.revokeObjectURL(photoMap[rollNo]);
            delete photoMap[rollNo];
            setPhotos(photoMap);
        }
    };

    const generateDocuments = () => {
        if (students.length === 0) {
            alert('Please load students first!');
            return;
        }

        const studentsWithPhotos = students.filter(s => photos[s.roll_no]);
        const studentsWithoutPhotos = students.filter(s => !photos[s.roll_no]);

        if (studentsWithoutPhotos.length > 0) {
            const confirm = window.confirm(
                `⚠️ ${studentsWithoutPhotos.length} students don't have photos.\n` +
                `Do you want to continue with placeholder images?`
            );
            if (!confirm) return;
        }

        setLoading(true);

        if (documentType === 'id-card') {
            generateIDCards();
        } else if (documentType === 'admit-card') {
            generateAdmitCards();
        } else if (documentType === 'marksheet') {
            generateMarksheets();
        }

        setLoading(false);
    };

    const generateIDCards = () => {
        let html = `
            <html>
            <head>
                <style>
                    @page { size: A4 landscape; margin: 10mm; }
                    body { font-family: Arial, sans-serif; display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; }
                    .id-card {
                        width: 220px;
                        height: 310px;
                        border: 2px solid #1e3a8a;
                        border-radius: 12px;
                        overflow: hidden;
                        background: white;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        page-break-inside: avoid;
                    }
                    .card-header {
                        background: #1e3a8a;
                        color: white;
                        padding: 8px 10px;
                        text-align: center;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .card-header img { width: 35px; height: 35px; object-fit: contain; background: white; border-radius: 4px; padding: 2px; }
                    .card-header .school-name { font-size: 11px; font-weight: 900; text-transform: uppercase; flex: 1; }
                    .card-body { padding: 8px 12px; text-align: center; }
                    .photo-box { width: 80px; height: 90px; margin: 0 auto; border: 2px solid #1e3a8a; border-radius: 8px; overflow: hidden; }
                    .photo-box img { width: 100%; height: 100%; object-fit: cover; }
                    .student-name { font-size: 13px; font-weight: 900; margin: 4px 0; text-transform: uppercase; color: #1e3a8a; }
                    .detail-row { display: flex; justify-content: space-between; font-size: 9px; padding: 2px 0; border-bottom: 1px solid #f1f5f9; }
                    .detail-label { font-weight: 900; color: #9ca3af; }
                    .detail-value { font-weight: 700; color: #1f2937; }
                    .card-footer { background: #1e3a8a; color: white; padding: 4px 8px; text-align: center; font-size: 7px; margin-top: 4px; }
                    .card-footer .address { font-weight: 700; }
                    .signature-box { display: flex; justify-content: flex-end; margin-top: 2px; }
                    .signature-box img { height: 16px; object-fit: contain; }
                    .placeholder-photo { 
                        display: flex; align-items: center; justify-content: center; 
                        width: 100%; height: 100%; background: #f3f4f6; 
                        color: #9ca3af; font-size: 10px; font-weight: bold;
                    }
                </style>
            </head>
            <body>
        `;

        students.forEach((student) => {
            const photoUrl = photos[student.roll_no] || '';
            const hasPhoto = !!photoUrl;
            
            html += `
                <div class="id-card">
                    <div class="card-header">
                        <img src="${schoolSettings.logo_url}" alt="Logo" />
                        <div class="school-name">${schoolSettings.school_name}</div>
                    </div>
                    <div class="card-body">
                        <div class="photo-box">
                            ${hasPhoto ? 
                                `<img src="${photoUrl}" alt="${student.name}" />` :
                                `<div class="placeholder-photo">No Photo</div>`
                            }
                        </div>
                        <div class="student-name">${student.name || 'N/A'}</div>
                        <div class="detail-row"><span class="detail-label">Class</span><span class="detail-value">${student.class || 'N/A'} - ${student.section || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Roll No</span><span class="detail-value">${student.roll_no || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Father</span><span class="detail-value">${student.father_name || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Contact</span><span class="detail-value">${student.phone || 'N/A'}</span></div>
                        <div class="signature-box">
                            <img src="${schoolSettings.principal_signature_url}" alt="Signature" />
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="address">${schoolSettings.address} | 📞 ${schoolSettings.contact}</div>
                    </div>
                </div>
            `;
        });

        html += `</body></html>`;

        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        win.focus();
        win.print();
    };

    const generateAdmitCards = () => {
        alert('📋 Admit Card generation will be available soon!');
    };

    const generateMarksheets = () => {
        alert('📊 Marksheet generation will be available soon!');
    };

    return (
        <div className="w-full p-6 bg-gray-50 min-h-screen">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
                <h2 className="text-xl font-black text-gray-800">📄 Bulk Document Generator</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Generate ID Cards, Admit Cards, and Marksheets with local photos. 
                    <span className="text-amber-600 font-bold"> Photos are NOT saved to database!</span>
                </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
                <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-4">Step 1: Select Class & Document Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Class</label>
                        <select 
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-bold"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            <option value="">-- Select Class --</option>
                            {classes.map((c, i) => (
                                <option key={i} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Section</label>
                        <select 
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-bold"
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                        >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Document Type</label>
                        <select 
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-bold"
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                        >
                            <option value="id-card">🪪 ID Card</option>
                            <option value="admit-card">📋 Admit Card</option>
                            <option value="marksheet">📊 Marksheet</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button 
                            onClick={fetchStudents}
                            disabled={!selectedClass || loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold text-sm py-2.5 rounded-xl transition"
                        >
                            {loading ? 'Loading...' : '🔍 Load Students'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
                <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-4">
                    Step 2: Bulk Photos Upload 
                    <span className="text-amber-600 font-bold text-xs ml-2">(Local Only - Not Saved to Database)</span>
                </h3>
                
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition">
                    <label className="cursor-pointer block">
                        <div className="text-4xl mb-2">📸</div>
                        <p className="font-bold text-gray-700">Click to upload bulk photos</p>
                        <p className="text-xs text-gray-400 mt-1">
                            File names should contain roll numbers (e.g., <strong>1.jpg</strong>, <strong>2.jpg</strong>, <strong>ROLL_12.jpg</strong>)
                        </p>
                        <p className="text-xs text-amber-600 font-bold mt-2">
                            ⚠️ Photos are stored temporarily in browser memory only
                        </p>
                        <input 
                            type="file" 
                            accept="image/*" 
                            multiple 
                            onChange={handleBulkPhotoUpload}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
                <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-4">
                    Step 3: Review Students & Photos 
                    <span className="text-xs font-normal text-gray-400 ml-2">
                        ({students.filter(s => photos[s.roll_no]).length} / {students.length} photos uploaded)
                    </span>
                </h3>

                {students.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <p className="font-bold">No students loaded</p>
                        <p className="text-sm">Please select a class and click "Load Students"</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr className="text-gray-500 uppercase text-xs font-black">
                                    <th className="p-3">Roll No</th>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Class</th>
                                    <th className="p-3">Photo Status</th>
                                    <th className="p-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {students.map((student) => {
                                    const hasPhoto = !!photos[student.roll_no];
                                    return (
                                        <tr key={student.id || student.roll_no} className="hover:bg-gray-50">
                                            <td className="p-3 font-bold">{student.roll_no || 'N/A'}</td>
                                            <td className="p-3 font-medium">{student.name || 'N/A'}</td>
                                            <td className="p-3">{student.class || 'N/A'}</td>
                                            <td className="p-3">
                                                {hasPhoto ? (
                                                    <span className="text-green-600 font-bold">✅ Photo Uploaded</span>
                                                ) : (
                                                    <span className="text-amber-600 font-bold">⚠️ No Photo</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <label className="cursor-pointer text-indigo-600 hover:text-indigo-800 text-xs font-bold">
                                                        📤 Upload
                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                if (e.target.files[0]) {
                                                                    handleSinglePhotoUpload(student.roll_no, e.target.files[0]);
                                                                }
                                                                e.target.value = '';
                                                            }}
                                                        />
                                                    </label>
                                                    {hasPhoto && (
                                                        <button 
                                                            onClick={() => handleRemovePhoto(student.roll_no)}
                                                            className="text-red-500 hover:text-red-700 text-xs font-bold"
                                                        >
                                                            ❌ Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="flex justify-end">
                <button 
                    onClick={generateDocuments}
                    disabled={students.length === 0 || loading}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg transition flex items-center gap-2"
                >
                    🚀 Generate {documentType === 'id-card' ? 'ID Cards' : documentType === 'admit-card' ? 'Admit Cards' : 'Marksheets'}
                </button>
            </div>
        </div>
    );
};

export default BulkDocumentGenerator;