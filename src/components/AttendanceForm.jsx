// src/components/AttendanceForm.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, MapPin, Loader, Smartphone, Send } from 'lucide-react';

const AttendanceForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    employee_id: '',
    subject: '',
    mobile: ''
  });
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [schoolData, setSchoolData] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  // Get URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const school = params.get('school');
    const lat = parseFloat(params.get('lat'));
    const lng = parseFloat(params.get('lng'));
    const radius = parseInt(params.get('radius'));
    const expiry = parseInt(params.get('expiry'));
    
    setSchoolData({ school, lat, lng, radius, expiry });
    
    // Check if QR expired
    if (expiry && expiry < new Date().getTime()) {
      setStatus({ success: false, message: "⚠️ QR Code expired! Please refresh the page." });
    }
  }, []);
  
  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          setLocationError("Please enable location services to mark attendance");
        }
      );
    } else {
      setLocationError("Geolocation is not supported");
    }
  }, []);
  
  // Calculate distance from school
  const calculateDistance = () => {
    if (!location || !schoolData) return null;
    
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371000;
    const φ1 = toRad(schoolData.lat);
    const φ2 = toRad(location.lat);
    const Δφ = toRad(location.lat - schoolData.lat);
    const Δλ = toRad(location.lng - schoolData.lng);
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };
  
  const isWithinRadius = () => {
    const distance = calculateDistance();
    return distance !== null && distance <= (schoolData?.radius || 100);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.employee_id) {
      setStatus({ success: false, message: "Please fill Name and Employee ID" });
      return;
    }
    
    if (!isWithinRadius()) {
      const distance = calculateDistance();
      setStatus({ success: false, message: `📍 You are ${distance}m away! Must be within ${schoolData?.radius}m of school.` });
      return;
    }
    
    setIsLoading(true);
    
    const attendanceData = {
      teacher_id: formData.employee_id,
      teacher_name: formData.name,
      teacher_subject: formData.subject,
      teacher_mobile: formData.mobile,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      latitude: location?.lat,
      longitude: location?.lng,
      distance: calculateDistance(),
      school_name: schoolData?.school,
      status: 'present'
    };
    
    try {
      const response = await fetch('https://abd-school-backend.onrender.com/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStatus({ success: true, message: `✅ Attendance marked successfully for ${formData.name}!` });
        setFormSubmitted(true);
        
        // Send WhatsApp if mobile provided
        if (formData.mobile) {
          sendWhatsApp(attendanceData);
        }
      } else {
        setStatus({ success: false, message: result.error || "Attendance failed!" });
      }
    } catch (err) {
      setStatus({ success: false, message: "Network error! Please try again." });
    } finally {
      setIsLoading(false);
    }
  };
  
  const sendWhatsApp = async (data) => {
    try {
      const message = `📋 *ATTENDANCE CONFIRMATION*\n\n` +
        `🏫 School: ${data.school_name}\n` +
        `👨‍🏫 Teacher: ${data.teacher_name}\n` +
        `🆔 Employee ID: ${data.teacher_id}\n` +
        `📅 Date: ${data.date}\n` +
        `⏰ Time: ${data.time}\n` +
        `📍 Distance: ${data.distance}m from school\n` +
        `✅ Status: PRESENT\n\n` +
        `_Powered by A.B.Digital Work_`;
      
      await fetch('https://abd-school-backend.onrender.com/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: data.teacher_mobile, message: message })
      });
    } catch (err) {
      console.error("WhatsApp error", err);
    }
  };
  
  const distance = calculateDistance();
  const withinRadius = isWithinRadius();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Smartphone className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Staff Attendance</h2>
          <p className="text-sm text-gray-500">{schoolData?.school || 'School'}</p>
        </div>
        
        {/* Location Status */}
        <div className={`p-3 rounded-xl mb-4 flex items-center gap-2 ${withinRadius ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
          <MapPin size={18} />
          <span className="text-sm">
            {location ? (
              withinRadius ? 
                `✅ Within school premises (${distance}m)` : 
                `❌ ${distance}m away! Must be within ${schoolData?.radius}m`
            ) : locationError ? locationError : "Getting location..."}
          </span>
        </div>
        
        {/* Form */}
        {!formSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Enter your full name"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Employee ID *</label>
              <input
                type="text"
                required
                value={formData.employee_id}
                onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Enter your employee ID"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Subject/Department</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g., Mathematics, Admin, etc."
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">WhatsApp Mobile (for confirmation)</label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g., 9876543210"
              />
            </div>
            
            {status && !status.success && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-start gap-2">
                <XCircle size={18} className="mt-0.5" />
                <span className="text-sm">{status.message}</span>
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading || !withinRadius || !location}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader className="animate-spin" size={18} /> : <Send size={18} />}
              {isLoading ? 'Processing...' : '📌 Mark Attendance'}
            </button>
          </form>
        ) : (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-green-700">Attendance Marked!</h3>
            <p className="text-gray-600 mt-2">{status?.message}</p>
            <button
              onClick={() => window.close()}
              className="mt-6 px-6 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700"
            >
              Close Window
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceForm;