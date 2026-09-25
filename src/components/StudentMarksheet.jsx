// src/components/StudentMarksheet.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Printer, Download, ArrowLeft, Award, TrendingUp, Calendar, User, BookOpen } from 'lucide-react';

const BASE_URL = 'https://erp-api.aapschool.in';

const StudentMarksheet = ({ examId, studentId, onClose }) => {
  const [marksheet, setMarksheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (examId && studentId) {
      fetchMarksheet();
    }
  }, [examId, studentId]);

  const fetchMarksheet = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${BASE_URL}/api/exams/student-marksheet/${examId}/${studentId}`);
      if (res.data.success) {
        setMarksheet(res.data);
      } else {
        setError(res.data.error || 'Marksheet load nahi ho payi');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!marksheet) return;
    
    let content = `==================================================\n`;
    content += `          ${marksheet.school.name.toUpperCase()}\n`;
    content += `          ${marksheet.school.address}\n`;
    content += `==================================================\n`;
    content += `              MARKSHEET / REPORT CARD\n`;
    content += `==================================================\n\n`;
    content += `Student Name   : ${marksheet.student.name}\n`;
    content += `Roll No        : ${marksheet.student.roll_no}\n`;
    content += `Father's Name  : ${marksheet.student.father_name}\n`;
    content += `Mother's Name  : ${marksheet.student.mother_name}\n`;
    content += `Class & Section: ${marksheet.student.class} - ${marksheet.student.section}\n`;
    content += `Admission No   : ${marksheet.student.admission_no}\n`;
    content += `Date of Birth  : ${marksheet.student.dob}\n\n`;
    content += `--------------------------------------------------\n`;
    content += `Exam           : ${marksheet.exam.name}\n`;
    content += `Exam Date      : ${marksheet.exam.date}\n`;
    content += `--------------------------------------------------\n\n`;
    content += `SUBJECT-WISE MARKS:\n`;
    content += `--------------------------------------------------\n`;
    content += `Subject                Theory  Practical  Total\n`;
    content += `--------------------------------------------------\n`;
    
    marksheet.subjects.forEach(sub => {
      const m = marksheet.marks[sub] || {};
      content += `${(sub + '                     ').substring(0, 22)} `;
      content += `${String(m.theory || 0).padStart(4)}    `;
      content += `${String(m.practical || 0).padStart(4)}    `;
      content += `${String(m.obtained || 0).padStart(4)}\n`;
    });
    
    content += `--------------------------------------------------\n`;
    content += `TOTAL MARKS  : ${marksheet.total_obtained} / ${marksheet.total_max}\n`;
    content += `PERCENTAGE   : ${marksheet.percentage}%\n`;
    content += `GRADE        : ${marksheet.grade}\n`;
    content += `ATTENDANCE   : ${marksheet.attendance_days} Days\n`;
    content += `==================================================\n\n`;
    content += `Class Teacher: ______________  Principal: ______________\n`;
    content += `\nGenerated on: ${new Date().toLocaleString()}\n`;
    content += `Powered by: A.B.Digital Work\n`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Marksheet_${marksheet.student.name}_${marksheet.exam.name}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center">
        <p className="font-bold">❌ {error}</p>
        <button onClick={onClose} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">
          Close
        </button>
      </div>
    );
  }

  if (!marksheet) return null;

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-marksheet, #printable-marksheet * { visibility: visible; }
          #printable-marksheet {
            position: absolute; left: 0; top: 0; width: 100%; padding: 15mm;
          }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 10mm; }
        }
      `}</style>

      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
          
          {/* Toolbar (No Print) */}
          <div className="no-print bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="font-black text-sm uppercase tracking-wider">📄 Student Marksheet</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleDownload} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1">
                <Download className="w-4 h-4" /> Download
              </button>
              <button onClick={handlePrint} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold flex items-center gap-1">
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </div>

          {/* Marksheet Content */}
          <div id="printable-marksheet" className="p-8 bg-white">
            
            {/* Header */}
            <div className="text-center border-b-4 border-double border-slate-800 pb-4 mb-6">
              {marksheet.school.logo && (
                <img src={marksheet.school.logo} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-2" />
              )}
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wide">
                {marksheet.school.name}
              </h1>
              <p className="text-xs text-slate-600 mt-1">{marksheet.school.address}</p>
              <div className="mt-3 inline-block px-4 py-1 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded">
                Marksheet / Report Card
              </div>
            </div>

            {/* Student Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
              <div className="space-y-1">
                <div className="flex"><span className="w-32 font-bold text-slate-500 uppercase text-[10px]">Student Name:</span><span className="font-black text-slate-800">{marksheet.student.name}</span></div>
                <div className="flex"><span className="w-32 font-bold text-slate-500 uppercase text-[10px]">Roll No:</span><span className="font-bold text-slate-800">{marksheet.student.roll_no}</span></div>
                <div className="flex"><span className="w-32 font-bold text-slate-500 uppercase text-[10px]">Father's Name:</span><span className="font-semibold text-slate-700">{marksheet.student.father_name}</span></div>
                <div className="flex"><span className="w-32 font-bold text-slate-500 uppercase text-[10px]">Mother's Name:</span><span className="font-semibold text-slate-700">{marksheet.student.mother_name}</span></div>
              </div>
              <div className="space-y-1">
                <div className="flex"><span className="w-32 font-bold text-slate-500 uppercase text-[10px]">Class & Section:</span><span className="font-bold text-slate-800">{marksheet.student.class} - {marksheet.student.section}</span></div>
                <div className="flex"><span className="w-32 font-bold text-slate-500 uppercase text-[10px]">Admission No:</span><span className="font-bold text-slate-800">{marksheet.student.admission_no}</span></div>
                <div className="flex"><span className="w-32 font-bold text-slate-500 uppercase text-[10px]">Exam:</span><span className="font-black text-indigo-700">{marksheet.exam.name}</span></div>
                <div className="flex"><span className="w-32 font-bold text-slate-500 uppercase text-[10px]">Date:</span><span className="font-semibold text-slate-700">{marksheet.exam.date}</span></div>
              </div>
            </div>

            {/* Marks Table */}
            <table className="w-full border-collapse border-2 border-slate-800 text-xs mb-6">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="border border-slate-800 p-2 text-left">Subject</th>
                  <th className="border border-slate-800 p-2 text-center">Theory</th>
                  <th className="border border-slate-800 p-2 text-center">Practical</th>
                  <th className="border border-slate-800 p-2 text-center">Internal</th>
                  <th className="border border-slate-800 p-2 text-center">Total</th>
                  <th className="border border-slate-800 p-2 text-center">Max</th>
                  <th className="border border-slate-800 p-2 text-center">Grade</th>
                </tr>
              </thead>
              <tbody>
                {marksheet.subjects.map((subject, idx) => {
                  const m = marksheet.marks[subject] || {};
                  const pct = (m.obtained / 100) * 100;
                  let subGrade = 'F';
                  if (pct >= 90) subGrade = 'A+';
                  else if (pct >= 80) subGrade = 'A';
                  else if (pct >= 70) subGrade = 'B+';
                  else if (pct >= 60) subGrade = 'B';
                  else if (pct >= 50) subGrade = 'C';
                  else if (pct >= 40) subGrade = 'D';
                  
                  return (
                    <tr key={subject} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="border border-slate-300 p-2 font-bold text-slate-800">{subject}</td>
                      <td className="border border-slate-300 p-2 text-center font-semibold">{m.theory || 0}</td>
                      <td className="border border-slate-300 p-2 text-center font-semibold">{m.practical || 0}</td>
                      <td className="border border-slate-300 p-2 text-center font-semibold">{m.internal || 0}</td>
                      <td className="border border-slate-300 p-2 text-center font-black text-indigo-700">{m.obtained || 0}</td>
                      <td className="border border-slate-300 p-2 text-center text-slate-500">{m.max || 100}</td>
                      <td className="border border-slate-300 p-2 text-center font-black text-purple-700">{subGrade}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-indigo-600 text-white">
                  <td colSpan="4" className="border border-slate-800 p-2 text-right font-black">GRAND TOTAL:</td>
                  <td className="border border-slate-800 p-2 text-center font-black">{marksheet.total_obtained}</td>
                  <td className="border border-slate-800 p-2 text-center font-black">{marksheet.total_max}</td>
                  <td className="border border-slate-800 p-2 text-center font-black">{marksheet.grade}</td>
                </tr>
              </tfoot>
            </table>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="border-2 border-indigo-300 bg-indigo-50 rounded-lg p-3 text-center">
                <div className="text-[10px] font-black text-indigo-600 uppercase">Total Marks</div>
                <div className="text-xl font-black text-indigo-900">{marksheet.total_obtained}/{marksheet.total_max}</div>
              </div>
              <div className="border-2 border-green-300 bg-green-50 rounded-lg p-3 text-center">
                <div className="text-[10px] font-black text-green-600 uppercase">Percentage</div>
                <div className="text-xl font-black text-green-900">{marksheet.percentage}%</div>
              </div>
              <div className="border-2 border-purple-300 bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-[10px] font-black text-purple-600 uppercase">Grade</div>
                <div className="text-xl font-black text-purple-900">{marksheet.grade}</div>
              </div>
            </div>

            {/* Attendance */}
            {marksheet.attendance_days > 0 && (
              <div className="mb-4 text-xs text-center font-bold text-slate-600">
                Attendance: <span className="text-orange-700">{marksheet.attendance_days} Days</span>
              </div>
            )}

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-4 mt-12 pt-4 border-t border-slate-300">
              <div className="text-center">
                <div className="h-10"></div>
                <div className="border-t-2 border-slate-800 pt-1 text-[10px] font-black text-slate-700 uppercase">Class Teacher</div>
              </div>
              <div className="text-center">
                <div className="h-10"></div>
                <div className="border-t-2 border-slate-800 pt-1 text-[10px] font-black text-slate-700 uppercase">Exam Incharge</div>
              </div>
              <div className="text-center">
                <div className="h-10 flex items-center justify-center">
                  {marksheet.school.signature ? (
                    <img src={marksheet.school.signature} alt="Signature" className="max-h-10 object-contain" />
                  ) : null}
                </div>
                <div className="border-t-2 border-slate-800 pt-1 text-[10px] font-black text-slate-700 uppercase">Principal</div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[9px] text-slate-400 mt-6 font-bold">
              Generated on {new Date().toLocaleString()} • Powered by A.B.Digital Work
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentMarksheet;