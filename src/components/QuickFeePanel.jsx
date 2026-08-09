// src/components/QuickFeePanel.jsx
import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Search } from 'lucide-react';

const QuickFeePanel = () => {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [feeForm, setFeeForm] = useState({
    fee_type: 'Monthly',
    base_fee: '',
    final_payable_fee: '',
    vehicle_fee: '',
    total_fee: ''
  });
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch('https://erp-api.aapschool.in/api/students');
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error("Error fetching students", err);
    }
  };

  const handleSelectStudent = (s) => {
    setSelectedStudent(s);
    setFeeForm({
      fee_type: s.fee_cycle || 'Monthly',
      base_fee: s.cycle_fee_amount || '',
      final_payable_fee: s.school_fee_total || '',
      vehicle_fee: s.transport_fee_total || '',
      total_fee: (parseFloat(s.school_fee_total || 0) + parseFloat(s.transport_fee_total || 0))
    });
  };

  const handleFeeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const res = await fetch('https://erp-api.aapschool.in/api/quick-fee-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          fee_type: feeForm.fee_type,
          cycle_fee_amount: feeForm.base_fee,
          school_fee_total: feeForm.final_payable_fee,
          transport_fee_total: feeForm.vehicle_fee
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("🎉 Fee structure successfully updated for " + selectedStudent.name);
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchStudents();
      }
    } catch (err) {
      alert("Error updating fee structure.");
    }
  };

  const filtered = students.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.admission_no?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px', backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h2 style={{ margin: 0, color: '#0f172a', fontSize: '22px' }}>⚡ Quick Fee Allocation Panel</h2>
        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>Bina registration clash ke direct bacho ki fee structure set aur update karein</p>
      </div>

      {successMsg && (
        <div style={{ padding: '12px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px dashed #10b981', borderRadius: '8px', marginBottom: '16px', fontWeight: 'bold' }}>
          {successMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', maxHeight: '600px', overflowY: 'auto' }}>
          <input 
            type="text" 
            placeholder="Search student..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px', boxSizing: 'border-box' }} 
          />
          {filtered.map(s => (
            <div 
              key={s.id} 
              onClick={() => handleSelectStudent(s)}
              style={{ padding: '10px', borderRadius: '8px', cursor: 'pointer', backgroundColor: selectedStudent?.id === s.id ? '#eef2ff' : '#f8fafc', marginBottom: '8px', border: '1px solid #e2e8f0' }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{s.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Father: {s.father_name || 'N/A'} | Class: {s.class} - {s.section}</div>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {selectedStudent ? (
            <form onSubmit={handleFeeSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: 'span 2', backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '8px', fontSize: '14px' }}>
                👤 <strong>Student:</strong> {selectedStudent.name} &nbsp;|&nbsp; <strong>Father:</strong> {selectedStudent.father_name} &nbsp;|&nbsp; <strong>Class:</strong> {selectedStudent.class} - {selectedStudent.section}
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Fee Type / Cycle</label>
                <select value={feeForm.fee_type} onChange={(e) => setFeeForm({...feeForm, fee_type: e.target.value})} style={inpStyle}>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Base Cycle Fee (₹)</label>
                <input type="number" value={feeForm.base_fee} onChange={(e) => setFeeForm({...feeForm, base_fee: e.target.value})} style={inpStyle} />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Final Payable Yearly Fee (₹)</label>
                <input type="number" value={feeForm.final_payable_fee} onChange={(e) => setFeeForm({...feeForm, final_payable_fee: e.target.value})} style={inpStyle} />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Vehicle / Transport Fee (₹)</label>
                <input type="number" value={feeForm.vehicle_fee} onChange={(e) => setFeeForm({...feeForm, vehicle_fee: e.target.value})} style={inpStyle} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Total Combined Fee (Calculated)</label>
                <input type="text" readOnly value={`₹${(parseFloat(feeForm.final_payable_fee || 0) + parseFloat(feeForm.vehicle_fee || 0))}`} style={{ ...inpStyle, backgroundColor: '#f1f5f9', fontWeight: '900', color: '#4f46e5' }} />
              </div>

              <button type="submit" style={{ gridColumn: 'span 2', padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                💾 Save / Update Fee Structure
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px' }}>
              👈 Pehle left list se kisi student ko select karein.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const inpStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none', fontSize: '14px' };

export default QuickFeePanel;