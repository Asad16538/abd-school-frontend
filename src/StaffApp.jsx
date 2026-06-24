// src/StaffApp.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QRScannerComponent from './components/QRScanner';
import { 
  Home, Bell, User, Calendar, Clock, Users, 
  LogOut, CheckCircle, XCircle, AlertTriangle,
  CreditCard, BookOpen, Settings, ChevronRight,
  UserPlus, FileText, TrendingUp, DollarSign, Camera, QrCode
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

  const handleQRCheckin = async (qrData) => {
    try {
      let parsedData = qrData;
      if (typeof qrData === 'string') {
        try {
          parsedData = JSON.parse(qrData);
        } catch (e) {
          parsedData = { qr_code: qrData };
        }
      }

      const res = await axios.post(`${BASE_URL}/api/staff/qr-checkin`, {
        staff_id: staffData.id,
        qr_data: parsedData,
        latitude: parsedData.latitude || 0,
        longitude: parsedData.longitude || 0
      });
      
      if (res.data.success) {
        alert('✅ Attendance marked successfully via QR!');
        fetchTodayAttendance();
        setShowScanner(false);
      } else {
        alert('❌ ' + (res.data.message || 'Check-in failed'));
      }
    } catch (err) {
      alert('❌ Check-in failed. Please try again.');
      setShowScanner(false);
    }
  };

  const [attendance, setAttendance] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');

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

  const handleCheckIn = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/staff/attendance/checkin`, {
        staff_id: staffData?.id
      });
      if (res.data.success) {
        alert('✅ Check-in successful!');
        fetchTodayAttendance();
        fetchAttendanceHistory();
      }
    } catch (err) {
      alert('❌ Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/staff/attendance/checkout`, {
        staff_id: staffData?.id
      });
      if (res.data.success) {
        alert('✅ Check-out successful!');
        fetchTodayAttendance();
        fetchAttendanceHistory();
      }
    } catch (err) {
      alert('❌ Check-out failed');
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
              <p className="text-[10px] opacity-80">{staffData?.designation || 'Teacher'}</p>
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
          <button 
            onClick={() => setActiveTab('notifications')}
            className="text-xs text-amber-600 font-bold"
          >
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
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            todayStatus={todayStatus}
            checkInTime={checkInTime}
            checkOutTime={checkOutTime}
            setShowScanner={setShowScanner}
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
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            setShowScanner={setShowScanner}
          />
        )}
        {activeTab === 'students' && (
          <StaffStudents assignedStudents={assignedStudents} />
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
          onClick={() => setActiveTab('students')}
          className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'students' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[9px] font-bold">छात्र</span>
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
const StaffDashboard = ({ staffData, notifications, onViewAll, onCheckIn, onCheckOut, todayStatus, checkInTime, checkOutTime, setShowScanner }) => {
  const [stats, setStats] = useState({
    total_students: 0,
    present_today: 0,
    absent_today: 0,
    pending_fees: 0
  });
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
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
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">📅 Today / आज</h4>
            {todayStatus ? (
              <div className="mt-1">
                <p className="text-sm font-bold text-green-600">✅ Checked In</p>
                <p className="text-xs text-gray-500">⏱️ In: {checkInTime}</p>
                {checkOutTime && <p className="text-xs text-gray-500">⏱️ Out: {checkOutTime}</p>}
              </div>
            ) : (
              <p className="text-sm font-bold text-gray-400 mt-1">❌ Not checked in yet</p>
            )}
          </div>
          <div className="flex gap-2">
            {!todayStatus && (
              <>
                <button 
                  onClick={() => setShowScanner(true)}
                  className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  <QrCode className="w-4 h-4" /> QR
                </button>
                <button 
                  onClick={onCheckIn}
                  className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg"
                >
                  ✅ Check In
                </button>
              </>
            )}
            {todayStatus && !checkOutTime && (
              <button 
                onClick={onCheckOut}
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg"
              >
                ❌ Check Out
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-blue-100">कुल छात्र</p>
              <h3 className="text-xl font-black mt-1">{stats.total_students || 0}</h3>
            </div>
            <Users className="w-8 h-8 opacity-20" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-100">आज उपस्थित</p>
              <h3 className="text-xl font-black mt-1">{stats.present_today || 0}</h3>
            </div>
            <CheckCircle className="w-8 h-8 opacity-20" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 text-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-rose-100">आज अनुपस्थित</p>
              <h3 className="text-xl font-black mt-1">{stats.absent_today || 0}</h3>
            </div>
            <XCircle className="w-8 h-8 opacity-20" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-amber-100">बकाया फीस</p>
              <h3 className="text-xl font-black mt-1">₹{stats.pending_fees || 0}</h3>
            </div>
            <AlertTriangle className="w-8 h-8 opacity-20" />
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
const StaffAttendance = ({ staffData, attendance, loading, todayStatus, checkInTime, checkOutTime, onCheckIn, onCheckOut, setShowScanner }) => {
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
                <p className="text-sm font-bold text-green-600">✅ Checked In</p>
                <p className="text-xs text-gray-500">⏱️ In: {checkInTime}</p>
                {checkOutTime && <p className="text-xs text-gray-500">⏱️ Out: {checkOutTime}</p>}
              </div>
            ) : (
              <p className="text-sm font-bold text-gray-400">❌ Not checked in yet</p>
            )}
          </div>
          <div className="flex gap-2">
            {!todayStatus && (
              <>
                <button 
                  onClick={() => setShowScanner(true)}
                  className="px-3 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  <QrCode className="w-4 h-4" /> QR
                </button>
                <button 
                  onClick={onCheckIn}
                  className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg"
                >
                  ✅ Check In
                </button>
              </>
            )}
            {todayStatus && !checkOutTime && (
              <button 
                onClick={onCheckOut}
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg"
              >
                ❌ Check Out
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
                {a.status === 'Present' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : a.status === 'Absent' ? (
                  <XCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-800">{a.date || 'N/A'}</p>
                  <p className="text-[10px] text-gray-400">
                    In: {a.check_in_time || '--'} | Out: {a.check_out_time || '--'}
                  </p>
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
            <div className="text-right">
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                {s.status || 'Active'}
              </span>
            </div>
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
          </div>
        </div>
        
        <div className="space-y-2 border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">🏫 School</span>
            <span className="text-sm font-bold text-gray-800">Smart School ERP</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">📚 Subject</span>
            <span className="text-sm font-bold text-gray-800">{staffData?.subject || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">👨‍🏫 Class Teacher</span>
            <span className="text-sm font-bold text-gray-800">{staffData?.class_teacher || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">💰 Base Salary</span>
            <span className="text-sm font-bold text-gray-800">₹{staffData?.base_salary || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">📅 Joined</span>
            <span className="text-sm font-bold text-gray-800">{staffData?.created_at || 'N/A'}</span>
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