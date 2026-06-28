// src/components/QRScanner.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QRScannerComponent = ({ onScan, onClose }) => {
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const scannerRef = useRef(null);
  const containerId = 'qr-reader-' + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    // ✅ Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      startScanner();
    }, 500);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      // ✅ Check if element exists
      const element = document.getElementById(containerId);
      if (!element) {
        setError('Scanner element not found. Please refresh.');
        return;
      }

      // ✅ Create scanner instance
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      // ✅ Start scanning
      await scanner.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          // ✅ QR Code scanned successfully
          stopScanner();
          setIsScanning(false);
          onScan(decodedText);
        },
        (errorMessage) => {
          // Ignore errors (continuous scanning)
          console.log('Scanning...');
        }
      );
      
      setIsScanning(true);
      setHasPermission(true);
      setError('');
    } catch (err) {
      console.error('QR Scanner error:', err);
      if (err.message?.includes('permission') || err.message?.includes('denied')) {
        setError('Camera access denied. Please allow camera permission from browser settings.');
      } else if (err.message?.includes('not found')) {
        setError('No camera found on this device.');
      } else {
        setError('Camera access denied. Please allow camera permission.');
      }
      setHasPermission(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
      } catch (e) {
        console.log('Stop scanner error:', e);
      }
    }
  };

  const retryPermission = async () => {
    setError('');
    setIsScanning(false);
    setHasPermission(false);
    stopScanner();
    
    // ✅ Small delay before restart
    setTimeout(() => {
      startScanner();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800">📷 Scan QR Code</h3>
          <button 
            onClick={() => {
              stopScanner();
              onClose();
            }} 
            className="text-gray-500 font-bold text-xl hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {/* ✅ QR Reader Container - Unique ID */}
        <div 
          id={containerId} 
          style={{ 
            width: '100%', 
            minHeight: '300px',
            backgroundColor: '#000',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        ></div>

        {!hasPermission && !error && (
          <div className="mt-3 text-center py-2">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-gray-500 mt-2">Requesting camera permission...</p>
          </div>
        )}

        {error && (
          <div className="mt-3">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <p className="text-red-600 text-sm font-bold">⚠️ {error}</p>
            </div>
            <button 
              onClick={retryPermission}
              className="w-full mt-2 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition"
            >
              🔄 Retry Camera Permission
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              💡 Browser settings mein camera permission enable karein
            </p>
          </div>
        )}
        
        {hasPermission && (
          <p className="text-xs text-green-600 text-center mt-3 font-bold">
            ✅ Camera active. QR code scan karein.
          </p>
        )}
      </div>
    </div>
  );
};

export default QRScannerComponent;
