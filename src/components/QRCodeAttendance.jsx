import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, XCircle, ShieldCheck, RefreshCw } from 'lucide-react';

const QRCodeAttendance = () => {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [locError, setLocError] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // 1. Safe useEffect without top-level await violation
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const res = await fetch('https://abd-school-backend.onrender.com/api/staff');
        const data = await res.json();
        if (Array.isArray(data)) setStaffList(data);
      } catch (err) {
        console.error("Error fetching staff list:", err);
      }
    };

    loadStaff();
    requestGpsLocation();
  }, []);

  const requestGpsLocation = () => {
  setLoading(true);
  if (!navigator.geolocation) {
    setLocError("🚨 Aapka browser GPS Location support nahi karta.");
    setLocation({ lat: 0.0, lng: 0.0 });
    setLoading(false);
    return;
  }

  // 🎯 FIRST READING LO
  navigator.geolocation.getCurrentPosition(
    (position1) => {
      const accuracy1 = position1.coords.accuracy;
      const lat1 = position1.coords.latitude;
      const lng1 = position1.coords.longitude;
      
      // 🎯 2 SECOND BAAD SECOND READING LO
      setTimeout(() => {
        navigator.geolocation.getCurrentPosition(
          (position2) => {
            const accuracy2 = position2.coords.accuracy;
            const lat2 = position2.coords.latitude;
            const lng2 = position2.coords.longitude;
            
            // 🛡️ FAKE GPS DETECTION
            const diff = Math.abs(lat1 - lat2) + Math.abs(lng1 - lng2);
            
            // Agar accuracy perfect hai (< 5) YA dono readings same hain -> FAKE GPS
            if ((accuracy1 < 5 || accuracy2 < 5) || diff < 0.000001) {
              setLocError("🚨 Fake GPS Detected! Aap real location se attendance nahi laga sakte.");
              setLocation({ lat: 0.0, lng: 0.0 });
              setLoading(false);
              return;
            }
            
            // ✅ REAL GPS - Second reading use karo
            setLocation({
              lat: lat2,
              lng: lng2
            });
            setLocError(null);
            setLoading(false);
          },
          (err) => {
            // 🎯 SECOND READING FAIL - First reading use karo
            console.warn("Second GPS reading failed, using first:", err);
            setLocation({
              lat: lat1,
              lng: lng1
            });
            setLocError(null);
            setLoading(false);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }, 2000); // 2 second delay
    },
    (err) => {
      console.error("GPS Error handled safely:", err);
      setLocation({ lat: 0.0, lng: 0.0 });
      setLocError("❌ GPS Access Denied! Kripya permission allow karein.");
      setLoading(false);
    },
    { enableHighAccuracy: true, timeout: 15000 }
  );
};

  // 🎯 STRICTLY ASYNC BINDING: Ab compiler line 33 par kabhi error nahi dega!
  const handleMarkAttendance = async () => {
    if (!selectedStaffId) {
      alert("Please select your name first!");
      return;
    }
    if (!location.lat || !location.lng) {
      alert("GPS coordinates missing! Kripya location reload karein.");
      return;
    }

    setLoading(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const res = await fetch('https://abd-school-backend.onrender.com/api/staff/mark-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: parseInt(selectedStaffId),
          latitude: location.lat,
          longitude: location.lng
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setStatusMsg({ type: 'success', text: data.message });
        setSelectedStaffId('');
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Attendance mark karne me galti hui!' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Backend network connection offline!' });
    } finally {
      setLoading(false);
    }
  };

  // Niche ka return statement jaisa hai waisa hi chalne dein...

  return (
    <div style={{ maxWidth: '450px', margin: '30px auto', padding: '20px', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        
        <div style={{ display: 'inline-flex', padding: '12px', backgroundColor: '#eef2ff', borderRadius: '50%', color: '#4f46e5', marginBottom: '14px' }}>
          <ShieldCheck size={32} />
        </div>
        
        <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>A.B.DIGITAL WORK</h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>GPS Verified Attendance Terminal</p>

        {/* LIVE LOCATION STATUS BAR */}
        <div style={{ backgroundColor: location.lat ? '#f0fdf4' : '#fef2f2', border: `1px solid ${location.lat ? '#bbf7d0' : '#fca5a5'}`, padding: '12px', borderRadius: '10px', fontSize: '13px', marginBottom: '20px', color: location.lat ? '#16a34a' : '#991b1b', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
              <MapPin size={16}/> {location.lat ? "GPS Satellite Connected" : "GPS Signal Missing"}
            </span>
            <button onClick={requestGpsLocation} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }} title="Reload Location">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          {location.lat ? (
            <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold', marginTop: '4px' }}>✓ Secure Geo-Location Bound Connected</div>
          ) : (
            <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>{locError || "Fetching device live telemetry..."}</div>
          )}
        </div>

        {/* ATTENDANCE MAIN ACTION FORM */}
        <div style={{ textAlign: 'left', marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Select Your Profile Name (अपना नाम चुनें)</label>
          <select 
            value={selectedStaffId} 
            onChange={(e) => setSelectedStaffId(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', fontWeight: '600', backgroundColor: '#fff' }}
          >
            <option value="">-- Choose Name --</option>
            {staffList.map(s => (
              <option key={s.id} value={s.id}>Mr. {s.name} ({s.designation})</option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleMarkAttendance}
          disabled={loading || !location.lat}
          style={{ width: '100%', padding: '14px', backgroundColor: (!location.lat) ? '#94a3b8' : '#4f46e5', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: (!location.lat) ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px rgba(79, 70, 229, 0.15)', transition: 'background 0.2s' }}
        >
          {loading ? "Verifying Matrix Range..." : "🎯 Punch Attendance (IN / OUT)"}
        </button>

        {/* FEEDBACK BANNER ALERTS (Yahan aayega success ya scope error box) */}
        {statusMsg.text && (
          <div style={{ marginTop: '20px', padding: '14px', borderRadius: '10px', border: '1px dashed', textAlign: 'left', display: 'flex', gap: '8px', alignItems: 'flex-start', backgroundColor: statusMsg.type === 'success' ? '#f0fdf4' : '#fef2f2', color: statusMsg.type === 'success' ? '#16a34a' : '#ef4444', borderColor: statusMsg.type === 'success' ? '#10b981' : '#f87171' }}>
            {statusMsg.type === 'success' ? <CheckCircle size={20} style={{ flexShrink: 0 }} /> : <XCircle size={20} style={{ flexShrink: 0 }} />}
            <span style={{ fontSize: '13px', fontWeight: 'bold', lineHeight: '1.4' }}>{statusMsg.text}</span>
          </div>
        )}

      </div>
    </div>
  );
};

export default QRCodeAttendance;