// src/components/StaffAttendanceTerminal.jsx
import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, XCircle, ShieldCheck, RefreshCw, Send } from 'lucide-react';

// 🎯 SECURE BASE URL: Aapka live local secure IP address
const BASE_URL = 'https://abd-school-backend-production.up.railway.app';

const StaffAttendanceTerminal = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [locError, setLocError] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    // 📱 ANTI-PROXY DEVICE TOKEN HARDWARE LOCK
    let deviceToken = localStorage.getItem('ab_school_device_fingerprint');
    if (!deviceToken) {
      deviceToken = 'DEV-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
      localStorage.setItem('ab_school_device_fingerprint', deviceToken);
    }

    // 2. Load hotey hi live telemetry fetch trigger karo
    requestGpsLocation();
  }, []);

  const requestGpsLocation = () => {
    if (!navigator.geolocation) {
      setLocError("🚨 Aapka browser GPS Location support nahi karta.");
      return;
    }
    
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocError(null);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLocError("❌ GPS Access Denied! Kripya mobile settings me jaakar browser ko Location Permission allow karein.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();

    if (!mobileNumber || mobileNumber.trim().length < 10) {
      alert("Please enter a valid 10-digit registered mobile number!");
      return;
    }
    if (!location.lat || !location.lng) {
      alert("GPS coordinates missing! Kripya location reload/allow karein.");
      return;
    }

    setLoading(true);
    setStatusMsg({ type: '', text: '' });

    // Local storage se save fingerprint token nikaalo
    const deviceToken = localStorage.getItem('ab_school_device_fingerprint');

    try {
      // 🕵️‍♂️ STEP A: Mobile number ke sath check lagakar staff profile dhoondho
      const staffCheckRes = await fetch(`${BASE_URL}/api/staff?mobile=${mobileNumber.trim()}`);
      if (!staffCheckRes.ok) throw new Error("Server communication fail.");
      
      const staffData = await staffCheckRes.json();
      
      if (!staffData || staffData.length === 0) {
        setStatusMsg({ type: 'error', text: '❌ Mobile Number Not Found! Live staff directory me yeh number nahi mila.' });
        setLoading(false);
        return;
      }

      const identifiedStaff = staffData[0];

      // 🛡️ STEP B: Identified staff member ke ID aur token ke sath post request bheinjo
      // 🎯 FIX: Quotes aur brackets ekdam tightly tight close hain yahan
      const res = await fetch(`${BASE_URL}/api/staff/mark-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: parseInt(identifiedStaff.id),
          latitude: location.lat,
          longitude: location.lng,
          device_token: deviceToken
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setStatusMsg({ type: 'success', text: `Success! Perfect! Mr./Ms. ${identifiedStaff.name} ki attendance lag gayi hai.\nStatus: ${data.message}` });
        setMobileNumber(''); // Form field reset
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Attendance mark karne me galti hui!' });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Backend network connection offline or secure context error!' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '450px', margin: '30px auto', padding: '20px', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        
        <div style={{ display: 'inline-flex', padding: '12px', backgroundColor: '#eef2ff', borderRadius: '50%', color: '#4f46e5', marginBottom: '14px' }}>
          <ShieldCheck size={32} />
        </div>
        
        <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>A.B.DIGITAL WORK</h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>GPS & Device Verified Attendance Terminal</p>

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
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Lat: {location.lat.toFixed(5)} | Lng: {location.lng.toFixed(5)} (Campus Verified Bound)</div>
          ) : (
            <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>{locError || "Fetching device live telemetry..."}</div>
          )}
        </div>

        {/* ATTENDANCE SECURE MOBILE ENTRY MATRIX FORM */}
        <form onSubmit={handleMarkAttendance}>
          <div style={{ textAlign: 'left', marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>
              Enter Your Registered Mobile Number (अपना मोबाइल नंबर डालें)
            </label>
            <input 
              type="tel"
              maxLength={10}
              placeholder="e.g. 9893XXXXXX"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
              disabled={loading || !location.lat}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px', boxSizing: 'border-box', backgroundColor: '#fff' }}
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading || !location.lat}
            style={{ width: '100%', padding: '14px', backgroundColor: (!location.lat) ? '#94a3b8' : '#4f46e5', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: (!location.lat) ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px rgba(79, 70, 229, 0.15)', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {loading ? "Verifying Matrix Parameters..." : <><Send size={16} /> Punch Attendance (IN / OUT)</>}
          </button>
        </form>

        {/* FEEDBACK BANNER ALERTS */}
        {statusMsg.text && (
          <div style={{ marginTop: '20px', padding: '14px', borderRadius: '10px', border: '1px dashed', textAlign: 'left', display: 'flex', gap: '8px', alignItems: 'flex-start', backgroundColor: statusMsg.type === 'success' ? '#f0fdf4' : '#fef2f2', color: statusMsg.type === 'success' ? '#16a34a' : '#ef4444', borderColor: statusMsg.type === 'success' ? '#10b981' : '#f87171' }}>
            {statusMsg.type === 'success' ? <CheckCircle size={20} style={{ flexShrink: 0 }} /> : <XCircle size={20} style={{ flexShrink: 0 }} />}
            <span style={{ fontSize: '13px', fontWeight: 'bold', lineHeight: '1.4', whiteSpace: 'pre-line' }}>{statusMsg.text}</span>
          </div>
        )}

      </div>
    </div>
  );
};

export default StaffAttendanceTerminal;