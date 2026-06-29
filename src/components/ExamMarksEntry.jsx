// src/components/ExamMarksEntry.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Users, CheckCircle, XCircle, Save, 
  BookOpen, AlertCircle
} from 'lucide-react';

const BASE_URL = 'https://abd-school-backend.onrender.com';

const ExamMarksEntry = ({ staffData, onMarksSaved }) => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [boardName, setBoardName] = useState('CBSE');
  const [examPattern, setExamPattern] = useState({
    theory_marks: 80,
    internal_marks: 20,
    total_marks: 100
  });
  const [showAttendance, setShowAttendance] = useState(false);

  useEffect(() => {
    fetchAssignedExams();
    fetchBoardSettings();
  }, []);

  const fetchBoardSettings = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/board-settings`);
      if (res.data) {
        setBoardName(res.data.board_name || 'CBSE');
      }
    } catch (err) {
      console.log("Board settings fetch error");
    }
  };

  const fetchAssignedExams = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/staff/exams/${staffData.id}`);
      setExams(res.data.exams || []);
    } catch (err) {
      console.log("Exam fetch error");
    }
  };

  const fetchExamPattern = async (className, subjectType) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/exam-pattern`, {
        params: {
          board: boardName,
          class: className || 'All',
          subject_type: subjectType || 'All'
        }
      });
      setExamPattern(res.data);
      
      const isFinalExam = selectedExam?.exam_type === 'Final' || 
                          selectedExam?.exam_type === 'Term 2' || 
                          selectedExam?.exam_type === 'Annual' ||
                          selectedExam?.exam_type === 'Half Yearly';
      setShowAttendance(isFinalExam);
      
    } catch (err) {
      console.log("Exam pattern fetch error");
    }
  };

  const handleExamSelect = async (examId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/exams/${examId}/students`);
      setStudents(res.data.students || []);
      setSelectedExam(res.data.exam);
      
      await fetchExamPattern(res.data.exam?.class, res.data.exam?.subject_type);
      
      const marks = {};
      res.data.students.forEach(s => {
        marks[s.id] = { 
          theory: s.theory_marks !== null ? s.theory_marks : '',
          internal: s.internal_marks !== null ? s.internal_marks : '',
          attendance: s.attendance_marks !== null ? s.attendance_marks : '',
          total: s.marks_obtained !== null ? s.marks_obtained : '',
          grade: s.grade || ''
        };
      });
      setMarksData(marks);
    } catch (err) {
      setMessage({ type: 'error', text: 'Students fetch error' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, field, value) => {
    setMarksData(prev => {
      const updated = { ...prev };
      updated[studentId] = { ...updated[studentId], [field]: value };
      
      const theory = parseFloat(updated[studentId].theory) || 0;
      const internal = parseFloat(updated[studentId].internal) || 0;
      const attendance = parseFloat(updated[studentId].attendance) || 0;
      updated[studentId].total = theory + internal + attendance;
      
      const totalMarks = examPattern.total_marks || 100;
      const percentage = (updated[studentId].total / totalMarks) * 100;
      updated[studentId].grade = getGrade(percentage);
      
      return updated;
    });
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const handleSaveMarks = async () => {
    setLoading(true);
    try {
      const payload = {
        exam_id: selectedExam.id,
        marks: Object.keys(marksData).map(studentId => ({
          student_id: parseInt(studentId),
          theory_marks: parseFloat(marksData[studentId].theory) || 0,
          internal_marks: parseFloat(marksData[studentId].internal) || 0,
          attendance_marks: parseFloat(marksData[studentId].attendance) || 0
        }))
      };
      
      const res = await axios.post(`${BASE_URL}/api/exams/save-marks`, payload);
      if (res.data.success) {
        setMessage({ type: 'success', text: '✅ Marks saved successfully!' });
        onMarksSaved();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Marks save failed' });
    } finally {
      setLoading(false);
    }
  };

  const shouldShowAttendance = () => {
    const examTypes = ['Final', 'Term 2', 'Annual', 'Half Yearly'];
    return examTypes.some(t => selectedExam?.exam_type?.includes(t));
  };

  const showAttendanceColumn = shouldShowAttendance();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-800">📝 Marks Entry</h3>
      
      <div className={`p-3 rounded-xl border flex items-center gap-2 ${
        boardName === 'MP Board' ? 'bg-orange-50 border-orange-200 text-orange-700' :
        boardName === 'CBSE' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
        'bg-gray-50 border-gray-200 text-gray-700'
      }`}>
        <AlertCircle className="w-4 h-4" />
        <span className="text-xs font-bold">
          📚 {boardName} - Theory: {examPattern.theory_marks}, Internal: {examPattern.internal_marks}
          {showAttendanceColumn && ' + Attendance'}
        </span>
      </div>
      
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-gray-400" />
          <select 
            className="flex-1 p-2.5 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50"
            onChange={(e) => handleExamSelect(e.target.value)}
            defaultValue=""
          >
            <option value="">-- Select Exam --</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>
                {e.exam_name} - Class {e.class} {e.section}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message.text && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {students.length > 0 && selectedExam && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
                  <th className="p-3 w-16">Roll</th>
                  <th className="p-3 min-w-[120px]">Student Name</th>
                  <th className="p-3 w-28">
                    <div className="text-center">Theory</div>
                    <div className="text-center text-[8px] font-normal">({examPattern.theory_marks})</div>
                  </th>
                  <th className="p-3 w-28">
                    <div className="text-center">Internal/SE/NB</div>
                    <div className="text-center text-[8px] font-normal">({examPattern.internal_marks})</div>
                  </th>
                  {showAttendanceColumn && (
                    <th className="p-3 w-24">
                      <div className="text-center">Attendance</div>
                      <div className="text-center text-[8px] font-normal">(5)</div>
                    </th>
                  )}
                  <th className="p-3 w-20 text-center">Total</th>
                  <th className="p-3 w-16 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="p-3 font-bold">{student.roll_no || '-'}</td>
                    <td className="p-3 font-medium">{student.name}</td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        min="0"
                        max={examPattern.theory_marks}
                        value={marksData[student.id]?.theory || ''}
                        onChange={(e) => handleMarkChange(student.id, 'theory', e.target.value)}
                        className="w-full max-w-[60px] p-1.5 border border-gray-200 rounded-lg text-center text-sm font-bold mx-auto block"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        min="0"
                        max={examPattern.internal_marks}
                        value={marksData[student.id]?.internal || ''}
                        onChange={(e) => handleMarkChange(student.id, 'internal', e.target.value)}
                        className="w-full max-w-[60px] p-1.5 border border-gray-200 rounded-lg text-center text-sm font-bold mx-auto block"
                        placeholder="0"
                      />
                    </td>
                    {showAttendanceColumn && (
                      <td className="p-3">
                        <input 
                          type="number" 
                          min="0"
                          max="5"
                          value={marksData[student.id]?.attendance || ''}
                          onChange={(e) => handleMarkChange(student.id, 'attendance', e.target.value)}
                          className="w-full max-w-[60px] p-1.5 border border-gray-200 rounded-lg text-center text-sm font-bold mx-auto block"
                          placeholder="0"
                        />
                      </td>
                    )}
                    <td className="p-3 text-center">
                      <span className="font-bold text-indigo-600 text-sm">
                        {marksData[student.id]?.total || 0}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        (marksData[student.id]?.grade || 'F') === 'A+' || (marksData[student.id]?.grade || 'F') === 'A' ? 'bg-green-100 text-green-700' :
                        (marksData[student.id]?.grade || 'F') === 'B+' || (marksData[student.id]?.grade || 'F') === 'B' ? 'bg-blue-100 text-blue-700' :
                        (marksData[student.id]?.grade || 'F') === 'C' ? 'bg-yellow-100 text-yellow-700' :
                        (marksData[student.id]?.grade || 'F') === 'D' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {marksData[student.id]?.grade || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button 
              onClick={handleSaveMarks}
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> {loading ? 'Saving...' : '💾 Save All Marks'}
            </button>
          </div>
        </div>
      )}

      {!loading && students.length === 0 && selectedExam && (
        <div className="bg-white p-8 rounded-xl text-center border border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-bold text-sm">No students found</p>
        </div>
      )}
    </div>
  );
};

export default ExamMarksEntry;