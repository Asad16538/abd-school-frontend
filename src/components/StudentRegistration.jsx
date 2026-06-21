// src/components/StudentRegistration.jsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const StudentRegistration = () => {
  const [formData, setFormData] = useState({
    admission_no: '', roll_no: '', name: '', student_class: '', section: 'A', stream: '',
    dob: '', gender: 'Male', category: 'General', aadhaar_no: '', samagra_id: '',
    father_name: '', mother_name: '', whatsapp_no: '', address: '',
    fee_cycle: 'Monthly', cycle_fee_amount: '', school_fee_total: '', transport_fee_total: '',
    bank_name: '', account_no: '', ifsc_code: ''
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  // Excel Instructions
  const excelInstructions = `
📋 EXCEL COLUMN FORMAT:
1. Admission No (दाखिला संख्या - Unique)
2. Roll No (रोल नंबर)
3. Student Name (छात्र का नाम)
4. Class (कक्षा - e.g. 1, 2, 3, 11, 12)
5. Section (वर्ग - A, B, C)
6. Stream (संकाय - Science/Commerce/Arts - Only for 11 & 12)
7. DOB (जन्म तिथि - YYYY-MM-DD)
8. Gender (Male/Female)
9. Category (General/OBC/SC/ST)
10. Aadhaar_no (12 Digit)
11. Samagra ID (समग्र आईडी - 9 digit)
12. Father Name (पिता का नाम)
13. Mother Name (माता का नाम)
14. WhatsApp No (10 digit Mobile)
15. Address (पता)
16. Fee Cycle (Monthly/Quarterly/Annual)
17. Total Fee (कुल तय की गई साल की फीस)
18. Transport Fee (वार्षिक वाहन फीस)
19. Bank Name (बैंक का नाम)
20. Account No (बैंक खाता संख्या)
21. IFSC Code (आईएफएससी कोड)

💡 PHOTO UPLOAD NOTE:
Photos ab ID/Admit Card/Marksheet generate karte waqt upload ki jayengi.
Student registration ke time photo upload nahi karna hai.
  `;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /// Manual Form Submit Engine (WITH PHOTO)
const handleManualSubmit = async (e) => {
  e.preventDefault();
  
  // 🎯 FormData use karo (photo file bhejne ke liye)
  const formData = new FormData();
  formData.append('admission_no', formDataState.admission_no);
  formData.append('roll_no', formDataState.roll_no);
  formData.append('name', formDataState.name);
  formData.append('class', formDataState.student_class);
  formData.append('section', formDataState.section);
  formData.append('stream', (formDataState.student_class === '11' || formDataState.student_class === '12') ? (formDataState.stream || 'Science') : '');
  formData.append('dob', formDataState.dob);
  formData.append('gender', formDataState.gender);
  formData.append('category', formDataState.category);
  formData.append('aadhaar_no', formDataState.aadhaar_no);
  formData.append('samagra_id', formDataState.samagra_id);
  formData.append('father_name', formDataState.father_name);
  formData.append('mother_name', formDataState.mother_name);
  formData.append('whatsapp_no', formDataState.whatsapp_no);
  formData.append('address', formDataState.address);
  formData.append('fee_cycle', formDataState.fee_cycle);
  formData.append('cycle_fee_amount', formDataState.cycle_fee_amount || '0');
  formData.append('school_fee_total', formDataState.school_fee_total || '0');
  formData.append('transport_fee_total', formDataState.transport_fee_total || '0');
  formData.append('bank_name', formDataState.bank_name);
  formData.append('account_no', formDataState.account_no);
  formData.append('ifsc_code', formDataState.ifsc_code);
  
  // ✅ PHOTO APPEND KARO
  const photoInput = document.querySelector('input[name="student_photo"]');
  if (photoInput && photoInput.files && photoInput.files[0]) {
    formData.append('student_photo', photoInput.files[0]);
  }

  try {
    const response = await fetch('https://abd-school-backend.onrender.com/api/students/register-manual', {
      method: 'POST',
      body: formData  // ✅ Content-Type HEADER MAT DALO - Browser auto set karega
    });
    const data = await response.json();
    
    if (response.ok) {
      setMessage({ type: 'success', text: '🎉 Student Profile Successfully Registered!' });
      
      setFormData({
        admission_no: '', roll_no: '', name: '', student_class: '', section: 'A', stream: '',
        dob: '', gender: 'Male', category: 'General', aadhaar_no: '', samagra_id: '',
        father_name: '', mother_name: '', whatsapp_no: '', address: '',
        fee_cycle: 'Monthly', cycle_fee_amount: '', school_fee_total: '', transport_fee_total: '',
        bank_name: '', account_no: '', ifsc_code: ''
      });

      // ✅ Photo input reset karo
      if (photoInput) photoInput.value = '';

      setTimeout(() => {
        window.location.reload(); 
      }, 1500); 
    } else {
      setMessage({ type: 'error', text: data.error || 'Server mein dikkat hai' });
    }
  } catch (err) {
    setMessage({ type: 'error', text: 'Backend se connection fail!' });
  }
};

  // Excel File Import Handler
  const handleExcelImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        if (jsonData.length === 0) {
          setMessage({ type: 'error', text: 'Excel sheet khali hai!' });
          return;
        }

        const response = await fetch('https://abd-school-backend.onrender.com/api/students/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ students: jsonData })
        });
        const resData = await response.json();
        
        if (response.ok) {
          setMessage({ type: 'success', text: `🚀 Excel Import Successful: ${resData.message}` });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setMessage({ type: 'error', text: resData.error });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Excel read karne mein error aayi. Sahi format use karein!' });
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Top Header Row with Bulk Import */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b' }}>🎒 Student Registration Panel</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>Naye bacho ka dakhila karein ya ek sath Excel sheet upload karein</p>
        </div>

        <div style={{ position: 'relative', display: 'inline-block' }} className="excel-hover-container">
          <label style={{
            backgroundColor: '#10b981', color: 'white', padding: '10px 20px', borderRadius: '8px',
            fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
          }}>
            📥 Excel Se Bulk Import Karein
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleExcelImport} style={{ display: 'none' }} />
          </label>

          <div className="excel-tooltip" style={{
            display: 'none', position: 'absolute', right: '0', top: '45px', width: '340px',
            backgroundColor: '#1e293b', color: '#f8fafc', padding: '15px', borderRadius: '8px',
            fontSize: '12px', zIndex: '100', whiteSpace: 'pre-line', lineHeight: '1.6',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)', border: '1px solid #334155'
          }}>
            {excelInstructions}
          </div>
        </div>
      </div>

      {message.text && (
        <div style={{
          padding: '12px', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold',
          backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: message.type === 'success' ? '#065f46' : '#991b1b',
          border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Manual Registration Form */}
      <form onSubmit={handleManualSubmit} autoComplete="off" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        
        {/* Section 1: Academic Info */}
        <h3 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', color: '#0f172a' }}>1. Academic Details (स्कूल की जानकारी)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Admission No *</label>
            <input type="text" name="admission_no" autoComplete="off" required value={formData.admission_no} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Roll No</label>
            <input type="text" name="roll_no" autoComplete="off" value={formData.roll_no} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Class (कक्षा) *</label>
            <input 
              type="text" 
              name="student_class" 
              placeholder="e.g. 5, 11 ya 12" 
              required 
              value={formData.student_class} 
              onChange={(e) => {
                const val = e.target.value;
                const isHigherClass = val === '11' || val === '12';
                setFormData({ 
                  ...formData, 
                  student_class: val,
                  stream: isHigherClass ? (formData.stream || 'Science') : '' 
                });
              }} 
              style={inputStyle} 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Section *</label>
            <select name="section" value={formData.section} onChange={handleChange} style={inputStyle}>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>

          {(formData.student_class === '11' || formData.student_class === '12') && (
            <div className="stream-field-animation">
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '700', color: '#4f46e5' }}>Stream (संकाय) *</label>
              <select name="stream" required value={formData.stream || 'Science'} onChange={handleChange} style={{ ...inputStyle, backgroundColor: '#f5f3ff', border: '1px solid #c084fc', color: '#581c87', fontWeight: 'bold' }}>
                <option value="Science">🧪 Science (विज्ञान)</option>
                <option value="Commerce">💼 Commerce (वाणिज्य)</option>
                <option value="Arts">🎨 Arts (कला)</option>
              </select>
            </div>
          )}
        </div>

                {/* Section 5: Student Photo Upload */}
        <h3 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', color: '#0f172a' }}>
          📸 Student Photo Upload
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Upload Photo (JPG/PNG)
            </label>
            <input 
              type="file" 
              accept="image/*"
              name="student_photo"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    console.log("📸 Photo selected:", file.name);
                    // Photo preview ke liye state mein store karo (optional)
                  };
                  reader.readAsDataURL(file);
                }
              }}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                boxSizing: 'border-box',
                fontSize: '14px',
                backgroundColor: '#f8fafc'
              }}
            />
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              ⚠️ Photo <strong>Roll No</strong> ke naam se save hogi (e.g., 10.jpg)
            </p>
          </div>
        </div>

        {/* Section 2: Personal Profile (Without Photo) */}
        <h3 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', color: '#0f172a' }}>2. Student Profile (व्यक्तिगत विवरण)</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Student Full Name *</label>
            <input type="text" name="name" autoComplete="off" required value={formData.name} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Date of Birth *</label>
            <input type="text" name="dob" maxLength="10" placeholder="DD/MM/YYYY" value={formData.dob} onChange={(e) => {
                let val = e.target.value.replace(/\D/g, '');
                if (val.length > 2 && val.length <= 4) { val = val.slice(0, 2) + '/' + val.slice(2); }
                else if (val.length > 4) { val = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4, 8); }
                setFormData({ ...formData, dob: val });
              }} style={inputStyle} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange} style={inputStyle}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Category</label>
            <select name="category" value={formData.category} onChange={handleChange} style={inputStyle}>
              <option value="General">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Aadhaar Number</label>
            <input type="text" name="aadhaar_no" autoComplete="off" placeholder="12 Digits Aadhaar" value={formData.aadhaar_no} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Samagra ID (MP Special)</label>
            <input type="text" name="samagra_id" autoComplete="off" placeholder="9 Digits ID" value={formData.samagra_id} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        {/* Section 3: Parents & Contact */}
        <h3 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', color: '#0f172a' }}>3. Parents & WhatsApp Contact (अभिभावक विवरण)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Father's Name</label>
            <input type="text" name="father_name" autoComplete="off" value={formData.father_name} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Mother's Name</label>
            <input type="text" name="mother_name" autoComplete="off" value={formData.mother_name} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#16a34a' }}>📱 WhatsApp Number *</label>
            <input type="text" name="whatsapp_no" autoComplete="off" required placeholder="For Auto Alerts" value={formData.whatsapp_no} onChange={handleChange} style={{ ...inputStyle, borderColor: '#22c55e' }} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Permanent Address</label>
            <input type="text" name="address" autoComplete="off" value={formData.address} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        {/* Section 4: Fees & Bank Details */}
        <h3 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', color: '#0f172a' }}>4. Fees & Bank Account Details (फीस और बैंक खाता)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Fee Payment Cycle *</label>
            <select name="fee_cycle" value={formData.fee_cycle} onChange={handleChange} style={inputStyle}>
              <option value="Monthly">Monthly (मासिक फीस)</option>
              <option value="Quarterly">Quarterly (त्रैमासिक - 3 महीने)</option>
              <option value="Annual">Annual (वार्षिक फीस)</option>
            </select>
          </div>

                  

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Cycle Fee Amount *</label>
            <input type="number" name="cycle_fee_amount" autoComplete="off" required placeholder="e.g. 1500" value={formData.cycle_fee_amount || ''} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Total Applicable Fee *</label>
            <input type="number" name="school_fee_total" autoComplete="off" required placeholder="Custom total e.g. 18000" value={formData.school_fee_total} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Transport / Van Fee</label>
            <input type="number" name="transport_fee_total" autoComplete="off" placeholder="e.g. 5000" value={formData.transport_fee_total} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Bank Name</label>
            <input type="text" name="bank_name" autoComplete="off" value={formData.bank_name} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Account Number</label>
            <input type="text" name="account_no" autoComplete="off" value={formData.account_no} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>IFSC Code</label>
            <input type="text" name="ifsc_code" autoComplete="off" value={formData.ifsc_code} onChange={handleChange} style={inputStyle} />
          </div>
        </div>
        
        <button type="submit" style={{
          backgroundColor: '#2563eb', color: 'white', padding: '12px 30px', border: 'none',
          borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
          boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
        }}>
          💾 Save Student Profile
        </button>
      </form>

      <style>{`
        .excel-hover-container:hover .excel-tooltip { display: block !important; }
        .excel-hover-container:focus-within .excel-tooltip { display: block !important; }
        .stream-field-animation { animation: fadeInStream 0.3s ease-out forwards; }
        @keyframes fadeInStream { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

const inputStyle = {
  width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1',
  boxSizing: 'border-box', fontSize: '14px', outline: 'none'
};

export default StudentRegistration;
