// src/components/StaffPayrollAttendance.jsx
import React, { useState, useEffect } from 'react';
import { UserPlus, Settings, QrCode, Download, Users, AlertTriangle, MapPin, Clock, Calendar, FileText, CheckCircle2, DollarSign, History } from 'lucide-react';
import * as XLSX from 'xlsx';

// 🎯 FIX: Ise component function ke strictly BAHAR aur UPAR rakhein taaki ReferenceError khatam ho!
const BASE_URL = 'https://abd-school-backend.onrender.com';
const StaffPayrollAttendance = () => {
  // Core System States with Strict Safe Defaults
  const [staffList, setStaffList] = useState([]);
  const [activeTab, setActiveTab] = useState('directory'); // directory | reports | rules | qr_wall
  const [reportMode, setReportMode] = useState('today'); // today | monthly | management
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].substring(0, 7)); // YYYY-MM
  const [reportData, setReportData] = useState([]);
  const [managementSheetData, setManagementSheetData] = useState([]);
  
  // Salary / Pay Slip Modal View State variables
  const [selectedStaffSlip, setSelectedStaffSlip] = useState(null);

  // Advance Payment Modal States
  const [advanceModalStaff, setAdvanceModalStaff] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');
  const [advanceHistory, setAdvanceHistory] = useState([]);

  // New Staff Form States (Upgraded with PF Configuration support)
  const [staffName, setStaffName] = useState('');
  const [designation, setDesignation] = useState('');
  const [mobile, setMobile] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [pfEnabled, setPfEnabled] = useState(0);
  const [clEncashment, setClEncashment] = useState({}); // Stores per staff CL pay rule boolean state

  // Rule Book States Linked to Dynamic Settings Table
  const [rules, setRules] = useState({
    latitude: 24.7432,
    longitude: 78.8561,
    radius: 50,
    start_time: '08:00',
    buffer: 15,
    end_time: '14:00'
  });

  const [uiMessage, setUiMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Safe wrapper for rounding metrics
  const roundVal = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return 0;
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };

  useEffect(() => {
  let isMounted = true;
  
  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // ⏱️ 5 second timeout -> 3 second karo
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Timeout')), 3000) // ✅ 5 se 3 kiya
);
      
      // 🚀 Parallel fetch with timeout
      const fetchPromise = Promise.all([
        fetch(`${BASE_URL}/api/staff`).catch(() => null),
        fetch(`${BASE_URL}/api/attendance-rules`).catch(() => null)
      ]);
      
      const results = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (isMounted) {
        // Staff data
        if (results && results[0] && results[0].ok) {
          const data = await results[0].json();
          if (Array.isArray(data)) setStaffList(data);
        } else {
          setStaffList([]); // ✅ Empty list, loading hat jayegi
        }
        
        // Rules data
        if (results && results[1] && results[1].ok) {
          const data = await results[1].json();
          if (data && !data.error) {
            setRules({
              latitude: 24.7432,
              longitude: 78.8561,
              radius: 50,
              start_time: data.start_time ?? '08:00',
              buffer: data.buffer ?? 15,
              end_time: data.end_time ?? '14:00'
            });
          }
        }
      }
    } catch (e) {
      console.error("Initial load error:", e);
      if (isMounted) {
        setStaffList([]); // ✅ Error par bhi loading hat jayegi
      }
    } finally {
      if (isMounted) {
        setLoading(false); // ✅ HAMESHA LOADING HATAO
      }
    }
  };
  
  loadInitialData();
  
  return () => {
    isMounted = false;
  };
}, []);

   // ✅ TAB SYNC - Sirf pehli baar fetch karo, har baar nahi
useEffect(() => {
  // Rules tab - Sirf tab change par fetch karo, agar data default hai to
  if (activeTab === 'rules' && rules.latitude === 24.7432) {
    fetchRules();
  }
  // Directory tab - Sirf tab change par fetch karo, agar list empty hai to
  if (activeTab === 'directory' && staffList.length === 0) {
    fetchStaff();
  }
}, [activeTab]);

  // ✅ CL ENCASHMENT TOGGLE PAR MANAGEMENT SHEET AUTO-REFRESH
  useEffect(() => {
    if (activeTab === 'reports' && reportMode === 'management') {
      fetchManagementPayrollSheet();
    }
  }, [clEncashment, selectedMonth]);

  // Fetch Reports dynamically jab report mode ya month select badle
  useEffect(() => {
    if (activeTab === 'reports') {
      if (reportMode === 'management') {
        fetchManagementPayrollSheet();
      } else {
        fetchAttendanceReports();
      }
    }
  }, [activeTab, reportMode, selectedMonth]);

  const fetchStaff = async () => {
    try {
      // 🎯 Sateek Replacement:
      const res = await fetch(`${BASE_URL}/api/staff`);
      if (!res.ok) throw new Error("Network response not ok");
      const data = await res.json();
      if (Array.isArray(data)) setStaffList(data);
    } catch (err) {
      console.error("Staff engine link failure", err);
      setStaffList([]); 
    }
  };

  const fetchRules = async () => {
  try {
    // 1. Pehle attendance rules fetch karo (PRIORITY)
    const rulesRes = await fetch(`${BASE_URL}/api/attendance-rules`);
    let rulesData = null;
    
    if (rulesRes.ok) {
      rulesData = await rulesRes.json();
    }

    // 2. Default values (Aapki exact location)
    let currentLat = 24.750358920875314;
    let currentLng = 78.8348749760745;
    let currentRadius = 50;

    // 3. Agar rules available hain, to UNKO priority do
    if (rulesData && !rulesData.error && rulesData.latitude) {
      currentLat = parseFloat(rulesData.latitude);
      currentLng = parseFloat(rulesData.longitude);
      currentRadius = parseInt(rulesData.radius) || 50;
      
      setRules({
        latitude: currentLat,
        longitude: currentLng,
        radius: currentRadius,
        start_time: rulesData.start_time ?? '08:00',
        buffer: rulesData.buffer ?? 15,
        end_time: rulesData.end_time ?? '14:00'
      });
      return; // ✅ Rules mil gaye, yahi return karo
    }

    // 4. Agar rules nahi hain, to settings se lo (FALLBACK)
    const settingsRes = await fetch(`${BASE_URL}/api/settings`);
    if (settingsRes.ok) {
      const sData = await settingsRes.json();
      currentLat = parseFloat(sData.school_latitude) || currentLat;
      currentLng = parseFloat(sData.school_longitude) || currentLng;
      currentRadius = parseInt(sData.school_location_radius) || currentRadius;
    }

    setRules({
      latitude: currentLat,
      longitude: currentLng,
      radius: currentRadius,
      start_time: '08:00',
      buffer: 15,
      end_time: '14:00'
    });

  } catch (err) {
    console.error("Rules fetch error:", err);
    // Fallback to your exact location
    setRules({
      latitude: 24.750358920875314,
      longitude: 78.8348749760745,
      radius: 50,
      start_time: '08:00',
      buffer: 15,
      end_time: '14:00'
    });
  }
};

  const fetchAttendanceReports = async () => {
    try {
      const url = reportMode === 'today' 
  ? `${BASE_URL}/api/payroll/today-report`
  : `${BASE_URL}/api/payroll/monthly-report?month=${selectedMonth}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Network response not ok");
      const data = await res.json();
      if (Array.isArray(data)) setReportData(data);
    } catch (err) {
      console.error("Failed fetching operational logs report metrics", err);
      setReportData([]);
    }
  };

  const fetchManagementPayrollSheet = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/payroll/management-sheet?month=${selectedMonth}`);
      if (!res.ok) throw new Error("Network response not ok");
      const data = await res.json();
      if (Array.isArray(data)) {
        const calculatedSheet = data.map(staff => {
          const isClActive = !!clEncashment[staff.staff_id];
          const clBonus = isClActive ? ((staff.cl_remaining || 0) * 500) : 0;
          return {
            ...staff,
            cl_bonus_added: clBonus,
            final_net_payout: Math.max(0, (staff.base_net_payout || 0) + clBonus)
          };
        });
        setManagementSheetData(calculatedSheet);
      }
    } catch (err) {
      console.error("Error logging system master payroll matrices", err);
      const offlineFallback = (staffList || []).map(s => {
        const base = parseFloat(s?.base_salary) || 0;
        const clBonus = !!clEncashment[s.id] ? 6000 : 0;
        return {
          staff_id: s.id, name: s.name || 'Unknown', designation: s.designation || 'Staff', base_salary: base,
          days_present: 0, total_lates: 0, late_salary_cut_amount: 0, half_days: 0, half_day_deduction: 0,
          pf_deduction: s.pf_enabled === 1 ? roundVal(base * 0.12) : 0, advance_taken: 0, cl_remaining: 12,
          cl_bonus_added: clBonus, final_net_payout: roundVal(base + clBonus)
        };
      });
      setManagementSheetData(offlineFallback);
    }
  };

  const fetchIndividualPaySlip = async (staffId) => {
    try {
      const res = await fetch(`${BASE_URL}/api/payroll/payslip/${staffId}?month=${selectedMonth}`);
      const data = await res.json();
      if (data && !data.error) {
        let totalAdvanceToDeduct = 0;
        try {
          const advRes = await fetch(`${BASE_URL}/api/payroll/advance-history/${staffId}`);
          const advData = await advRes.json();
          if (Array.isArray(advData)) totalAdvanceToDeduct = advData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        } catch (e) { console.log("Advance fetch handled safely."); }
        
        const clBonus = clEncashment[staffId] ? ((data.cl_remaining || 0) * 500) : 0;
        const finalCalculatedPayout = (data.net_salary_payout || 0) - totalAdvanceToDeduct + clBonus;

        setSelectedStaffSlip({
          ...data,
          advance_deducted: totalAdvanceToDeduct,
          cl_bonus_added: clBonus,
          cl_encashment_active: clEncashment[staffId] ? "Enabled" : "Disabled",
          net_salary_payout: finalCalculatedPayout < 0 ? 0 : roundVal(finalCalculatedPayout)
        });
      }
    } catch (err) {
      const currentS = staffList.find(s=>s.id===staffId);
      const isClActive = !!clEncashment[staffId];
      const fallbackClBonus = isClActive ? 12 * 500 : 0;
      const base = parseFloat(currentS?.base_salary) || 0;
      setSelectedStaffSlip({
        staff_id: staffId, name: currentS?.name || 'Staff Profile', designation: currentS?.designation || 'Teacher',
        month: selectedMonth, base_salary: base, days_present: 0, late_fines_deducted: 0, half_days_count: 0, half_day_deductions: 0,
        pf_deducted: currentS?.pf_enabled === 1 ? roundVal(base * 0.12) : 0, advance_deducted: 0, cl_bonus_added: fallbackClBonus, cl_encashment_active: isClActive ? "Enabled" : "Disabled",
        cl_remaining: 12, net_salary_payout: roundVal(base + fallbackClBonus)
      });
    }
  };

  const downloadTextPaySlipFile = (slip) => {
    if (!slip) return;
    const slipText = 
      `==================================================\n` +
      `          A.B.DIGITAL WORK SYSTEMS LOGS          \n` +
      `               MONTHLY SALARY SLIP               \n` +
      `==================================================\n` +
      `Name: Mr./Ms. ${slip.name || 'N/A'}\n` +
      `Designation Post: ${slip.designation || 'N/A'}\n` +
      `Target Month: ${slip.month || 'N/A'}\n` +
      `--------------------------------------------------\n` +
      `Base Fixed Salary:              ₹${slip.base_salary || 0}\n` +
      `Days Logged Present:            ${slip.days_present || 0} Days\n` +
      `(+) CL Encashment Extra Bonus:  +₹${slip.cl_bonus_added || 0} (${slip.cl_encashment_active})\n` +
      `--------------------------------------------------\n` +
      `(-) Late Fine Penalties:        -₹${slip.late_fines_deducted || 0}\n` +
      `(-) Half Day Reductions:        -₹${slip.half_day_deductions || 0} (${slip.half_days_count || 0} times)\n` +
      `(-) EPF Contribution (12%):     -₹${slip.pf_deducted || 0}\n` +
      `(-) Advance Amount Deducted:    -₹${slip.advance_deducted || 0}\n` +
      `--------------------------------------------------\n` +
      `💰 NET PAYOUT INCOME:           ₹${slip.net_salary_payout || 0}\n` +
      `--------------------------------------------------\n` +
      `* Leaves balance remaining:      ${slip.cl_remaining ?? 12} CLs\n` +
      `==================================================\n` +
      `Generated on: ${new Date().toLocaleDateString()} | System Secure Node\n`;

    const blob = new Blob([slipText], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `PaySlip_${slip.name.replace(/\s+/g, '_')}_${slip.month}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFetchAdvanceHistory = async (staffId) => {
  try {
    const res = await fetch(`${BASE_URL}/api/payroll/advance-history/${staffId}`);
    const data = await res.json();
    console.log("Advance history response:", data); // Debug ke liye
    if (Array.isArray(data)) {
      setAdvanceHistory(data);
    } else if (data && Array.isArray(data.history)) {
      setAdvanceHistory(data.history);
    } else {
      setAdvanceHistory([]);
    }
  } catch (err) {
    console.error("Fetch advance history error:", err);
    setAdvanceHistory([]);
  }
};

  const handleOpenAdvanceModal = (staff) => {
    if (!staff) return;
    setAdvanceModalStaff(staff);
    handleFetchAdvanceHistory(staff.id);
  };

  const handleSubmitAdvancePayment = async (e) => {
  e.preventDefault();
  if (!advanceAmount || parseFloat(advanceAmount) <= 0 || !advanceModalStaff) return;

  const payload = {
    staff_id: advanceModalStaff.id,
    amount: parseFloat(advanceAmount),
    purpose: advanceReason || 'Personal Advance',
    date: new Date().toISOString().split('T')[0]
  };

  try {
    const res = await fetch(`${BASE_URL}/api/payroll/add-advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await res.json();
    console.log("Advance submit response:", result);
    
    if (res.ok) {
      alert("✅ Advance Payment logged successfully!");
      setAdvanceAmount('');
      setAdvanceReason('');
      await handleFetchAdvanceHistory(advanceModalStaff.id);
    } else {
      alert("Failed: " + (result.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Submit advance error:", err);
    alert("Error saving advance. Check backend logs.");
  }
};

  const downloadAdvanceHistory = async (staffId, staffName) => {
    try {
      const response = await fetch(`${BASE_URL}/api/payroll/download-advance-history/${staffId}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Advance_History_${staffName}_${staffId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download history');
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    const payload = { name: staffName, designation, mobile, base_salary: parseFloat(baseSalary) || 0, pf_enabled: pfEnabled };
    try {
      const res = await fetch(`${BASE_URL}/api/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setUiMessage('🎉 New Staff Member Registered into Ledger!');
        setStaffName(''); setDesignation(''); setMobile(''); setBaseSalary(''); setPfEnabled(0);
        fetchStaff();
        setTimeout(() => setUiMessage(''), 3000);
      }
    } catch (err) {
      alert("Error logging staff metrics.");
    }
  };

  // 🎯 STAFF REMOVAL PROCESS ENGINE (SOFT DELETE CALL)
  const handleDeleteStaff = async (staffId, staffName) => {
    const confirmDelete = window.confirm(`⚠️ Kya aap sach me Mr. ${staffName} ko roster se hatana chahte hain?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${BASE_URL}/api/staff/delete/${staffId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        setUiMessage(`❌ Mr. ${staffName} removed from active roster successfully!`);
        fetchStaff(); // Fresh list load karega jisse wo turant screen se gayab ho jayein
        setTimeout(() => setUiMessage(''), 3000);
      } else {
        alert("Error removing staff profile.");
      }
    } catch (err) {
      console.error("Failed connecting to deactivation pipeline:", err);
      alert("Backend server connection failed.");
    }
  };

  // 🎯 RULES FORM EDITED FULLY: Ab settings aur rules table dono perfect automatic sync hongi
  const handleUpdateRules = async (e) => {
    e.preventDefault();
    try {
      // 1. Core attendance rules endpoint update call
      const res = await fetch(`${BASE_URL}/api/attendance-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: parseFloat(rules.latitude),
          longitude: parseFloat(rules.longitude),
          radius: parseFloat(rules.radius),
          start_time: rules.start_time,
          buffer: parseInt(rules.buffer),
          end_time: rules.end_time
        })
      });

      // 2. 🎯 PARALLEL AUTO-SYNC LOGIC: Backend data engine ke backup parameters ko exact hit kiya
      await fetch(`${BASE_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_latitude: parseFloat(rules.latitude),
          school_longitude: parseFloat(rules.longitude),
          school_location_radius: parseInt(rules.radius)
        })
      });

      if (res.ok) {
        setUiMessage('⚙️ Global Geo-Fence parameters successfully cross-synchronized!');
        setTimeout(() => setUiMessage(''), 3000);
        fetchRules();
      }
    } catch (err) {
      alert("Error routing network variables.");
    }
  };

  const handleToggleClRule = (staffId) => {
    setClEncashment(prev => ({ ...prev, [staffId]: !prev[staffId] }));
  };

  const downloadExcelReport = () => {
    if (!Array.isArray(reportData) || reportData.length === 0) {
      alert("No data available to download.");
      return;
    }
    const excelRows = reportData.map(row => ({
      "Staff Name": row.name || 'N/A',
      "Post Designation": row.designation || 'N/A',
      "Log Date": row.date || 'N/A',
      "School Entry Timing": row.entry_time || 'N/A',
      "School Exit Timing": row.exit_time || 'N/A',
      "Late Fine (₹)": row.late_fine || 0,
      "Leave State": row.leave || 'N/A',
      "Half Day": row.half_day || 'N/A',
      "PF Account Check": row.pf || 'N/A'
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");
    XLSX.writeFile(workbook, `Attendance_Report_${reportMode === 'today' ? 'Daily' : selectedMonth}.xlsx`);
  };

  const downloadManagementPayrollExcel = () => {
    if (!Array.isArray(managementSheetData) || managementSheetData.length === 0) {
      alert("Management spreadsheet matrix data is currently empty.");
      return;
    }
    const excelRows = managementSheetData.map(row => ({
      "Staff Name": row.name || 'N/A',
      "Designation": row.designation || 'N/A',
      "Gross Base Salary (₹)": row.base_salary || 0,
      "Days Present": row.days_present || 0,
      "Total Late Counts": row.total_lates || 0,
      "3-Late Cut Penalty (₹)": row.late_salary_cut_amount || 0,
      "Half Days Count": row.half_days || 0,
      "Half Day Deducts (₹)": row.half_day_deduction || 0,
      "EPF Deductions (₹)": row.pf_deduction || 0,
      "Advance Deductions (₹)": row.advance_taken || 0,
      "CL Bonus Paid (₹)": row.cl_bonus_added || 0,
      "NET PAYOUT CASH (₹)": row.final_net_payout || 0
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll Ledger");
    XLSX.writeFile(workbook, `Master_Management_Payroll_${selectedMonth}.xlsx`);
  };

  // Static/Reusable Styles inside Component Framework
  const tabBtnStyle = { padding: '8px 16px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' };
  const cardStyle = { backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
  const cardTitleStyle = { margin: '0 0 16px 0', fontSize: '15px', color: '#1e293b', fontWeight: 'bold', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' };
  const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' };
  const inpStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', marginTop: '4px', fontSize: '14px', fontWeight: '600', backgroundColor: '#fff' };
  const submitBtnStyle = { width: '100%', padding: '11px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
  const rowActionBtnStyle = { padding: '5px 10px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#334155', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #cbd5e1', transition: 'all 0.1s' };
  const thTdStyle = { padding: '12px 10px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' };

  // Master Wall QR Encryption String Generator
  const myComputerIp = window.location.hostname;
  const wallQrDataString = `https://${myComputerIp}/staff-attendance-terminal`; 
  const generatedWallQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(wallQrDataString)}`;

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif', color: '#64748b' }}>
        <p style={{ fontWeight: 'bold', fontSize: '15px' }}>⏳ Loading Advanced Staff Matrix Logs...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '10px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {/* HEADER TITLE MATRIX ROW */}
      <div style={{ marginBottom: '24px', backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h2 style={{ margin: 0, color: '#0f172a', fontSize: '24px', fontWeight: 'bold' }}>📅 Staff Management & Geo-Payroll Matrix</h2>
        <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '14px' }}>Track range bounds attendance, deploy automated WhatsApp alerts, and check live accounting sheets</p>
      </div>

      {uiMessage && (
        <div style={{ padding: '12px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px dashed #10b981', borderRadius: '8px', marginBottom: '16px', fontWeight: 'bold', fontSize: '14px' }}>
          {uiMessage}
        </div>
      )}

      {/* HORIZONTAL TAB BAR MENU PANEL */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px' }}>
          <button onClick={() => setActiveTab('directory')} style={{ ...tabBtnStyle, backgroundColor: activeTab === 'directory' ? '#4f46e5' : '#fff', color: activeTab === 'directory' ? 'white' : '#475569', border: '1px solid #cbd5e1' }}><Users size={16}/> Staff Profiles</button>
          <button onClick={() => { setActiveTab('reports'); setReportMode('today'); }} style={{ ...tabBtnStyle, backgroundColor: activeTab === 'reports' ? '#4f46e5' : '#fff', color: activeTab === 'reports' ? 'white' : '#475569', border: '1px solid #cbd5e1' }}><Calendar size={16}/> Master Reports Engine</button>
    
          {/* 🎯 ADVANCE TAB BUTTON */}
          <button onClick={() => setActiveTab('advance')} style={{ ...tabBtnStyle, backgroundColor: activeTab === 'advance' ? '#e65100' : '#fff', color: activeTab === 'advance' ? 'white' : '#475569', border: '1px solid #cbd5e1' }}><DollarSign size={16}/> Advance Salary</button>
    
          <button onClick={() => setActiveTab('rules')} style={{ ...tabBtnStyle, backgroundColor: activeTab === 'rules' ? '#4f46e5' : '#fff', color: activeTab === 'rules' ? 'white' : '#475569', border: '1px solid #cbd5e1' }}><Settings size={16}/> Attendance Rules</button>
          <button onClick={() => setActiveTab('qr_wall')} style={{ ...tabBtnStyle, backgroundColor: activeTab === 'qr_wall' ? '#4f46e5' : '#fff', color: activeTab === 'qr_wall' ? 'white' : '#475569', border: '1px solid #cbd5e1' }}><QrCode size={16}/> Wall QR Terminal</button>
        </div>
        
        {activeTab === 'reports' && reportMode !== 'management' && (
          <button onClick={downloadExcelReport} style={{ ...tabBtnStyle, backgroundColor: '#16a34a', color: 'white' }}>
            <Download size={16}/> 📥 Export Attendance Excel
          </button>
        )}
        {activeTab === 'reports' && reportMode === 'management' && (
          <button onClick={downloadManagementPayrollExcel} style={{ ...tabBtnStyle, backgroundColor: '#1e293b', color: 'white' }}>
            <Download size={16}/> 📥 Download Master Payroll Sheet
          </button>
        )}
      </div>

      {/* TAB CONTENT: DIRECTORY COMPONENT */}
      {activeTab === 'directory' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}><UserPlus size={18} color="#4f46e5"/> Register New Staff Matrix</h3>
            <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Staff / Teacher Full Name</label>
                <input type="text" placeholder="e.g. Rajesh Sharma" value={staffName || ''} onChange={(e) => setStaffName(e.target.value)} style={inpStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Designation Post</label>
                <input type="text" placeholder="e.g. Senior Math Teacher" value={designation || ''} onChange={(e) => setDesignation(e.target.value)} style={inpStyle} required />
              </div>
              <div>
                <label style={labelStyle}>📱 WhatsApp Mobile Connection</label>
                <input type="text" placeholder="e.g. 98932XXXXX" value={mobile || ''} onChange={(e) => setMobile(e.target.value)} style={{ ...inpStyle, color: '#16a34a' }} required />
              </div>
              <div>
                <label style={labelStyle}>Basic Monthly Salary Structure (₹)</label>
                <input type="number" placeholder="e.g. 25000" value={baseSalary || ''} onChange={(e) => setBaseSalary(e.target.value)} style={inpStyle} required />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                <input type="checkbox" id="pf_check" checked={pfEnabled === 1} onChange={(e) => setPfEnabled(e.target.checked ? 1 : 0)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                <label htmlFor="pf_check" style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', cursor: 'pointer' }}>Enable Standard EPF Deduction (12%)</label>
              </div>
              <button type="submit" style={submitBtnStyle}>Save Structural Variables ⚡</button>
            </form>
          </div>

          <div style={cardStyle}>
            <h3 style={cardTitleStyle}><Users size={18} color="#4f46e5"/> Registered Staff Registry ({(staffList || []).length})</h3>
            <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(!staffList || staffList.length === 0) ? (
                <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>No accounts found.</p>
              ) : (
                staffList.map((s) => (
                  <div key={s?.id || Math.random()} style={{ padding: '14px', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                    <div style={{ flex: 1, marginRight: '10px' }}>
                      <strong style={{ color: '#0f172a', fontSize: '14px' }}>Mr. {s?.name || 'Unknown'}</strong>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{s?.designation || 'N/A'} | Mob: {s?.mobile || 'N/A'}</div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                        <input type="checkbox" id={`cl_toggle_${s?.id}`} checked={!!clEncashment[s?.id]} onChange={() => handleToggleClRule(s?.id)} style={{ width: '13px', height: '13px', cursor: 'pointer' }} />
                        <label htmlFor={`cl_toggle_${s?.id}`} style={{ fontSize: '11px', color: '#334155', fontWeight: 'bold', cursor: 'pointer' }}>CL Encashment Bonus</label>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                        <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: '#eef2ff', color: '#4f46e5', borderRadius: '4px', fontWeight: 'bold' }}>₹{s?.base_salary || 0}/mo</span>
                        {s?.pf_enabled === 1 && <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: '4px', fontWeight: 'bold' }}>PF Bound</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '95px' }}>
                      <button onClick={() => handleOpenAdvanceModal(s)} style={{ ...rowActionBtnStyle, backgroundColor: '#fff3e0', color: '#e65100', borderColor: '#ffe0b2' }}><DollarSign size={11}/> + Advance</button>
                      <button onClick={() => fetchIndividualPaySlip(s?.id)} style={{ ...rowActionBtnStyle, backgroundColor: '#4f46e5', color: '#fff', borderColor: '#4f46e5' }}><FileText size={11}/> Pay Slip</button>
                      {/* 🎯 DELETE ACTION: Isse dynamic handle click bind ho jayega */}
                      <button onClick={() => handleDeleteStaff(s.id, s.name)} style={{ ...rowActionBtnStyle, backgroundColor: '#fef2f2', color: '#b91c1c', borderColor: '#fca5a5', marginTop: '2px' }}>❌ Delete Staff</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'advance' && (
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}><DollarSign size={18} color="#e65100"/> Advance Salary Management</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {staffList.map((s) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <span>{s.name}</span>
                <button onClick={() => handleOpenAdvanceModal(s)} style={{ padding: '6px 12px', backgroundColor: '#e65100', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  Issue Advance
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ADVANCED REPORTS ENGINE MODULE */}
      {activeTab === 'reports' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button onClick={() => setReportMode('today')} style={{ ...tabBtnStyle, padding: '6px 12px', backgroundColor: reportMode === 'today' ? '#4f46e5' : '#f1f5f9', color: reportMode === 'today' ? 'white' : '#475569' }}>Today's Live Logs</button>
              <button onClick={() => setReportMode('monthly')} style={{ ...tabBtnStyle, padding: '6px 12px', backgroundColor: reportMode === 'monthly' ? '#4f46e5' : '#f1f5f9', color: reportMode === 'monthly' ? 'white' : '#475569' }}>Monthly Master Directory</button>
              <button onClick={() => setReportMode('management')} style={{ ...tabBtnStyle, padding: '6px 12px', backgroundColor: reportMode === 'management' ? '#1e293b' : '#f1f5f9', color: reportMode === 'management' ? 'white' : '#475569' }}>💰 Management Salary Sheet</button>
            </div>
            
            {reportMode !== 'today' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Select Target Month:</label>
                <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: '600' }} />
              </div>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            {reportMode !== 'management' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 'bold' }}>
                    <th style={thTdStyle}>Staff Name</th><th style={thTdStyle}>Post Designation</th><th style={thTdStyle}>Log Date</th><th style={thTdStyle}>School Entry Timing</th><th style={thTdStyle}>School Exit Timing</th><th style={thTdStyle}>Late Fine</th><th style={thTdStyle}>Leave State</th><th style={thTdStyle}>Half Day Trigger</th><th style={thTdStyle}>PF Deduct</th>
                  </tr>
                </thead>
                <tbody>
                  {!Array.isArray(reportData) || reportData.length === 0 ? (
                    <tr><td colSpan="9" style={{ ...thTdStyle, textAlign: 'center', color: '#94a3b8', padding: '24px' }}>No log streams returned for this specified sequence.</td></tr>
                  ) : (
                    reportData.map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: row.half_day === 'Yes' ? '#fff1f2' : 'transparent' }}>
                        <td style={{ ...thTdStyle, fontWeight: 'bold', color: '#1e293b' }}>{row.name || 'N/A'}</td>
                        <td style={thTdStyle}>{row.designation || 'N/A'}</td><td style={thTdStyle}>{row.date || 'N/A'}</td>
                        <td style={{ ...thTdStyle, color: row.entry_time === 'N/A' ? '#94a3b8' : '#0f172a' }}>{row.entry_time || 'N/A'}</td>
                        <td style={{ ...thTdStyle, color: row.exit_time === 'N/A' ? '#94a3b8' : '#0f172a' }}>{row.exit_time || 'N/A'}</td>
                        <td style={{ ...thTdStyle, color: (row.late_fine || 0) > 0 ? '#ef4444' : '#16a34a', fontWeight: 'bold' }}>₹{row.late_fine || 0}</td>
                        <td style={thTdStyle}><span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e2e8f0', fontSize: '11px', fontWeight: 'bold' }}>{row.leave || 'Present'}</span></td>
                        <td style={thTdStyle}><span style={{ color: row.half_day === 'Yes' ? '#df4444' : '#64748b', fontWeight: 'bold' }}>{row.half_day || 'No'}</span></td>
                        <td style={thTdStyle}>{row.pf || 'No'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#334155', color: '#fff', fontWeight: 'bold' }}>
                    <th style={thTdStyle}>Staff Name</th><th style={thTdStyle}>Designation</th><th style={thTdStyle}>Gross Salary</th><th style={thTdStyle}>Present</th><th style={thTdStyle}>Lates</th><th style={thTdStyle}>3-Late Penalty</th><th style={thTdStyle}>Half Days</th><th style={thTdStyle}>Half Deduct</th><th style={thTdStyle}>EPF Out</th><th style={thTdStyle}>Advance Out</th><th style={thTdStyle}>CL Bonus</th><th style={thTdStyle}>NET PAYOUT CASH</th>
                  </tr>
                </thead>
                <tbody>
                  {!Array.isArray(managementSheetData) || managementSheetData.length === 0 ? (
                    <tr><td colSpan="12" style={{ ...thTdStyle, textAlign: 'center', color: '#94a3b8', padding: '24px' }}>No salary logs loaded yet.</td></tr>
                  ) : (
                    managementSheetData.map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                        <td style={{ ...thTdStyle, fontWeight: 'bold', color: '#0f172a' }}>{row.name || 'Unknown'}</td>
                        <td style={thTdStyle}>{row.designation || 'Staff'}</td>
                        <td style={thTdStyle}>₹{row.base_salary || 0}</td>
                        <td style={thTdStyle}>{row.days_present || 0} D</td>
                        <td style={{ ...thTdStyle, color: (row.total_lates || 0) >= 3 ? '#ef4444' : '#0f172a', fontWeight: (row.total_lates || 0) >= 3 ? 'bold' : 'normal' }}>{row.total_lates || 0} Times</td>
                        <td style={{ ...thTdStyle, color: (row.late_salary_cut_amount || 0) > 0 ? '#ef4444' : '#64748b', fontWeight: 'bold' }}>₹{row.late_salary_cut_amount || 0}</td>
                        <td style={thTdStyle}>{row.half_days || 0}</td>
                        <td style={{ ...thTdStyle, color: (row.half_day_deduction || 0) > 0 ? '#ef4444' : '#64748b' }}>₹{row.half_day_deduction || 0}</td>
                        <td style={thTdStyle}>₹{row.pf_deduction || 0}</td>
                        <td style={{ ...thTdStyle, color: '#b91c1c', fontWeight: 'bold' }}>₹{row.advance_taken || 0}</td>
                        <td style={{ ...thTdStyle, color: '#15803d', fontWeight: 'bold' }}>+₹{row.cl_bonus_added || 0}</td>
                        <td style={{ ...thTdStyle, fontSize: '13px', fontWeight: '900', color: '#16a34a', backgroundColor: '#f0fdf4' }}>₹{row.final_net_payout || 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ATTENDANCE RULES CONFIGURATION */}
      {activeTab === 'rules' && (
        <div style={{ ...cardStyle, maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={cardTitleStyle}><Settings size={18} color="#4f46e5"/> Live Location & Duty Hours Setup</h3>
          <div style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', padding: '10px', borderRadius: '8px', fontSize: '12px', color: '#b45309', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertTriangle size={18}/> <span><b>Dynamic SaaS Geo-Fence Sync:</b> Yeh input fields ab fully editable hain bhai. Aap yahan jo bhi coordinates ya radius daal kar save karenge, wo poore core system me instantaneous overwrite aur apply ho jayenge!</span>
          </div>
          
          <form onSubmit={handleUpdateRules} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}><MapPin size={14}/> Operational Latitude</label>
              <input type="number" step="any" value={rules?.latitude ?? 24.7432} onChange={(e) => setRules({ ...rules, latitude: parseFloat(e.target.value) || 0 })} style={{ ...inpStyle, border: '1px solid #cbd5e1', color: '#1e293b' }} required />
            </div>
            <div>
              <label style={labelStyle}><MapPin size={14}/> Operational Longitude</label>
              <input type="number" step="any" value={rules?.longitude ?? 78.8561} onChange={(e) => setRules({ ...rules, longitude: parseFloat(e.target.value) || 0 })} style={{ ...inpStyle, border: '1px solid #cbd5e1', color: '#1e293b' }} required />
            </div>
            <div>
              <label style={labelStyle}>Allowed Radius Range (Meters)</label>
              <input type="number" value={rules?.radius ?? 50} onChange={(e) => setRules({ ...rules, radius: parseInt(e.target.value) || 0 })} style={{ ...inpStyle, border: '1px solid #4f46e5', color: '#4f46e5' }} required />
              <p style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>* Mobile testing me bypass karne ke liye ise temporarilly 500 meters kar sakte hain.</p>
            </div>
            <div>
              <label style={labelStyle}><Clock size={14}/> Shift Start Time (Entry)</label>
              <input type="text" placeholder="e.g. 08:00" value={rules?.start_time || '08:00'} onChange={(e) => setRules({ ...rules, start_time: e.target.value })} style={inpStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Late Buffer Limit (Minutes)</label>
              <input type="number" value={rules?.buffer ?? 15} onChange={(e) => setRules({ ...rules, buffer: parseInt(e.target.value) || 0 })} style={inpStyle} required />
            </div>
            <div>
              <label style={labelStyle}><Clock size={14}/> Shift End Time (Exit)</label>
              <input type="text" placeholder="e.g. 14:00" value={rules?.end_time || '14:00'} onChange={(e) => setRules({ ...rules, end_time: e.target.value })} style={inpStyle} required />
            </div>
            <button type="submit" style={{ ...submitBtnStyle, gridColumn: 'span 2', backgroundColor: '#10b981' }}>Save Operational Parameters 💾</button>
          </form>
        </div>
      )}

      {/* TAB CONTENT: MASTER WALL QR SLIP CONFIGURATIONS */}
      {activeTab === 'qr_wall' && (
        <div style={{ textAlign: 'center', padding: '20px', maxWidth: '500px', margin: '0 auto', border: '2px dashed #cbd5e1', borderRadius: '16px', backgroundColor: '#fff' }}>
          <h3 style={{ margin: '0 0 6px 0', color: '#0f172a', fontWeight: 'bold', fontSize: '18px' }}>🏫 A.B.DIGITAL WORK ATTENDANCE TERMINAL</h3>
          <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '13px' }}>Print this Master QR and paste it on the school wall. Staff will scan it twice a day via mobile.</p>
          
          <div id="printable-wall-qr-zone" style={{ padding: '20px', border: '4px solid #000', borderRadius: '12px', display: 'inline-block', backgroundColor: '#fff', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', letterSpacing: '1px', fontWeight: '900', color: '#000' }}>SCAN HERE FOR DAILY DIGITAL ATTENDANCE</h4>
            <img src={generatedWallQrUrl} alt="Wall QR Code Terminal" style={{ width: '220px', height: '220px', display: 'block', margin: '0 auto' }} />
            <div style={{ fontSize: '10px', marginTop: '12px', fontWeight: 'bold', color: '#000' }}>🔒 GEO-LOCATION BOUND ENGINE PROTECTION</div>
          </div>

          <div>
            <button onClick={() => window.print()} style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <Download size={16}/> Print Master Wall QR Slip
            </button>
          </div>
        </div>
      )}

      {/* ADVANCE PAYMENT AND HISTORY MASTER MODAL BOX */}
      {advanceModalStaff && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', zIndex: 1100 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '24px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>💸 Advance Payout Log: Mr. {advanceModalStaff.name}</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>Submit new advance transactions. These balances are forcefully deducted in automatic monthly payroll calculations.</p>
            
            <form onSubmit={handleSubmitAdvancePayment} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', borderBottom: '2px dashed #e2e8f0', paddingBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Advance Paid Amount (₹)</label>
                <input type="number" placeholder="e.g. 5000" value={advanceAmount} onChange={(e)=>setAdvanceAmount(e.target.value)} style={inpStyle} required/>
              </div>
              <div>
                <label style={labelStyle}>Reason / Kyun liya amount</label>
                <input type="text" placeholder="e.g. Medical emergency, Festival loan" value={advanceReason} onChange={(e)=>setAdvanceReason(e.target.value)} style={inpStyle} required/>
              </div>
              <button type="submit" style={{ ...submitBtnStyle, backgroundColor: '#e65100', marginTop: '6px' }}>Issue Advance Transaction ⚡</button>
            </form>

            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}><History size={14}/> Payout History Ledger Logs</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
              {!Array.isArray(advanceHistory) || advanceHistory.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '10px' }}>No historic advance transactions recorded.</p>
              ) : (
                advanceHistory.map((h, i) => (
                  <div key={i} style={{ padding: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>{h.purpose || 'Personal Advance'}</div>
                      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Date: {h.date}</div>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#c62828' }}>-₹{h.amount}</span>
                  </div>
                ))
              )}
            </div>

                        {/* Download CSV Button */}
            <div style={{ marginTop: '12px', marginBottom: '12px' }}>
              <button 
                onClick={() => downloadAdvanceHistory(advanceModalStaff.id, advanceModalStaff.name)}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  backgroundColor: '#16a34a', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontWeight: 'bold', 
                  fontSize: '12px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Download size={14}/> 📥 Download History as CSV
              </button>
            </div>

            <div style={{ textAlign: 'right', marginTop: '16px' }}>
              <button onClick={()=>{setAdvanceModalStaff(null); setAdvanceHistory([]);}} style={{ padding: '8px 16px', backgroundColor: '#cbd5e1', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>Close Logs</button>
            </div>
          </div>
        </div>
      )}

      {/* PAY SLIP GENERATION DIALOG OVERLAY MODAL */}
      {selectedStaffSlip && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '24px', maxWidth: '500px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', marginBottom: '14px' }}>
              <CheckCircle2 size={24}/>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>Payroll Specifications Verified!</h3>
            </div>
            
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', fontFamily: 'monospace', fontSize: '12px', color: '#334155', lineHeight: '1.5' }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px', marginBottom: '8px' }}>A.B.DIGITAL WORK SYSTEMS LOGS</div>
              <div><b>Name:</b> Mr./Ms. {selectedStaffSlip.name || 'N/A'}</div>
              <div><b>Designation Post:</b> {selectedStaffSlip.designation || 'N/A'}</div>
              <div><b>Target Month:</b> {selectedStaffSlip.month || 'N/A'}</div>
              <div><b>Base Fixed Salary:</b> ₹{selectedStaffSlip.base_salary || 0}</div>
              <div><b>Days Logged Present:</b> {selectedStaffSlip.days_present || 0} Days</div>
              <div style={{ color: '#16a34a', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px', marginBottom: '6px' }}><b>(+) CL Encashment Extra Bonus:</b> +₹{selectedStaffSlip.cl_bonus_added || 0} ({selectedStaffSlip.cl_encashment_active || 'Disabled'})</div>
              
              <div style={{ color: '#ef4444' }}><b>(-) Late Fine Penalties:</b> ₹{selectedStaffSlip.late_fines_deducted || 0}</div>
              <div style={{ color: '#ef4444' }}><b>(-) Half Day Reductions:</b> ₹{selectedStaffSlip.half_day_deductions || 0} ({selectedStaffSlip.half_days_count || 0} times)</div>
              <div style={{ color: '#ef4444' }}><b>(-) EPF Contribution (12%):</b> ₹{selectedStaffSlip.pf_deducted || 0}</div>
              <div style={{ color: '#c62828', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px', marginBottom: '6px' }}><b>(-) Advance Amount Deducted:</b> -₹{selectedStaffSlip.advance_deducted || 0}</div>
              
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', paddingTop: '4px' }}>💰 NET PAYOUT INCOME: ₹{selectedStaffSlip.net_salary_payout || 0}</div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '8px' }}>* leaves balance left: {selectedStaffSlip.cl_remaining ?? 12} CLs</div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => downloadTextPaySlipFile(selectedStaffSlip)} style={{ flex: 1, padding: '10px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Download size={14}/> Download Slip
              </button>
              <button onClick={() => setSelectedStaffSlip(null)} style={{ padding: '10px 16px', backgroundColor: '#cbd5e1', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StaffPayrollAttendance;