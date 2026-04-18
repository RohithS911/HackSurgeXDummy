import { useState, useEffect, useRef } from 'react';
import { t } from '../translations';
import './WakeWordDetector.css';

const WAKE_WORDS = ['sita', 'hey sita', 'sita ai', 'seeta', 'hey seeta'];

function WakeWordDetector({ onWakeWordDetected, language = 'en' }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const enabledRef = useRef(true);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supported = !!SpeechRecognition;

  useEffect(() => {
    if (supported) startRecognition();
    return () => {
      enabledRef.current = false;
      stopRecognition();
    };
  }, []);

  const startRecognition = () => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        const matched = WAKE_WORDS.some(w => transcript.includes(w));
        if (matched) {
          console.log('Wake word detected:', transcript);
          setIsListening(true);
          if (onWakeWordDetected) onWakeWordDetected(0, 'Sita AI');
          setTimeout(() => setIsListening(false), 2000);
        }
      }
    };

    recognition.onend = () => {
      if (enabledRef.current) {
        try { recognition.start(); } catch (_) {}
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'not-allowed') {
        console.warn('Microphone permission denied for wake word');
      }
    };

    try { recognition.start(); } catch (_) {}
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
  };

  if (!supported) return null;

  return (
    <div className="wake-word-detector">
      <div className="wake-word-header">
        <div className="wake-word-info">
          <span className="wake-word-icon">🎤</span>
          <div className="wake-word-text">
            <h3>{t('voice_activation', language)}</h3>
            <p>{t('say_to_activate', language)}</p>
          </div>
        </div>
      </div>

      {isListening && (
        <div className="wake-word-listening">
          <div className="pulse-animation"></div>
          <span>{t('wake_detected', language)}</span>
        </div>
      )}
    </div>
  );
}

export default WakeWordDetector;
