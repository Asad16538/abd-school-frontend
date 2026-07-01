// src/components/StaffTelegramLink.jsx
import React, { useState } from 'react';
import axios from 'axios';

const StaffTelegramLink = () => {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLink = async () => {
    if (!mobile || mobile.length < 10) {
      setMessage('❌ Please enter a valid 10-digit mobile number!');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // 🎯 Current URL se Telegram ID nikaalo
      const urlParams = new URLSearchParams(window.location.search);
      const telegramId = urlParams.get('telegram_id') || 'UNKNOWN';

      const res = await axios.post('https://abd-school-backend.onrender.com/api/staff/link-telegram', {
        mobile: mobile,
        telegram_id: telegramId
      });

      if (res.data.success) {
        setMessage('✅ ' + res.data.message);
      } else {
        setMessage('❌ ' + res.data.error);
      }
    } catch (err) {
      setMessage('❌ Server error! Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
        <h2 className="text-xl font-black text-gray-800 mb-4">👨‍🏫 Staff Telegram Link</h2>
        <p className="text-xs text-gray-500 mb-6 font-bold uppercase">
          Apna registered mobile number daalein Telegram ID link karne ke liye.
        </p>
        <input
          type="number"
          placeholder="Enter Registered Mobile"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          className="w-full p-3 border border-gray-200 rounded-xl mb-4 text-sm"
        />
        <button
          onClick={handleLink}
          disabled={loading}
          className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition"
        >
          {loading ? 'Linking...' : 'Link Account'}
        </button>
        {message && (
          <div className={`mt-4 p-3 rounded-xl text-sm font-bold ${message.includes('✅') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffTelegramLink;