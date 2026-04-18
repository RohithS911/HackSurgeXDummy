import { useState, useRef, useEffect } from 'react';
import { analyzeSoil } from '../services/soilService';
import CameraCapture from './CameraCapture';
import { Camera, UploadCloud, RefreshCw, ChevronLeft, Image as ImageIcon, AlertCircle } from 'lucide-react';
import './UploadScreen.css';

function UploadScreen({ onComplete, onBack, language, voiceCapturedPhoto, onPhotoProcessed }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const galleryInputRef = useRef(null);

  useEffect(() => {
    if (voiceCapturedPhoto) {
      setImage(voiceCapturedPhoto);
      setPreview(URL.createObjectURL(voiceCapturedPhoto));
      setError(null);
      if (onPhotoProcessed) onPhotoProcessed();
    }
  }, [voiceCapturedPhoto, onPhotoProcessed]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    validateAndSetFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setError(null);
    } else {
      setError('Please select a valid image file.');
    }
  };

  const handleCameraCapture = (file) => {
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError(null);
    setShowCamera(false);
  };

  const handleAnalyze = async () => {
    if (!image) {
      setError('No image selected. Please select an image first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await analyzeSoil(image, language);
      onComplete(result);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetUpload = () => {
    setImage(null);
    setPreview(null);
    setError(null);
  };

  return (
    <div className="screen upload-screen animate-fade-in">
      <div className="header-glass">
        <button className="icon-btn-back" onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="screen-title text-gradient">Capture Soil</h1>
        <div style={{ width: 24 }}></div> {/* Spacer for alignment */}
      </div>

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {!preview && (
        <div className="upload-container">
          <div
            className={`drag-drop-zone glass-panel ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => galleryInputRef.current.click()}
          >
            <div className="upload-icon-pulse">
              <UploadCloud size={48} className="text-primary" />
            </div>
            <h3>Upload Soil Photo</h3>
            <p>Drag and drop or click to browse</p>
          </div>

          <div className="divider">
            <span>OR</span>
          </div>

          <button className="btn btn-secondary btn-large" onClick={() => setShowCamera(true)}>
            <Camera size={20} />
            <span>Open Camera</span>
          </button>

          {error && (
            <div className="alert-glass error-alert mt-4">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {preview && (
        <div className="preview-container">
          <div className="image-preview-card glass-panel">
            <img src={preview} alt="Soil preview" />
            <div className="preview-overlay">
              <ImageIcon size={24} />
              <span>Soil Sample Ready</span>
            </div>
          </div>

          {error && (
            <div className="alert-glass error-alert mt-4">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="action-row mt-6">
            <button className="btn btn-secondary flex-1" onClick={resetUpload}>
              <RefreshCw size={18} />
              <span>Retake</span>
            </button>
            <button
              className="btn btn-primary flex-2"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-small" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <BrainCircuit size={18} />
                  <span>Analyze Soil</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}

// Need to import BrainCircuit since it is used in the analyze button
import { BrainCircuit } from 'lucide-react';

export default UploadScreen;
