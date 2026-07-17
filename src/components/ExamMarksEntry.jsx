import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Save, BookOpen, Users, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

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
  const [classes, setClasses] = useState([]);
  
  // ==============================
  // FIELD CONFIGURATION (NBSE HATAYA)
  // ==============================
  const subjectFields = [
    { key: 'theory', label: 'Theory', color: 'text-blue-600', width: 'w-[65px]' },
    { key: 'practical', label: 'Pract./Project', color: 'text-green-600', width: 'w-[80px]' },
    { key: 'internal', label: 'Internal/Other', color: 'text-orange-600', width: 'w-[75px]' },
    { key: 'total', label: 'Total', color: 'text-purple-700 font-bold', width: 'w-[60px]', readOnly: true }
  ];

  // ==============================
  // FETCH FUNCTIONS
  // ==============================
  useEffect(() => {
    fetchAssignedExams();
  }, []);

  const fetchAssignedExams = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/staff/exams/${staffData.id}`);
      setExams(res.data.exams || []);
      
      const uniqueClasses = [...new Set((res.data.exams || []).map(e => e.class))];
      setClasses(uniqueClasses);
    } catch (err) {
      console.log("Exam fetch error", err);
      setMessage({ type: 'error', text: 'Failed to fetch exams' });
    }
  };

  const loadStudentsAndSubjects = useCallback(async (examId, className) => {
    if (!examId || !className) return;
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Fetch students for this class
      const studentsRes = await axios.get(`${BASE_URL}/api/students/class/${className}`);
      const studentsList = studentsRes.data.students || [];
      setStudents(studentsList);
      
      // Fetch subjects for this class
      const subjectsRes = await axios.get(`${BASE_URL}/api/subjects/class/${className}`);
      const subjectsList = subjectsRes.data.subjects || [];
      setSubjects(subjectsList);
      
      // Fetch existing marks for this exam
      const marksRes = await axios.get(`${BASE_URL}/api/exams/${examId}/marks`);
      const existingMarks = marksRes.data.marks || {};
      
      // Initialize marks data for each student
      const initialMarks = {};
      studentsList.forEach(student => {
        initialMarks[student.id] = {
          student_id: student.id,
          roll_no: student.roll_no,
          name: student.name,
          attendance: existingMarks[student.id]?.attendance || '',
          subject_marks: {}
        };
        
        // Initialize subject marks with Theory, Practical, Internal, Total
        subjectsList.forEach(sub => {
          const existing = existingMarks[student.id]?.subject_marks?.[sub.id] || {};
          initialMarks[student.id].subject_marks[sub.id] = {
            theory: existing.theory || '',
            practical: existing.practical || '',
            internal: existing.internal || '',
            total: existing.total || 0
          };
        });
      });
      
      setMarksData(initialMarks);
      
      const exam = exams.find(e => e.id === parseInt(examId));
      setSelectedExam(exam || null);
      setSelectedClass(className);
      
    } catch (err) {
      console.error("Load error:", err);
      setMessage({ type: 'error', text: 'Failed to load students/subjects' });
    } finally {
      setLoading(false);
    }
  }, [exams]);

  // ==============================
  // HANDLE FUNCTIONS
  // ==============================
  const handleExamSelect = (examId) => {
    const exam = exams.find(e => e.id === parseInt(examId));
    if (exam) {
      setSelectedExam(exam);
      setSelectedClass(exam.class);
      loadStudentsAndSubjects(examId, exam.class);
    }
  };

  // Handle mark change for any field
  const handleMarkChange = (studentId, subjectId, field, value) => {
    setMarksData(prev => {
      const updated = { ...prev };
      const student = updated[studentId];
      
      // Update the specific field
      student.subject_marks[subjectId][field] = value;
      
      // Auto-calculate total: Theory + Practical + Internal
      const theory = parseFloat(student.subject_marks[subjectId].theory) || 0;
      const practical = parseFloat(student.subject_marks[subjectId].practical) || 0;
      const internal = parseFloat(student.subject_marks[subjectId].internal) || 0;
      student.subject_marks[subjectId].total = theory + practical + internal;
      
      return updated;
    });
  };

  // Calculate totals for a student
  const calculateStudentTotals = (studentId) => {
    const student = marksData[studentId];
    if (!student) return { total: 0, percentage: 0, grade: '-', maxMarks: 0 };
    
    let totalMarks = 0;
    let maxMarks = 0;
    
    subjects.forEach(sub => {
      const marks = student.subject_marks[sub.id];
      if (marks) {
        totalMarks += marks.total || 0;
        maxMarks += sub.max_marks || 100;
      }
    });
    
    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
    
    let grade = '-';
    if (percentage >= 91) grade = 'A1';
    else if (percentage >= 81) grade = 'A2';
    else if (percentage >= 71) grade = 'B1';
    else if (percentage >= 61) grade = 'B2';
    else if (percentage >= 51) grade = 'C1';
    else if (percentage >= 41) grade = 'C2';
    else if (percentage >= 33) grade = 'D';
    else grade = 'E';
    
    return { total: totalMarks, percentage, grade, maxMarks };
  };

  // Save all marks
  const handleSaveMarks = async () => {
    if (!selectedExam || !selectedClass) {
      setMessage({ type: 'error', text: 'Please select an exam first!' });
      return;
    }
    
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const payload = {
        exam_id: selectedExam.id,
        class: selectedClass,
        marks: Object.keys(marksData).map(studentId => {
          const student = marksData[studentId];
          const subjectMarks = {};
          
          subjects.forEach(sub => {
            const marks = student.subject_marks[sub.id];
            if (marks) {
              subjectMarks[sub.id] = {
                theory: parseFloat(marks.theory) || 0,
                practical: parseFloat(marks.practical) || 0,
                internal: parseFloat(marks.internal) || 0
              };
            }
          });
          
          return {
            student_id: parseInt(studentId),
            attendance: parseFloat(student.attendance) || 0,
            subject_marks: subjectMarks
          };
        })
      };
      
      await axios.post(`${BASE_URL}/api/exams/save-marks`, payload);
      
      setMessage({ type: 'success', text: '✅ All marks saved successfully!' });
      if (onMarksSaved) onMarksSaved();
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      
    } catch (err) {
      console.error("Save error:", err);
      setMessage({ type: 'error', text: 'Failed to save marks. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // ==============================
  // RENDER
  // ==============================
  const renderMessage = () => {
    if (!message.text) return null;
    
    const bgColor = message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    message.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
                    'bg-blue-50 text-blue-800 border-blue-200';
    
    const Icon = message.type === 'success' ? CheckCircle :
                 message.type === 'error' ? XCircle : AlertCircle;
    
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
    
    if (!students.length) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-12 h-12 mx-auto text-gray-300" />
          <p className="mt-4">No students found in this class</p>
        </div>
      );
    }
    
    if (!subjects.length) {
      return (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300" />
          <p className="mt-4">No subjects assigned to this class</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="bg-gray-100 text-[10px] uppercase sticky top-0 z-10">
            <tr>
              <th className="p-3 text-left min-w-[100px] sticky left-0 bg-gray-100 z-20">Roll - Name</th>
              
              {/* Subject columns with Theory, Practical, Internal, Total */}
              {subjects.map(sub => (
                <th key={sub.id} className="p-2 text-center min-w-[300px]">
                  <div className="font-bold text-xs mb-1">{sub.subject_name}</div>
                  <div className="flex gap-1 text-[8px] text-gray-500 justify-center">
                    <span className="w-[65px] text-blue-600">Theory</span>
                    <span className="w-[80px] text-green-600">Pract./Project</span>
                    <span className="w-[75px] text-orange-600">Internal/Other</span>
                    <span className="w-[60px] font-bold text-purple-700">Total</span>
                  </div>
                </th>
              ))}
              
              {/* Grand Total, %, Grade */}
              <th className="p-2 text-center min-w-[60px]">Grand Total</th>
              <th className="p-2 text-center min-w-[55px]">%</th>
              <th className="p-2 text-center min-w-[50px]">Grade</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => {
              const studentMarks = marksData[student.id];
              if (!studentMarks) return null;
              
              const { total, percentage, grade, maxMarks } = calculateStudentTotals(student.id);
              
              return (
                <tr key={student.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 text-left font-bold text-xs sticky left-0 bg-white z-10">
                    <div>{student.roll_no}</div>
                    <div className="font-normal text-gray-500">{student.name}</div>
                  </td>
                  
                  {/* Subject marks with Theory, Practical, Internal, Total */}
                  {subjects.map(sub => {
                    const marks = studentMarks.subject_marks[sub.id] || { theory: '', practical: '', internal: '', total: 0 };
                    
                    return (
                      <td key={sub.id} className="p-1 text-center">
                        <div className="flex gap-1 justify-center items-center">
                          {/* Theory Input */}
                          <input
                            type="number"
                            className="w-[65px] border border-blue-300 rounded px-1 py-1 text-center text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                            placeholder="Th"
                            value={marks.theory}
                            onChange={(e) => handleMarkChange(student.id, sub.id, 'theory', e.target.value)}
                            min="0"
                            max={sub.max_marks || 100}
                          />
                          
                          {/* Practical/Project Input */}
                          <input
                            type="number"
                            className="w-[80px] border border-green-300 rounded px-1 py-1 text-center text-xs focus:border-green-500 focus:ring-1 focus:ring-green-200"
                            placeholder="Pract./Proj."
                            value={marks.practical}
                            onChange={(e) => handleMarkChange(student.id, sub.id, 'practical', e.target.value)}
                            min="0"
                            max={sub.max_marks || 100}
                          />
                          
                          {/* Internal/Other Input */}
                          <input
                            type="number"
                            className="w-[75px] border border-orange-300 rounded px-1 py-1 text-center text-xs focus:border-orange-500 focus:ring-1 focus:ring-orange-200"
                            placeholder="Internal"
                            value={marks.internal}
                            onChange={(e) => handleMarkChange(student.id, sub.id, 'internal', e.target.value)}
                            min="0"
                            max={sub.max_marks || 100}
                          />
                          
                          {/* Total (Auto-calculated) */}
                          <span className="w-[60px] text-center font-bold text-purple-700 text-sm bg-purple-50 rounded py-1">
                            {marks.total || 0}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                  
                  {/* Grand Total */}
                  <td className="p-2 text-center font-bold text-blue-600 text-sm">
                    {total}
                  </td>
                  
                  {/* Percentage */}
                  <td className="p-2 text-center font-bold text-xs">
                    {percentage.toFixed(1)}%
                  </td>
                  
                  {/* Grade */}
                  <td className={`p-2 text-center font-bold text-xs ${grade === 'E' ? 'text-red-600' : 'text-green-600'}`}>
                    {grade}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {/* Save button */}
        <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {students.length} students • {subjects.length} subjects
          </span>
          <button
            onClick={handleSaveMarks}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save All Marks
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold">✏️ Enter Marks</h2>
        </div>
        <div className="flex gap-3 text-[10px] font-bold">
          <span className="text-blue-600">Theory</span>
          <span className="text-green-600">Pract./Project</span>
          <span className="text-orange-600">Internal/Other</span>
          <span className="text-purple-700">= Total</span>
        </div>
      </div>
      
      {/* Exam Selection */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          className="flex-1 p-3 border border-gray-300 rounded-xl font-medium bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          onChange={(e) => handleExamSelect(e.target.value)}
          value={selectedExam?.id || ''}
        >
          <option value="">-- Select Exam --</option>
          {exams.map(exam => (
            <option key={exam.id} value={exam.id}>
              {exam.exam_name} - Class {exam.class} - {exam.subject}
            </option>
          ))}
        </select>
      </div>
      
      {/* Message */}
      {renderMessage()}
      
      {/* Marks Table */}
      {selectedExam && (
        <div className="mt-4">
          {renderMarksTable()}
        </div>
      )}
      
      {/* Empty state */}
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
