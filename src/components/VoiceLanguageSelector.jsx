import { useState } from 'react';
import sarvamVoiceService from '../services/sarvamVoiceService';
import './VoiceLanguageSelector.css';

function VoiceLanguageSelector({ onLanguageSelect, onClose }) {
  const [isListening, setIsListening] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [error, setError] = useState(null);

  const detectLanguageFromSpeech = (text) => {
    // Language detection based on keywords
    const patterns = {
      'en': /english|अंग्रेजी|ಇಂಗ್ಲಿಷ್|ஆங்கிலம்|ఇంగ్లీష్/i,
      'hi': /hindi|हिंदी|ಹಿಂದಿ|இந்தி|హిందీ/i,
      'kn': /kannada|कन्नड़|ಕನ್ನಡ|கன்னடம்|కన్నడ/i,
      'ta': /tamil|तमिल|ತಮಿಳು|தமிழ்|తమిళం/i,
      'te': /telugu|तेलुगु|ತೆಲುಗು|தெலுங்கு|తెలుగు/i
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }

    return null;
  };

  const startListening = async () => {
    try {
      setError(null);
      setDetectedLanguage(null);
      
      await sarvamVoiceService.startRecording();
      setIsListening(true);
      
      // Auto-stop after 5 seconds
      setTimeout(async () => {
        if (isListening) {
          await stopListening();
        }
      }, 5000);
    } catch (err) {
      setError(err.message);
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      const audioBlob = await sarvamVoiceService.stopRecording();
      setIsListening(false);
      
      // Try to detect with multiple languages
      const languages = ['hi-IN', 'en-IN', 'kn-IN', 'ta-IN', 'te-IN'];
      
      for (const lang of languages) {
        try {
          const transcript = await sarvamVoiceService.speechToText(audioBlob, lang);
          
          if (transcript) {
            console.log('Detected transcript:', transcript, 'in language:', lang);
            const detected = detectLanguageFromSpeech(transcript);
            
            if (detected) {
              setDetectedLanguage(detected);
              setTimeout(() => {
                onLanguageSelect(detected);
                onClose();
              }, 1000);
              return;
            }
          }
        } catch (err) {
          console.log(`Failed with ${lang}:`, err.message);
        }
      }
      
      setError('Could not detect language. Please try again.');
    } catch (err) {
      setError(err.message);
      setIsListening(false);
    }
  };

  const languages = [
    { code: 'en', label: 'English', native: 'English', prompt: 'Say "English"' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी', prompt: 'Say "Hindi"' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', prompt: 'Say "Kannada"' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்', prompt: 'Say "Tamil"' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు', prompt: 'Say "Telugu"' }
  ];

  return (
    <div className="voice-language-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>🎙️ Select Language by Voice</h2>
        <p className="modal-subtitle">Powered by Sarvam AI</p>

        <div className="voice-indicator">
          <button 
            className={`voice-circle ${isListening ? 'listening' : ''}`}
            onClick={isListening ? stopListening : startListening}
          >
            {isListening ? '🎤' : '🎙️'}
          </button>
          {isListening && <div className="pulse-wave"></div>}
        </div>

        {isListening && (
          <p className="status-text">Listening... Speak now!</p>
        )}

        {detectedLanguage && (
          <p className="detected-text">
            ✓ Detected: {languages.find(l => l.code === detectedLanguage)?.native}
          </p>
        )}

        {error && (
          <p className="error-text">⚠️ {error}</p>
        )}

        <div className="language-hints">
          <p className="hints-title">Say one of these:</p>
          {languages.map(lang => (
            <div key={lang.code} className="hint-item">
              <span className="hint-native">{lang.native}</span>
              <span className="hint-prompt">"{lang.label}"</span>
            </div>
          ))}
        </div>

        <button className="btn-manual" onClick={onClose}>
          Or select manually
        </button>
      </div>
    </div>
  );
}

export default VoiceLanguageSelector;
