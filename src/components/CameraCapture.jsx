import { useState, useRef, useEffect } from 'react';
import './CameraCapture.css';

function CameraCapture({ onCapture, onClose, autoCapture = false }) {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [isCaptured, setIsCaptured] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const countdownStartedRef = useRef(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Auto-start countdown when camera is ready (for autonomous mode)
  useEffect(() => {
    if (autoCapture && stream && !countdownStartedRef.current && !isCaptured) {
      countdownStartedRef.current = true;
      // Wait 1 second for camera to stabilize, then start countdown
      setTimeout(() => {
        startCountdown();
      }, 1000);
    }
  }, [autoCapture, stream, isCaptured]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startCountdown = () => {
    setCountdown(5);
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          capturePhoto();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      console.error('Video or canvas not available');
      return;
    }

    console.log('Capturing photo...');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        console.log('Photo captured, blob size:', blob.size);
        
        // Create file from blob
        const file = new File([blob], 'soil-image.jpg', { type: 'image/jpeg' });
        
        setIsCaptured(true);
        stopCamera();
        
        // Pass file to parent FIRST
        if (onCapture) {
          console.log('Calling onCapture with file:', file.name);
          onCapture(file);
        }
        
        // For autonomous mode, dispatch close event after a brief delay
        // This allows the agent to receive the file before modal closes
        if (autoCapture) {
          console.log('Auto-capture mode: dispatching close event');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('closeCameraCapture'));
          }, 500);
        }
      } else {
        console.error('Failed to create blob from canvas');
      }
    }, 'image/jpeg', 0.95);
  };

  const handleManualCapture = () => {
    capturePhoto();
  };

  const handleRetake = () => {
    setIsCaptured(false);
    setCountdown(null);
    startCamera();
  };

  return (
    <div className="camera-capture-overlay">
      <div className="camera-capture-container">
        <button className="camera-close-btn" onClick={onClose}>×</button>

        <div className="camera-header">
          <h2>📷 Capture Soil Image</h2>
          <p>Position the camera over the soil</p>
        </div>

        {error && (
          <div className="camera-error">
            <p>⚠️ {error}</p>
            <button className="btn-retry" onClick={startCamera}>
              Retry
            </button>
          </div>
        )}

        {!error && (
          <>
            <div className="camera-viewport">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={isCaptured ? 'hidden' : ''}
              />
              
              <canvas
                ref={canvasRef}
                className={!isCaptured ? 'hidden' : ''}
              />

              {/* Capture guide overlay */}
              {!isCaptured && stream && (
                <div className="capture-guide">
                  <div className="guide-frame"></div>
                  <p className="guide-text">Align soil within frame</p>
                </div>
              )}

              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="countdown-overlay">
                  <div className="countdown-number">{countdown}</div>
                </div>
              )}
            </div>

            <div className="camera-controls">
              {!isCaptured && !autoCapture ? (
                <>
                  <button 
                    className="btn-capture"
                    onClick={handleManualCapture}
                    disabled={!stream || countdown !== null}
                  >
                    📸 Capture Now
                  </button>
                  <button 
                    className="btn-countdown"
                    onClick={startCountdown}
                    disabled={!stream || countdown !== null}
                  >
                    ⏱️ 5s Timer
                  </button>
                </>
              ) : !isCaptured && autoCapture ? (
                <div className="auto-capture-message">
                  <p>🤖 Autonomous capture in progress...</p>
                </div>
              ) : (
                <>
                  <button className="btn-retake" onClick={handleRetake}>
                    🔄 Retake
                  </button>
                  <button className="btn-use" onClick={onClose}>
                    ✓ Use Photo
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CameraCapture;
