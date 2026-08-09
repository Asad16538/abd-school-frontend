// src/components/QuickFeePanel.jsx
import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, PlusCircle, Users, Coins } from 'lucide-react';

const QuickFeePanel = () => {
  const [feeRecords, setFeeRecords] = useState([]);
  const [stats, setStats] = useState({ total_students: 0, total_fee: 0 });
  
  const [form, setForm] = useState({
    student_name: '',
    father_name: '',
    class: '',
    section: 'A',
    fee_cycle: 'Monthly',
    original_fee: '',
    payable_fee: '',
    vehicle_fee: ''
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchQuickFeeData();
  }, []);

  const fetchQuickFeeData = async () => {
    try {
      const res = await fetch('https://erp-api.aapschool.in/api/quick-fee/list');
      const data = await res.json();
      if (data.success) {
        setFeeRecords(data.records);
        setStats({ total_students: data.total_students, total_fee: data.total_fee });
      }
    } catch (err) {
      console.error("Error loading quick fee records", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('https://erp-api.aapschool.in/api/quick-fee/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setForm({
          student_name: '', father_name: '', class: '', section: 'A',
          fee_cycle: 'Monthly', original_fee: '', payable_fee: '', vehicle_fee: ''
        });
        fetchQuickFeeData();
      } else {
        setErrorMsg(data.error || "Saving failed.");
      }
    } catch (err) {
      setErrorMsg("Network error while saving fee record.");
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px', backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '22px' }}>⚡ Independent Quick Fee Panel</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>Bina student registration ke direct fee chadhayein aur metrics update karein</p>
        </div>

        {/* Live Summary Cards for this Section */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ backgroundColor: '#eef2ff', padding: '10px 16px', borderRadius: '8px', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users color="#4f46e5" size={20} />
            <div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#6366f1', textTransform: 'uppercase' }}>Kul Chhatr (Total Students)</div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#312e81' }}>{stats.total_students}</div>
            </div>
          </div>

          <div style={{ backgroundColor: '#ecfdf5', padding: '10px 16px', borderRadius: '8px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Coins color="#059669" size={20} />
            <div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#059669', textTransform: 'uppercase' }}>Kul Fee (Total Target)</div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#065f46' }}>₹{stats.total_fee}</div>
            </div>
          </div>
        </div>
      </div>

      {successMsg && <div style={{ padding: '12px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px dashed #10b981', borderRadius: '8px', marginBottom: '16px', fontWeight: 'bold' }}>{successMsg}</div>}
      {errorMsg && <div style={{ padding: '12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px dashed #ef4444', borderRadius: '8px', marginBottom: '16px', fontWeight: 'bold' }}>{errorMsg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
        {/* Entry Form */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>📝 New Fee Entry Form</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Student's Name *</label>
              <input type="text" required placeholder="Enter student name" value={form.student_name} onChange={(e) => setForm({...form, student_name: e.target.value})} style={inpStyle} />
            </div>

            <div>
              <label style={labelStyle}>Father's Name</label>
              <input type="text" placeholder="Enter father name" value={form.father_name} onChange={(e) => setForm({...form, father_name: e.target.value})} style={inpStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Class *</label>
                <input type="text" required placeholder="e.g. 10" value={form.class} onChange={(e) => setForm({...form, class: e.target.value})} style={inpStyle} />
              </div>
              <div>
                <label style={labelStyle}>Section *</label>
                <select value={form.section} onChange={(e) => setForm({...form, section: e.target.value})} style={inpStyle}>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Fee Cycle</label>
              <select value={form.fee_cycle} onChange={(e) => setForm({...form, fee_cycle: e.target.value})} style={inpStyle}>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Annual">Annual</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Original Fee (₹)</label>
                <input type="number" placeholder="0" value={form.original_fee} onChange={(e) => setForm({...form, original_fee: e.target.value})} style={inpStyle} />
              </div>
              <div>
                <label style={labelStyle}>Payable Fee (₹) *</label>
                <input type="number" required placeholder="0" value={form.payable_fee} onChange={(e) => setForm({...form, payable_fee: e.target.value})} style={inpStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Vehicle Fee (₹)</label>
              <input type="number" placeholder="0" value={form.vehicle_fee} onChange={(e) => setForm({...form, vehicle_fee: e.target.value})} style={inpStyle} />
            </div>

            <button type="submit" style={{ padding: '12px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
              💾 Save Fee Record
            </button>
          </form>
        </div>

        {/* Records Table */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', maxHeight: '650px', overflowY: 'auto' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>📊 Entered Fee Records List ({feeRecords.length})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                <th style={{ padding: '10px' }}>Student Name</th>
                <th style={{ padding: '10px' }}>Class/Sec</th>
                <th style={{ padding: '10px' }}>Cycle</th>
                <th style={{ padding: '10px' }}>Payable</th>
                <th style={{ padding: '10px' }}>Vehicle</th>
              </tr>
            </thead>
            <tbody>
              {feeRecords.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No fee records added yet.</td></tr>
              ) : (
                feeRecords.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{r.student_name}<div style={{ fontSize: '10px', color: '#64748b' }}>F: {r.father_name || 'N/A'}</div></td>
                    <td style={{ padding: '10px' }}>{r.class} - {r.section}</td>
                    <td style={{ padding: '10px' }}>{r.fee_cycle}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#16a34a' }}>₹{r.payable_fee}</td>
                    <td style={{ padding: '10px' }}>₹{r.vehicle_fee}</td>
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

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' };
const inpStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none', fontSize: '14px' };

export default QuickFeePanel;
