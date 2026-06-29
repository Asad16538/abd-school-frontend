// src/components/ExamMarksEntry.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, BookOpen, AlertCircle, Users, CheckCircle, XCircle } from 'lucide-react';

const BASE_URL = 'https://abd-school-backend.onrender.com';

const ExamMarksEntry = ({ staffData, onMarksSaved }) => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [boardName, setBoardName] = useState('CBSE');
  const [examPattern, setExamPattern] = useState({ theory_marks: 80, internal_marks: 20, total_marks: 100 });
  const [showAttendance, setShowAttendance] = useState(false);

  useEffect(() => { fetchAssignedExams(); fetchBoardSettings(); }, []);

  const fetchBoardSettings = async () => {
    try { const res = await axios.get(`${BASE_URL}/api/board-settings`); if (res.data) setBoardName(res.data.board_name || 'CBSE'); } 
    catch (err) { console.log("Board settings fetch error"); }
  };

  const fetchAssignedExams = async () => {
    try { const res = await axios.get(`${BASE_URL}/api/staff/exams/${staffData.id}`); setExams(res.data.exams || []); } 
    catch (err) { console.log("Exam fetch error"); }
  };

  const fetchExamPattern = async (className, subjectType) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/exam-pattern`, { params: { board: boardName, class: className || 'All', subject_type: subjectType || 'All' } });
      setExamPattern(res.data);
      const isFinalExam = ['Final', 'Term 2', 'Annual', 'Half Yearly'].includes(selectedExam?.exam_type);
      setShowAttendance(isFinalExam);
    } catch (err) { console.log("Exam pattern fetch error"); }
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
        marks[s.id] = { theory: '', internal: '', final: '', attendance: '', total: 0, grade: '', att_percent: 0 };
      });
      setMarksData(marks);
    } catch (err) { setMessage({ type: 'error', text: 'Students fetch error' }); }
    finally { setLoading(false); }
  };

  const handleMarkChange = (studentId, field, value) => {
    setMarksData(prev => {
      const updated = { ...prev };
      updated[studentId] = { ...updated[studentId], [field]: value };
      
      const t = parseFloat(updated[studentId].theory) || 0;
      const i = parseFloat(updated[studentId].internal) || 0;
      const f = parseFloat(updated[studentId].final) || 0;
      const a = parseFloat(updated[studentId].attendance) || 0;
      
      updated[studentId].total = t + i + f + a;
      // ✅ FIX 1: Attendance % - 10 marks max
      updated[studentId].att_percent = a > 0 ? ((a / 10) * 100).toFixed(0) : 0; 
      
      const totalMarks = examPattern.total_marks || 100;
      updated[studentId].grade = getGrade((updated[studentId].total / totalMarks) * 100);
      return updated;
    });
  };

  const getGrade = (p) => p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B+' : p >= 60 ? 'B' : 'C';

  const handleSaveMarks = async () => {
    setLoading(true);
    try {
      const payload = {
        exam_id: selectedExam.id,
        marks: Object.keys(marksData).map(sid => ({
          student_id: parseInt(sid),
          theory_marks: parseFloat(marksData[sid].theory) || 0,
          internal_marks: parseFloat(marksData[sid].internal) || 0,
          final_marks: parseFloat(marksData[sid].final) || 0,
          attendance_marks: parseFloat(marksData[sid].attendance) || 0
        }))
      };
      await axios.post(`${BASE_URL}/api/exams/save-marks`, payload);
      setMessage({ type: 'success', text: '✅ Saved!' });
    } catch (err) { setMessage({ type: 'error', text: 'Failed' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Select Exam */}
      <select className="w-full p-3 border rounded-xl" onChange={(e) => handleExamSelect(e.target.value)}>
        <option value="">-- Select Exam --</option>
        {exams.map(e => <option key={e.id} value={e.id}>{e.exam_name} - {e.class}</option>)}
      </select>

      {message.text && (
        <div className={`p-2 rounded-xl text-xs font-bold ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {students.length > 0 && (
        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-[10px] uppercase">
              <tr>
                <th className="p-2">Roll - Name</th>
                <th className="p-2">IA</th>
                <th className="p-2">Theory</th>
                <th className="p-2">Practical</th>
                <th className="p-2">Attnd.</th>
                <th className="p-2">Attnd %</th>
                <th className="p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="border-b text-center">
                  <td className="p-2 text-left font-bold">{s.roll_no || '-'} - {s.name}</td>
                  <td><input type="number" className="w-12 border p-1 rounded" onChange={(e) => handleMarkChange(s.id, 'internal', e.target.value)}/></td>
                  <td><input type="number" className="w-12 border p-1 rounded" onChange={(e) => handleMarkChange(s.id, 'theory', e.target.value)}/></td>
                  <td><input type="number" className="w-12 border p-1 rounded" onChange={(e) => handleMarkChange(s.id, 'final', e.target.value)}/></td>
                  <td><input type="number" className="w-12 border p-1 rounded" onChange={(e) => handleMarkChange(s.id, 'attendance', e.target.value)}/></td>
                  <td className="p-2 font-bold text-blue-600">{marksData[s.id]?.att_percent}%</td>
                  <td className="p-2 font-bold">{marksData[s.id]?.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleSaveMarks} disabled={loading} className="w-full py-3 bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition">
            {loading ? 'Saving...' : '💾 Save All Marks'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ExamMarksEntry;
