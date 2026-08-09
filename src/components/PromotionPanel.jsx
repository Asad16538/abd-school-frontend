// src/components/PromotionPanel.jsx
import React, { useState } from 'react';
import { ArrowRightCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

const PromotionPanel = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePromoteSession = async () => {
    const confirmAction = window.confirm("⚠️ WARNING: Kya aap sach me agle session ke liye saare bacho ki class ko promote karna chahte hain?");
    if (!confirmAction) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('https://erp-api.aapschool.in/api/academic/promote-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message || "🎉 Saare students successfully next session mein promote ho gaye hain!");
      } else {
        setError(data.error || "Promotion process fail ho gaya.");
      }
    } catch (err) {
      setError("Server connection error! Kripya dobara koshish karein.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '600px' }}>
      <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ArrowRightCircle color="#4f46e5" size={22} /> Next Session Class Promotion Hub
      </h3>
      <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>
        Naye session ki shuruat par ek click karke poore school ke students ki class ko ek step aage (jaise Class 1 se Class 2) update kar sakte hain.
      </p>

      {message && (
        <div style={{ padding: '12px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px dashed #10b981', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px dashed #ef4444', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldAlert size={16} /> {error}
        </div>
      )}

      <button 
        onClick={handlePromoteSession} 
        disabled={loading}
        style={{ 
          padding: '12px 24px', 
          backgroundColor: loading ? '#94a3b8' : '#4f46e5', 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px', 
          fontWeight: 'bold', 
          fontSize: '14px', 
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
        }}
      >
        {loading ? "⏳ Promoting Classes..." : "🚀 Promote All Students to Next Session"}
      </button>
    </div>
  );
};

export default PromotionPanel;