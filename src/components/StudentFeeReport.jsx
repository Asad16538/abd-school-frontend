// src/components/StudentFeeReport.jsx
import React, { useState, useEffect } from 'react';
import { Filter, FileSpreadsheet, MessageSquare } from 'lucide-react';
import * as XLSX from 'xlsx';

const StudentFeeReport = () => {
  const [feeReport, setFeeReport] = useState([]);
  const [filterClass, setFilterClass] = useState('1'); 
  const [filterSection, setFilterSection] = useState('All');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [uiMessage, setUiMessage] = useState('');
  const [schoolName, setSchoolName] = useState('Smart School ERP');

  useEffect(() => {
    fetchClassFeeReport();
    fetchSchoolName();
  }, [filterClass, filterSection]);

  const fetchSchoolName = async () => {
    try {
      const res = await fetch('https://abd-school-backend.onrender.com/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.school_name) setSchoolName(data.school_name);
      }
    } catch (e) {
      console.error("Branding sync delayed safely.");
    }
  };

  const fetchClassFeeReport = async () => {
    try {
      const res = await fetch(`https://abd-school-backend.onrender.com/api/payroll/fees-class-report?class=${filterClass}&section=${filterSection}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.report)) {
        setFeeReport(data.report);
        setSelectedStudents([]); 
      } else {
        setFeeReport([]);
      }
    } catch (err) {
      console.error("Database connection fetch engine logs failure:", err);
      setFeeReport([]);
    }
  };

  const downloadClassFeeExcelReport = () => {
    if (feeReport.length === 0) {
      alert("⚠️ Excel report download karne ke liye data grid me bacchon ka hona zaroori hai!");
      return;
    }

    const excelRows = [];

    excelRows.push([`🏫 ${schoolName.toUpperCase()}`]); 
    excelRows.push(["FEE SUBMISSION REPORT (फीस रिपोर्ट)"]); 
    excelRows.push([`Class / Section: ${filterClass} Class (${filterSection === 'All' ? 'All Sections' : 'Section ' + filterSection})`]); 
    excelRows.push([]); 

    excelRows.push([
      "Serial No. (क्रम संख्या)",
      "Roll No. (रोल नं)",
      "Admission No. (दाखिला संख्या)",
      "Student's Name (छात्र का नाम)",
      "Father's Name (पिता का नाम)",
      "Mother's Name (माता का नाम)",
      "School Fee (शैक्षणिक फीस)",
      "Van Fee (वाहन फीस)",
      "Total Fee (कुल फीस)",
      "Submitted Fee (जमा की गयी फीस)",
      "Due Amount (बकाया फीस)"
    ]);

    let totalSchool = 0; 
    let totalVan = 0; 
    let totalCombined = 0; 
    let totalPaid = 0; 
    let totalDue = 0;

    feeReport.forEach((student, index) => {
      const sFee = parseFloat(student.school_fee_total) || 0;
      const sPaid = parseFloat(student.school_fee_paid) || 0;
      const vFee = parseFloat(student.transport_fee_total) || 0;
      const vPaid = parseFloat(student.transport_fee_paid) || 0;

      const studentTotal = sFee + vFee;
      const studentPaid = sPaid + vPaid;
      const studentDue = parseFloat(student.pending_balance) || 0;

      totalSchool += sFee; 
      totalVan += vFee; 
      totalCombined += studentTotal; 
      totalPaid += studentPaid; 
      totalDue += studentDue;

      excelRows.push([
        index + 1,
        student.roll_no || 'N/A',
        student.admission_no || 'N/A',
        student.name || 'N/A',
        student.father_name || 'N/A',
        student.mother_name || 'N/A',
        sFee,
        vFee,
        studentTotal,
        studentPaid,
        studentDue
      ]);
    });

    excelRows.push([]); 
    
    excelRows.push([
      "KUL YOG (कुल क्लास योग)", "", "", "", "", "",
      totalSchool,
      totalVan,
      totalCombined,
      totalPaid,
      totalDue
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Class Fee Ledger Summary");
    XLSX.writeFile(workbook, `Fee_Report_Class_${filterClass}_Section_${filterSection}.xlsx`);
  };

  const handleSendBulkReminders = async () => {
    if (selectedStudents.length === 0) return;
    const confirmBulk = window.confirm(`🚀 selected ${selectedStudents.length} bacchon ke parents ko automates WhatsApp reminders bhejें?`);
    if (!confirmBulk) return;

    try {
      setBulkLoading(true);
      const res = await fetch('https://abd-school-backend.onrender.com/api/payroll/send-bulk-fee-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_ids: selectedStudents })
      });
      const data = await res.json();
      if (data.success) {
        setUiMessage(data.message);
        fetchClassFeeReport(); 
        setTimeout(() => setUiMessage(''), 4000);
      }
    } catch (err) {
      alert("SaaS Bot router pipeline connection timed out.");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSelectAllCheckbox = (e) => {
    if (e.target.checked) {
      const allPendingIds = feeReport.filter(s => s.pending_balance > 0).map(s => s.id);
      setSelectedStudents(allPendingIds);
    } else { 
      setSelectedStudents([]); 
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      <div style={{ marginBottom: '24px', backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '24px', fontWeight: 'bold' }}>💰 Student Fee Control & Report Center</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>Track student dues registries, export multilingual auditing sheets, and fire bulk WhatsApp reminders</p>
        </div>
        <button onClick={downloadClassFeeExcelReport} style={{ padding: '10px 20px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileSpreadsheet size={16}/> 📥 Download Class Excel Report
        </button>
      </div>

      {uiMessage && (
        <div style={{ padding: '12px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px dashed #10b981', borderRadius: '8px', marginBottom: '16px', fontWeight: 'bold', fontSize: '14px' }}>
          {uiMessage}
        </div>
      )}

      <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #e2e8f0', alignItems: 'flex-end' }}>
          
          <div style={{ minWidth: '160px', flex: '1 1 auto' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Select Target Class</label>
            <select 
              value={filterClass} 
              onChange={(e) => setFilterClass(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', fontWeight: '600', backgroundColor: '#fff', outline: 'none' }}
            >
              <option value="1">1st Class</option>
              <option value="2">2nd Class</option>
              <option value="3">3rd Class</option>
              <option value="4">4th Class</option>
              <option value="5">5th Class</option>
              <option value="6">6th Class</option>
              <option value="7">7th Class</option>
              <option value="8">8th Class</option>
              <option value="9">9th Class</option>
              <option value="10">10th Class</option>
              <option value="11">11th Class</option>
              <option value="12">12th Class</option>
            </select>
          </div>

          <div style={{ minWidth: '160px', flex: '1 1 auto' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Select Section</label>
            <select 
              value={filterSection} 
              onChange={(e) => setFilterSection(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', fontWeight: '600', backgroundColor: '#fff', outline: 'none' }}
            >
              <option value="All">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>

          <button 
            onClick={handleSendBulkReminders} 
            disabled={bulkLoading || selectedStudents.length === 0} 
            style={{ padding: '11px 24px', backgroundColor: selectedStudents.length === 0 ? '#94a3b8' : '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: selectedStudents.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <MessageSquare size={16}/> {bulkLoading ? "⏳ Sending Bot SMS..." : `Send Bulk WhatsApp Reminders (${selectedStudents.length})`}
          </button>
          
        </div> 

        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 'bold' }}>
                <th style={{ padding: '12px 10px', borderBottom: '1px solid #e2e8f0', width: '40px' }}>
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAllCheckbox} 
                    checked={feeReport.length > 0 && selectedStudents.length === feeReport.filter(s => s.pending_balance > 0).length} 
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }} 
                  />
                </th>
                <th style={{ padding: '12px 10px', borderBottom: '1px solid #e2e8f0' }}>Admission No</th>
                <th style={{ padding: '12px 10px', borderBottom: '1px solid #e2e8f0' }}>Student Name</th>
                <th style={{ padding: '12px 10px', borderBottom: '1px solid #e2e8f0' }}>Class/Sec</th>
                <th style={{ padding: '12px 10px', borderBottom: '1px solid #e2e8f0' }}>School Fee Total</th>
                <th style={{ padding: '12px 10px', borderBottom: '1px solid #e2e8f0' }}>School Fee Paid</th>
                <th style={{ padding: '12px 10px', borderBottom: '1px solid #e2e8f0' }}>Bus Fee Total</th>
                <th style={{ padding: '12px 10px', borderBottom: '1px solid #e2e8f0' }}>Bus Fee Paid</th>
                <th style={{ padding: '12px 10px', borderBottom: '1px solid #e2e8f0' }}>Outstanding Due</th>
              </tr>
            </thead>
            <tbody>
              {feeReport.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>
                    No student records found for the specified targets.
                  </td>
                </tr>
              ) : (
                feeReport.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: s.pending_balance > 0 ? 'transparent' : '#f8fafc' }}>
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        disabled={s.pending_balance <= 0} 
                        checked={selectedStudents.includes(s.id)} 
                        onChange={() => setSelectedStudents(prev => prev.includes(s.id) ? prev.filter(i => i !== s.id) : [...prev, s.id])} 
                        style={{ cursor: s.pending_balance <= 0 ? 'not-allowed' : 'pointer', width: '15px', height: '15px' }}
                      />
                    </td>
                    <td style={{ padding: '12px 10px', fontWeight: 'bold', fontFamily: 'monospace', color: '#334155' }}>{s.admission_no}</td>
                    <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#0f172a' }}>{s.name}</td>
                    <td style={{ padding: '12px 10px', fontWeight: '500' }}>{s.class} - {s.section}</td>
                    <td style={{ padding: '12px 10px' }}>₹{s.school_fee_total}</td>
                    <td style={{ padding: '12px 10px', color: '#16a34a', fontWeight: '600' }}>₹{s.school_fee_paid}</td>
                    <td style={{ padding: '12px 10px' }}>₹{s.transport_fee_total}</td>
                    <td style={{ padding: '12px 10px', color: '#16a34a', fontWeight: '600' }}>₹{s.transport_fee_paid}</td>
                    <td style={{ padding: '12px 10px', color: s.pending_balance > 0 ? '#ef4444' : '#16a34a', fontWeight: '900', fontSize: '14px' }}>₹{s.pending_balance}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div> 
    </div>
  );
};

export default StudentFeeReport;