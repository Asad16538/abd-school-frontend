// src/components/SearchPayFees.jsx

import React, { useState, useEffect } from 'react';
import { Search, User, CreditCard, Calendar, FileText, CheckCircle, Edit, Trash2, History, Download, X } from 'lucide-react';

const SearchPayFees = () => {
  // 1. School Settings State With Live Testing Image Logo
  const [schoolSettings, setSchoolSettings] = useState({
    school_name: 'A.B.Digital Work',
    school_address: 'Madhya Pradesh, India',
    school_mobile: '9893260067',
    school_logo: null  // Initially null
  });

  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Fee Processing Form States
  const [schoolPay, setSchoolPay] = useState('');
  const [transportPay, setTransportPay] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Printed Slip Meta State
  const [printData, setPrintData] = useState(null);
  const [successBanner, setSuccessBanner] = useState('');
  const [logoError, setLogoError] = useState(false);  // Logo error state
  const [isPrinting, setIsPrinting] = useState(false); // 🔥 NEW: Print tracking

  // NEW: History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [feeHistory, setFeeHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 2. Fetch School Settings Function
  const fetchSchoolSettings = async () => {
    try {
      const res = await fetch('https://abd-school-backend.onrender.com/api/settings');
      const data = await res.json();
      if (data) {
        setSchoolSettings({
          school_name: data.school_name || 'A.B.Digital Work',
          school_address: data.school_address || 'Madhya Pradesh, India',
          school_mobile: data.school_mobile || '9893260067',
          school_logo: data.school_logo || null
        });
      }
    } catch (err) {
      console.error("Settings load error", err);
    }
  };

  useEffect(() => {
    fetchSchoolSettings();
    fetchStudentsList();
  }, []);

  const fetchStudentsList = async () => {
    try {
      const res = await fetch('https://abd-school-backend.onrender.com/api/students');
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error("Database sync failed!");
    }
  };

  // NEW: Fetch Fee History for a student
const fetchFeeHistory = async (studentId) => {
  setLoadingHistory(true);
  try {
    console.log("📡 Fetching history for student ID:", studentId);
    const res = await fetch(`https://abd-school-backend.onrender.com/api/fee-history/${studentId}`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log("📊 History response:", data);
    
    if (data.success && data.history) {
      setFeeHistory(data.history);
      setShowHistoryModal(true);
    } else {
      // Agar history empty hai toh bhi modal show karo with empty array
      setFeeHistory([]);
      setShowHistoryModal(true);
      console.warn("No history found or invalid response format");
    }
  } catch (err) {
    console.error("Error fetching fee history:", err);
    alert("Fee history fetch karne me error aaya: " + err.message);
  } finally {
    setLoadingHistory(false);
  }
};

  // NEW: Print/Download Fee History
  const printFeeHistory = () => {
    const printWindow = window.open('', '_blank');
    const historyRows = feeHistory.map(record => `
      <tr>
        <td style="border: 1px solid #000; padding: 8px;">${record.date || record.payment_date || 'N/A'}</td>
        <td style="border: 1px solid #000; padding: 8px;">${record.receipt_no || 'N/A'}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: right;">₹${parseFloat(record.school_fee_paid || 0).toLocaleString()}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: right;">₹${parseFloat(record.transport_fee_paid || 0).toLocaleString()}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: right;">₹${(parseFloat(record.school_fee_paid || 0) + parseFloat(record.transport_fee_paid || 0)).toLocaleString()}</td>
        <td style="border: 1px solid #000; padding: 8px;">${record.next_due_date || 'N/A'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee History - ${selectedStudent?.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #1e293b; }
          .header p { margin: 5px 0; color: #64748b; }
          .student-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #1e293b; color: white; padding: 10px; border: 1px solid #000; }
          td { border: 1px solid #000; padding: 8px; }
          .total-row { background: #f1f5f9; font-weight: bold; }
          @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <button onclick="window.print();" class="no-print" style="margin-bottom: 20px; padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer;">🖨️ Print History</button>
        <button onclick="window.close();" class="no-print" style="margin-bottom: 20px; margin-left: 10px; padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">❌ Close</button>
        
        <div class="header">
          <h1>${schoolSettings.school_name || 'A.B.DIGITAL WORK'}</h1>
          <p>${schoolSettings.school_address || 'Madhya Pradesh, India'} | Helpline: ${schoolSettings.school_mobile || '9893260067'}</p>
          <h3>📜 FEE PAYMENT HISTORY</h3>
        </div>
        
        <div class="student-info">
          <strong>Student Name:</strong> ${selectedStudent?.name} &nbsp;|&nbsp;
          <strong>Admission No:</strong> ${selectedStudent?.admission_no} &nbsp;|&nbsp;
          <strong>Class:</strong> ${selectedStudent?.class} - ${selectedStudent?.section} &nbsp;|&nbsp;
          <strong>Father:</strong> ${selectedStudent?.father_name}
        </div>
        
        ${feeHistory.length === 0 ? '<p style="text-align: center;">No fee payment records found.</p>' : `
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Receipt No.</th>
                <th style="text-align: right;">School Fee (₹)</th>
                <th style="text-align: right;">Transport Fee (₹)</th>
                <th style="text-align: right;">Total Paid (₹)</th>
                <th>Next Due Date</th>
              </tr>
            </thead>
            <tbody>
              ${historyRows}
              <tr class="total-row">
                <td colspan="2" style="text-align: right;"><strong>GRAND TOTAL:</strong></td>
                <td style="text-align: right;"><strong>₹${feeHistory.reduce((sum, r) => sum + parseFloat(r.school_fee_paid || 0), 0).toLocaleString()}</strong></td>
                <td style="text-align: right;"><strong>₹${feeHistory.reduce((sum, r) => sum + parseFloat(r.transport_fee_paid || 0), 0).toLocaleString()}</strong></td>
                <td style="text-align: right;"><strong>₹${feeHistory.reduce((sum, r) => sum + parseFloat(r.school_fee_paid || 0) + parseFloat(r.transport_fee_paid || 0), 0).toLocaleString()}</strong></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        `}
        
        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #94a3b8;">
          Generated on: ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Auto redirect from dashboard
  useEffect(() => {
    const redirectStudentId = localStorage.getItem('redirect_student_id');
    
    if (redirectStudentId && students.length > 0) {
      const targetStudent = students.find(s => String(s.id) === String(redirectStudentId));
      
      if (targetStudent) {
        setSelectedStudent(targetStudent);
        if (typeof setActiveQuery === 'function') setActiveQuery(targetStudent.name);
        if (typeof setSearchQuery === 'function') setSearchQuery(targetStudent.admission_no || targetStudent.name);
        
        console.log("⚡ Dashboard Redirect Link Active: Auto-selected ->", targetStudent.name);
        
        localStorage.removeItem('redirect_student_id');
      }
    }
  }, [students]);

  const handleDeleteProfile = async (id) => {
    if (!window.confirm("🚨 WARNING: Kya aap sach me is student profile ko hamesha ke liye delete karna chahte hain?")) return;
    try {
      await fetch(`https://abd-school-backend.onrender.com/api/students/delete/${id}`, { method: 'DELETE' });
      setSelectedStudent(null);
      fetchStudentsList();
      alert("❌ Student Profile Deleted!");
    } catch (err) {
      alert("Error deleting student profile.");
    }
  };

  const handleEditUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://abd-school-backend.onrender.com/api/students/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedStudent)
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccessBanner('🎉 Profile Matrix System Updated Successfully!');
        setIsEditing(false);
        fetchStudentsList();
        
        setTimeout(() => {
          setSuccessBanner('');
          // 🔥 FIX: No more page reload - just clear banner
        }, 1500);
      } else {
        alert(data.error || 'Update process me error hai');
      }
    } catch (err) {
      alert("Error updating profile matrix system.");
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setSelectedStudent({ ...selectedStudent, [fieldName]: value });
  };

  const handleFeePayment = async (e) => {
    e.preventDefault();
    const finalDate = isCustomDate ? paymentDate : new Date().toISOString().split('T')[0];
    
    const formatDateForPrint = (dStr) => {
      if(!dStr) return '';
      const parts = dStr.split('-');
      if(parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return dStr;
    };

    const payload = {
      student_id: selectedStudent.id,
      school_pay: schoolPay || 0,
      transport_pay: transportPay || 0,
      next_due_date: formatDateForPrint(nextDueDate),
      payment_date: formatDateForPrint(finalDate)
    };

    try {
      const res = await fetch('https://abd-school-backend.onrender.com/api/submit-fee-advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      
      if (resData.success) {
        const currentSchoolPaid = parseFloat(selectedStudent.school_fee_paid || 0);
        const currentTransPaid = parseFloat(selectedStudent.transport_fee_paid || 0);
        const todaySchoolPay = parseFloat(schoolPay || 0);
        const todayTransPay = parseFloat(transportPay || 0);

        const feeCycle = selectedStudent.fee_cycle || 'Monthly';
        const cycleFeeAmount = selectedStudent.cycle_fee_amount || selectedStudent.school_fee_total;
        
        let feeHeadName = 'Tuition Fee';
        if (feeCycle === 'Monthly') feeHeadName = 'Tuition / Monthly Academic Head Fee';
        else if (feeCycle === 'Quarterly') feeHeadName = 'Tuition / Quarterly Academic Head Fee';
        else if (feeCycle === 'Annual') feeHeadName = 'Tuition / Annual Academic Head Fee';
        
        let transportHeadName = 'Transport Commute charges';
        if (feeCycle === 'Monthly') transportHeadName = 'Monthly Transport Commute charges';
        else if (feeCycle === 'Quarterly') transportHeadName = 'Quarterly Transport Commute charges';
        else if (feeCycle === 'Annual') transportHeadName = 'Annual Transport Commute charges';

        setPrintData({
          receipt_no: resData.receipt_no,
          date: formatDateForPrint(finalDate),
          name: selectedStudent.name,
          father_name: selectedStudent.father_name,
          class: selectedStudent.class,
          section: selectedStudent.section,
          admission_no: selectedStudent.admission_no,
          school_fee_total: parseFloat(selectedStudent.school_fee_total || 0),
          transport_fee_total: parseFloat(selectedStudent.transport_fee_total || 0),
          last_school_paid: currentSchoolPaid,
          last_trans_paid: currentTransPaid,
          today_school_paid: todaySchoolPay,
          today_trans_paid: todayTransPay,
          next_due: formatDateForPrint(nextDueDate),
          fee_head_name: feeHeadName,
          transport_head_name: transportHeadName,
          fee_cycle: feeCycle,
          cycle_fee_amount: cycleFeeAmount
        });
      
        setSuccessBanner("🎉 Fees Processed Successfully! Print option is enabled below.");
        setSchoolPay(''); 
        setTransportPay('');
        setNextDueDate('');
        fetchStudentsList();
      }
    } catch (err) {
      alert("Network Error while processing payment.");
    }
  };

  const handleSearchTrigger = () => {
    setActiveQuery(searchQuery);
  };

  const filteredStudents = students.filter(s => {
    const query = activeQuery.toLowerCase().trim();
    if (!query) return true;
    
    const sName = s.name ? s.name.toLowerCase() : '';
    const sAdm = s.admission_no ? s.admission_no.toLowerCase() : '';
    const sMobile = s.parent_mobile ? s.parent_mobile : '';
    
    return sName.includes(query) || sAdm.includes(query) || sMobile.includes(query);
  });

  return (
    <div style={{ padding: '4px', fontFamily: 'Arial, sans-serif' }}>
      
      <style>{`
        @media print {
          .no-print-area, .sidebar, nav, header, aside, .sidebar-container, button, .modal-overlay { 
            display: none !important; 
          }
          body, #root, main, .main-content { 
            background: #fff !important; 
            padding: 0 !important; 
            margin: 0 !important; 
            display: block !important;
            width: 100% !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-receipt-sheet { 
            display: block !important; 
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important; 
            color: #000 !important; 
            background: #fff !important; 
          }
          .receipt-box { 
            border: 2px dashed #000 !important; 
            padding: 24px; 
            margin-bottom: 40px; 
            page-break-inside: avoid; 
            border-radius: 8px; 
          }
        }
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 1000px;
          max-height: 80vh;
          overflow: auto;
          padding: 24px;
          position: relative;
        }
        .history-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }
        .history-table th, .history-table td {
          border: 1px solid #e2e8f0;
          padding: 10px;
          text-align: left;
        }
        .history-table th {
          background: #f1f5f9;
          font-weight: bold;
          position: sticky;
          top: 0;
        }
      `}</style>

      {/* HISTORY MODAL */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={20} color="#4f46e5"/> Fee History - {selectedStudent?.name}
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={printFeeHistory}
                  style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  <Download size={16}/> Download/Print
                </button>
                <button 
                  onClick={() => setShowHistoryModal(false)}
                  style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  <X size={16}/> Close
                </button>
              </div>
            </div>
            
            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading history...</div>
            ) : feeHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                No fee payment records found for this student.
              </div>
            ) : (
              <>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  <strong>📊 Summary:</strong> Total Payments: {feeHistory.length} | 
                  Total School Fee Paid: ₹{feeHistory.reduce((sum, r) => sum + parseFloat(r.school_fee_paid || 0), 0).toLocaleString()} |
                  Total Transport Paid: ₹{feeHistory.reduce((sum, r) => sum + parseFloat(r.transport_fee_paid || 0), 0).toLocaleString()}
                </div>
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Receipt No.</th>
                      <th>School Fee (₹)</th>
                      <th>Transport Fee (₹)</th>
                      <th>Total (₹)</th>
                      <th>Next Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeHistory.map((record, idx) => (
                      <tr key={idx}>
                        <td>{record.date || record.payment_date || 'N/A'}</td>
                        <td>{record.receipt_no || 'N/A'}</td>
                        <td style={{ textAlign: 'right' }}>₹{parseFloat(record.school_fee_paid || 0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>₹{parseFloat(record.transport_fee_paid || 0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{(parseFloat(record.school_fee_paid || 0) + parseFloat(record.transport_fee_paid || 0)).toLocaleString()}</td>
                        <td>{record.next_due_date || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                      <td colSpan="2" style={{ textAlign: 'right' }}>GRAND TOTAL:</td>
                      <td style={{ textAlign: 'right' }}>₹{feeHistory.reduce((sum, r) => sum + parseFloat(r.school_fee_paid || 0), 0).toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>₹{feeHistory.reduce((sum, r) => sum + parseFloat(r.transport_fee_paid || 0), 0).toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>₹{feeHistory.reduce((sum, r) => sum + parseFloat(r.school_fee_paid || 0) + parseFloat(r.transport_fee_paid || 0), 0).toLocaleString()}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </>
            )}
          </div>
        </div>
      )}

      {/* RENDER BODY FOR DESKTOP USER INTERFACE */}
      <div className="no-print-area">
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '22px', fontWeight: 'bold' }}>🔍 Search & Pay Fees Panel</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>Search student records, edit profiles dynamically or clear pending balance accounts</p>
        </div>

      {/* 🔥 FLOATING BACK BUTTON - Top right corner me fixed */}
<div style={{ 
  position: 'fixed', 
  top: '20px', 
  right: '20px', 
  zIndex: 1000,
  display: 'flex',
  gap: '10px'
}}>
  <button 
    onClick={() => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/';
      }
    }}
    style={{ 
      padding: '10px 18px', 
      backgroundColor: '#4f46e5', 
      color: 'white', 
      border: 'none', 
      borderRadius: '30px', 
      fontWeight: 'bold', 
      fontSize: '14px', 
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}
  >
    ◀ BACK
  </button>
</div>

        {/* SEARCH SECTION WITH FIXED BACK BUTTON */}
<div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
  {/* 🔥 FIXED BACK BUTTON - Sirf Dashboard/ChatList pe jayega */}
  <button 
    onClick={() => {
      // Dashboard route pe bhejo (aapke routes ke according change karna)
      // Agar aapka dashboard "/dashboard" hai toh:
      window.location.href = '/dashboard';
      
      // Agar aapka main page "/" ya "/chatlist" hai toh:
      // window.location.href = '/';
      // window.location.href = '/chatlist';
    }}
    style={{ 
      padding: '12px 20px', 
      backgroundColor: '#ef4444', 
      color: 'white', 
      border: 'none', 
      borderRadius: '10px', 
      fontWeight: 'bold', 
      fontSize: '14px', 
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'background 0.2s'
    }}
    onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
    onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
  >
    ◀ BACK TO DASHBOARD
  </button>
  
  <div style={{ position: 'relative', flexGrow: 1 }}>
    <Search style={{ position: 'absolute', left: '14px', top: '13px', color: '#94a3b8', width: '18px', height: '18px' }} />
    <input 
      type="text" 
      placeholder="Search by Student Name, Scholar No, or WhatsApp Mobile..."
      value={searchQuery}
      onChange={(e) => {
        setSearchQuery(e.target.value);
        setActiveQuery(e.target.value);
      }}
      onKeyDown={(e) => { if(e.key === 'Enter') handleSearchTrigger(); }}
      style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
    />
  </div>
  <button 
    onClick={handleSearchTrigger}
    style={{ padding: '12px 24px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)' }}
    onMouseOver={(e) => e.target.style.backgroundColor = '#4338ca'}
    onMouseOut={(e) => e.target.style.backgroundColor = '#4f46e5'}
  >
    Search Student
  </button>
</div>

        {/* Master Content Split Grid Block */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* LEFT CONTAINER: Live Filtered List */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', maxHeight: '520px', overflowY: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#475569', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>Matched Directory ({filteredStudents.length})</h3>
            {filteredStudents.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>No records found match criteria.</p>
            ) : (
              filteredStudents.map(s => {
                const pendingBal = (s.school_fee_total + s.transport_fee_total) - (s.school_fee_paid + s.transport_fee_paid);
                return (
                  <div 
                    key={s.id} 
                    onClick={() => { setSelectedStudent(s); setIsEditing(false); setPrintData(null); setSuccessBanner(''); }}
                    style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', backgroundColor: selectedStudent?.id === s.id ? '#eef2ff' : 'transparent', borderRadius: '8px', transition: 'all 0.2s', marginBottom: '4px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#1e293b', fontSize: '14px' }}>{s.name}</strong>
                      <span style={{ fontSize: '11px', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#64748b', fontWeight: 'bold' }}>Adm: {s.admission_no}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Class {s.class} - Sec {s.section} | Father: {s.father_name}</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: pendingBal > 0 ? '#ef4444' : '#10b981', marginTop: '4px' }}>
                      {pendingBal > 0 ? `Outstanding Pending: ₹${pendingBal}` : 'Fees Cleared ✓'} | Fee Cycle: {s.fee_cycle || 'Monthly'}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT CONTAINER: Dynamic Desk Terminal Controls */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            {selectedStudent ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '15px' }}><User style={{ color: '#6366f1' }} /> Workspace Terminal</h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {/* 🔥 NEW: History Button */}
                    <button 
                      onClick={() => fetchFeeHistory(selectedStudent.id)} 
                      style={{ padding: '6px 12px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
                    >
                      <History size={14}/> History
                    </button>
                    <button onClick={() => setIsEditing(!isEditing)} style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                      <Edit size={14}/> Edit Profile
                    </button>
                    <button onClick={() => handleDeleteProfile(selectedStudent.id)} style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Trash2 size={14}/> Delete
                    </button>
                  </div>
                </div>

                {successBanner && (
                  <div style={{ marginBottom: '14px', padding: '10px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px dashed #10b981', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                    {successBanner}
                  </div>
                )}

                {isEditing ? (
                  <form onSubmit={handleEditUpdate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
                    <div style={{ gridColumn: 'span 2', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', fontWeight: 'bold', color: '#1e293b', fontSize: '11px', textTransform: 'uppercase' }}>1. Primary Student Identity</div>
                    
                    <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Full Name</label><input type="text" value={selectedStudent.name || ''} onChange={(e) => handleFieldChange('name', e.target.value)} style={inpStyle} required /></div>
                    <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Admission/Scholar No</label><input type="text" value={selectedStudent.admission_no || ''} onChange={(e) => handleFieldChange('admission_no', e.target.value)} style={inpStyle} required /></div>
                    <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Roll Number</label><input type="text" value={selectedStudent.roll_no || ''} onChange={(e) => handleFieldChange('roll_no', e.target.value)} style={inpStyle} /></div>
                    <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Class</label><input type="text" value={selectedStudent.class || ''} onChange={(e) => handleFieldChange('class', e.target.value)} style={inpStyle} required /></div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Section</label>
                      <select value={selectedStudent.section || 'A'} onChange={(e) => handleFieldChange('section', e.target.value)} style={inpStyle}>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </div>
                    <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Date of Birth (DD/MM/YYYY)</label><input type="text" value={selectedStudent.dob || ''} onChange={(e) => handleFieldChange('dob', e.target.value)} style={inpStyle} /></div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Gender</label>
                      <select value={selectedStudent.gender || 'Male'} onChange={(e) => handleFieldChange('gender', e.target.value)} style={inpStyle}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div style={{ gridColumn: 'span 2', borderBottom: '1px solid #e2e8f0', paddingTop: '8px', paddingBottom: '4px', fontWeight: 'bold', color: '#1e293b', fontSize: '11px', textTransform: 'uppercase' }}>2. Security Credentials & Parental Tree</div>
                    <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Father's Name</label><input type="text" value={selectedStudent.father_name || ''} onChange={(e) => handleFieldChange('father_name', e.target.value)} style={inpStyle} /></div>
                    <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Mother's Name</label><input type="text" value={selectedStudent.mother_name || ''} onChange={(e) => handleFieldChange('mother_name', e.target.value)} style={inpStyle} /></div>
                    <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>📱 WhatsApp Mobile</label><input type="text" value={selectedStudent.parent_mobile || ''} onChange={(e) => handleFieldChange('parent_mobile', e.target.value)} style={{ ...inpStyle, color: '#16a34a' }} required /></div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Category</label>
                      <select value={selectedStudent.category || 'General'} onChange={(e) => handleFieldChange('category', e.target.value)} style={inpStyle}>
                        <option value="General">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                      </select>
                    </div>
                    <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Aadhaar Card No</label><input type="text" value={selectedStudent.aadhaar_no || ''} onChange={(e) => handleFieldChange('aadhaar_no', e.target.value)} style={inpStyle} /></div>
                    <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Samagra ID</label><input type="text" value={selectedStudent.samagra_id || ''} onChange={(e) => handleFieldChange('samagra_id', e.target.value)} style={{ ...inpStyle, color: '#2563eb' }} /></div>
                    <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Permanent Address</label><input type="text" value={selectedStudent.address || ''} onChange={(e) => handleFieldChange('address', e.target.value)} style={inpStyle} /></div>

                    <div style={{ gridColumn: 'span 2', borderBottom: '1px solid #e2e8f0', paddingTop: '8px', paddingBottom: '4px', fontWeight: 'bold', color: '#1e293b', fontSize: '11px', textTransform: 'uppercase' }}>3. Commercial Ledger Matrix</div>
                    <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Total Yearly Fee (₹)</label><input type="number" value={selectedStudent.school_fee_total || 0} onChange={(e) => handleFieldChange('school_fee_total', e.target.value)} style={inpStyle} /></div>
                    <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Total Transport Fee (₹)</label><input type="number" value={selectedStudent.transport_fee_total || 0} onChange={(e) => handleFieldChange('transport_fee_total', e.target.value)} style={inpStyle} /></div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Fee Payment Cycle</label>
                      <select value={selectedStudent.fee_cycle || 'Monthly'} onChange={(e) => handleFieldChange('fee_cycle', e.target.value)} style={inpStyle}>
                        <option value="Monthly">Monthly (मासिक फीस)</option>
                        <option value="Quarterly">Quarterly (त्रैमासिक)</option>
                        <option value="Annual">Annual (वार्षिक फीस)</option>
                      </select>
                    </div>
                    <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Cycle Fee Amount (₹)</label><input type="number" value={selectedStudent.cycle_fee_amount || 0} onChange={(e) => handleFieldChange('cycle_fee_amount', e.target.value)} style={inpStyle} /></div>

                    <div style={{ gridColumn: 'span 2', borderBottom: '1px solid #e2e8f0', paddingTop: '8px', paddingBottom: '4px', fontWeight: 'bold', color: '#1e293b', fontSize: '11px', textTransform: 'uppercase' }}>4. Student Bank Accounts</div>
                    <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Bank Name</label><input type="text" value={selectedStudent.bank_name || ''} onChange={(e) => handleFieldChange('bank_name', e.target.value)} style={inpStyle} /></div>
                    <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Account Number</label><input type="text" value={selectedStudent.account_no || ''} onChange={(e) => handleFieldChange('account_no', e.target.value)} style={inpStyle} /></div>
                    <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>IFSC Code</label><input type="text" value={selectedStudent.ifsc_code || ''} onChange={(e) => handleFieldChange('ifsc_code', e.target.value)} style={inpStyle} /></div>

                    <button type="submit" style={{ gridColumn: 'span 2', padding: '12px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px', fontSize: '14px' }}>Update Profile Matrix ⚡</button>
                  </form>
                ) : (
                  <div>
                    <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', fontSize: '13px', border: '1px solid #e2e8f0', marginBottom: '20px', lineHeight: '1.6' }}>
                      💡 <b>School Balance Ledger:</b> Allocated Target: ₹{selectedStudent.school_fee_total} | Total Collected: ₹{selectedStudent.school_fee_paid} | Remaining: <span style={{ color: '#ef4444', fontWeight: 'bold' }}>₹{selectedStudent.school_fee_total - selectedStudent.school_fee_paid}</span><br/>
                      🚌 <b>Transport/Van Ledger:</b> Allocated Target: ₹{selectedStudent.transport_fee_total} | Total Collected: ₹{selectedStudent.transport_fee_paid} | Remaining: <span style={{ color: '#ef4444', fontWeight: 'bold' }}>₹{selectedStudent.transport_fee_total - selectedStudent.transport_fee_paid}</span><br/>
                      📅 <b>Fee Cycle:</b> {selectedStudent.fee_cycle || 'Monthly'} | Cycle Amount: ₹{selectedStudent.cycle_fee_amount || selectedStudent.school_fee_total}
                    </div>

                    <form onSubmit={handleFeePayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ backgroundColor: '#f5f3ff', padding: '12px', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
                        <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px', color: '#5b21b6' }}>📅 Receipt Print Date Settings</label>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', fontSize: '13px' }}>
                          <label><input type="radio" checked={!isCustomDate} onChange={() => setIsCustomDate(false)} /> Current Date (Today)</label>
                          <label><input type="radio" checked={isCustomDate} onChange={() => setIsCustomDate(true)} /> Backdated Entry</label>
                        </div>
                        {isCustomDate && (
                          <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} style={{ ...inpStyle, marginTop: '8px', padding: '6px' }} />
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>School Fee to Collect (₹)</label>
                          <input type="number" placeholder="Amt e.g. 2000" value={schoolPay} onChange={(e) => setSchoolPay(e.target.value)} style={inpStyle} />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Transport Fee to Collect (₹)</label>
                          <input type="number" placeholder="Amt e.g. 500" value={transportPay} onChange={(e) => setTransportPay(e.target.value)} style={inpStyle} />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>📅 Next Fee Due Date (अगली जमा तिथि) *</label>
                        <input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} style={inpStyle} required />
                      </div>

                      <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}>
                        💾 Submit & Process Fee Record
                      </button>
                    </form>

                    {successBanner && !isEditing && (
  <div style={{ marginTop: '20px', textAlign: 'center', padding: '14px', border: '1px dashed #10b981', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
    <p style={{ color: '#16a34a', fontWeight: 'bold', margin: '0 0 10px 0', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
      <CheckCircle size={16}/> {successBanner}
    </p>
    
    {/* 🔥 FIXED PRINT BUTTON - Refresh hoga but same page pe rahega */}
    <button 
      onClick={() => {
        // Print command
        window.print();
        
        // 2 seconds baad page refresh hoga (print window close hone ke baad)
        setTimeout(() => {
          // Sirf refresh karo, kisi dusre page pe nahi bhejna
          window.location.reload();
        }, 2000);
      }} 
      style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
    >
      <FileText size={16}/> 🖨️ Print Double Invoice Slip
    </button>
  </div>
)}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0', fontSize: '14px' }}>
                👈 Directory results list se pehle kisi bache ko select kijiye.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🧾 HARD COPY DUAL COUNTERFOIL LAYOUT */}
      {printData && (
        <div className="print-receipt-sheet" style={{ display: 'block' }}>
          {[1, 2].map((copyId) => {
            const qrText = `REC:${printData.receipt_no}|AMT:${printData.today_school_paid + printData.today_trans_paid}`;
            const staticQrFallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrText)}`;

            return (
              <div key={copyId} className="receipt-box" style={{ minHeight: '440px', position: 'relative', border: '2px dashed #000', padding: '24px', marginBottom: '40px', boxSizing: 'border-box', backgroundColor: '#fff', color: '#000', display: 'block' }}>
                {copyId === 2 && (
                  <div style={{ position: 'absolute', top: '-34px', left: 0, right: 0, textAlign: 'center', fontSize: '11px', letterSpacing: '2px', color: '#000' }}>
                    ✂️ ----------------------- KAINCHI SE KAAT KAR ALAG KAREIN (FOLD & CUT HERE) ----------------------- ✂️
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '12px', minHeight: '80px' }}>
                  <div style={{ width: '75px', height: '75px', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#fff' }}>
                    {schoolSettings?.school_logo && !logoError ? (
                      <img 
                        src={schoolSettings.school_logo} 
                        alt="School Logo" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                        onError={() => setLogoError(true)}
                      />
                    ) : (
                      <div style={{ fontSize: '10px', fontWeight: 'bold', textAlign: 'center', padding: '4px', color: '#000' }}>
                        {schoolSettings.school_name?.substring(0, 2).toUpperCase() || 'AB'}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'center', flex: 1, padding: '0 10px' }}>
                    <h2 style={{ margin: '0 0 2px 0', fontSize: '20px', fontWeight: '900', color: '#000', letterSpacing: '0.5px' }}>{schoolSettings?.school_name?.toUpperCase() || 'A.B.DIGITAL WORK'}</h2>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: '600', color: '#000' }}>{schoolSettings?.school_address || 'Madhya Pradesh, India'} | Helpline: {schoolSettings?.school_mobile || '9893260067'}</p>
                    <div style={{ display: 'inline-block', border: '1px solid #000', padding: '1px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', marginTop: '6px', color: '#000', textTransform: 'uppercase' }}>
                      {copyId === 1 ? "FEES RECEIPT - SCHOOL COPY" : "FEES RECEIPT - PARENTS COPY"}
                    </div>
                  </div>

                  <div style={{ width: '75px', height: '75px', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: '2px', boxSizing: 'border-box' }}>
                    <img 
                      src={staticQrFallbackUrl} 
                      alt="Verification QR" 
                      style={{ 
                        width: '70px', 
                        height: '70px', 
                        objectFit: 'contain', 
                        display: 'block !important',
                        visibility: 'visible !important',
                        opacity: '1 !important'
                      }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', margin: '16px 0', fontSize: '13px', borderBottom: '1px dashed #000', paddingBottom: '12px', color: '#000' }}>
                  <div>
                    <div style={{ margin: '4px 0' }}><b>Receipt Number (रसीद संख्या):</b> {printData.receipt_no}</div>
                    <div style={{ margin: '4px 0' }}><b>Student Name (छात्र का नाम):</b> <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{printData.name}</span></div>
                    <div style={{ margin: '4px 0' }}><b>Father's Name (पिता का नाम):</b> {printData.father_name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ margin: '4px 0' }}><b>Date (दिनांक):</b> {printData.date}</div>
                    <div style={{ margin: '4px 0' }}><b>Scholar/Admission No:</b> {printData.admission_no}</div>
                    <div style={{ margin: '4px 0' }}><b>Class & Section (कक्षा/वर्ग):</b> {printData.class} - {printData.section}</div>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '13px', color: '#000' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #000', borderTop: '2px solid #000', textAlign: 'left' }}>
                      <th style={{ padding: '8px 4px' }}>Fee Particular Head Description</th>
                      <th style={{ padding: '8px 4px' }}>Yearly Target</th>
                      <th style={{ padding: '8px 4px' }}>Prev Collected</th>
                      <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Current Deposited (आज जमा)</th>
                      <th style={{ padding: '8px 4px', textAlign: 'right' }}>Pending Dues Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px dashed #000' }}>
                      <td style={{ padding: '8px 4px' }}>{printData.fee_head_name || 'Tuition / Academic Head Fee'}</td>
                      <td style={{ padding: '8px 4px' }}>₹{printData.school_fee_total}</td>
                      <td style={{ padding: '8px 4px' }}>₹{printData.last_school_paid}</td>
                      <td style={{ padding: '8px 4px', fontWeight: 'bold' }}>₹{printData.today_school_paid}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold' }}>₹{printData.school_fee_total - (printData.last_school_paid + printData.today_school_paid)}</td>
                    </tr>
                    <tr style={{ borderBottom: '2px solid #000' }}>
                      <td style={{ padding: '8px 4px' }}>{printData.transport_head_name || 'Transport Commute charges'}</td>
                      <td style={{ padding: '8px 4px' }}>₹{printData.transport_fee_total}</td>
                      <td style={{ padding: '8px 4px' }}>₹{printData.last_trans_paid}</td>
                      <td style={{ padding: '8px 4px', fontWeight: 'bold' }}>₹{printData.today_trans_paid}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold' }}>₹{printData.transport_fee_total - (printData.last_trans_paid + printData.today_trans_paid)}</td>
                    </tr>
                    <tr style={{ fontWeight: 'bold', fontSize: '14px' }}>
                      <td colSpan="3" style={{ padding: '12px 4px' }}>💰 Net Grand Collected Totals (कुल आज जमा राशि):</td>
                      <td style={{ padding: '12px 4px', fontSize: '15px', color: '#000', textDecoration: 'underline' }}>₹{printData.today_school_paid + printData.today_trans_paid}.00</td>
                      <td style={{ padding: '12px 4px', textAlign: 'right' }}>₹{parseFloat(printData.school_fee_total + printData.transport_fee_total) - parseFloat(printData.last_school_paid + printData.last_trans_paid + printData.today_school_paid + printData.today_trans_paid)}.00</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ marginTop: '12px', fontSize: '11px', color: '#555', borderTop: '1px dotted #ccc', paddingTop: '8px' }}>
                  <b>Fee Cycle:</b> {printData.fee_cycle || 'Monthly'} | <b>Cycle Amount:</b> ₹{printData.cycle_fee_amount || printData.school_fee_total}
                </div>

                <div style={{ marginTop: '16px', fontSize: '13px', fontStyle: 'italic', color: '#000' }}>
                  <div>⚠️ <b>Next Scheduled Due Date (अगली देय तिथि):</b> <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{printData.next_due || 'N/A'}</span></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', fontSize: '12px', color: '#000' }}>
                  <span style={{ textAlign: 'center' }}>___________________________<br/>Guardian/Parent Sign (अभिभावक)</span>
                  <span style={{ textAlign: 'center' }}>___________________________<br/>ERP Cashier / Clerk Sign</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const inpStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', marginTop: '4px', fontSize: '14px', fontWeight: '600' };

export default SearchPayFees;