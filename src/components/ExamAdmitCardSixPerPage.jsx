// src/components/ExamAdmitCardSixPerPage.jsx
import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import axios from 'axios';

const BASE_URL = 'https://erp-api.aapschool.in';

const ExamAdmitCardSixPerPage = () => {
  const [selectedClass, setSelectedClass] = useState('10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [examName, setExamName] = useState('QUARTERLY EXAMINATION 2026');
  const [sessionYear, setSessionYear] = useState('2026-27');
  
  // Settings States
  const [schoolName, setSchoolName] = useState('ADITYA ARMY PUBLIC SCHOOL');
  const [schoolLogo, setSchoolLogo] = useState('https://via.placeholder.com/80?text=Logo');
  const [principalSign, setPrincipalSign] = useState('');

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const classesList = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const sectionsList = ['A', 'B', 'C'];

  useEffect(() => {
    fetchSchoolSettings();
  }, []);

  const fetchSchoolSettings = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/settings`);
      if (res.data) {
        if (res.data.school_name) setSchoolName(res.data.school_name);
        if (res.data.school_logo) setSchoolLogo(res.data.school_logo);
        if (res.data.school_signature) setPrincipalSign(res.data.school_signature);
      }
    } catch (err) {
      console.log("Settings fetch error:", err);
    }
  };

  const handleLoadData = async () => {
    if (!selectedClass) {
      setMessage('⚠️ Kripya class select karein!');
      return;
    }
    setLoading(true);
    setMessage('');

    try {
      const res = await axios.get(`${BASE_URL}/api/academic/class-students-cards?class_name=${selectedClass}&section=${selectedSection}`);
      if (res.data.success) {
        setStudents(res.data.students || []);
        if (res.data.students.length === 0) {
          setMessage('ℹ️ Is class/section mein koi active student nahi mila.');
        }
      }
    } catch (err) {
      console.log("Data load error:", err);
      setMessage('❌ Data load karne mein error aayi.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print-specific CSS styles to ensure ONLY admit cards print in A4 6-per-page grid */}
      <style>{`
        @media print {
          /* Hide everything else on the body/screen */
          body * {
            visibility: hidden;
          }
          /* Show only the printable container and its contents */
          #printable-admit-cards, #printable-admit-cards * {
            visibility: visible;
          }
          #printable-admit-cards {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 5mm;
          }
          /* Force A4 page grid setup for exactly 6 cards per page */
          .admit-card-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            grid-template-rows: repeat(3, 1fr) !important;
            gap: 4mm !important;
            page-break-after: always;
          }
          .admit-card-item {
            border: 2px dashed #000 !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            height: 92mm !important;
            max-height: 92mm !important;
            padding: 3mm !important;
            background: #fff !important;
          }
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
        }
      `}</style>

      <div className="p-4 max-w-7xl mx-auto">
        {/* Configuration & Print Control Bar (Hidden on print) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6 print:hidden">
          <h3 className="text-base font-black text-gray-800 mb-2">🎫 6 Admit Cards Per Page Generator</h3>
          <p className="text-xs text-gray-500 mb-4">A4 size page par 6 cutting-border admit cards print karein.</p>
          
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Exam Title</label>
              <input 
                type="text" 
                value={examName} 
                onChange={(e) => setExamName(e.target.value)}
                className="p-2 border border-gray-200 rounded-xl text-xs font-bold bg-white w-48"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Session</label>
              <input 
                type="text" 
                value={sessionYear} 
                onChange={(e) => setSessionYear(e.target.value)}
                className="p-2 border border-gray-200 rounded-xl text-xs font-bold bg-white w-32"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Class</label>
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="p-2 border border-gray-200 rounded-xl text-xs font-bold bg-white"
              >
                <option value="">-- Select Class --</option>
                {classesList.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Section</label>
              <select 
                value={selectedSection} 
                onChange={(e) => setSelectedSection(e.target.value)}
                className="p-2 border border-gray-200 rounded-xl text-xs font-bold bg-white"
              >
                <option value="All">All Sections</option>
                {sectionsList.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>

            <div className="flex items-end self-end gap-2">
              <button 
                onClick={handleLoadData}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition cursor-pointer"
              >
                {loading ? 'Loading...' : 'Load Students ⚡'}
              </button>

              {students.length > 0 && (
                <button 
                  onClick={handlePrint}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print 6-Per-Page
                </button>
              )}
            </div>
          </div>

          {message && <p className="text-xs font-bold mt-3 text-indigo-600">{message}</p>}
        </div>

        {/* Admit Cards Container (Target ID for Print Isolation) */}
        {students.length > 0 && (
          <div id="printable-admit-cards">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 admit-card-grid">
              {students.map((student, idx) => (
                <div 
                  key={student.id || idx} 
                  className="relative bg-white border-2 border-dashed border-gray-800 rounded-xl p-3 shadow-sm admit-card-item flex flex-col justify-between overflow-hidden"
                  style={{ minHeight: '310px', maxHeight: '330px' }}
                >
                  
                  {/* Watermark Logo inside card */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
                    <img src={schoolLogo} alt="Watermark" className="w-36 h-36 object-contain" />
                  </div>

                  {/* Top Header: Logo on right, School Name beside it */}
                  <div className="relative z-10 flex items-center justify-between border-b border-gray-400 pb-1.5 mb-1.5">
                    <div className="flex-1 pr-2">
                      <h2 className="text-xs font-black text-indigo-900 uppercase leading-tight">{schoolName}</h2>
                      <p className="text-[9px] text-gray-600">Official Examination Session</p>
                    </div>
                    <div className="w-9 h-9 border border-gray-300 rounded-lg overflow-hidden bg-white shrink-0 flex items-center justify-center">
                      <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  </div>

                  {/* Sub-header: Box containing Hall Ticket, Session and Exam Name */}
                  <div className="relative z-10 text-center mb-1.5">
                    <div className="inline-block border border-gray-800 px-2 py-0.5 bg-gray-50 rounded text-[9px] font-black uppercase tracking-wider">
                      Admit Card / Hall Ticket
                    </div>
                    <div className="text-[9px] font-bold text-gray-800 mt-0.5">Session: {sessionYear}</div>
                    <div className="text-[9px] font-black text-indigo-900 uppercase">{examName}</div>
                  </div>

                  {/* Student Details Matrix with Automatic Photo */}
                  <div className="relative z-10 flex gap-3 items-center mb-1.5 flex-1">
                    <div className="w-14.5 h-18 border border-gray-400 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center shrink-0" style={{ width: '60px', height: '75px' }}>
                      <img 
                        src={student.photo || `https://erp-api.aapschool.in/static/student_photos/${student.class}_${student.section || 'A'}/${student.roll_no || student.id}.jpg`} 
                        alt="Student" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/150?text=Photo";
                        }}
                      />
                    </div>

                    <div className="flex-1 text-[11px] space-y-0.5 font-medium text-gray-800">
                      <div><strong className="text-black">Name:</strong> {student.name}</div>
                      <div><strong className="text-black">Father:</strong> {student.father_name || 'N/A'}</div>
                      <div className="grid grid-cols-2 gap-1">
                        <div><strong className="text-black">Class:</strong> {student.class} ({student.section || 'A'})</div>
                        <div><strong className="text-black">Roll No:</strong> {student.roll_no || '-'}</div>
                      </div>
                      <div><strong className="text-black">Admission No:</strong> {student.admission_no || student.id}</div>
                    </div>
                  </div>

                  {/* Bottom Signatures: Class Teacher, Exam Incharge, Principal */}
                  <div className="relative z-10 grid grid-cols-3 gap-1 pt-1.5 border-t border-gray-300 text-[9px] font-bold text-gray-700 text-center items-end">
                    <div>
                      <div className="h-3"></div>
                      <div className="border-t border-gray-400 pt-0.5">Class Teacher</div>
                    </div>
                    <div>
                      <div className="h-3"></div>
                      <div className="border-t border-gray-400 pt-0.5">Exam Incharge</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-4 flex items-center justify-center">
                        {principalSign ? (
                          <img src={principalSign} alt="Sign" className="max-h-4 object-contain" />
                        ) : (
                          <span className="font-serif italic text-[8px] text-gray-500">Authorized</span>
                        )}
                      </div>
                      <div className="border-t border-gray-400 pt-0.5 w-full">Principal</div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

self.addEventListener('error', (e) => {
  if (e.message) console.error(e.message);
});

export default ExamAdmitCardSixPerPage;
