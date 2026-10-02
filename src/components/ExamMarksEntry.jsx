import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Save, BookOpen, Users, CheckCircle, XCircle, Loader2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const BASE_URL = 'https://erp-api.aapschool.in';

const ExamMarksEntry = ({ staffData, onMarksSaved }) => {
  // ==============================
  // STATES
  // ==============================
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ==============================
  // FETCH FUNCTIONS
  // ==============================
  useEffect(() => {
    if (staffData?.id) {
      fetchAssignedExamsAndSubjects();
    }
  }, [staffData]);

  const fetchAssignedExamsAndSubjects = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/staff/exams/${staffData.id}`);
      setExams(res.data.exams || []);

      const subRes = await axios.get(`${BASE_URL}/api/staff/assigned-subjects/${staffData.id}`);
      setSubjects(subRes.data.assignments || []);
    } catch (err) {
      console.log("Fetch error", err);
      setMessage({ type: 'error', text: 'Failed to fetch data' });
    }
  };

  const loadStudentsAndSubjects = useCallback(async (examId, className) => {
    if (!examId || !className) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await axios.get(`${BASE_URL}/api/exams/${examId}/students-multi`);

      if (res.data.success) {
        const examData = res.data.exam;
        const studentsList = res.data.students || [];
        setStudents(studentsList);

        const subjectsList = examData?.subjects || [];
        const subjectConfig = examData?.subject_config || {};  // ✅ Config lo

        // ✅ FIX: Har subject ka actual theory_max / internal_max use karo
        setSubjects(subjectsList.map(s => {
          const config = subjectConfig[s] || {};
          return {
            subject_name: s,
            id: s,
            theory_max: config.theory_max || 80,
            internal_max: config.internal_max || 20,
            max_marks: config.total_max || 100
          };
        }));

        const initialMarks = {};
        studentsList.forEach(student => {
          initialMarks[student.id] = {
            student_id: student.id,
            roll_no: student.roll_no || '-',
            name: student.name,
            father_name: student.father_name || student.fatherName || 'N/A',
            attendance: student.attendance || '',
            subject_marks: {}
          };

          subjectsList.forEach(sub => {
            const existing = student.marks?.[sub] || {};
            initialMarks[student.id].subject_marks[sub] = {
              theory: existing.theory !== undefined ? existing.theory : '',
              practical: existing.practical !== undefined ? existing.practical : '',
              total: existing.total || 0
            };
          });
        });

        setMarksData(initialMarks);

        const exam = exams.find(e => e.id === parseInt(examId) || e.exam_id === examId);
        setSelectedExam(exam || null);
        setSelectedClass(className);
      }
    } catch (err) {
      console.error("Load error:", err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to load students/subjects' });
    } finally {
      setLoading(false);
    }
  }, [exams]);

  // ==============================
  // HANDLE FUNCTIONS
  // ==============================
  const handleExamSelect = (examId) => {
    const exam = exams.find(e => e.id === parseInt(examId) || e.exam_id === examId);
    if (exam) {
      setSelectedExam(exam);
      setSelectedClass(exam.class);
      loadStudentsAndSubjects(examId, exam.class);
    }
  };

  const handleMarkChange = (studentId, subjectName, field, value) => {
    setMarksData(prev => {
      const updated = { ...prev };
      const student = updated[studentId];

      if (!student.subject_marks[subjectName]) {
        student.subject_marks[subjectName] = { theory: '', practical: '', total: 0 };
      }

      student.subject_marks[subjectName][field] = value;

      const isUnitTest = selectedExam?.exam_name?.toLowerCase().includes('unit');
      const theory = parseFloat(student.subject_marks[subjectName].theory) || 0;
      const practical = parseFloat(student.subject_marks[subjectName].practical) || 0;

      student.subject_marks[subjectName].total = isUnitTest ? theory : (theory + practical);

      return updated;
    });
  };

  const handleAttendanceChange = (studentId, value) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], attendance: value }
    }));
  };

  const calculateStudentTotals = (studentId) => {
    const student = marksData[studentId];
    if (!student) return { total: 0, percentage: 0, grade: '-' };

    let totalMarks = 0;
    let maxMarks = 0;   // ✅ Actual max calculate karo

    subjects.forEach(sub => {
      const marks = student.subject_marks[sub.subject_name];
      if (marks) {
        totalMarks += marks.total || 0;
      }
      // ✅ Har subject ka actual max add karo
      maxMarks += (sub.max_marks || 100);
    });

    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

    // ... baaki grade calculation same
};

    let grade = '-';
    if (percentage >= 91) grade = 'A1';
    else if (percentage >= 81) grade = 'A2';
    else if (percentage >= 71) grade = 'B1';
    else if (percentage >= 61) grade = 'B2';
    else if (percentage >= 51) grade = 'C1';
    else if (percentage >= 41) grade = 'C2';
    else if (percentage >= 33) grade = 'D';
    else grade = 'E';

    return { total: totalMarks, percentage, grade };
  };

  const handleSaveMarks = async () => {
    if (!selectedExam || !selectedClass) {
      setMessage({ type: 'error', text: 'Please select an exam first!' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const examId = selectedExam.exam_id || selectedExam.id;
      const isUnitTest = selectedExam?.exam_name?.toLowerCase().includes('unit');

      const studentsData = Object.keys(marksData).map(studentId => {
        const student = marksData[studentId];
        const marks = {};

        subjects.forEach(sub => {
          const marksInfo = student.subject_marks[sub.subject_name] || { theory: 0, practical: 0, total: 0 };
          const th = parseFloat(marksInfo.theory) || 0;
          const pr = parseFloat(marksInfo.practical) || 0;

          marks[sub.subject_name] = {
            theory: th,
            practical: isUnitTest ? 0 : pr,
            total: isUnitTest ? th : (th + pr)
          };
        });

        return {
          student_id: parseInt(studentId),
          attendance: student.attendance || 0,
          marks: marks
        };
      });

      const payload = {
        exam_id: examId,
        students: studentsData
      };

      const res = await axios.post(`${BASE_URL}/api/exams/save-multi-marks`, payload);

      if (res.data.success) {
        setMessage({ type: 'success', text: '✅ All marks & attendance saved successfully!' });
        if (onMarksSaved) onMarksSaved();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }

    } catch (err) {
      console.error("Save error:", err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save marks' });
    } finally {
      setSaving(false);
    }
  };

  // ==============================
  // ✅ EXCEL EXPORT FUNCTION (NAYA)
  // ==============================
  const handleExportExcel = () => {
    if (!students.length || !subjects.length) {
      setMessage({ type: 'error', text: 'Pehle exam select karke marks load karein!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    const isUnitTest = selectedExam?.exam_name?.toLowerCase().includes('unit');
    const isAnnual = selectedExam?.exam_name?.toLowerCase().includes('annual');

    // ✅ Sheet ke liye data array banao
    const exportData = students.map(student => {
      const studentMarks = marksData[student.id] || {};
      const { total, percentage, grade } = calculateStudentTotals(student.id);

      // Row base object - Roll, Name, Father
      const row = {
        'Roll No': student.roll_no || '-',
        'Student Name': student.name || '-',
        'Father Name': student.father_name || 'N/A'
      };

      // Har subject ke Theory/Practical/Total columns add karo
      subjects.forEach(sub => {
        const marks = studentMarks.subject_marks?.[sub.subject_name] || { theory: '', practical: '', total: 0 };

        if (isUnitTest) {
          row[`${sub.subject_name} (Marks)`] = parseFloat(marks.theory) || 0;
        } else {
          row[`${sub.subject_name} (Theory)`] = parseFloat(marks.theory) || 0;
          row[`${sub.subject_name} (Practical)`] = parseFloat(marks.practical) || 0;
        }
        row[`${sub.subject_name} (Total)`] = marks.total || 0;
      });

      // Grand Total, %, Grade
      row['Grand Total'] = total;
      row['Max Marks'] = subjects.length * 100;
      row['Percentage'] = `${percentage.toFixed(1)}%`;
      row['Grade'] = grade;

      // Annual attendance column
      if (isAnnual) {
        row['Present Days'] = studentMarks.attendance || 0;
      }

      return row;
    });

    // ✅ Worksheet banao
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // ✅ Column widths auto set karo
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length + 2, 12)
    }));
    worksheet['!cols'] = colWidths;

    // ✅ Workbook banao
    const workbook = XLSX.utils.book_new();
    const sheetName = selectedExam?.exam_name
      ? `${selectedExam.exam_name.slice(0, 25)}`
      : 'Marks Entry';

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // ✅ Filename banao
    const className = selectedExam?.class || 'Class';
    const section = selectedExam?.section || 'A';
    const examName = (selectedExam?.exam_name || 'Exam').replace(/\s+/g, '_');
    const filename = `Marks_${examName}_Class${className}_${section}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // ✅ Download
    XLSX.writeFile(workbook, filename);

    setMessage({ type: 'success', text: `✅ Excel download ho gayi: ${filename}` });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const renderMessage = () => {
    if (!message.text) return null;
    const bgColor = message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200';
    const Icon = message.type === 'success' ? CheckCircle : AlertCircle;
    return (
      <div className={`flex items-center gap-2 p-3 border rounded-xl ${bgColor}`}>
        <Icon className="w-5 h-5" />
        <span className="font-medium">{message.text}</span>
      </div>
    );
  };

  const renderMarksTable = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="mt-4 text-gray-500">Loading students and subjects...</p>
        </div>
      );
    }

    if (!students.length) return <div className="text-center py-12 text-gray-500"><Users className="w-12 h-12 mx-auto text-gray-300" /><p className="mt-4">No students found</p></div>;
    if (!subjects.length) return <div className="text-center py-12 text-gray-500"><BookOpen className="w-12 h-12 mx-auto text-gray-300" /><p className="mt-4">No subjects found</p></div>;

    const isUnitTest = selectedExam?.exam_name?.toLowerCase().includes('unit');
    const isAnnual = selectedExam?.exam_name?.toLowerCase().includes('annual');

    return (
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="bg-gray-100 text-[10px] uppercase sticky top-0 z-10">
            <tr>
              <th className="p-3 text-left min-w-[100px] sticky left-0 bg-gray-100 z-20">Roll - Name</th>

              {subjects.map(sub => (
                <th key={sub.subject_name} className="p-2 text-center min-w-[200px]">
                  <div className="font-bold text-xs mb-1">{sub.subject_name}</div>
                  <div className="flex gap-1 text-[8px] text-gray-500 justify-center">
                    {isUnitTest ? (
                      <span className="w-[70px] text-blue-600 font-bold">Marks</span>
                    ) : (
                      <>
                        <span className="w-[70px] text-blue-600">Theory</span>
                        <span className="w-[70px] text-green-600">Practical</span>
                      </>
                    )}
                    <span className="w-[60px] font-bold text-purple-700">Total</span>
                  </div>
                </th>
              ))}

              <th className="p-2 text-center min-w-[60px]">Grand Total</th>
              <th className="p-2 text-center min-w-[55px]">%</th>
              <th className="p-2 text-center min-w-[50px]">Grade</th>
              {isAnnual && <th className="p-2 text-center min-w-[90px] text-orange-700 font-black">Present Days</th>}
            </tr>
          </thead>
          <tbody>
            {students.map(student => {
              const studentMarks = marksData[student.id];
              if (!studentMarks) return null;

              const { total, percentage, grade } = calculateStudentTotals(student.id);

              return (
                <tr key={student.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 text-left font-bold text-xs sticky left-0 bg-white z-10">
                    <div>{student.roll_no}</div>
                    <div className="font-normal text-gray-500">{student.name}</div>
                  </td>

                  {subjects.map(sub => {
    const marks = studentMarks.subject_marks[sub.subject_name] || { theory: '', practical: '', total: 0 };
    const theoryMax = sub.theory_max || 80;   // ✅ Actual max
    const practicalMax = sub.internal_max || 20;  // ✅ Actual max

    return (
      <td key={sub.subject_name} className="p-1 text-center">
        <div className="flex gap-1 justify-center items-center">
          {isUnitTest ? (
            <input
              type="number"
              className="w-[70px] border border-blue-300 rounded px-1 py-1 text-center text-xs focus:border-blue-500"
              placeholder={`/${theoryMax}`}
              value={marks.theory}
              onChange={(e) => handleMarkChange(student.id, sub.subject_name, 'theory', e.target.value)}
              min="0"
              max={theoryMax}   // ✅ Actual max
            />
          ) : (
            <>
              <input
                type="number"
                className="w-[70px] border border-blue-300 rounded px-1 py-1 text-center text-xs focus:border-blue-500"
                placeholder={`Th/${theoryMax}`}
                value={marks.theory}
                onChange={(e) => handleMarkChange(student.id, sub.subject_name, 'theory', e.target.value)}
                min="0"
                max={theoryMax}   // ✅ Theory max
              />
              <input
                type="number"
                className="w-[70px] border border-green-300 rounded px-1 py-1 text-center text-xs focus:border-green-500"
                placeholder={`Pr/${practicalMax}`}
                value={marks.practical}
                onChange={(e) => handleMarkChange(student.id, sub.subject_name, 'practical', e.target.value)}
                min="0"
                max={practicalMax}   // ✅ Practical max
              />
            </>
          )}
          <span className="w-[60px] text-center font-bold text-purple-700 text-sm bg-purple-50 rounded py-1">
            {marks.total || 0}
          </span>
        </div>
      </td>
    );
})}

                  <td className="p-2 text-center font-bold text-blue-600 text-sm">{total}</td>
                  <td className="p-2 text-center font-bold text-xs">{percentage.toFixed(1)}%</td>
                  <td className={`p-2 text-center font-bold text-xs ${grade === 'E' ? 'text-red-600' : 'text-green-600'}`}>
                    {grade}
                  </td>

                  {isAnnual && (
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        className="w-[75px] border border-orange-400 bg-orange-50 rounded px-1 py-1 text-center text-xs font-bold focus:border-orange-600"
                        placeholder="Days"
                        value={studentMarks.attendance}
                        onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                        min="0"
                        max="365"
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="p-4 bg-gray-50 border-t flex flex-wrap gap-3 justify-between items-center">
          <span className="text-sm text-gray-500">
            {students.length} students • {subjects.length} subjects {isAnnual && "• Annual Attendance Enabled"}
          </span>

          {/* ✅ 2 BUTTONS: EXCEL EXPORT + SAVE MARKS */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"
              title="Download Excel"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Excel Download
            </button>

            <button
              onClick={handleSaveMarks}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save All Marks
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-2xl shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold">✏️ Assigned Class Marks Entry</h2>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          className="flex-1 p-3 border border-gray-300 rounded-xl font-medium bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          onChange={(e) => handleExamSelect(e.target.value)}
          value={selectedExam?.id || selectedExam?.exam_id || ''}
        >
          <option value="">-- Select Exam Type --</option>
          {exams.map(exam => (
            <option key={exam.id || exam.exam_id} value={exam.id || exam.exam_id}>
              {exam.exam_name} - Class {exam.class} ({exam.section || 'A'})
            </option>
          ))}
        </select>
      </div>

      {renderMessage()}
      {selectedExam && <div className="mt-4">{renderMarksTable()}</div>}

      {!selectedExam && !loading && (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-16 h-16 mx-auto text-gray-300" />
          <p className="mt-4 font-medium">Select an exam to start entering marks</p>
        </div>
      )}
    </div>
  );
};

export default ExamMarksEntry;
