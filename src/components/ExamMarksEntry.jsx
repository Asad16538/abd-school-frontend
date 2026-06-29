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

  useEffect(() => { fetchAssignedExams(); }, []);

  const fetchAssignedExams = async () => {
    try { const res = await axios.get(`${BASE_URL}/api/staff/exams/${staffData.id}`); setExams(res.data.exams || []); } 
    catch (err) { console.log("Exam fetch error"); }
  };

  const handleExamSelect = async (examId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/exams/${examId}/students`);
      setStudents(res.data.students || []);
      setSelectedExam(res.data.exam);
      
      const marks = {};
      res.data.students.forEach(s => {
        marks[s.id] = { theory: '', internal: '', final: '', attendance: '', total: 0, att_percent: 0 };
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
      // Attendance % calculation (Assuming 5 marks max for attendance)
      updated[studentId].att_percent = a > 0 ? ((a / 5) * 100).toFixed(0) : 0; 
      
      return updated;
    });
  };

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
      setMessage({ type: 'success', text: '✅ Marks saved successfully!' });
      onMarksSaved();
    } catch (err) { setMessage({ type: 'error', text: 'Failed to save' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4 p-4">
      <select className="w-full p-3 border rounded-xl font-bold" onChange={(e) => handleExamSelect(e.target.value)}>
        <option value="">-- Select Exam --</option>
        {exams.map(e => <option key={e.id} value={e.id}>{e.exam_name} - {e.class}</option>)}
      </select>

      {students.length > 0 && (
        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-[10px] uppercase">
              <tr>
                <th className="p-2 text-left">Roll - Student</th>
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
                  <td className="p-2 text-left font-bold">{s.roll_no} - {s.name}</td>
                  <td><input type="number" className="w-12 border p-1 rounded" onChange={(e) => handleMarkChange(s.id, 'internal', e.target.value)}/></td>
                  <td><input type="number" className="w-12 border p-1 rounded" onChange={(e) => handleMarkChange(s.id, 'theory', e.target.value)}/></td>
                  <td><input type="number" className="w-12 border p-1 rounded" onChange={(e) => handleMarkChange(s.id, 'final', e.target.value)}/></td>
                  <td><input type="number" className="w-12 border p-1 rounded" onChange={(e) => handleMarkChange(s.id, 'attendance', e.target.value)}/></td>
                  <td className="p-2 font-bold text-blue-600">{marksData[s.id]?.att_percent}%</td>
                  <td className="p-2 font-bold text-indigo-700">{marksData[s.id]?.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleSaveMarks} className="w-full py-3 bg-emerald-600 text-white font-bold hover:bg-emerald-700">💾 Save All Marks</button>
        </div>
      )}
    </div>
  );
};
export default ExamMarksEntry;
