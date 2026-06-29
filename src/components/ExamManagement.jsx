// src/components/ExamManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Edit, Trash2, Eye, FileText, Download, 
  Printer, Calendar, BookOpen, Users, TrendingUp,
  Award, CheckCircle, XCircle, AlertCircle, Search,
  Settings, Copy, RefreshCw, ChevronDown, FileSpreadsheet
} from 'lucide-react';

const BASE_URL = 'https://abd-school-backend.onrender.com';

const ExamManagement = () => {
  // ==============================
  // STATES
  // ==============================
  const [activeTab, setActiveTab] = useState('setup');
  const [board, setBoard] = useState('CBSE');
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [marksData, setMarksData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [examTemplates, setExamTemplates] = useState({
    cbse: ['Periodic Test 1', 'Term 1', 'Periodic Test 2', 'Term 2'],
    mp_board: ['Quarterly Exam', 'Half Yearly Exam', 'Annual Exam'],
    up_board: ['Quarterly Exam', 'Half Yearly Exam', 'Pre-Board Exam', 'Annual Exam']
  });

  // Exam Setup Form
  const [examForm, setExamForm] = useState({
    exam_name: '',
    exam_type: 'Unit Test',
    class: '',
    section: 'A',
    subject: '',
    max_marks: 100,
    passing_marks: 33,
    weightage: 0,
    date: new Date().toISOString().split('T')[0]
  });

  // Grade System
  const [gradeSystem, setGradeSystem] = useState([
    { grade: 'A+', min: 90, max: 100, description: 'Outstanding' },
    { grade: 'A', min: 80, max: 89, description: 'Excellent' },
    { grade: 'B+', min: 70, max: 79, description: 'Very Good' },
    { grade: 'B', min: 60, max: 69, description: 'Good' },
    { grade: 'C', min: 50, max: 59, description: 'Average' },
    { grade: 'D', min: 40, max: 49, description: 'Below Average' },
    { grade: 'F', min: 0, max: 39, description: 'Fail' }
  ]);

  // Marksheet Templates
  const marksheetTemplates = [
    { id: 'classic_blue', name: 'Classic Blue', preview: '🔵' },
    { id: 'modern_green', name: 'Modern Green', preview: '🟢' },
    { id: 'elegant_gold', name: 'Elegant Gold', preview: '🟡' },
    { id: 'minimal_white', name: 'Minimal White', preview: '⚪' },
    { id: 'corporate_red', name: 'Corporate Red', preview: '🔴' }
  ];

  const classesList = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const sectionsList = ['A', 'B', 'C'];
  const examTypes = ['Unit Test', 'Monthly Test', 'Mid-term', 'Final', 'Weekly Test'];
  const subjectsList = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer', 'Sanskrit'];

  // ==============================
  // FETCH FUNCTIONS
  // ==============================
  useEffect(() => {
    fetchExams();
    fetchBoardSettings();
    fetchGradeSystem();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/exams`);
      setExams(res.data.exams || []);
    } catch (err) {
      console.log("Exam fetch error");
    }
  };

  const fetchBoardSettings = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/board-settings`);
      if (res.data) {
        setBoard(res.data.board_name || 'CBSE');
      }
    } catch (err) {
      console.log("Board settings fetch error");
    }
  };

  const fetchGradeSystem = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/grade-system`);
      if (res.data) {
        setGradeSystem(res.data.grades || gradeSystem);
      }
    } catch (err) {
      console.log("Grade system fetch error");
    }
  };

  const fetchStudentsForExam = async (examId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/exams/${examId}/students`);
      setStudents(res.data.students || []);
      setSelectedExam(res.data.exam);
      
      // Initialize marks data
      const marks = {};
      res.data.students.forEach(s => {
        const existingMark = res.data.marks?.find(m => m.student_id === s.id);
        marks[s.id] = { 
          marks: existingMark?.marks_obtained || '', 
          grade: existingMark?.grade || '' 
        };
      });
      setMarksData(marks);
    } catch (err) {
      setMessage({ type: 'error', text: 'Students fetch error' });
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // HANDLE FUNCTIONS
  // ==============================
  const handleCreateExam = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/exams/create`, examForm);
      if (res.data.success) {
        setMessage({ type: 'success', text: '✅ Exam created successfully!' });
        setExamForm({
          exam_name: '',
          exam_type: 'Unit Test',
          class: '',
          section: 'A',
          subject: '',
          max_marks: 100,
          passing_marks: 33,
          weightage: 0,
          date: new Date().toISOString().split('T')[0]
        });
        fetchExams();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Exam create failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMarks = async () => {
    setLoading(true);
    try {
      const payload = {
        exam_id: selectedExam.id,
        marks: Object.keys(marksData).map(studentId => ({
          student_id: parseInt(studentId),
          marks_obtained: parseFloat(marksData[studentId].marks) || 0
        }))
      };
      
      const res = await axios.post(`${BASE_URL}/api/exams/save-marks`, payload);
      if (res.data.success) {
        setMessage({ type: 'success', text: '✅ Marks saved successfully!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Marks save failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateResult = async (examId) => {
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/exams/generate-result/${examId}`);
      if (res.data.success) {
        setMessage({ type: 'success', text: '✅ Result generated successfully!' });
        setActiveTab('results');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Result generation failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, value) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], marks: value }
    }));
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    try {
      const res = await axios.delete(`${BASE_URL}/api/exams/${examId}`);
      if (res.data.success) {
        setMessage({ type: 'success', text: '✅ Exam deleted successfully!' });
        fetchExams();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Delete failed' });
    }
  };

  const handleBoardChange = async (newBoard) => {
    setBoard(newBoard);
    try {
      await axios.post(`${BASE_URL}/api/board-settings`, { board_name: newBoard });
      setMessage({ type: 'success', text: `✅ Switched to ${newBoard} pattern!` });
    } catch (err) {
      setMessage({ type: 'error', text: 'Board update failed' });
    }
  };

  const getGrade = (percentage) => {
    for (let g of gradeSystem) {
      if (percentage >= g.min && percentage <= g.max) {
        return g.grade;
      }
    }
    return 'F';
  };

  // ==============================
  // RENDER
  // ==============================
  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 rounded-2xl text-white shadow-md mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2">📝 Exam Management</h2>
            <p className="text-xs opacity-80">Create exams, enter marks, generate results | Current Board: <span className="font-bold">{board}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={board}
              onChange={(e) => handleBoardChange(e.target.value)}
              className="bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-lg border border-white/30"
            >
              <option value="CBSE" className="text-gray-800">🏫 CBSE</option>
              <option value="MP Board" className="text-gray-800">📘 MP Board</option>
              <option value="UP Board" className="text-gray-800">📗 UP Board</option>
              <option value="Custom" className="text-gray-800">⚙️ Custom</option>
            </select>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`p-3 rounded-xl text-xs font-bold mb-4 flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
        <button 
          onClick={() => setActiveTab('setup')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'setup' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          📚 Setup Exam
        </button>
        <button 
          onClick={() => setActiveTab('marks')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'marks' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          ✏️ Enter Marks
        </button>
        <button 
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'results' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          📊 Results
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'reports' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          📄 Report Cards
        </button>
        <button 
          onClick={() => setActiveTab('grades')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'grades' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          📊 Grade System
        </button>
      </div>

      {/* ============================== */}
      {/* TAB 1: SETUP EXAM */}
      {/* ============================== */}
      {activeTab === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Exam Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-black text-gray-800 mb-4">📝 Create New Exam</h3>
            <form onSubmit={handleCreateExam} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Exam Name</label>
                <input 
                  type="text" 
                  required
                  value={examForm.exam_name}
                  onChange={(e) => setExamForm({...examForm, exam_name: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-xl text-sm font-bold"
                  placeholder="e.g. Mathematics Unit Test 1"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Exam Type</label>
                <select 
                  value={examForm.exam_type}
                  onChange={(e) => setExamForm({...examForm, exam_type: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-xl text-sm font-bold"
                >
                  {examTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Class</label>
                  <select 
                    value={examForm.class}
                    onChange={(e) => setExamForm({...examForm, class: e.target.value})}
                    className="w-full p-2 border border-gray-200 rounded-xl text-sm font-bold"
                    required
                  >
                    <option value="">--</option>
                    {classesList.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Section</label>
                  <select 
                    value={examForm.section}
                    onChange={(e) => setExamForm({...examForm, section: e.target.value})}
                    className="w-full p-2 border border-gray-200 rounded-xl text-sm font-bold"
                  >
                    {sectionsList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Subject</label>
                <select 
                  value={examForm.subject}
                  onChange={(e) => setExamForm({...examForm, subject: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-xl text-sm font-bold"
                  required
                >
                  <option value="">-- Select --</option>
                  {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Max Marks</label>
                  <input 
                    type="number" 
                    value={examForm.max_marks}
                    onChange={(e) => setExamForm({...examForm, max_marks: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-200 rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Passing Marks</label>
                  <input 
                    type="number" 
                    value={examForm.passing_marks}
                    onChange={(e) => setExamForm({...examForm, passing_marks: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-200 rounded-xl text-sm font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Weightage %</label>
                  <input 
                    type="number" 
                    value={examForm.weightage}
                    onChange={(e) => setExamForm({...examForm, weightage: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-200 rounded-xl text-sm font-bold"
                    placeholder="e.g. 20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Date</label>
                  <input 
                    type="date" 
                    value={examForm.date}
                    onChange={(e) => setExamForm({...examForm, date: e.target.value})}
                    className="w-full p-2 border border-gray-200 rounded-xl text-sm font-bold"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition"
              >
                {loading ? 'Creating...' : '📚 Create Exam'}
              </button>
            </form>
          </div>

          {/* Exam List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center justify-between">
              <span>📋 All Exams</span>
              <button onClick={fetchExams} className="text-indigo-600 text-xs font-bold flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </h3>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
                    <th className="p-3">Exam</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {exams.length === 0 ? (
                    <tr><td colSpan="5" className="p-6 text-center text-gray-400">No exams created yet</td></tr>
                  ) : (
                    exams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-gray-50">
                        <td className="p-3 font-bold">{exam.exam_name}</td>
                        <td className="p-3">Class {exam.class} - {exam.section}</td>
                        <td className="p-3">{exam.subject}</td>
                        <td className="p-3">{exam.date}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={() => { setActiveTab('marks'); fetchStudentsForExam(exam.id); }}
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                              title="Enter Marks"
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => handleGenerateResult(exam.id)}
                              className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                              title="Generate Result"
                            >
                              📊
                            </button>
                            <button 
                              onClick={() => handleDeleteExam(exam.id)}
                              className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 📚 Subject Setup */}
{activeTab === 'subjects' && (
  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
    <h3 className="text-sm font-black text-gray-800 mb-4">📚 Subject Setup</h3>
    
    {/* Class Selection */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div>
        <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Class</label>
        <select 
          className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-bold"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
        >
          <option value="">All Classes</option>
          {classesList.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Board</label>
        <select 
          className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-bold"
          value={boardFilter}
          onChange={(e) => setBoardFilter(e.target.value)}
        >
          <option value="CBSE">CBSE</option>
          <option value="MP Board">MP Board</option>
          <option value="UP Board">UP Board</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Stream (11-12)</label>
        <select 
          className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-bold"
          value={streamFilter}
          onChange={(e) => setStreamFilter(e.target.value)}
        >
          <option value="">Select Stream</option>
          <option value="Science">Science</option>
          <option value="Commerce">Commerce</option>
          <option value="Arts">Arts</option>
        </select>
      </div>
    </div>
    
    {/* Subject List */}
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs font-medium">
        <thead className="bg-gray-50">
          <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
            <th className="p-3">Subject</th>
            <th className="p-3">Code</th>
            <th className="p-3">Theory</th>
            <th className="p-3">Internal</th>
            <th className="p-3">Total</th>
            <th className="p-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {subjectsList.map((subject, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="p-3 font-bold">{subject.name}</td>
              <td className="p-3">{subject.code || '-'}</td>
              <td className="p-3">{subject.theory || 0}</td>
              <td className="p-3">{subject.internal || 0}</td>
              <td className="p-3 font-bold">{(subject.theory || 0) + (subject.internal || 0)}</td>
              <td className="p-3 text-center">
                <button className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    
    {/* Add Subject Button */}
    <div className="mt-4">
      <button 
        onClick={() => setShowAddSubject(true)}
        className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition flex items-center gap-2"
      >
        <Plus className="w-4 h-4" /> Add Subject
      </button>
    </div>
  </div>
)}

      {/* ============================== */}
      {/* TAB 2: ENTER MARKS */}
      {/* ============================== */}
      {activeTab === 'marks' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-gray-800">✏️ Enter Marks</h3>
            <div className="flex items-center gap-2">
              <select 
                className="p-2 border border-gray-200 rounded-xl text-xs font-bold"
                onChange={(e) => fetchStudentsForExam(e.target.value)}
              >
                <option value="">Select Exam</option>
                {exams.map(e => (
                  <option key={e.id} value={e.id}>{e.exam_name} - Class {e.class}</option>
                ))}
              </select>
              {selectedExam && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold">
                  {selectedExam.subject} - Class {selectedExam.class}{selectedExam.section}
                </span>
              )}
            </div>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-bold">Select an exam to enter marks</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium">
                  <thead className="bg-gray-50">
                    <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
                      <th className="p-3 w-16">Roll No</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Marks Obtained</th>
                      <th className="p-3">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((student) => {
                      const percentage = selectedExam?.max_marks ? (parseFloat(marksData[student.id]?.marks || 0) / selectedExam.max_marks) * 100 : 0;
                      const grade = getGrade(percentage);
                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="p-3 font-bold">{student.roll_no || '-'}</td>
                          <td className="p-3 font-medium">{student.name}</td>
                          <td className="p-3">
                            <input 
                              type="number" 
                              min="0"
                              max={selectedExam?.max_marks || 100}
                              value={marksData[student.id]?.marks || ''}
                              onChange={(e) => handleMarkChange(student.id, e.target.value)}
                              className="w-24 p-1.5 border border-gray-200 rounded-lg text-center text-sm font-bold"
                              placeholder="0"
                            />
                            <span className="text-xs text-gray-400 ml-1">/ {selectedExam?.max_marks || 100}</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              grade === 'A+' || grade === 'A' ? 'bg-green-100 text-green-700' :
                              grade === 'B+' || grade === 'B' ? 'bg-blue-100 text-blue-700' :
                              grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                              grade === 'D' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {grade || '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={handleSaveMarks}
                  disabled={loading}
                  className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition flex items-center gap-2"
                >
                  {loading ? 'Saving...' : '💾 Save All Marks'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================== */}
      {/* TAB 3: RESULTS */}
      {/* ============================== */}
      {activeTab === 'results' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-black text-gray-800 mb-4">📊 Exam Results</h3>
          <div className="text-center py-12 text-gray-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-bold">Results will appear here after generation</p>
            <p className="text-xs">Click "Generate Result" from exam list</p>
          </div>
        </div>
      )}

      {/* ============================== */}
      {/* TAB 4: REPORT CARDS */}
      {/* ============================== */}
      {activeTab === 'reports' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-black text-gray-800 mb-4">📄 Report Cards</h3>
          
          {/* Template Selection */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {marksheetTemplates.map((t) => (
              <div key={t.id} className={`p-3 border-2 rounded-xl text-center cursor-pointer transition hover:border-indigo-400 ${t.id === 'classic_blue' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}>
                <div className="text-3xl mb-1">{t.preview}</div>
                <div className="text-[10px] font-bold">{t.name}</div>
              </div>
            ))}
          </div>
          
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-bold">Report card generation coming soon</p>
            <p className="text-xs">Select a template and class to generate</p>
          </div>
        </div>
      )}

      {/* ============================== */}
      {/* TAB 5: GRADE SYSTEM */}
      {/* ============================== */}
      {activeTab === 'grades' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-black text-gray-800 mb-4">📊 Grade System</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-gray-50">
                <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
                  <th className="p-3">Grade</th>
                  <th className="p-3">Min %</th>
                  <th className="p-3">Max %</th>
                  <th className="p-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gradeSystem.map((g, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-3 font-bold">{g.grade}</td>
                    <td className="p-3">{g.min}%</td>
                    <td className="p-3">{g.max}%</td>
                    <td className="p-3">{g.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;