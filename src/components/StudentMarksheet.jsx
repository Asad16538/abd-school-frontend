// src/components/StudentMarksheet.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { Printer, ArrowLeft, FileDown, Image as ImageIcon, X } from 'lucide-react';

const BASE_URL = 'https://erp-api.aapschool.in';

const StudentMarksheet = ({ examId, studentId, onClose }) => {
  const [marksheet, setMarksheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [popup, setPopup] = useState(null); // ✅ Custom popup (no vercel.app alert)
  const marksheetRef = useRef(null);

  useEffect(() => {
    if (examId && studentId) fetchMarksheet();
  }, [examId, studentId]);

  const fetchMarksheet = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(
        `${BASE_URL}/api/exams/student-marksheet/${encodeURIComponent(examId)}/${studentId}`
      );
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

  // ✅ Custom popup (no vercel.app branding)
  const showPopup = (type, title, message) => {
    setPopup({ type, title, message });
    setTimeout(() => setPopup(null), 4000);
  };

  const handleDownloadPDF = async () => {
    if (!marksheetRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(marksheetRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: marksheetRef.current.scrollWidth,
        windowHeight: marksheetRef.current.scrollHeight
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Marksheet_${marksheet.student.name}_${marksheet.exam.name}.pdf`);
      showPopup('success', 'PDF Downloaded', 'Marksheet PDF successfully download ho gayi!');
    } catch (err) {
      console.error('PDF error:', err);
      showPopup('error', 'PDF Error', 'PDF download mein error aayi. Kripya dubara koshish karein.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadJPG = async () => {
    if (!marksheetRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(marksheetRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Marksheet_${marksheet.student.name}_${marksheet.exam.name}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showPopup('success', 'JPG Downloaded', 'Marksheet JPG successfully download ho gayi!');
    } catch (err) {
      console.error('JPG error:', err);
      showPopup('error', 'JPG Error', 'JPG download mein error aayi. Kripya dubara koshish karein.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-bold text-gray-700">Marksheet load ho rahi hai...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center">
          <p className="font-bold text-red-600 mb-4">❌ {error}</p>
          <button onClick={onClose} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!marksheet) return null;

  return (
    <>
      {/* ============================================ */}
      {/* ✅ CUSTOM POPUP (no browser alert) */}
      {/* ============================================ */}
      {popup && (
        <div className="fixed top-4 right-4 z-[100] no-print">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border-l-4 min-w-[280px] ${
            popup.type === 'success'
              ? 'bg-green-50 border-green-500 text-green-800'
              : 'bg-red-50 border-red-500 text-red-800'
          }`}>
            <div className="flex-grow">
              <div className="font-black text-xs uppercase tracking-wider">{popup.title}</div>
              <div className="text-[11px] font-semibold mt-0.5">{popup.message}</div>
            </div>
            <button
              onClick={() => setPopup(null)}
              className="p-1 hover:bg-black/10 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-marksheet, #printable-marksheet * { visibility: visible; }
          #printable-marksheet {
            position: absolute; left: 0; top: 0; width: 100%;
            padding: 10mm; background: white;
          }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 8mm; }
        }
      `}</style>

      <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-2 md:p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl my-4">

          {/* Toolbar */}
          <div className="no-print bg-slate-900 text-white p-3 md:p-4 flex flex-wrap justify-between items-center gap-2 sticky top-0 z-20 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="font-black text-xs md:text-sm uppercase tracking-wider">
                📄 Student Marksheet
              </h3>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="px-2.5 py-1.5 md:px-3 md:py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-[10px] md:text-xs font-bold flex items-center gap-1 cursor-pointer transition"
              >
                <FileDown className="w-3.5 h-3.5" /> {downloading ? 'Wait...' : 'PDF'}
              </button>
              <button
                onClick={handleDownloadJPG}
                disabled={downloading}
                className="px-2.5 py-1.5 md:px-3 md:py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg text-[10px] md:text-xs font-bold flex items-center gap-1 cursor-pointer transition"
              >
                <ImageIcon className="w-3.5 h-3.5" /> {downloading ? 'Wait...' : 'JPG'}
              </button>
              <button
                onClick={handlePrint}
                className="px-2.5 py-1.5 md:px-3 md:py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-[10px] md:text-xs font-bold flex items-center gap-1 cursor-pointer transition"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
            </div>
          </div>

          {/* Printable Area */}
          <div ref={marksheetRef} id="printable-marksheet" className="p-6 md:p-10 bg-white">

            {/* Header */}
            <div className="text-center border-b-4 border-double border-slate-800 pb-4 mb-5">
              {marksheet.school.logo && (
                <img src={marksheet.school.logo} alt="Logo"
                  className="w-16 h-16 md:w-20 md:h-20 object-contain mx-auto mb-2" />
              )}
              <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-wide">
                {marksheet.school.name}
              </h1>
              <p className="text-[10px] md:text-xs text-slate-600 mt-1">{marksheet.school.address}</p>
              <div className="mt-3 inline-block px-4 py-1 bg-slate-900 text-white text-[10px] md:text-xs font-black uppercase tracking-widest rounded">
                Marksheet / Report Card
              </div>
            </div>

            {/* Student Info + Photo */}
            <div className="flex gap-4 mb-5">
              <div className="shrink-0">
                <div className="w-24 h-28 md:w-28 md:h-32 border-2 border-slate-800 rounded overflow-hidden bg-slate-100 flex items-center justify-center">
                  {marksheet.student.photo_url ? (
                    <img src={marksheet.student.photo_url} alt="Student"
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<span class="text-[10px] text-slate-400 font-bold">NO PHOTO</span>';
                      }}
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold">NO PHOTO</span>
                  )}
                </div>
                <div className="text-center text-[8px] text-slate-500 font-bold mt-1 uppercase">
                  Student Photo
                </div>
              </div>

              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="flex">
                  <span className="w-24 md:w-28 font-bold text-slate-500 uppercase text-[9px]">Student Name:</span>
                  <span className="font-black text-slate-800">{marksheet.student.name}</span>
                </div>
                <div className="flex">
                  <span className="w-24 md:w-28 font-bold text-slate-500 uppercase text-[9px]">Class & Section:</span>
                  <span className="font-bold text-slate-800">{marksheet.student.class} - {marksheet.student.section}</span>
                </div>
                <div className="flex">
                  <span className="w-24 md:w-28 font-bold text-slate-500 uppercase text-[9px]">Roll No:</span>
                  <span className="font-bold text-slate-800">{marksheet.student.roll_no}</span>
                </div>
                <div className="flex">
                  <span className="w-24 md:w-28 font-bold text-slate-500 uppercase text-[9px]">Admission No:</span>
                  <span className="font-bold text-slate-800">{marksheet.student.admission_no}</span>
                </div>
                <div className="flex">
                  <span className="w-24 md:w-28 font-bold text-slate-500 uppercase text-[9px]">Father's Name:</span>
                  <span className="font-semibold text-slate-700">{marksheet.student.father_name}</span>
                </div>
                <div className="flex">
                  <span className="w-24 md:w-28 font-bold text-slate-500 uppercase text-[9px]">Exam:</span>
                  <span className="font-black text-indigo-700">{marksheet.exam.name}</span>
                </div>
                <div className="flex">
                  <span className="w-24 md:w-28 font-bold text-slate-500 uppercase text-[9px]">Mother's Name:</span>
                  <span className="font-semibold text-slate-700">{marksheet.student.mother_name}</span>
                </div>
                <div className="flex">
                  <span className="w-24 md:w-28 font-bold text-slate-500 uppercase text-[9px]">Date:</span>
                  <span className="font-semibold text-slate-700">{marksheet.exam.date}</span>
                </div>
              </div>
            </div>

            {/* Marks Table */}
            <table className="w-full border-collapse border-2 border-slate-800 text-[10px] md:text-xs mb-5">
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
                  const pct = m.obtained || 0;
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
                      <td className={`border border-slate-300 p-2 text-center font-black ${subGrade === 'F' ? 'text-red-600' : 'text-purple-700'}`}>{subGrade}</td>
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

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="border-2 border-indigo-300 bg-indigo-50 rounded-lg p-3 text-center">
                <div className="text-[9px] md:text-[10px] font-black text-indigo-600 uppercase">Total Marks</div>
                <div className="text-lg md:text-xl font-black text-indigo-900">{marksheet.total_obtained}/{marksheet.total_max}</div>
              </div>
              <div className="border-2 border-green-300 bg-green-50 rounded-lg p-3 text-center">
                <div className="text-[9px] md:text-[10px] font-black text-green-600 uppercase">Percentage</div>
                <div className="text-lg md:text-xl font-black text-green-900">{marksheet.percentage}%</div>
              </div>
              <div className="border-2 border-purple-300 bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-[9px] md:text-[10px] font-black text-purple-600 uppercase">Grade</div>
                <div className="text-lg md:text-xl font-black text-purple-900">{marksheet.grade}</div>
              </div>
            </div>

            {marksheet.attendance_days > 0 && (
              <div className="mb-5 text-xs text-center font-bold text-slate-600">
                Attendance: <span className="text-orange-700">{marksheet.attendance_days} Days</span>
              </div>
            )}

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-4 mt-10 pt-4 border-t border-slate-300">
              <div className="text-center">
                <div className="h-10"></div>
                <div className="border-t-2 border-slate-800 pt-1 text-[9px] md:text-[10px] font-black text-slate-700 uppercase">Class Teacher</div>
              </div>
              <div className="text-center">
                <div className="h-10"></div>
                <div className="border-t-2 border-slate-800 pt-1 text-[9px] md:text-[10px] font-black text-slate-700 uppercase">Exam Incharge</div>
              </div>
              <div className="text-center">
                <div className="h-10 flex items-center justify-center">
                  {marksheet.school.signature && (
                    <img src={marksheet.school.signature} alt="Signature" className="max-h-10 object-contain" />
                  )}
                </div>
                <div className="border-t-2 border-slate-800 pt-1 text-[9px] md:text-[10px] font-black text-slate-700 uppercase">Principal</div>
              </div>
            </div>

            <div className="text-center text-[8px] text-slate-400 mt-6 font-bold">
              Generated on {new Date().toLocaleString()} • Powered by A.B.Digital Work
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentMarksheet;
