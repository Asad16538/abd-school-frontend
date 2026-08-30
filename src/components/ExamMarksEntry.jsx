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
      // 1. Staff ke exams fetch karo
      const res = await axios.get(`${BASE_URL}/api/staff/exams/${staffData.id}`);
      setExams(res.data.exams || []);
      
      // 2. Staff ke assigned subjects fetch karo (Naya route)
      const subRes = await axios.get(`${BASE_URL}/api/staff/assigned-subjects/${staffData.id}`);
      setSubjects(subRes.data.assignments || []);
      
    } catch (err) {
      console.log("Fetch error", err);
      setMessage({ type: 'error', text: 'Failed to fetch data' });
    }
  };

  // ✅ FIXED: Multi-subject API use karo
  const loadStudentsAndSubjects = useCallback(async (examId, className) => {
    if (!examId || !className) return;
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // ✅ CORRECT: /api/exams/{examId}/students-multi use karo
      const res = await axios.get(`${BASE_URL}/api/exams/${examId}/students-multi`);
      
      if (res.data.success) {
        const examData = res.data.exam;
        const studentsList = res.data.students || [];
        setStudents(studentsList);
        
        // Subjects ko exam se lo
        const subjectsList = examData?.subjects || [];
        setSubjects(subjectsList.map(s => ({ 
          subject_name: s, 
          max_marks: 100,
          id: s 
        })));
        
        // Initialize marks data
        const initialMarks = {};
        studentsList.forEach(student => {
          initialMarks[student.id] = {
            student_id: student.id,
            roll_no: student.roll_no || '-',
            name: student.name,
            subject_marks: {}
          };
          
          subjectsList.forEach(sub => {
            const existing = student.marks?.[sub] || {};
            initialMarks[student.id].subject_marks[sub] = {
              theory: existing.theory || '',
              practical: existing.practical || '',
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

  // Handle mark change
  const handleMarkChange = (studentId, subjectName, field, value) => {
    setMarksData(prev => {
      const updated = { ...prev };
      const student = updated[studentId];
      
      if (!student.subject_marks[subjectName]) {
        student.subject_marks[subjectName] = { theory: '', practical: '', total: 0 };
      }
      
      student.subject_marks[subjectName][field] = value;
      
      // Auto-calculate total
      const theory = parseFloat(student.subject_marks[subjectName].theory) || 0;
      const practical = parseFloat(student.subject_marks[subjectName].practical) || 0;
      student.subject_marks[subjectName].total = theory + practical;
      
      return updated;
    });
  };

  // Calculate totals for a student
  const calculateStudentTotals = (studentId) => {
    const student = marksData[studentId];
    if (!student) return { total: 0, percentage: 0, grade: '-', maxMarks: 0 };
    
    let totalMarks = 0;
    const maxMarks = subjects.length * 100;
    
    subjects.forEach(sub => {
      const marks = student.subject_marks[sub.subject_name];
      if (marks) {
        totalMarks += marks.total || 0;
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

  // ✅ FIXED: Save marks using save-multi-marks API
  const handleSaveMarks = async () => {
    if (!selectedExam || !selectedClass) {
      setMessage({ type: 'error', text: 'Please select an exam first!' });
      return;
    }
    
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const examId = selectedExam.exam_id || selectedExam.id;
      
      const studentsData = Object.keys(marksData).map(studentId => {
        const student = marksData[studentId];
        const marks = {};
        
        subjects.forEach(sub => {
          const marksInfo = student.subject_marks[sub.subject_name] || { theory: 0, practical: 0, total: 0 };
          marks[sub.subject_name] = {
            theory: parseFloat(marksInfo.theory) || 0,
            practical: parseFloat(marksInfo.practical) || 0,
            total: parseFloat(marksInfo.theory) || 0 + parseFloat(marksInfo.practical) || 0
          };
        });
        
        return {
          student_id: parseInt(studentId),
          marks: marks
        };
      });

      const payload = {
        exam_id: examId,
        students: studentsData
      };
      
      // ✅ CORRECT: save-multi-marks API use karo
      const res = await axios.post(`${BASE_URL}/api/exams/save-multi-marks`, payload);
      
      if (res.data.success) {
        setMessage({ type: 'success', text: '✅ All marks saved successfully!' });
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
              
              {subjects.map(sub => (
                <th key={sub.subject_name} className="p-2 text-center min-w-[280px]">
                  <div className="font-bold text-xs mb-1">{sub.subject_name}</div>
                  <div className="flex gap-1 text-[8px] text-gray-500 justify-center">
                    <span className="w-[65px] text-blue-600">Theory</span>
                    <span className="w-[80px] text-green-600">Pract./Project</span>
                    <span className="w-[60px] font-bold text-purple-700">Total</span>
                  </div>
                </th>
              ))}
              
              <th className="p-2 text-center min-w-[60px]">Grand Total</th>
              <th className="p-2 text-center min-w-[55px]">%</th>
              <th className="p-2 text-center min-w-[50px]">Grade</th>
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
                    
                    return (
                      <td key={sub.subject_name} className="p-1 text-center">
                        <div className="flex gap-1 justify-center items-center">
                          <input
                            type="number"
                            className="w-[65px] border border-blue-300 rounded px-1 py-1 text-center text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                            placeholder="Th"
                            value={marks.theory}
                            onChange={(e) => handleMarkChange(student.id, sub.subject_name, 'theory', e.target.value)}
                            min="0"
                            max="100"
                          />
                          
                          <input
                            type="number"
                            className="w-[80px] border border-green-300 rounded px-1 py-1 text-center text-xs focus:border-green-500 focus:ring-1 focus:ring-green-200"
                            placeholder="Pract."
                            value={marks.practical}
                            onChange={(e) => handleMarkChange(student.id, sub.subject_name, 'practical', e.target.value)}
                            min="0"
                            max="100"
                          />
                          
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
                </tr>
              );
            })}
          </tbody>
        </table>
        
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold">✏️ Enter Marks</h2>
        </div>
        <div className="flex gap-3 text-[10px] font-bold">
          <span className="text-blue-600">Theory</span>
          <span className="text-green-600">Pract./Project</span>
          <span className="text-purple-700">= Total</span>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          className="flex-1 p-3 border border-gray-300 rounded-xl font-medium bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          onChange={(e) => handleExamSelect(e.target.value)}
          value={selectedExam?.id || selectedExam?.exam_id || ''}
        >
          <option value="">-- Select Exam --</option>
          {exams.map(exam => (
            <option key={exam.id || exam.exam_id} value={exam.id || exam.exam_id}>
              {exam.exam_name} - Class {exam.class}
            </option>
          ))}
        </select>
      </div>
      
      {renderMessage()}
      
      {selectedExam && (
        <div className="mt-4">
          {renderMarksTable()}
        </div>
      )}
      
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
