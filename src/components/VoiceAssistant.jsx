import { useState } from 'react';
import VoiceController from './VoiceController';
import WakeWordDetector from './WakeWordDetector';
import './VoiceAssistant.css';

function VoiceAssistant({ onLanguageDetected, onCommand, currentLanguage, onPhotoCapture }) {
  const [showController, setShowController] = useState(false);

  const handleWakeWordDetected = () => {
    console.log('Wake word detected, opening voice controller');
    setShowController(true);
  };

  return (
    <>
      <div className="voice-assistant">
        <WakeWordDetector onWakeWordDetected={handleWakeWordDetected} language={currentLanguage} />

        {/* Manual Voice Button */}
        <button
          className="voice-btn"
          onClick={() => setShowController(true)}
          aria-label="Voice Assistant"
        >
          <span className="voice-btn-ring ring-1"></span>
          <span className="voice-btn-ring ring-2"></span>
          <span className="voice-btn-ring ring-3"></span>
          <svg className="voice-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" x2="12" y1="19" y2="22"/>
          </svg>
        </button>
      </div>

      {showController && (
        <VoiceController
          onCommand={onCommand}
          onLanguageDetected={onLanguageDetected}
          currentLanguage={currentLanguage}
          onPhotoCapture={onPhotoCapture}
          onClose={() => setShowController(false)}
        />
      )}
    </>
  );
}

export default VoiceAssistant;
