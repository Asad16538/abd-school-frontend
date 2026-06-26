// src/components/QRScanner.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QRScannerComponent = ({ onScan, onClose }) => {
  const [error, setError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };

        // ✅ FIX: Use spread operator to capture all arguments
        await scanner.start(
          { facingMode: 'environment' },
          config,
          (...args) => {
            // ✅ First argument is the decoded text
            const decodedText = args[0];
            console.log('✅ QR Scanned:', decodedText);
            scanner.stop();
            if (decodedText) {
              onScan(decodedText);
            }
          },
          (errorMessage) => {
            // Ignore errors
          }
        );
        setError('');
      } catch (err) {
        console.error('QR Scanner error:', err);
        setError('Camera access denied. Please allow camera permission.');
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  const retryPermission = () => {
    setError('');
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current.clear().catch(() => {});
    }
    const startAgain = async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (...args) => {
            const decodedText = args[0];
            scanner.stop();
            if (decodedText) {
              onScan(decodedText);
            }
          },
          () => {}
        );
        setError('');
      } catch (err) {
        setError('Camera access denied. Please allow camera permission.');
      }
    };
    startAgain();
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
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
        
        <div id="qr-reader" style={{ width: '100%' }}></div>

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
        
        <p className="text-xs text-gray-400 text-center mt-3">
          School wall par lage QR code ko scan karein
        </p>
      </div>
    </div>
  );
};

export default QRScannerComponent;