// src/StaffApp.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QRScannerComponent from './components/QRScanner';
import { 
  Home, Bell, User, Calendar, Clock, Users, 
  LogOut, CheckCircle, XCircle, AlertTriangle,
  CreditCard, BookOpen, Settings, ChevronRight,
  UserPlus, FileText, TrendingUp, DollarSign, Camera, QrCode,
  Save, Search, ShieldAlert
} from 'lucide-react';

const BASE_URL = 'https://abd-school-backend.onrender.com';

const StaffApp = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [staffData, setStaffData] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [advanceHistory, setAdvanceHistory] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  
  // Class Attendance States
  const [classAttendanceStudents, setClassAttendanceStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState({ type: '', text: '' });
  const [dayStatus, setDayStatus] = useState('INIT');
  const [lockMessage, setLockMessage] = useState('');

  // Staff Attendance States
  const [attendance, setAttendance] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('staff_token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/staff/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setIsLoggedIn(true);
        setStaffData(res.data.staff);
        fetchNotifications(res.data.staff.id);
        fetchAssignedStudents(res.data.staff.id);
        fetchAdvanceHistory(res.data.staff.id);
        if (res.data.staff.assigned_class) {
          fetchClassAttendance(res.data.staff.assigned_class, res.data.staff.assigned_section || 'A');
        }
        fetchTodayAttendance();
        fetchAttendanceHistory();
      } else {
        localStorage.removeItem('staff_token');
      }
    } catch (err) {
      localStorage.removeItem('staff_token');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async (staffId) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/staff/notifications/${staffId}`);
      const notifs = res.data.notifications || [];
      setNotifications(notifs);
      const unread = notifs.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.log("Notification fetch error");
    }
  };

  const fetchAssignedStudents = async (staffId) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/staff/assigned-students/${staffId}`);
      if (res.data.success) {
        setAssignedStudents(res.data.students || []);
      }
    } catch (err) {
      console.log("Assigned students error");
    }
  };

  const fetchAdvanceHistory = async (staffId) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/payroll/advance-history/${staffId}`);
      setAdvanceHistory(res.data || []);
    } catch (err) {
      console.log("Advance history error");
    }
  };

  const fetchClassAttendance = async (className, sectionName) => {
    if (!className || !sectionName) return;
    
    setAttendanceLoading(true);
    setAttendanceMessage({ type: '', text: '' });
    setClassAttendanceStudents([]);

    try {
      const response = await axios.get(`${BASE_URL}/api/attendance/students`, {
        params: { class: className, section: sectionName, date: selectedDate }
      });

      if (response.data.status === 'LOCKED') {
        setDayStatus('LOCKED');
        setLockMessage(response.data.message);
      } else {
        setDayStatus('OPEN');
        const fetchedStudents = response.data.students || [];
        setClassAttendanceStudents(fetchedStudents);

        const initialAttendance = {};
        fetchedStudents.forEach(student => {
          initialAttendance[student.id] = 'Present';
        });
        setAttendanceRecords(initialAttendance);

        if (fetchedStudents.length === 0) {
          setAttendanceMessage({ type: 'info', text: 'Is Class mein koi student nahi mila.' });
        }
      }
    } catch (error) {
      setAttendanceMessage({ type: 'error', text: error.response?.data?.error || 'Data lane mein dikkat!' });
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleStatusChange = (studentId, newStatus) => {
    setAttendanceRecords(prev => ({ ...prev, [studentId]: newStatus }));
  };

  const handleSubmitAttendance = async () => {
    if (classAttendanceStudents.length === 0 || dayStatus === 'LOCKED') return;

    setAttendanceLoading(true);
    setAttendanceMessage({ type: '', text: '' });

    const recordsArray = Object.keys(attendanceRecords).map(id => ({
      student_id: parseInt(id),
      status: attendanceRecords[id]
    }));

    try {
      const response = await axios.post(`${BASE_URL}/api/attendance/submit`, {
        class: staffData?.assigned_class || '',
        section: staffData?.assigned_section || 'A',
        date: selectedDate,
        records: recordsArray
      });

      setAttendanceMessage({ type: 'success', text: response.data.message || '✅ Attendance saved!' });
    } catch (error) {
      setAttendanceMessage({ type: 'error', text: error.response?.data?.error || 'Attendance save nahi ho payi!' });
    } finally {
      setAttendanceLoading(false);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await axios.post(`${BASE_URL}/api/staff/notification/read/${id}`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.log("Mark read error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('staff_token');
    setIsLoggedIn(false);
    setStaffData(null);
    setNotifications([]);
  };

  // ✅ FIXED - SINGLE QR CHECKIN HANDLER
  const handleQRCheckin = async (qrData) => {
  try {
    console.log("📱 QR Data Received:", qrData);
    
    // ✅ Parse QR data
    let parsedData = {};
    if (typeof qrData === 'string') {
      try {
        parsedData = JSON.parse(qrData);
      } catch (e) {
        // Not JSON, use as is
        parsedData = { qr_code: qrData };
      }
    }

    // ✅ Location permission
    let latitude = 0;
    let longitude = 0;
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;
      console.log("📍 Location:", latitude, longitude);
    } catch (locErr) {
      alert('❌ Location access denied. Please enable GPS.');
      setShowScanner(false);
      return;
    }

    // ✅ Device token
    const deviceToken = localStorage.getItem('device_token') || navigator.userAgent;

    // ✅ Attendance API call
    const payload = {
      staff_id: staffData.id,
      latitude: latitude,
      longitude: longitude,
      device_token: deviceToken
    };
    
    console.log("📤 Sending payload:", payload);

    const res = await axios.post(`${BASE_URL}/api/staff/mark-attendance`, payload);
    
    console.log("📥 Response:", res.data);
    
    if (res.data.success) {
      alert(res.data.message || '✅ Campus Entry Complete!');
      fetchTodayAttendance();
      setShowScanner(false);
    } else {
      alert('❌ ' + (res.data.message || res.data.error || 'Check-in failed'));
      setShowScanner(false);
    }
  } catch (err) {
    console.error('❌ QR Checkin error:', err);
    if (err.response) {
      alert('❌ ' + (err.response.data?.error || err.response.data?.message || 'Server error'));
    } else if (err.request) {
      alert('❌ Backend server not responding. Please check your internet connection.');
    } else {
      alert('❌ Check-in failed. Please try again.');
    }
    setShowScanner(false);
  }
};

  const fetchTodayAttendance = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/staff/attendance/today/${staffData?.id}`);
      if (res.data.success) {
        setTodayStatus(res.data.attendance);
        if (res.data.attendance) {
          setCheckInTime(res.data.attendance.check_in_time || '');
          setCheckOutTime(res.data.attendance.check_out_time || '');
        }
      }
    } catch (err) {
      console.log("Today attendance error");
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/staff/attendance/history/${staffData?.id}`);
      if (res.data.success) {
        setAttendance(res.data.attendance || []);
      }
    } catch (err) {
      console.log("History error");
    }
  };

  useEffect(() => {
    if (staffData?.id) {
      fetchTodayAttendance();
      fetchAttendanceHistory();
    }
  }, [staffData]);

  useEffect(() => {
    if (staffData?.assigned_class) {
      fetchClassAttendance(staffData.assigned_class, staffData.assigned_section || 'A');
    }
  }, [selectedDate]);

  const handleCheckOut = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/staff/attendance/checkout`, {
        staff_id: staffData?.id
      });
      if (res.data.success) {
        alert('✅ Campus Exit successful!');
        fetchTodayAttendance();
        fetchAttendanceHistory();
      }
    } catch (err) {
      alert('❌ Campus Exit failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500 font-bold text-sm">⏳ Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <StaffLogin onLogin={(data) => {
      setIsLoggedIn(true);
      setStaffData(data.staff);
      fetchNotifications(data.staff.id);
      fetchAssignedStudents(data.staff.id);
      fetchAdvanceHistory(data.staff.id);
      if (data.staff.assigned_class) {
        fetchClassAttendance(data.staff.assigned_class, data.staff.assigned_section || 'A');
      }
    }} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <header className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-4 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm">👨‍🏫 {staffData?.name || 'Staff'}</h1>
              <p className="text-[10px] opacity-80">
                {staffData?.designation || 'Teacher'} 
                {staffData?.assigned_class && ` • Class ${staffData.assigned_class}`}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 bg-white/20 rounded-lg">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {unreadCount > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-700">
              {unreadCount} नई सूचना / New notification{unreadCount > 1 ? 's' : ''}
            </span>
          </div>
          <button onClick={() => setActiveTab('notifications')} className="text-xs text-amber-600 font-bold">
            📖 देखें
          </button>
        </div>
      )}

      <div className="p-4">
        {activeTab === 'dashboard' && (
          <StaffDashboard 
            staffData={staffData} 
            notifications={notifications.slice(0, 3)}
            onViewAll={() => setActiveTab('notifications')}
            todayStatus={todayStatus}
            checkInTime={checkInTime}
            checkOutTime={checkOutTime}
            setShowScanner={setShowScanner}
            onCheckOut={handleCheckOut}
          />
        )}
        {activeTab === 'notifications' && (
          <StaffNotifications 
            notifications={notifications} 
            onMarkRead={markNotificationRead}
          />
        )}
        {activeTab === 'attendance' && (
          <StaffAttendance 
            staffData={staffData}
            attendance={attendance}
            loading={attendance.length === 0}
            todayStatus={todayStatus}
            checkInTime={checkInTime}
            checkOutTime={checkOutTime}
            setShowScanner={setShowScanner}
            onCheckOut={handleCheckOut}
          />
        )}
        {activeTab === 'students' && (
          <StaffStudents assignedStudents={assignedStudents} />
        )}
        {activeTab === 'class_attendance' && (
          <ClassAttendanceStaff 
            staffData={staffData}
            students={classAttendanceStudents}
            attendanceRecords={attendanceRecords}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            dayStatus={dayStatus}
            lockMessage={lockMessage}
            attendanceLoading={attendanceLoading}
            attendanceMessage={attendanceMessage}
            onStatusChange={handleStatusChange}
            onSubmitAttendance={handleSubmitAttendance}
          />
        )}
        {activeTab === 'profile' && (
          <StaffProfile staffData={staffData} />
        )}
        {activeTab === 'advance' && (
          <StaffAdvance advanceHistory={advanceHistory} />
        )}
      </div>

      {showScanner && (
        <QRScannerComponent 
          onScan={(data) => {
            handleQRCheckin(data);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 z-50 shadow-lg">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'dashboard' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-bold">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('notifications')}
          className={`flex flex-col items-center p-2 rounded-lg relative ${activeTab === 'notifications' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
          <span className="text-[9px] font-bold">सूचना</span>
        </button>
        <button 
          onClick={() => setActiveTab('attendance')}
          className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'attendance' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[9px] font-bold">उपस्थिति</span>
        </button>
        <button 
          onClick={() => setActiveTab('class_attendance')}
          className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'class_attendance' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[9px] font-bold">कक्षा</span>
        </button>
        <button 
          onClick={() => setActiveTab('advance')}
          className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'advance' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-[9px] font-bold">अग्रिम</span>
        </button>
      </nav>
    </div>
  );
};

// ============================================================
// 👨‍🏫 STAFF LOGIN
// ============================================================
const StaffLogin = ({ onLogin }) => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${BASE_URL}/api/staff/login`, {
        mobile,
        password
      });

      if (res.data.success) {
        localStorage.setItem('staff_token', res.data.token);
        onLogin(res.data);
      } else {
        setError(res.data.message || '❌ गलत मोबाइल या पासवर्ड');
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || '❌ सर्वर से कनेक्ट नहीं हो पाया');
      } else {
        setError('❌ सर्वर से कनेक्ट नहीं हो पाया');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-md w-full max-w-md p-8 rounded-2xl shadow-2xl border border-white/20">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3 border-2 border-white overflow-hidden">
            <User className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black text-gray-800">👨‍🏫 Staff App</h2>
          <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">Teacher / Staff Login</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold rounded-r-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">
              📱 Mobile Number / मोबाइल नंबर
            </label>
            <input 
              type="tel" 
              required 
              value={mobile} 
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter your mobile number" 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium" 
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">
              🔑 Password / पासवर्ड
            </label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password" 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium pr-10" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <p className="text-[9px] text-gray-400 mt-1">
              💡 Default password: Your mobile number
            </p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:bg-indigo-700 transition"
          >
            {loading ? '⏳ Loading...' : '🔑 Login / लॉगिन करें'}
          </button>
        </form>

        <div className="mt-6 text-center text-[9px] text-gray-400 font-bold uppercase tracking-wider">
          🔒 Secured by A.B.Digital Work
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 📊 STAFF DASHBOARD
// ============================================================
const StaffDashboard = ({ staffData, notifications, onViewAll, todayStatus, checkInTime, checkOutTime, setShowScanner, onCheckOut }) => {
  const [stats, setStats] = useState({
    total_students: 0,
    present_today: 0,
    absent_today: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/staff/dashboard-stats`);
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.log("Stats fetch error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-800">{staffData?.name || 'Staff Name'}</h3>
            <p className="text-sm text-gray-500">{staffData?.designation || 'Teacher'}</p>
            <p className="text-sm text-gray-500">📱 {staffData?.mobile || 'N/A'}</p>
            {staffData?.assigned_class && (
              <p className="text-sm text-indigo-600 font-bold">🏫 Class Teacher: {staffData.assigned_class} - {staffData.assigned_section || 'A'}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">📅 Today / आज</h4>
            {todayStatus ? (
              <div className="mt-1">
                <p className="text-sm font-bold text-green-600">✅ Campus Entry Done</p>
                <p className="text-xs text-gray-500">⏱️ In: {checkInTime}</p>
                {checkOutTime && <p className="text-xs text-gray-500">⏱️ Out: {checkOutTime}</p>}
              </div>
            ) : (
              <p className="text-sm font-bold text-gray-400 mt-1">❌ Campus Entry not done yet</p>
            )}
          </div>
          <div className="flex gap-2">
            {!todayStatus && (
              <button onClick={() => setShowScanner(true)} className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-md hover:bg-purple-700 transition">
                <QrCode className="w-4 h-4" /> Scan QR
              </button>
            )}
            {todayStatus && !checkOutTime && (
              <button onClick={onCheckOut} className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-lg shadow-md hover:bg-orange-700 transition">
                🚗 Campus Exit
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-blue-100">कुल छात्र</p>
              <h3 className="text-xl font-black mt-1">{stats.total_students}</h3>
            </div>
            <Users className="w-8 h-8 opacity-20" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-100">✅ उपस्थित</p>
              <h3 className="text-xl font-black mt-1">{stats.present_today}</h3>
            </div>
            <CheckCircle className="w-8 h-8 opacity-20" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 text-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-rose-100">❌ अनुपस्थित</p>
              <h3 className="text-xl font-black mt-1">{stats.absent_today}</h3>
            </div>
            <XCircle className="w-8 h-8 opacity-20" />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">📬 ताज़ा सूचनाएं</h4>
          <button onClick={onViewAll} className="text-[10px] text-indigo-600 font-bold">
            सभी देखें →
          </button>
        </div>
        {notifications && notifications.length > 0 ? (
          notifications.map((n, i) => (
            <div key={i} className="border-b border-gray-100 py-2 last:border-0">
              <p className="text-sm font-medium text-gray-800">{n.message}</p>
              <p className="text-[10px] text-gray-400">{n.created_at}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">कोई नई सूचना नहीं</p>
        )}
      </div>
    </div>
  );
};

// ============================================================
// 📬 STAFF NOTIFICATIONS
// ============================================================
const StaffNotifications = ({ notifications, onMarkRead }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-800">📬 सभी सूचनाएं</h3>
      
      {notifications.length === 0 ? (
        <div className="bg-white p-8 rounded-xl text-center border border-gray-200">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-bold text-sm">कोई सूचना नहीं</p>
        </div>
      ) : (
        notifications.map((n) => (
          <div 
            key={n.id} 
            className={`bg-white p-4 rounded-xl border ${n.is_read ? 'border-gray-200' : 'border-indigo-200 bg-indigo-50/30'} shadow-sm hover:shadow-md transition cursor-pointer`}
            onClick={() => !n.is_read && onMarkRead(n.id)}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {n.type === 'attendance' && <Calendar className="w-4 h-4 text-blue-600" />}
                {n.type === 'fee' && <CreditCard className="w-4 h-4 text-emerald-600" />}
                {n.type === 'notice' && <Bell className="w-4 h-4 text-amber-600" />}
                {!n.type && <Bell className="w-4 h-4 text-gray-600" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-800">{n.title || 'सूचना'}</p>
                  {!n.is_read && (
                    <span className="text-[8px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {n.created_at || 'N/A'}
                  </span>
                  {n.is_read ? (
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" /> पढ़ लिया
                    </span>
                  ) : (
                    <span className="text-[10px] text-indigo-600 font-bold">🔴 नया</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// ============================================================
// 📋 STAFF ATTENDANCE
// ============================================================
const StaffAttendance = ({ staffData, attendance, loading, todayStatus, checkInTime, checkOutTime, setShowScanner, onCheckOut }) => {
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const absentCount = attendance.filter(a => a.status === 'Absent').length;
  const totalDays = attendance.length;
  const percentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-800">📋 My Attendance / मेरी उपस्थिति</h3>
      
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">📅 Today / आज</h4>
        <div className="flex items-center justify-between">
          <div>
            {todayStatus ? (
              <div>
                <p className="text-sm font-bold text-green-600">✅ Campus Entry Done</p>
                <p className="text-xs text-gray-500">⏱️ In: {checkInTime}</p>
                {checkOutTime && <p className="text-xs text-gray-500">⏱️ Out: {checkOutTime}</p>}
              </div>
            ) : (
              <p className="text-sm font-bold text-gray-400">❌ Campus Entry not done yet</p>
            )}
          </div>
          <div className="flex gap-2">
            {!todayStatus && (
              <button onClick={() => setShowScanner(true)} className="px-3 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                <QrCode className="w-4 h-4" /> Scan QR
              </button>
            )}
            {todayStatus && !checkOutTime && (
              <button onClick={onCheckOut} className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-lg">
                🚗 Campus Exit
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="bg-green-50 p-3 rounded-xl text-center border border-green-200">
          <p className="text-[10px] font-bold text-green-600">✅ Present</p>
          <p className="text-lg font-black text-green-700">{presentCount}</p>
        </div>
        <div className="bg-red-50 p-3 rounded-xl text-center border border-red-200">
          <p className="text-[10px] font-bold text-red-600">❌ Absent</p>
          <p className="text-lg font-black text-red-700">{absentCount}</p>
        </div>
        <div className="bg-blue-50 p-3 rounded-xl text-center border border-blue-200 col-span-2">
          <p className="text-[10px] font-bold text-blue-600">📊 Attendance %</p>
          <p className="text-lg font-black text-blue-700">{percentage}%</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 max-h-[300px] overflow-y-auto">
        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">📅 History / इतिहास</h4>
        
        {loading ? (
          <p className="text-center text-gray-400 py-4">⏳ Loading...</p>
        ) : attendance.length === 0 ? (
          <p className="text-center text-gray-400 py-4">कोई रिकॉर्ड नहीं</p>
        ) : (
          attendance.map((a, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3">
                {a.status === 'Present' ? <CheckCircle className="w-5 h-5 text-green-500" /> : a.status === 'Absent' ? <XCircle className="w-5 h-5 text-red-500" /> : <Clock className="w-5 h-5 text-amber-500" />}
                <div>
                  <p className="text-sm font-medium text-gray-800">{a.date || 'N/A'}</p>
                  <p className="text-[10px] text-gray-400">In: {a.check_in_time || '--'} | Out: {a.check_out_time || '--'}</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${a.status === 'Present' ? 'bg-green-100 text-green-700' : a.status === 'Absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                {a.status || 'N/A'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================
// 📚 CLASS ATTENDANCE
// ============================================================
const ClassAttendanceStaff = ({ 
  staffData, 
  students, 
  attendanceRecords, 
  selectedDate, 
  setSelectedDate,
  dayStatus,
  lockMessage,
  attendanceLoading,
  attendanceMessage,
  onStatusChange,
  onSubmitAttendance
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">
          📚 Class Attendance 
          {staffData?.assigned_class && (
            <span className="text-indigo-600"> - Class {staffData.assigned_class} {staffData.assigned_section || 'A'}</span>
          )}
        </h3>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)}
          className="p-2 border border-gray-200 rounded-lg text-xs font-bold"
        />
      </div>

      {attendanceMessage.text && (
        <div className={`p-3 rounded-xl text-xs font-bold text-center ${
          attendanceMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
          attendanceMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {attendanceMessage.text}
        </div>
      )}

      {dayStatus === 'LOCKED' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center shadow-sm flex flex-col items-center justify-center gap-3">
          <ShieldAlert className="w-12 h-12 text-amber-500 animate-bounce" />
          <h3 className="text-base font-black text-amber-900 uppercase tracking-wide">Operation Restricted</h3>
          <p className="text-xs font-bold text-amber-700">{lockMessage}</p>
        </div>
      )}

      {dayStatus === 'OPEN' && students.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b">
                  <th className="p-4 w-24">Roll No</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4 text-center w-80">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-all">
                    <td className="p-4 font-black text-gray-500">{student.roll_no || '-'}</td>
                    <td className="p-4 font-black text-gray-800 text-sm">{student.name}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-1.5">
                        {['Present', 'Absent', 'Leave', 'Late'].map((status) => {
                          const colorMap = {
                            Present: 'bg-green-600 text-white shadow-md shadow-green-200',
                            Absent: 'bg-red-600 text-white shadow-md shadow-red-200',
                            Leave: 'bg-amber-500 text-white shadow-md shadow-amber-200',
                            Late: 'bg-orange-500 text-white shadow-md shadow-orange-200'
                          };
                          const isActive = attendanceRecords[student.id] === status;
                          return (
                            <button
                              key={status}
                              onClick={() => onStatusChange(student.id, status)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer ${
                                isActive ? colorMap[status] : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                            >
                              {status === 'Present' ? 'P' : status === 'Absent' ? 'A' : status === 'Leave' ? 'L' : 'Late'}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button
              onClick={onSubmitAttendance}
              disabled={attendanceLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider py-3 px-8 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" /> {attendanceLoading ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}

      {dayStatus === 'OPEN' && students.length === 0 && !attendanceLoading && (
        <div className="bg-white p-8 rounded-xl text-center border border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-bold text-sm">कोई छात्र नहीं</p>
          <p className="text-xs text-gray-400">इस कक्षा में कोई छात्र नहीं है</p>
        </div>
      )}

      {attendanceLoading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// 👨‍🎓 STAFF STUDENTS
// ============================================================
const StaffStudents = ({ assignedStudents }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-800">👨‍🎓 My Students / मेरे छात्र</h3>
      
      {assignedStudents.length === 0 ? (
        <div className="bg-white p-8 rounded-xl text-center border border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-bold text-sm">कोई छात्र नहीं / No students assigned</p>
          <p className="text-xs text-gray-400 mt-1">Admin ne abhi tak class assign nahi ki hai</p>
        </div>
      ) : (
        assignedStudents.map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-800">{s.name}</p>
                <p className="text-xs text-gray-500">Class {s.class} - {s.section} | Roll: {s.roll_no}</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-500">Active</span>
          </div>
        ))
      )}
    </div>
  );
};

// ============================================================
// 👤 STAFF PROFILE
// ============================================================
const StaffProfile = ({ staffData }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-800">👤 Profile / प्रोफ़ाइल</h3>
      
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800">{staffData?.name || 'Staff Name'}</h3>
            <p className="text-sm text-gray-500">{staffData?.designation || 'Teacher'}</p>
            <p className="text-sm text-gray-500">📱 {staffData?.mobile || 'N/A'}</p>
            {staffData?.assigned_class && (
              <p className="text-sm text-indigo-600 font-bold">🏫 Class Teacher: {staffData.assigned_class} - {staffData.assigned_section || 'A'}</p>
            )}
            {staffData?.subject && (
              <p className="text-sm text-gray-500">📚 Subject: {staffData.subject}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-2 border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">🏫 School</span>
            <span className="text-sm font-bold text-gray-800">Smart School ERP</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">💰 Base Salary</span>
            <span className="text-sm font-bold text-gray-800">₹{staffData?.base_salary || 0}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">🔐 Account Settings</h4>
        <button className="w-full py-2.5 bg-indigo-50 text-indigo-600 font-bold text-sm rounded-xl border border-indigo-200 hover:bg-indigo-100 transition">
          🔑 Change Password
        </button>
        <button 
          onClick={() => {
            localStorage.removeItem('staff_token');
            window.location.reload();
          }}
          className="w-full mt-2 py-2.5 bg-red-50 text-red-600 font-bold text-sm rounded-xl border border-red-200 hover:bg-red-100 transition"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

// ============================================================
// 💰 STAFF ADVANCE SALARY
// ============================================================
const StaffAdvance = ({ advanceHistory }) => {
  const totalAdvance = advanceHistory.reduce((sum, a) => sum + (a.amount || 0), 0);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-800">💰 Advance Salary / अग्रिम वेतन</h3>
      
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-4 rounded-xl shadow-sm">
        <p className="text-[10px] font-black uppercase text-indigo-100">Total Advance Taken / कुल अग्रिम</p>
        <h2 className="text-2xl font-black mt-1">₹{totalAdvance}</h2>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 max-h-[400px] overflow-y-auto">
        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">📋 History / इतिहास</h4>
        
        {advanceHistory.length === 0 ? (
          <p className="text-center text-gray-400 py-4">कोई अग्रिम नहीं / No advance taken</p>
        ) : (
          advanceHistory.map((a, i) => (
            <div key={i} className="border-b border-gray-100 py-3 last:border-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800">₹{a.amount}</p>
                  <p className="text-[10px] text-gray-400">{a.purpose || 'Personal Advance'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-bold">
                    {a.date || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StaffApp;