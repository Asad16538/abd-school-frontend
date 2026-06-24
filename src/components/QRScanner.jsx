// src/components/QRScanner.jsx
import React, { useState, useEffect } from 'react';
import QrScanner from 'react-qr-scanner';

const QRScannerComponent = ({ onScan, onClose }) => {
  const [error, setError] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    // ✅ Camera permission request
    const requestCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        stream.getTracks().forEach(track => track.stop());
        setPermissionGranted(true);
        setError('');
      } catch (err) {
        console.log('Camera permission error:', err);
        setError('Camera access denied. Please allow camera permission.');
        setPermissionGranted(false);
      }
    };

    requestCameraPermission();
  }, []);

  const handleScan = (data) => {
    if (data) {
      onScan(data.text);
    }
  };

  const handleError = (err) => {
    console.log('QR Scan Error:', err);
    if (err?.message?.includes('Permission denied')) {
      setError('Camera access denied. Please allow camera permission from browser settings.');
    } else {
      setError('Camera access denied. Please allow camera permission.');
    }
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
          {!permissionGranted && !error && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Requesting camera permission...</p>
            </div>
          )}
          
          {permissionGranted && (
            <QrScanner
              delay={300}
              onError={handleError}
              onScan={handleScan}
              style={{ width: '100%' }}
              constraints={{
                facingMode: 'environment'
              }}
            />
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-600 text-sm font-bold">⚠️ {error}</p>
              <button 
                onClick={() => {
                  // Retry permission
                  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                    .then(stream => {
                      stream.getTracks().forEach(track => track.stop());
                      setPermissionGranted(true);
                      setError('');
                    })
                    .catch(() => {
                      setError('Camera access denied. Please allow camera permission.');
                    });
                }}
                className="mt-3 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg"
              >
                🔄 Retry
              </button>
            </div>
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
