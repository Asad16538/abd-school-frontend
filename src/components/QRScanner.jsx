// src/components/QRScanner.jsx
import React, { useState } from 'react';
import QrScanner from 'react-qr-scanner';

const QRScannerComponent = ({ onScan, onClose }) => {
  const [error, setError] = useState('');

  const handleScan = (data) => {
    if (data) {
      onScan(data.text);
    }
  };

  const handleError = (err) => {
    console.log('QR Scan Error:', err);
    setError('Camera access denied. Please allow camera permission.');
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800">📷 Scan QR Code</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 font-bold text-xl hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="relative">
          <QrScanner
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: '100%' }}
            constraints={{
              facingMode: 'environment'
            }}
          />
          {error && (
            <p className="text-red-500 text-xs mt-2 bg-red-50 p-2 rounded">
              ⚠️ {error}
            </p>
          )}
        </div>
        
        <p className="text-xs text-gray-400 text-center mt-3">
          School wall par lage QR code ko scan karein
        </p>
      </div>
    </div>
  );
};

export default QRScannerComponent;