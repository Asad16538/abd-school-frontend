// src/components/QRScanner.jsx
import React, { useState, useEffect, useRef } from 'react';

const QRScannerComponent = ({ onScan, onClose }) => {
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load jsQR library
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
    script.onload = () => {
      console.log('✅ jsQR loaded');
      setIsLoaded(true);
      startCamera();
    };
    script.onerror = () => {
      setError('Failed to load QR scanner library');
    };
    document.head.appendChild(script);

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', 
          width: { ideal: 640 }, 
          height: { ideal: 480 } 
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        setError('');
        // Start scanning after video is ready
        videoRef.current.onloadedmetadata = () => {
          scanQRCode();
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied. Please allow camera permission.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const scanQRCode = () => {
    if (!isScanning || !videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!canvas) return;

    const context = canvas.getContext('2d');
    
    // Check if video has data
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Use jsQR to decode
      if (window.jsQR) {
        try {
          const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          
          if (code && code.data) {
            console.log('✅ QR Scanned:', code.data);
            stopCamera();
            onScan(code.data);
            return;
          }
        } catch (err) {
          console.log('Scan error:', err);
        }
      }
    }

    // Continue scanning
    requestAnimationFrame(scanQRCode);
  };

  const retryPermission = () => {
    setError('');
    stopCamera();
    startCamera();
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
        
        <div className="relative bg-black rounded-xl overflow-hidden aspect-square">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
            autoPlay
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-green-500 rounded-lg"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-0.5 bg-green-500/50 animate-pulse"></div>
            </div>
          )}
        </div>

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