// src/components/ExamManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Edit, Trash2, Eye, FileText, Download, 
  Printer, Calendar, BookOpen, Users, TrendingUp,
  Award, CheckCircle, XCircle, AlertCircle, Search,
  Settings, Copy, RefreshCw, ChevronDown, FileSpreadsheet
} from 'lucide-react';

const BASE_URL = 'https://erp-api.aapschool.in';

const ExamManagement = () => {
  // ==============================
  // STATES
  // ==============================
  const [activeTab, setActiveTab] = useState('setup');
  const [board, setBoard] = useState('CBSE');
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedResultExam, setSelectedResultExam] = useState('');
  
  // 🎯 Class-wise Master Marks Entry States
  const [masterClass, setMasterClass] = useState('');
  const [masterExamType, setMasterExamType] = useState('Unit Test - 1');
  const [masterSubjects, setMasterSubjects] = useState([]);
  const [masterStudents, setMasterStudents] = useState([]);
  const [masterMarksData, setMasterMarksData] = useState({});
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [practicalType, setPracticalType] = useState('20 Marks Practical');
  const activityOptions = ['20 Marks Practical', 'Project', 'N.B. (Notebook)', 'S.E. (Internal)', 'Oral Test', 'Internal Assessment'];
  const [message, setMessage] = useState({ type: '', text: '' });
  const [classFilter, setClassFilter] = useState('');
  const [boardFilter, setBoardFilter] = useState('CBSE');
  const [streamFilter, setStreamFilter] = useState('');
  const [showAddSubject, setShowAddSubject] = useState(false);

  const classesList = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const sectionsList = ['A', 'B', 'C'];
  const examTypes = ['Unit Test - 1', 'Quarterly Examination', 'Unit Test - 2', 'Half Yearly Examination', 'Unit Test - 3', 'Annual Examination'];
  const subjectsList = [
    { name: 'Mathematics', code: 'MTH101' },
    { name: 'Science', code: 'SCI101' },
    { name: 'English', code: 'ENG101' },
    { name: 'Hindi', code: 'HIN101' },
    { name: 'Social Studies', code: 'SST101' },
    { name: 'Computer', code: 'COM101' },
    { name: 'Sanskrit', code: 'SAN101' },
    { name: 'Physics', code: 'PHY101' },
    { name: 'Chemistry', code: 'CHE101' },
    { name: 'Biology', code: 'BIO101' },
    { name: 'Accountancy', code: 'ACC101' },
    { name: 'Business Studies', code: 'BST101' },
    { name: 'Economics', code: 'ECO101' },
    { name: 'History', code: 'HIS101' },
    { name: 'Political Science', code: 'POL101' },
    { name: 'Geography', code: 'GEO101' }
  ];

  // Exam Setup Form
  const [examForm, setExamForm] = useState({
    exam_type: 'Unit Test - 1',
    class: '',
    section: 'A',
    subject: '',
    max_marks: 100,
    passing_marks: 33,
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
        setBoardFilter(res.data.board_name || 'CBSE');
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

  const fetchMasterExamSheet = async () => {
    if (!masterClass || !masterExamType) {
      setMessage({ type: 'error', text: 'Kripya Class aur Exam Type dono select karein!' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await axios.get(`${BASE_URL}/api/exams/master-sheet?class=${masterClass}&exam_type=${masterExamType}`);
      if (res.data.success) {
        setMasterSubjects(res.data.subjects || []);
        setMasterStudents(res.data.students || []);
        
        const initialMarks = {};
        res.data.students.forEach(st => {
          initialMarks[st.student_id] = st.marks || {};
        });
        setMasterMarksData(initialMarks);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Master sheet load failed' });
    } finally {
      setLoading(false);
    }
  };

  const fetchResultsForExam = async (examId) => {
    if (!examId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/exams/results-list/${examId}`);
      setResults(res.data.results || []);
    } catch (err) {
      console.log("Results fetch error");
      setResults([]);
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
      const payload = {
        ...examForm,
        exam_name: examForm.exam_type
      };
      const res = await axios.post(`${BASE_URL}/api/exams/create`, payload);
      if (res.data.success) {
        setMessage({ type: 'success', text: '✅ Exam created successfully!' });
        setExamForm({
          exam_type: 'Unit Test - 1',
          class: '',
          section: 'A',
          subject: '',
          max_marks: 100,
          passing_marks: 33,
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

  const handleSaveMasterMarks = async () => {
    if (!masterClass || !masterExamType) {
      setMessage({ type: 'error', text: 'Kripya Class aur Exam Type select karein!' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        class_name: masterClass,
        exam_type: masterExamType,
        records: Object.keys(masterMarksData).map(studentId => ({
          student_id: parseInt(studentId),
          subjects: masterMarksData[studentId]
        }))
      };

      const res = await axios.post(`${BASE_URL}/api/exams/save-master-marks`, payload);
      if (res.data.success) {
        setMessage({ type: 'success', text: '✅ Saare subjects ke marks successfully save ho gaye!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Marks save karne mein error aayi' });
    } finally {
      setSaving(false);
    }
  };

  const handleMasterMarkChange = (studentId, subjectId, val) => {
    setMasterMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subjectId]: {
          ...((prev[studentId] || {})[subjectId] || {}),
          obtained: parseFloat(val) || 0
        }
      }
    }));
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

  const handleDeleteExam = async (examId) => {
    try {
      const res = await axios.delete(`${BASE_URL}/api/exams/${examId}`);
      if (res.data.success) {
        fetchExams();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleBoardChange = async (newBoard) => {
    setBoard(newBoard);
    setBoardFilter(newBoard);
    try {
      await axios.post(`${BASE_URL}/api/board-settings`, { board_name: newBoard });
      setMessage({ type: 'success', text: `✅ Switched to ${newBoard} pattern!` });
    } catch (err) {
      setMessage({ type: 'error', text: 'Board update failed' });
    }
  };

  const downloadExcel = () => {
    if (results.length === 0) {
      setMessage({ type: 'error', text: 'Export karne ke liye koi result nahi hai!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,Roll No,Student Name,Marks Obtained,Percentage,Grade\n";
    results.forEach(r => {
      csvContent += `${r.roll_no || ''},"${r.name}",${r.obtained_marks},${r.percentage}%,${r.grade}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `exam_result_${selectedResultExam}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    window.print();
  };

  const getGrade = (totalMarks, maxMarks) => {
    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
    for (let g of gradeSystem) {
      if (percentage >= g.min && percentage <= g.max) {
        return g.grade;
      }
    }
    return percentage >= 40 ? 'D' : 'F';
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
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'subjects' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          📖 Subjects
        </button>
        <button 
          onClick={() => setActiveTab('marks')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'marks' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          ✏️ Enter Marks (Master Sheet)
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

      {/* TAB 1: SETUP EXAM */}
      {activeTab === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-black text-gray-800 mb-4">📝 Create New Exam</h3>
            <form onSubmit={handleCreateExam} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Exam Type / Format</label>
                <select 
                  value={examForm.exam_type}
                  onChange={(e) => setExamForm({...examForm, exam_type: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-xl text-sm font-bold bg-white"
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
                    className="w-full p-2 border border-gray-200 rounded-xl text-sm font-bold bg-white"
                    required
                  >
                    <option value="">-- Select --</option>
                    {classesList.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Section</label>
                  <select 
                    value={examForm.section}
                    onChange={(e) => setExamForm({...examForm, section: e.target.value})}
                    className="w-full p-2 border border-gray-200 rounded-xl text-sm font-bold bg-white"
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
                  className="w-full p-2 border border-gray-200 rounded-xl text-sm font-bold bg-white"
                  required
                >
                  <option value="">-- Select Subject --</option>
                  {subjectsList.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
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

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition cursor-pointer"
              >
                {loading ? 'Creating...' : '📚 Create Exam'}
              </button>
            </form>
          </div>

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

      {/* TAB 2: SUBJECTS */}
      {activeTab === 'subjects' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-black text-gray-800 mb-4">📚 Subject Setup</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-gray-50">
                <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
                  <th className="p-3">Subject</th>
                  <th className="p-3">Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subjectsList.map((subject, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-3 font-bold">{subject.name}</td>
                    <td className="p-3">{subject.code || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MARKS (CLASS-WISE MASTER GRID ENTRY) */}
      {activeTab === 'marks' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 border-b pb-4">
            <div>
              <h3 className="text-base font-black text-gray-800">✏️ Class-Wise Master Marks Entry Hub</h3>
              <p className="text-xs text-gray-500">Class aur Exam Type select karein. Ek hi table mein saare subjects aur saare bachchon ke marks enter karein.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Class Selector */}
              <select 
                className="p-2 border border-gray-200 rounded-xl text-xs font-bold bg-white"
                value={masterClass}
                onChange={(e) => setMasterClass(e.target.value)}
              >
                <option value="">-- Select Class --</option>
                {classesList.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>

              {/* Exam Type Selector */}
              <select 
                className="p-2 border border-gray-200 rounded-xl text-xs font-bold bg-white"
                value={masterExamType}
                onChange={(e) => setMasterExamType(e.target.value)}
              >
                {examTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <button 
                onClick={fetchMasterExamSheet}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition cursor-pointer"
              >
                {loading ? 'Loading...' : 'Load Students & Subjects ⚡'}
              </button>
            </div>
          </div>

          {masterStudents.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-bold">Upar dropdown se Class aur Exam Type select karke "Load" button dabayein</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium border-collapse">
                  <thead className="bg-gray-100">
                    <tr className="text-gray-700 uppercase tracking-wider text-[10px]">
                      <th className="p-3 border">Roll No</th>
                      <th className="p-3 border">Student Name</th>
                      {masterSubjects.map(sub => (
                        <th key={sub.id} className="p-3 border text-center">{sub.name}</th>
                      ))}
                      <th className="p-3 border text-center font-black text-indigo-700">Grand Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {masterStudents.map((student) => {
                      let rowTotal = 0;
                      return (
                        <tr key={student.student_id} className="hover:bg-gray-50">
                          <td className="p-3 border font-bold">{student.roll_no || '-'}</td>
                          <td className="p-3 border font-medium">
                            <div className="font-bold text-gray-900">{student.name}</div>
                            <div className="text-[10px] text-gray-500">Father: {student.father_name || 'N/A'}</div>
                          </td>

                          {masterSubjects.map(sub => {
                            const subMark = (masterMarksData[student.student_id]?.[sub.id]?.obtained) || 0;
                            rowTotal += subMark;
                            return (
                              <td key={sub.id} className="p-2 border text-center">
                                <input 
                                  type="number" 
                                  min="0"
                                  max="100"
                                  value={subMark || ''}
                                  onChange={(e) => handleMasterMarkChange(student.student_id, sub.id, e.target.value)}
                                  className="w-16 p-1.5 border border-gray-300 rounded-lg text-center text-xs font-bold bg-white"
                                  placeholder="Marks"
                                />
                              </td>
                            );
                          })}

                          <td className="p-3 border text-center font-black text-indigo-700 text-sm">
                            {rowTotal}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-end">
                <button 
                  onClick={handleSaveMasterMarks}
                  disabled={saving}
                  className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition flex items-center gap-2 cursor-pointer"
                >
                  {saving ? 'Saving...' : '💾 Save Master Sheet Marks'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 4: RESULTS */}
      {activeTab === 'results' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 border-b pb-4">
            <h3 className="text-sm font-black text-gray-800">📊 Exam Results & Scorecard</h3>
            
            <div className="flex flex-wrap items-center gap-2">
              <select 
                value={selectedResultExam}
                onChange={(e) => {
                  setSelectedResultExam(e.target.value);
                  fetchResultsForExam(e.target.value);
                }}
                className="p-2 border border-gray-200 rounded-xl text-xs font-bold bg-gray-50"
              >
                <option value="">-- Select Exam to View Result --</option>
                {exams.map(e => (
                  <option key={e.id} value={e.id}>{e.exam_name} - Class {e.class} [{e.subject}]</option>
                ))}
              </select>

              {results.length > 0 && (
                <>
                  <button 
                    onClick={downloadExcel}
                    className="px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition flex items-center gap-1 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Excel
                  </button>
                  <button 
                    onClick={downloadPDF}
                    className="px-3 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> PDF/Print
                  </button>
                </>
              )}
            </div>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-bold">No results found or result not generated yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead className="bg-gray-50">
                  <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
                    <th className="p-3">Roll No</th>
                    <th className="p-3">Student Name & Father's Name</th>
                    <th className="p-3 text-center">Marks Obtained</th>
                    <th className="p-3 text-center">Percentage</th>
                    <th className="p-3 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((res, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="p-3 font-bold">{res.roll_no || '-'}</td>
                      <td className="p-3">
                        <div className="font-bold text-gray-900">{res.name}</div>
                        <div className="text-[10px] text-gray-500">Father: {res.father_name || 'N/A'}</div>
                      </td>
                      <td className="p-3 text-center font-bold text-indigo-600">
                        {res.obtained_marks} / {res.max_marks || 500}
                      </td>
                      <td className="p-3 text-center font-bold">{res.percentage}%</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-green-100 text-green-700">
                          {res.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: REPORT CARDS */}
      {activeTab === 'reports' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-black text-gray-800 mb-4">📄 Report Cards</h3>
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-bold">Report card generation module active</p>
          </div>
        </div>
      )}
      
      {/* TAB 6: GRADE SYSTEM */}
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
