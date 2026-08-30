// src/components/ExamManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Edit, Trash2, Eye, FileText, Download, 
  Printer, Calendar, BookOpen, Users, TrendingUp,
  Award, CheckCircle, XCircle, AlertCircle, Search,
  Settings, Copy, RefreshCw, ChevronDown, FileSpreadsheet,
  X, Save
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
  const [students, setStudents] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [marksData, setMarksData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');

  // Grade System (Default)
  const [gradeSystem, setGradeSystem] = useState([
    { grade: 'A+', min: 90, max: 100, description: 'Outstanding' },
    { grade: 'A', min: 80, max: 89, description: 'Excellent' },
    { grade: 'B+', min: 70, max: 79, description: 'Very Good' },
    { grade: 'B', min: 60, max: 69, description: 'Good' },
    { grade: 'C', min: 50, max: 59, description: 'Average' },
    { grade: 'D', min: 40, max: 49, description: 'Below Average' },
    { grade: 'F', min: 0, max: 39, description: 'Fail' }
  ]);

  // ==============================
  // CONSTANTS
  // ==============================
  const classesList = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const sectionsList = ['A', 'B', 'C'];
  const examTypes = ['Unit Test - 1', 'Quarterly Examination', 'Unit Test - 2', 'Half Yearly Examination', 'Unit Test - 3', 'Annual Examination'];
  
  const allSubjectsList = [
    { name: 'Mathematics', code: 'MTH101', class: ['1','2','3','4','5','6','7','8','9','10','11','12'] },
    { name: 'Science', code: 'SCI101', class: ['1','2','3','4','5','6','7','8','9','10'] },
    { name: 'English', code: 'ENG101', class: ['1','2','3','4','5','6','7','8','9','10','11','12'] },
    { name: 'Hindi', code: 'HIN101', class: ['1','2','3','4','5','6','7','8','9','10','11','12'] },
    { name: 'Social Studies', code: 'SST101', class: ['1','2','3','4','5','6','7','8','9','10'] },
    { name: 'Computer', code: 'COM101', class: ['1','2','3','4','5','6','7','8','9','10','11','12'] },
    { name: 'Sanskrit', code: 'SAN101', class: ['6','7','8','9','10'] },
    { name: 'Physics', code: 'PHY101', class: ['11','12'] },
    { name: 'Chemistry', code: 'CHE101', class: ['11','12'] },
    { name: 'Biology', code: 'BIO101', class: ['11','12'] },
    { name: 'Accountancy', code: 'ACC101', class: ['11','12'] },
    { name: 'Business Studies', code: 'BST101', class: ['11','12'] },
    { name: 'Economics', code: 'ECO101', class: ['11','12'] },
    { name: 'History', code: 'HIS101', class: ['11','12'] },
    { name: 'Political Science', code: 'POL101', class: ['11','12'] },
    { name: 'Geography', code: 'GEO101', class: ['11','12'] }
  ];

  // Exam Setup Form
  const [examForm, setExamForm] = useState({
    exam_type: 'Unit Test - 1',
    class: '',
    section: 'A',
    subjects: [],
    date: new Date().toISOString().split('T')[0]
  });

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

  // ✅ FIXED: Use grouped exams API
  const fetchExams = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/exams/grouped`);
      setExams(res.data.exams || []);
    } catch (err) {
      console.log("Exam fetch error", err);
      // Fallback
      try {
        const res2 = await axios.get(`${BASE_URL}/api/exams`);
        setExams(res2.data.exams || []);
      } catch (err2) {
        setMessage({ type: 'error', text: 'Failed to fetch exams' });
      }
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

  // ✅ FIXED: Use multi-subject students API
  const fetchStudentsForExam = async (examId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/exams/${examId}/students-multi`);
      
      if (res.data.success) {
        setStudents(res.data.students || []);
        setSelectedExam(res.data.exam);
        setSelectedSubjects(res.data.exam?.subjects || []);
        
        // Initialize marks data
        const marks = {};
        res.data.students.forEach(student => {
          marks[student.id] = {};
          if (student.marks) {
            Object.keys(student.marks).forEach(subject => {
              marks[student.id][subject] = {
                theory: student.marks[subject]?.theory || '',
                practical: student.marks[subject]?.practical || '',
                total: student.marks[subject]?.total || 0
              };
            });
          }
        });
        setMarksData(marks);
      }
    } catch (err) {
      console.error("Students fetch error", err);
      setMessage({ type: 'error', text: 'Students fetch error' });
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Use multi-subject results API
  const fetchResultsForExam = async (examId) => {
    if (!examId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/exams/results-list/${examId}`);
      if (res.data.success) {
        setResults(res.data.results || []);
        setSelectedExam(res.data);
      }
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
  const getSubjectsForClass = (className) => {
    if (!className) return [];
    return allSubjectsList.filter(subject => 
      subject.class.includes(className)
    );
  };

  const handleAddSubject = () => {
    if (newSubject.trim() && !selectedSubjects.includes(newSubject.trim())) {
      setSelectedSubjects([...selectedSubjects, newSubject.trim()]);
      setExamForm({
        ...examForm,
        subjects: [...selectedSubjects, newSubject.trim()]
      });
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (subject) => {
    const updatedSubjects = selectedSubjects.filter(s => s !== subject);
    setSelectedSubjects(updatedSubjects);
    setExamForm({
      ...examForm,
      subjects: updatedSubjects
    });
  };

  // ✅ FIXED: Use create-multi API
  const handleCreateExam = async (e) => {
    e.preventDefault();
    
    if (!examForm.class) {
      setMessage({ type: 'error', text: '⚠️ Please select a class!' });
      return;
    }
    
    if (selectedSubjects.length === 0) {
      setMessage({ type: 'error', text: '⚠️ Please add at least one subject!' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        exam_type: examForm.exam_type,
        class: examForm.class,
        section: examForm.section,
        subjects: selectedSubjects,
        date: examForm.date
      };
      
      const res = await axios.post(`${BASE_URL}/api/exams/create-multi`, payload);
      
      if (res.data.success) {
        setMessage({ type: 'success', text: `✅ Exam created with ${res.data.subjects?.length || 0} subjects!` });
        setExamForm({
          exam_type: 'Unit Test - 1',
          class: '',
          section: 'A',
          subjects: [],
          date: new Date().toISOString().split('T')[0]
        });
        setSelectedSubjects([]);
        fetchExams();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Exam create failed' });
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Use save-multi-marks API
  const handleSaveMarks = async () => {
    setLoading(true);
    setSaving(true);
    try {
      const studentsData = Object.keys(marksData).map(studentId => {
        const studentMarks = marksData[studentId] || {};
        const marks = {};
        
        selectedSubjects.forEach(subject => {
          const mark = studentMarks[subject] || { theory: '', practical: '', total: 0 };
          marks[subject] = {
            theory: parseFloat(mark.theory) || 0,
            practical: parseFloat(mark.practical) || 0,
            total: parseFloat(mark.theory) || 0 + parseFloat(mark.practical) || 0
          };
        });
        
        return {
          student_id: parseInt(studentId),
          marks: marks
        };
      });

      const payload = {
        exam_id: selectedExam?.exam_id,
        students: studentsData
      };
      
      const res = await axios.post(`${BASE_URL}/api/exams/save-multi-marks`, payload);
      
      if (res.data.success) {
        setMessage({ type: 'success', text: '✅ Marks saved successfully!' });
      }
    } catch (err) {
      console.error("Save Marks Error:", err.response?.data || err.message);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Marks save failed' });
    } finally {
      setLoading(false);
      setSaving(false);
    }
  };

  // ✅ FIXED: Use generate-complete-result API
  const handleGenerateResult = async (examId) => {
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/exams/generate-complete-result/${examId}`);
      if (res.data.success) {
        setMessage({ type: 'success', text: '✅ Result generated successfully!' });
        setActiveTab('results');
        fetchResultsForExam(examId);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Result generation failed' });
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Use delete-multi API
  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    
    try {
      const res = await axios.delete(`${BASE_URL}/api/exams/delete-multi/${examId}`);
      if (res.data.success) {
        setMessage({ type: 'success', text: '✅ Exam deleted successfully!' });
        fetchExams();
      }
    } catch (err) {
      console.error("Delete error:", err);
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

  const handleMarkChange = (studentId, subject, field, value) => {
    setMarksData(prev => {
      const student = prev[studentId] || {};
      const subjectData = student[subject] || { theory: '', practical: '', total: 0 };
      
      const updatedSubject = { ...subjectData, [field]: value };
      
      const theoryVal = parseFloat(updatedSubject.theory) || 0;
      const practicalVal = parseFloat(updatedSubject.practical) || 0;
      updatedSubject.total = theoryVal + practicalVal;
      
      return {
        ...prev,
        [studentId]: {
          ...student,
          [subject]: updatedSubject
        }
      };
    });
  };

  // 📥 Excel Download Function
  const downloadExcel = () => {
    if (results.length === 0) {
      setMessage({ type: 'error', text: 'Export karne ke liye koi result nahi hai!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,Roll No,Student Name,Total Marks,Percentage,Grade\n";
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

  // 🖨️ PDF / Print Function
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

  const getStudentTotalMarks = (studentId) => {
    const studentMarks = marksData[studentId] || {};
    let total = 0;
    selectedSubjects.forEach(subject => {
      total += studentMarks[subject]?.total || 0;
    });
    return total;
  };

  const getMaxMarks = () => {
    return selectedSubjects.length * 100;
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
                    onChange={(e) => {
                      const className = e.target.value;
                      setExamForm({...examForm, class: className});
                      const classSubjects = getSubjectsForClass(className);
                      if (classSubjects.length > 0) {
                        const subjectNames = classSubjects.map(s => s.name);
                        setSelectedSubjects(subjectNames);
                        setExamForm(prev => ({
                          ...prev,
                          subjects: subjectNames
                        }));
                      }
                    }}
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
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Subjects for Class {examForm.class || ''}</label>
                
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedSubjects.map(subject => (
                    <span key={subject} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold">
                      {subject}
                      <button 
                        type="button"
                        onClick={() => handleRemoveSubject(subject)}
                        className="hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Add new subject..."
                    className="flex-1 p-2 border border-gray-200 rounded-xl text-xs font-bold bg-white"
                    list="subjectSuggestions"
                  />
                  <datalist id="subjectSuggestions">
                    {allSubjectsList
                      .filter(s => !selectedSubjects.includes(s.name))
                      .map(s => (
                        <option key={s.name} value={s.name} />
                      ))}
                  </datalist>
                  <button 
                    type="button"
                    onClick={handleAddSubject}
                    className="px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
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
                className="w-full py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50"
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
                    <th className="p-3">Subjects</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {exams.length === 0 ? (
                    <tr><td colSpan="5" className="p-6 text-center text-gray-400">No exams created yet</td></tr>
                  ) : (
                    exams.map((exam) => (
                      <tr key={exam.exam_id || exam.id} className="hover:bg-gray-50">
                        <td className="p-3 font-bold">{exam.exam_name}</td>
                        <td className="p-3">Class {exam.class} - {exam.section}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {(exam.subjects || []).map((subject, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-gray-100 rounded text-[9px] font-medium">
                                {subject}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">{exam.date}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={() => { setActiveTab('marks'); fetchStudentsForExam(exam.exam_id || exam.id); }}
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                              title="Enter Marks"
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => handleGenerateResult(exam.exam_id || exam.id)}
                              className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                              title="Generate Result"
                            >
                              📊
                            </button>
                            <button 
                              onClick={() => handleDeleteExam(exam.exam_id || exam.id)}
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

      {/* TAB 2: MARKS */}
      {activeTab === 'marks' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 border-b pb-4">
            <div>
              <h3 className="text-base font-black text-gray-800">✏️ Marks Entry</h3>
              <p className="text-xs text-gray-500">Select an exam and enter marks for all subjects</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <select 
                className="p-2 border border-gray-200 rounded-xl text-xs font-bold bg-gray-50 min-w-[200px]"
                onChange={(e) => fetchStudentsForExam(e.target.value)}
              >
                <option value="">-- Select Exam --</option>
                {exams.map(e => (
                  <option key={e.exam_id || e.id} value={e.exam_id || e.id}>
                    {e.exam_name} - Class {e.class}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-bold">Select an exam from above dropdown to enter marks</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium">
                  <thead className="bg-gray-50">
                    <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
                      <th className="p-3 w-16">Roll No</th>
                      <th className="p-3 min-w-[120px]">Student Name</th>
                      {selectedSubjects.map(subject => (
                        <th key={subject} className="p-3 text-center min-w-[140px]">
                          {subject}
                          <div className="flex gap-1 justify-center mt-1">
                            <span className="text-[8px] text-blue-600">Theory</span>
                            <span className="text-[8px] text-green-600">Practical</span>
                            <span className="text-[8px] text-purple-600">Total</span>
                          </div>
                        </th>
                      ))}
                      <th className="p-3 text-center font-black text-purple-700">Grand Total</th>
                      <th className="p-3 text-center">Percentage</th>
                      <th className="p-3 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((student) => {
                      const studentTotal = getStudentTotalMarks(student.id);
                      const maxMarks = getMaxMarks();
                      const percentage = maxMarks > 0 ? (studentTotal / maxMarks) * 100 : 0;
                      const grade = getGrade(studentTotal, maxMarks);

                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="p-3 font-bold">{student.roll_no || '-'}</td>
                          <td className="p-3 font-medium">{student.name}</td>

                          {selectedSubjects.map(subject => {
                            const marks = marksData[student.id]?.[subject] || { theory: '', practical: '', total: 0 };
                            return (
                              <td key={subject} className="p-2">
                                <div className="flex gap-1 justify-center">
                                  <input 
                                    type="number" 
                                    min="0"
                                    max="100"
                                    value={marks.theory}
                                    onChange={(e) => handleMarkChange(student.id, subject, 'theory', e.target.value)}
                                    className="w-14 p-1 border border-blue-200 rounded text-center text-xs font-bold bg-blue-50/30"
                                    placeholder="T"
                                  />
                                  <input 
                                    type="number" 
                                    min="0"
                                    max="100"
                                    value={marks.practical}
                                    onChange={(e) => handleMarkChange(student.id, subject, 'practical', e.target.value)}
                                    className="w-14 p-1 border border-green-200 rounded text-center text-xs font-bold bg-green-50/30"
                                    placeholder="P"
                                  />
                                  <span className="w-12 text-center font-bold text-purple-600 text-xs flex items-center justify-center">
                                    {marks.total || 0}
                                  </span>
                                </div>
                              </td>
                            );
                          })}

                          <td className="p-3 text-center font-black text-purple-700">{studentTotal}</td>
                          <td className="p-3 text-center font-bold text-gray-600">{percentage.toFixed(1)}%</td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                              grade === 'A+' || grade === 'A' ? 'bg-green-100 text-green-700' :
                              grade === 'B+' || grade === 'B' ? 'bg-blue-100 text-blue-700' :
                              grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                              grade === 'D' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {grade}
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
                  disabled={saving}
                  className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : '💾 Save All Marks'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: RESULTS */}
      {activeTab === 'results' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 border-b pb-4">
            <h3 className="text-sm font-black text-gray-800">📊 Exam Results</h3>
            
            <div className="flex flex-wrap items-center gap-2">
              <select 
                value={selectedResultExam}
                onChange={(e) => {
                  setSelectedResultExam(e.target.value);
                  fetchResultsForExam(e.target.value);
                }}
                className="p-2 border border-gray-200 rounded-xl text-xs font-bold bg-gray-50 min-w-[200px]"
              >
                <option value="">-- Select Exam --</option>
                {exams.map(e => (
                  <option key={e.exam_id || e.id} value={e.exam_id || e.id}>
                    {e.exam_name} - Class {e.class}
                  </option>
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
              <p className="font-bold">No results found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead className="bg-gray-50">
                  <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
                    <th className="p-3">Roll No</th>
                    <th className="p-3">Student Name</th>
                    {results[0]?.subject_wise_marks && Object.keys(results[0].subject_wise_marks).map(subject => (
                      <th key={subject} className="p-3 text-center">{subject}</th>
                    ))}
                    <th className="p-3 text-center">Total</th>
                    <th className="p-3 text-center">%</th>
                    <th className="p-3 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((res, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="p-3 font-bold">{res.roll_no || '-'}</td>
                      <td className="p-3 font-medium">{res.name}</td>
                      {res.subject_wise_marks && Object.keys(res.subject_wise_marks).map(subject => (
                        <td key={subject} className="p-3 text-center font-bold">{res.subject_wise_marks[subject] || 0}</td>
                      ))}
                      <td className="p-3 text-center font-bold text-indigo-600">{res.obtained_marks}</td>
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

      {/* TAB 4: REPORT CARDS */}
      {activeTab === 'reports' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-black text-gray-800 mb-4">📄 Report Cards</h3>
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
          </div>
        </div>
      )}
      
      {/* TAB 5: GRADE SYSTEM */}
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
