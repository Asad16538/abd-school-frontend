// src/App.jsx
import StaffTelegramLink from './components/StaffTelegramLink';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogIn, User, Lock, ShieldAlert, Sparkles, KeyRound, RefreshCw, CheckCircle2, Phone, MapPin, Mail, Signature,
  LayoutDashboard, Users, Camera, CreditCard, IdCard, Settings, LogOut, Smartphone, Coins, Wallet, Landmark, TrendingUp, HandCoins, Search,
  FileText
} from 'lucide-react';
import axios from 'axios';
import AttendanceForm from './components/AttendanceForm';
import StaffSecureTerminal from './components/StaffSecureTerminal';
import StaffAttendanceTerminal from './components/StaffAttendanceTerminal';
import ExamManagement from './components/ExamManagement';

// ✅ CACHE FUNCTIONS
const CACHE_TTL = 86400000;

const getCachedData = (key) => {
  const cached = localStorage.getItem(`cache_${key}`);
  if (!cached) return null;
  try {
    const data = JSON.parse(cached);
    if (Date.now() - data.timestamp > CACHE_TTL) {  
      localStorage.removeItem(`cache_${key}`);
      return null;
    }
    return data.data;
  } catch {
    return null;
  }
};

const setCachedData = (key, data) => {
  localStorage.setItem(`cache_${key}`, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
};

// ✅ LAZY LOAD COMPONENTS (ALL 100% INCLUDED)
const StudentRegistration = lazy(() => import('./components/StudentRegistration'));
const SearchPayFees = lazy(() => import('./components/SearchPayFees'));
const QuickFeePanel = lazy(() => import('./components/QuickFeePanel'));
const StaffPayrollAttendance = lazy(() => import('./components/StaffPayrollAttendance'));
const StudentFeeReport = lazy(() => import('./components/StudentFeeReport'));
const ExpenseTracker = lazy(() => import('./components/ExpenseTracker'));
const IDCardStudio = lazy(() => import('./components/IDCardStudio'));
const ClassAttendance = lazy(() => import('./components/ClassAttendance'));
const PromotionPanel = lazy(() => import('./components/PromotionPanel'));

const BASE_URL = "https://erp-api.aapschool.in";

function App() {
  // ============================================================
  // ✅ STEP 1: SARE HOOKS PEHLE (TOP LEVEL)
  // ============================================================
  const [loginRole, setLoginRole] = useState('Admin');
  const [formMode, setFormMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [captchaInput, setCaptchaInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // 📱 MOBILE APP DRAWER STATE
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [schoolData, setSchoolData] = useState({
    school_name: 'Smart School ERP',
    school_address: 'India',
    school_email: 'admin@school.com',
    school_mobile: '9893260067',
    school_logo: null,
    school_signature: null,
    school_latitude: 0.0,
    school_longitude: 0.0,
    school_location_radius: 100,
    telegram_admin_id: ''
  });
  const [stats, setStats] = useState({
    total_students: 0, total_fees_target: 0, total_fees_paid: 0, today_fees_paid: 0, total_pending: 0, total_expenses: 0, total_income: 0
  });
  const [pendingStudents, setPendingStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [schoolPay, setSchoolPay] = useState('');
  const [transportPay, setTransportPay] = useState('');

  // ============================================================
  // ✅ STEP 2: SARE FUNCTIONS
  // ============================================================
  const generateCaptcha = () => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
    setCaptchaInput('');
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/settings`);
      if (res && res.data) {
        const data = {
          ...res.data,
          school_latitude: res.data.school_latitude || 23.2599,
          school_longitude: res.data.school_longitude || 77.4126,
          school_location_radius: res.data.school_location_radius || 100
        };
        setSchoolData(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error("Settings load failed:", err.response ? err.response.data : err.message);
      const cached = getCachedData('settings');
      if (cached) {
        setSchoolData(prev => ({ ...prev, ...cached }));
      }
    }
  };

  const loadDashboardData = async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        const cached = getCachedData('dashboard');
        if (cached) {
          setStats(cached.stats);
          setPendingStudents(cached.pending);
          return;
        }
      }
      const [statsRes, listRes, staffRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/dashboard-stats`),
        axios.get(`${BASE_URL}/api/pending-students`),
        axios.get(`${BASE_URL}/api/staff`)
      ]);
      const statsData = statsRes.data;
      statsData.total_staff = staffRes.data.length;
      setStats(statsData);
      setPendingStudents(listRes.data);
      setCachedData('dashboard', {
        stats: statsData,
        pending: listRes.data
      });
    } catch (err) {
      console.log("Dashboard data fetch error");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (parseInt(captchaInput) !== (num1 + num2)) {
      setError(`❌ Galat Captcha Code! Sahi jawab dein.`);
      generateCaptcha();
      return;
    }
    
    setLoading(true);
    try {
      let endpoint = `${BASE_URL}/api/login`;
      let payload = { username: username.trim(), password: password };

      if (loginRole === 'Teacher') {
        endpoint = `${BASE_URL}/api/staff/login`;
        payload = { mobile: username.trim(), password: password };
      } else if (loginRole === 'Parent') {
        endpoint = `${BASE_URL}/api/parent/login`;
        payload = { mobile: username.trim(), password: password };
      }

      const response = await axios.post(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      if (response && response.data && response.data.success) {
        localStorage.setItem('token', response.data.token);
        const activeRole = response.data.role || loginRole;
        localStorage.setItem('role', activeRole);
        setRole(activeRole);
        setIsLoggedIn(true);
        await fetchSettings();
      } else {
        setError(response.data?.message || "Login fail ho gaya!");
        generateCaptcha();
      }
    } catch (err) {
      setError('Login failed: ' + (err.response?.data?.message || err.message));
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    let endpoint = `${BASE_URL}/api/send-verification`;
    let payload = { username };

    if (loginRole === 'Teacher') {
      endpoint = `${BASE_URL}/api/staff/send-verification`;
      payload = { mobile: username };
    } else if (loginRole === 'Parent') {
      endpoint = `${BASE_URL}/api/parent/send-verification`;
      payload = { mobile: username };
    }

    try {
      const response = await axios.post(endpoint, payload);
      if (response.data.success) {
        setSuccessMsg(response.data.message);
        setFormMode('forgot_verify');
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error! Kripya dobara koshish karein.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    let endpoint = `${BASE_URL}/api/verify-and-reset`;
    let payload = { username, otp: otpCode, new_password: newPassword };

    if (loginRole === 'Teacher') {
      endpoint = `${BASE_URL}/api/staff/verify-and-reset`;
      payload = { mobile: username, otp: otpCode, new_password: newPassword };
    } else if (loginRole === 'Parent') {
      endpoint = `${BASE_URL}/api/parent/reset-password`;
      payload = { mobile: username, otp: otpCode, new_password: newPassword };
    }

    try {
      const response = await axios.post(endpoint, payload);
      if (response.data.success) {
        setSuccessMsg(response.data.message);
        setTimeout(() => {
          setFormMode('login');
          setPassword('');
          generateCaptcha();
        }, 2500);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed!');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${BASE_URL}/api/settings`, schoolData);
      setSuccessMsg(response.data.message || "Settings saved successfully!");
      setCachedData('settings', schoolData);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error("Settings save error:", err);
      setError('Settings save nahi ho payi. Network ya Server Error!');
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'logo');

    try {
      const res = await axios.post(`${BASE_URL}/api/upload-logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setSchoolData(prev => ({ ...prev, school_logo: res.data.url }));
        setSuccessMsg("✅ Logo uploaded & saved successfully!");
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError("❌ Logo upload fail ho gaya!");
    }
  };

  const handleSignatureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'signature');

    try {
      const res = await axios.post(`${BASE_URL}/api/upload-logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setSchoolData(prev => ({ ...prev, school_signature: res.data.url }));
        setSuccessMsg("✅ Signature uploaded & saved successfully!");
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError("❌ Signature upload fail ho gaya!");
    }
  };

  const generateTelegramLink = (student) => {
    const link = `https://abd-school-frontend.vercel.app/link-telegram?phone=${student.parent_mobile}`;
    const message = `Namaste, please apni Telegram ID link karne ke liye is link par click karein: ${link}`;
    const whatsappUrl = `https://wa.me/${student.parent_mobile}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const sendFeeReminder = (student) => {
    if (!student.parent_mobile || student.parent_mobile === '0000000000') {
      alert("❌ Is student ka valid mobile number registered nahi hai!");
      return;
    }

    const schoolName = schoolData.school_name || "SMART SCHOOL ERP";
    
    const pendingSchool = parseFloat(student.school_fee_total || 0) - parseFloat(student.school_fee_paid || 0);
    const pendingTrans = parseFloat(student.transport_fee_total || 0) - parseFloat(student.transport_fee_paid || 0);
    const totalDue = pendingSchool + pendingTrans;

    if (totalDue <= 0) {
      alert("✅ Is student ki fee pehle hi clear ho chuki hai!");
      return;
    }

    // 🛠️ YAHAN FIX KIYA HAI: ₹ ke baad $ sign lagaya hai taaki amount show ho
    const message = 
      `🔔 *[FEE REMINDER - ${schoolName.toUpperCase()}]*\n\n` +
      `Namaste,\n\n` +
      `👤 *Student Name:* ${student.name}\n` +
      `🏫 *Pending School Fee:* ₹${pendingSchool}\n` +
      `🚐 *Pending Van/Bus Fee:* ₹${pendingTrans}\n\n` +
      `💰 *Total Outstanding Amount:* *₹${totalDue}*\n\n` +
      `Kripya fee ka bhugtan samay par karein.\n\n` +
      `_System Powered by A.B.Digital Work_`;

    let phone = student.parent_mobile.trim();
    if (phone.length === 10) {
      phone = `91${phone}`;
    }

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  // ============================================================
  // ✅ STEP 3: useEffect
  // ============================================================
  useEffect(() => {
    const hostname = window.location.hostname;
    const referer = document.referrer || '';
    
    const allowedDomains = [
      'aapschool.in', 
      'www.aapschool.in', 
      'ab-digital-work.vercel.app', 
      'abd-school-frontend.vercel.app', 
      'vercel.app', 
      'localhost', 
      '127.0.0.1'
    ];
    
    const isAllowed = allowedDomains.includes(hostname) || 
                      allowedDomains.some(domain => referer.includes(domain)) ||
                      hostname.endsWith('.vercel.app');
    
    if (!isAllowed) {
      document.body.innerHTML = '<h1 style="text-align:center;margin-top:50px;font-family:sans-serif;">🔒 Access Denied - Enterprise Shield Activated</h1>';
      return;
    }
    
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    
    if (savedToken && savedRole) {
      setIsLoggedIn(true);
      setRole(savedRole);
      loadDashboardData();
      fetchSettings(); 
    } else {
      fetchSettings();
    }
    
    generateCaptcha();
  }, [isLoggedIn]);

  // ============================================================
  // ✅ STEP 4: CONDITIONAL RETURNS
  // ============================================================
  if (window.location.href.includes('staff-attendance-terminal') || window.location.pathname === '/staff-attendance-terminal') {
    return <StaffAttendanceTerminal />;
  }

  if (window.location.pathname === '/staff-link-telegram') {
    return <StaffTelegramLink />;
  }

  if (window.location.pathname === '/link-telegram') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
          <h2 className="text-xl font-black text-gray-800 mb-4">🏫 School ERP - Telegram Link</h2>
          <p className="text-xs text-gray-500 mb-6 font-bold uppercase">Apna registered mobile number daalein sync karne ke liye.</p>
          <input id="parentPhone" type="number" placeholder="Enter Registered Mobile" className="w-full p-3 border border-gray-200 rounded-xl mb-4 text-sm" />
          <button onClick={async () => {
            const phone = document.getElementById('parentPhone').value;
            const urlParams = new URLSearchParams(window.location.search);
            const telegramId = urlParams.get('telegram_id') || "UNKNOWN";
            try {
              await axios.post(`${BASE_URL}/api/link-telegram`, { phone, telegram_id: telegramId });
              alert("✅ Linked Successfully! Ab aapko updates milenge.");
            } catch (err) {
              alert("❌ Link fail ho gaya, number check karein.");
            }
          }} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">Link Account</button>
        </div>
      </div>
    );
  }

  if (window.location.pathname === '/attendance-form') {
    return <AttendanceForm />;
  }

  // ============================================================
  // ✅ STEP 5: MAIN RETURN
  // ============================================================
  return (
  <div className="min-h-screen bg-[#f3f4f6] font-sans flex flex-col relative text-gray-800">
    <AnimatePresence mode="wait">
      {!isLoggedIn ? (
        /* AUTH SCREEN */
        <motion.div key="auth-screen" className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-4 w-full relative">
          <div className="flex-grow flex items-center justify-center w-full z-10">
            <motion.div layout className="bg-white/95 backdrop-blur-md w-full max-w-md p-8 rounded-2xl shadow-2xl border border-white/20">

              <div className="text-center mb-6">
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    boxShadow: ["0px 4px 10px rgba(0,0,0,0.1)", "0px 10px 25px rgba(79, 70, 229, 0.4)", "0px 4px 10px rgba(0,0,0,0.1)"]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-20 h-20 bg-gradient-to-tr from-amber-400 via-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border-2 border-white overflow-hidden"
                >
                  {schoolData.school_logo ? (
                    <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={schoolData.school_logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <LogIn className="w-8 h-8 text-white" />
                  )}
                </motion.div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">{schoolData.school_name}</h2>
                <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">Advanced SaaS Gateway</p>
              </div>

              {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold rounded-r-xl flex items-center gap-2"><ShieldAlert className="w-4 h-4 shrink-0" /><span>{error}</span></div>}
              {successMsg && <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 text-xs font-bold rounded-r-xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /><span>{successMsg}</span></div>}

              {formMode === 'login' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-xl mb-4">
                    <button
                      type="button"
                      onClick={() => setLoginRole('Admin')}
                      className={`py-2 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                        loginRole === 'Admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      👑 Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginRole('Teacher')}
                      className={`py-2 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                        loginRole === 'Teacher' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      👨‍🏫 Teacher
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginRole('Parent')}
                      className={`py-2 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                        loginRole === 'Parent' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      👨‍👩‍👦 Parent
                    </button>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">
                        {loginRole === 'Parent' ? 'Parent Mobile Number' : loginRole === 'Teacher' ? 'Staff Mobile / Username' : 'Admin Username'}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><User className="w-4 h-4" /></span>
                        <input 
                          type="text" 
                          required 
                          value={username} 
                          onChange={(e) => setUsername(e.target.value)} 
                          placeholder={loginRole === 'Parent' ? 'Enter Mobile Number' : 'Enter Username'} 
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium" 
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider">Password</label>
                        <button type="button" onClick={() => { setFormMode('forgot_request'); setError(''); setSuccessMsg(''); }} className="text-[10px] font-bold text-indigo-600 hover:underline">Forgot Password?</button>
                      </div>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Lock className="w-4 h-4" /></span>
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium" />
                      </div>
                    </div>

                    <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
                      <span className="text-[11px] font-black text-indigo-900 tracking-wide flex items-center justify-between">📦 Security Captcha <RefreshCw className="w-3 h-3 text-indigo-600 cursor-pointer" onClick={generateCaptcha} /></span>
                      <div className="flex items-center gap-2">
                        <div className="bg-slate-800 text-amber-400 px-3 py-1.5 rounded-xl text-sm font-black border border-slate-700 min-w-[70px] text-center">{num1} + {num2} =</div>
                        <input type="number" required placeholder="Answer" value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)} className="flex-grow px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-center" />
                      </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md cursor-pointer">
                      Login as {loginRole} ⚡
                    </button>
                  </form>
                </div>
              )}

              {formMode === 'forgot_request' && (
                <form onSubmit={handleRequestOTP} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Account Username</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><User className="w-4 h-4" /></span>
                      <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Type admin username" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setFormMode('login')} className="w-1/3 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl">Back</button>
                    <button type="submit" className="flex-grow py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md">Send Code</button>
                  </div>
                </form>
              )}

              {formMode === 'forgot_verify' && (
                <form onSubmit={handleVerifyAndReset} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Enter Verification Code</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Smartphone className="w-4 h-4" /></span>
                      <input type="number" required value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="Code" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-center" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Create New Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><KeyRound className="w-4 h-4" /></span>
                      <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium" />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md">Verify & Reset</button>
                </form>
              )}
            </motion.div>
          </div>
          <footer className="w-full py-3 text-center text-xs font-semibold text-gray-300/80 tracking-wider uppercase">Developed by <span className="text-white font-bold">A.B.Digital Work</span></footer>
        </motion.div>
      ) : (
        /* MAIN DASHBOARD PANEL */
        <motion.div key="dashboard-screen" className="min-h-screen flex flex-col md:flex-row w-full bg-[#f3f4f6] relative">
          
          {/* 📱 MOBILE APP HEADER BAR (Menu shifted to right side to avoid overlap) */}
          <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between no-print z-30 shadow-md">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="font-black text-xs uppercase tracking-wide truncate text-amber-300">{schoolData.school_name}</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">{role}</span>
            </div>
            
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold uppercase shadow tracking-wider shrink-0 cursor-pointer"
            >
              {isMobileMenuOpen ? '✕ CLOSE' : '☰ MENU'}
            </button>
          </div>

          {/* 🛑 PRINT MEDIA KE WAQT PURA SIDEBAR PANEL AUTO-HIDE HONA CHAHIYE */}
          <aside className={`
            no-print bg-slate-900 text-slate-300 flex flex-col z-20 shadow-xl border-r border-slate-800
            fixed md:relative inset-y-0 left-0 transform transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0 w-64 pt-16 md:pt-0' : '-translate-x-full md:translate-x-0 w-64'}
            ${isMobileMenuOpen ? 'flex' : 'hidden md:flex'}
          `}>
            <div className="p-5 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
              <div className="w-10 h-10 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                {schoolData.school_logo ? <img src={schoolData.school_logo} alt="Logo" className="w-full h-full object-cover" /> : <Sparkles className="w-5 h-5 text-white" />}
              </div>
              <div className="overflow-hidden">
                <h1 className="font-black text-white text-sm truncate uppercase tracking-wide">{schoolData.school_name}</h1>
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-emerald-400 animate-ping"></span> {role} Active</span>
              </div>
            </div>

            <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
              {role !== 'Parent' && (
                <button
                  onClick={() => {
                    setActiveTab('overview');
                    loadDashboardData(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide cursor-pointer text-left ${activeTab === 'overview' ? 'text-white bg-indigo-600 shadow-md' : 'hover:bg-slate-800/60 text-slate-400'}`}
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-300" />
                  <span>Overview Panel</span>
                </button>
              )}

              {role === 'Admin' && (
                <button onClick={() => { setActiveTab('registration'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide cursor-pointer text-left ${activeTab === 'registration' ? 'text-white bg-indigo-600 shadow-md' : 'hover:bg-slate-800/60 text-slate-400'}`}>
                  <Users className={`w-4 h-4 ${activeTab === 'registration' ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>Student Register</span>
                </button>
              )}

              {role === 'Admin' && (
                <button onClick={() => { setActiveTab('search_pay'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide cursor-pointer text-left ${activeTab === 'search_pay' ? 'text-white bg-indigo-600 shadow-md' : 'hover:bg-slate-800/60 text-slate-400'}`}>
                  <Search className={`w-4 h-4 ${activeTab === 'search_pay' ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>🔍 Search & Pay Fees</span>
                </button>
              )}

              {role === 'Admin' && (
                <button onClick={() => { setActiveTab('quick_fee_panel'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide cursor-pointer text-left ${activeTab === 'quick_fee_panel' ? 'text-white bg-indigo-600 shadow-md' : 'hover:bg-slate-800/60 text-slate-400'}`}>
                  <CreditCard className={`w-4 h-4 ${activeTab === 'quick_fee_panel' ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>⚡ Quick Fee Panel</span>
                </button>
              )}

              {role === 'Admin' && (
                <button onClick={() => { setActiveTab('class_management'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide cursor-pointer text-left ${activeTab === 'class_management' ? 'text-white bg-indigo-600 shadow-md' : 'hover:bg-slate-800/60 text-slate-400'}`}>
                  <IdCard className={`w-4 h-4 ${activeTab === 'class_management' ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>🏫 Class Management</span>
                </button>
              )}

              {(role === 'Admin' || role === 'Teacher') && (
                <button onClick={() => { setActiveTab('student_attendance'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide cursor-pointer text-left ${activeTab === 'student_attendance' ? 'text-white bg-indigo-600 shadow-md' : 'hover:bg-slate-800/60 text-slate-400'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${activeTab === 'student_attendance' ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>📋 Student Attendance</span>
                </button>
              )}

              {(role === 'Admin' || role === 'Teacher') && (
                <button onClick={() => { setActiveTab('exam_management'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide cursor-pointer text-left ${activeTab === 'exam_management' ? 'text-white bg-indigo-600 shadow-md' : 'hover:bg-slate-800/60 text-slate-400'}`}>
                  <FileText className={`w-4 h-4 ${activeTab === 'exam_management' ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>📝 Exam Management</span>
                </button>
              )}

              {role === 'Admin' && (
                <button onClick={() => { setActiveTab('payroll_attendance'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide cursor-pointer text-left ${activeTab === 'payroll_attendance' ? 'text-white bg-indigo-600 shadow-md' : 'hover:bg-slate-800/60 text-slate-400'}`}>
                  <Users className={`w-4 h-4 ${activeTab === 'payroll_attendance' ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>📅 Staff & Geo-Payroll</span>
                </button>
              )}

              {role === 'Admin' && (
                <button onClick={() => { setActiveTab('fee_report_center'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide cursor-pointer text-left ${activeTab === 'fee_report_center' ? 'text-white bg-emerald-600 shadow-md' : 'hover:bg-slate-800/60 text-slate-400'}`}>
                  <Coins className={`w-4 h-4 ${activeTab === 'fee_report_center' ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>🚀 Fee Report Center</span>
                </button>
              )}

              {role === 'Admin' && (
                <button onClick={() => { setActiveTab('expense_tracker'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide cursor-pointer text-left ${activeTab === 'expense_tracker' ? 'text-white bg-rose-600 shadow-md' : 'hover:bg-slate-800/60 text-slate-400'}`}>
                  <Coins className={`w-4 h-4 ${activeTab === 'expense_tracker' ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>📊 Income & Expenses</span>
                </button>
              )}

              {role === 'Admin' && (
                <button 
                  onClick={() => { setActiveTab('role_management'); setIsMobileMenuOpen(false); }} 
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide cursor-pointer text-left ${activeTab === 'role_management' ? 'text-white bg-indigo-600 shadow-md' : 'hover:bg-slate-800/60 text-slate-400'}`}
                >
                  <Users className="w-4 h-4 text-amber-300" />
                  <span>🛡️ Role Management Hub</span>
                </button>
              )}

              {role === 'Admin' && (
                <button onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide cursor-pointer text-left ${activeTab === 'settings' ? 'text-white bg-indigo-600 shadow-md' : 'hover:bg-slate-800/60 text-slate-400'}`}>
                  <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>Settings</span>
                </button>
              )}

              {role === 'Admin' && (
                <button onClick={() => { setActiveTab('promotion_panel'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide cursor-pointer text-left ${activeTab === 'promotion_panel' ? 'text-white bg-indigo-600 shadow-md' : 'hover:bg-slate-800/60 text-slate-400'}`}>
                  <Sparkles className={`w-4 h-4 ${activeTab === 'promotion_panel' ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>🚀 Session Promotion</span>
                </button>
              )}

            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-950/40">
              <button onClick={() => { localStorage.removeItem('token');  localStorage.removeItem('role'); setIsLoggedIn(false); }} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 cursor-pointer"><LogOut className="w-4 h-4" /><span>Secure Logout</span></button>
            </div>
          </aside>

          {/* MAIN CONTENT SPACE CONTAINER */}
          <div className="flex-grow flex flex-col min-w-0">
            <header className="no-print bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
              <h2 className="text-lg font-black text-gray-800 capitalize tracking-tight">⚙️ {activeTab.replace('_', ' ')} Control Hub</h2>
            </header>

            <main className="flex-grow p-6 overflow-y-auto">
              <Suspense fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              }>
              
              {activeTab === 'quick_fee_panel' && <QuickFeePanel />}
              {activeTab === 'promotion_panel' && <PromotionPanel />}

                {activeTab === 'role_management' && (
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm max-w-4xl">
                    <h3 className="text-base font-black text-gray-800 border-b border-gray-100 pb-3 mb-4">👑 User Role & Permission Control Hub</h3>
                    <p className="text-xs text-gray-500 mb-6 font-semibold">Yahan se aap system ke alag-alag users aur unke roles ko manage aur permissions assign kar sakte hain.</p>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="font-black text-indigo-900 text-sm mb-1">👑 Principal / Super Admin</h4>
                          <p className="text-[11px] text-gray-600">Poore system ka full access (Fees, Settings, Staff, Expenses, ID Cards).</p>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold">
                          <input type="checkbox" defaultChecked disabled className="w-4 h-4 accent-indigo-600 cursor-pointer" />
                          <span>Active (Default)</span>
                        </label>
                      </div>

                      <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="font-black text-emerald-900 text-sm mb-1">💼 Accountant / Fee Manager</h4>
                          <p className="text-[11px] text-gray-600">Sirf Fee Collection, Search & Pay, aur Fee Reports ka access.</p>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer bg-white border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 shadow-sm">
                          <input type="checkbox" onChange={(e) => alert(e.target.checked ? "Accountant Role Enabled!" : "Accountant Role Disabled!")} className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                          <span>Enable Role</span>
                        </label>
                      </div>

                      <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="font-black text-blue-900 text-sm mb-1">👨‍🏫 Teacher / Staff Access</h4>
                          <p className="text-[11px] text-gray-600">Student Attendance, Exam Management, aur khud ki Geo-Payroll attendance.</p>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer bg-white border border-blue-300 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-800 shadow-sm">
                          <input type="checkbox" defaultChecked onChange={(e) => alert(e.target.checked ? "Teacher Access Enabled!" : "Teacher Access Disabled!")} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                          <span>Enable Role</span>
                        </label>
                      </div>

                      <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="font-black text-amber-900 text-sm mb-1">👨‍👩‍👦 Parent Portal Access</h4>
                          <p className="text-[11px] text-gray-600">Sirf apne bache ki fee status, report card aur attendance dekhne ka access.</p>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer bg-white border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-800 shadow-sm">
                          <input type="checkbox" defaultChecked onChange={(e) => alert(e.target.checked ? "Parent Portal Enabled!" : "Parent Portal Disabled!")} className="w-4 h-4 accent-amber-600 cursor-pointer" />
                          <span>Enable Role</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'overview' && (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
                        <div><p className="text-[11px] font-black uppercase text-blue-100">कुल छात्र</p><h3 className="text-2xl font-black mt-1">{stats.total_students}</h3></div>
                        <Users className="w-8 h-8 opacity-20" />
                      </div>
                      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
                        <div><p className="text-[11px] font-black uppercase text-indigo-100">कुल फीस</p><h3 className="text-xl font-black mt-1">₹{stats.total_fees_target}</h3></div>
                        <Coins className="w-8 h-8 opacity-20" />
                      </div>
                      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
                        <div><p className="text-[11px] font-black uppercase text-emerald-100">कुल जमा</p><h3 className="text-xl font-black mt-1">₹{stats.total_fees_paid}</h3></div>
                        <Landmark className="w-8 h-8 opacity-20" />
                      </div>
                      <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
                        <div><p className="text-[11px] font-black uppercase text-amber-100">आज की जमा</p><h3 className="text-xl font-black mt-1">₹{stats.today_fees_paid}</h3></div>
                        <Wallet className="w-8 h-8 opacity-20" />
                      </div>
                      <div className="bg-gradient-to-br from-rose-500 to-rose-600 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
                        <div><p className="text-[11px] font-black uppercase text-rose-100">कुल बकाया</p><h3 className="text-xl font-black mt-1">₹{stats.total_pending}</h3></div>
                        <ShieldAlert className="w-8 h-8 opacity-20" />
                      </div>
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
                        <div><p className="text-[11px] font-black uppercase text-purple-100">कुल खर्चा</p><h3 className="text-xl font-black mt-1">₹{stats.total_expenses}</h3></div>
                        <HandCoins className="w-8 h-8 opacity-20" />
                      </div>
                      <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
                        <div><p className="text-[11px] font-black uppercase text-pink-100">👨‍🏫 कुल स्टाफ</p><h3 className="text-2xl font-black mt-1">{stats.total_staff || 0}</h3></div>
                        <Users className="w-8 h-8 opacity-20" />
                      </div>
                      <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
                        <div><p className="text-[11px] font-black uppercase text-teal-100">कुल आमदनी (Net Profit)</p><h3 className="text-2xl font-black mt-1">₹{stats.total_income}</h3></div>
                        <TrendingUp className="w-8 h-8 opacity-20" />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
  <div className="flex items-center justify-between border-b pb-4 mb-4">
    <div>
      <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">⚠️ Most Pending Fee Students</h3>
      <p className="text-[11px] text-gray-400 font-bold">Bache jinki fees sabse zyada बकाया hai (Auto-sorting Enabled)</p>
    </div>
    <span className="px-2.5 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase rounded-lg">Defaulters Priority</span>
  </div>
  <div className="overflow-x-auto">
    <table className="w-full text-left text-xs font-medium">
      <thead>
        <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b">
          <th className="p-3">Student & Class Details</th>
          <th className="p-3">Break-down Fee Structure</th>
          <th className="p-3">Total Pending</th>
          <th className="p-3 text-center">Operations Channel</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {pendingStudents.map((st) => (
          <tr key={st.id} className="hover:bg-slate-50/60 transition-all">
            <td className="p-3">
              <div className="font-black text-gray-800 text-sm">{st.name}</div>
              <div className="text-gray-400 font-bold text-[10px] uppercase mt-0.5">{st.class} - Sec {st.section} | 📱 {st.parent_mobile}</div>
            </td>
            <td className="p-3 space-y-1">
              <div className="flex items-center gap-2"><span className="w-20 font-bold text-gray-400 uppercase text-[9px]">School Fee:</span><span className="font-bold text-gray-700">₹{st.school_fee_total - st.school_fee_paid} due</span></div>
              <div className="flex items-center gap-2"><span className="w-20 font-bold text-gray-400 uppercase text-[9px]">Van/Bus Fee:</span><span className="font-bold text-gray-700">₹{st.transport_fee_total - st.transport_fee_paid} due</span></div>
            </td>
            <td className="p-3"><span className="px-2 py-1 bg-red-50 text-red-600 font-black text-sm rounded-lg">₹{st.total_pending}</span></td>
            <td className="p-3">
              <div className="flex items-center justify-center gap-2">
                <button 
                  type="button"
                  onClick={() => { localStorage.setItem('redirect_student_id', st.id); setActiveTab('search_pay'); }} 
                  className="px-3 py-2 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-wider rounded-xl shadow-sm cursor-pointer hover:bg-indigo-700 transition-all"
                >
                  फीस जमा करे
                </button>
                
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sendFeeReminder(st);
                  }} 
                  className="px-3 py-2 bg-amber-400 text-black font-black text-[10px] uppercase tracking-wider rounded-xl shadow-sm cursor-pointer hover:bg-amber-500 transition-all z-20 relative"
                >
                  🔔 याद दिलाएं (WhatsApp)
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

                {activeTab === 'settings' && (
                  <div className="max-w-2xl bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-base font-black text-gray-800 border-b border-gray-100 pb-3 mb-4">Complete System & Branding Settings</h3>
                    <form onSubmit={handleSaveSettings} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">School Name</label>
                          <input
                            type="text"
                            required
                            value={schoolData?.school_name || ''}
                            onChange={(e) => setSchoolData({...schoolData, school_name: e.target.value})}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Verified Admin Mobile</label>
                          <input
                            type="text"
                            required
                            value={schoolData?.school_mobile || ''}
                            onChange={(e) => setSchoolData({...schoolData, school_mobile: e.target.value})}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-indigo-600"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Official Email Address</label>
                          <input
                            type="email"
                            required
                            value={schoolData?.school_email || ''}
                            onChange={(e) => setSchoolData({...schoolData, school_email: e.target.value})}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Complete Physical Address</label>
                          <input
                            type="text"
                            required
                            value={schoolData?.school_address || ''}
                            onChange={(e) => setSchoolData({...schoolData, school_address: e.target.value})}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                        <div>
                          <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">📍 School Latitude</label>
                          <input
                            type="number"
                            step="any"
                            value={schoolData?.school_latitude || 23.2599}
                            onChange={(e) => setSchoolData({...schoolData, school_latitude: parseFloat(e.target.value)})}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">📍 School Longitude</label>
                          <input
                            type="number"
                            step="any"
                            value={schoolData?.school_longitude || 77.4126}
                            onChange={(e) => setSchoolData({...schoolData, school_longitude: parseFloat(e.target.value)})}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">📏 Attendance Radius (meters)</label>
                          <input
                            type="number"
                            value={schoolData?.school_location_radius || 100}
                            onChange={(e) => setSchoolData({...schoolData, school_location_radius: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 pt-2 border-t border-gray-100">
                        <div>
                          <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">🤖 Admin Telegram ID</label>
                          <input
                            type="text"
                            placeholder="e.g., 1989970458"
                            value={schoolData?.telegram_admin_id || ''}
                            onChange={(e) => setSchoolData({...schoolData, telegram_admin_id: e.target.value})}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                          />
                          <p className="text-[8px] text-gray-400 mt-1">
                            ⚡ @userinfobot se apni Telegram ID nikalein. Saare admin notifications yahan aayenge.
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Upload System Brand Logo</label>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl h-20">
                            <div className="w-12 h-12 bg-white border rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                              {schoolData?.school_logo ? <img src={schoolData.school_logo} alt="Preview" className="w-full h-full object-cover" /> : <Sparkles className="w-5 h-5 text-indigo-500" />}
                            </div>
                            <input type="file" accept="image/*" onChange={handleLogoChange} className="text-[10px] flex-grow" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Upload Principal Digital Signature</label>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl h-20">
                            <div className="w-16 h-12 bg-white border rounded-xl flex items-center justify-center overflow-hidden shrink-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
                              {schoolData?.school_signature ? <img src={schoolData.school_signature} alt="Signature Preview" className="w-full h-full object-contain p-1" /> : <Signature className="w-5 h-5 text-amber-500" />}
                            </div>
                            <input type="file" accept="image/*" onChange={handleSignatureChange} className="text-[10px] flex-grow" />
                          </div>
                        </div>
                      </div>
                      <button type="submit" className="w-full mt-4 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer uppercase tracking-wider">
                        Save All Enterprise Configurations
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'registration' && <StudentRegistration />}
                {activeTab === 'search_pay' && <SearchPayFees />}
                {activeTab === 'payroll_attendance' && <StaffPayrollAttendance />}
                {activeTab === 'fee_report_center' && <StudentFeeReport />}
                {activeTab === 'expense_tracker' && <ExpenseTracker />}
                {activeTab === 'class_management' && <IDCardStudio />}
                {activeTab === 'student_attendance' && <ClassAttendance />}
                {activeTab === 'exam_management' && <ExamManagement />}
              </Suspense>
            </main>

            <footer className="no-print w-full py-2.5 bg-white border-t border-gray-200 text-center text-[10px] font-black text-gray-400 tracking-wider uppercase">
              Developed & Maintained by <span className="text-gray-600 font-extrabold">A.B.Digital Work</span>
            </footer>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
}

const CircleCardIcon = ({ component: Component }) => (
  <Component className="w-8 h-8 opacity-20" />
);

export default App;
