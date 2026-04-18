import { useState, useRef, useEffect } from 'react';
import sarvamVoiceService from '../services/sarvamVoiceService';
import autonomousAgentService from '../services/autonomousAgentService';
import { t } from '../translations';
import './VoiceController.css';

function VoiceController({ onCommand, onLanguageDetected, currentLanguage, onClose, onPhotoCapture }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [agentStatus, setAgentStatus] = useState(null);
  const [isAgentProcessing, setIsAgentProcessing] = useState(false);

  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Auto-start recording when modal opens
  useEffect(() => {
    startRecording();
    return () => stopVisualization();
  }, []);

  const startVisualization = (stream) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    microphone.connect(analyser);
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;
    drawVisualization();
  };

  const drawVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;
      if (!analyser || !dataArray) return;
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barCount = 40;
      const barWidth = canvas.width / barCount;
      const centerY = canvas.height / 2;
      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor(i * dataArray.length / barCount);
        const value = dataArray[dataIndex];
        const barHeight = (value / 255) * (canvas.height / 2);
        const intensity = value / 255;
        const hue = 140 - (intensity * 40);
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        ctx.fillRect(i * barWidth, centerY - barHeight / 2, barWidth - 2, barHeight);
      }
    };
    draw();
  };

  const stopVisualization = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
  };

  const handleVoiceCommand = (text) => {
    const lowerText = text.toLowerCase();

    const languageKeywords = {
      'en': ['english', 'अंग्रेजी', 'ಇಂಗ್ಲಿಷ್', 'ஆங்கிலம்', 'ఇంగ్లీష్', 'इंग्रजी', 'ইংরেজি', 'અંગ્રેજી', 'ਅੰਗਰੇਜ਼ੀ', 'ഇംഗ്ലീഷ്', 'ଇଂରାଜୀ', 'ইংৰাজী'],
      'hi': ['hindi', 'हिंदी', 'ಹಿಂದಿ', 'இந்தி', 'హిందీ', 'हिन्दी', 'হিন্দি', 'હિન્દી', 'ਹਿੰਦੀ', 'ഹിന്ദി', 'ହିନ୍ଦୀ', 'হিন্দী'],
      'kn': ['kannada', 'कन्नड़', 'ಕನ್ನಡ', 'கன்னடம்', 'కన్నడ', 'कन्नड', 'কন্নড', 'કન્નડ', 'ਕੰਨੜ', 'കന്നഡ', 'କନ୍ନଡ', 'কান্নাডা'],
      'ta': ['tamil', 'तमिल', 'ತಮಿಳು', 'தமிழ்', 'తమిళం', 'तामिळ', 'তামিল', 'તમિલ', 'ਤਮਿਲ', 'തമിഴ്', 'ତାମିଲ', 'তামিল'],
      'te': ['telugu', 'तेलुगु', 'ತೆಲುಗು', 'தெலுங்கு', 'తెలుగు', 'तेलगू', 'তেলুগু', 'તેલુગુ', 'ਤੇਲਗੂ', 'തെലുങ്ക്', 'ତେଲୁଗୁ', 'তেলেগু'],
      'mr': ['marathi', 'मराठी', 'ಮರಾಠಿ', 'மராத்தி', 'మరాఠీ', 'মারাঠি', 'મરાઠી', 'ਮਰਾਠੀ', 'മറാത്തി', 'ମରାଠୀ', 'মাৰাঠী'],
      'bn': ['bengali', 'bangla', 'बंगाली', 'ಬಂಗಾಳಿ', 'வங்காளம்', 'బెంగాలీ', 'बांग्ला', 'বাংলা', 'બંગાળી', 'ਬੰਗਾਲੀ', 'ബംഗാളി', 'ବଙ୍ଗାଳୀ', 'বাংলা'],
      'gu': ['gujarati', 'गुजराती', 'ಗುಜರಾತಿ', 'குஜராத்தி', 'గుజరాతీ', 'गुजराती', 'গুজরাটি', 'ગુજરાતી', 'ਗੁਜਰਾਤੀ', 'ഗുജറാത്തി', 'ଗୁଜରାଟୀ', 'গুজৰাটী'],
      'pa': ['punjabi', 'पंजाबी', 'ಪಂಜಾಬಿ', 'பஞ்சாபி', 'పంజాబీ', 'पंजाबी', 'পাঞ্জাবি', 'પંજાબી', 'ਪੰਜਾਬੀ', 'പഞ്ചാബി', 'ପଞ୍ଜାବୀ', 'পাঞ্জাবী'],
      'ml': ['malayalam', 'मलयालम', 'ಮಲಯಾಳಂ', 'மலையாளம்', 'మలయాళం', 'मल्याळम', 'মালায়ালাম', 'મલयાలమ', 'ਮਲਿਆਲਮ', 'മലയാളം', 'ମାଲାୟାଲମ', 'মালায়ালম'],
      'or': ['odia', 'oriya', 'ओड़िया', 'ಒಡಿಯಾ', 'ஒடியா', 'ఒడియా', 'ओडिया', 'ওড়িয়া', 'ઓડિયા', 'ਓੜੀਆ', 'ഒഡിയ', 'ଓଡ଼ିଆ'],
      'as': ['assamese', 'असमिया', 'ಅಸ್ಸಾಮೀಸ್', 'அஸ்ஸாமி', 'అస్సామీస్', 'आसामी', 'আসামি', 'આસામী', 'ਅਸਾਮੀ', 'അസ്സാമീസ്', 'ଆସାମୀ', 'অসমীয়া']
    };

    for (const [langCode, keywords] of Object.entries(languageKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        onLanguageDetected(langCode);
        return;
      }
    }

    const analyzeKeywords = ['analyze', 'analyse', 'soil', 'check soil', 'test soil', 'scan soil',
      'विश्लेषण', 'मिट्टी', 'ವಿಶ್ಲೇಷಣೆ', 'மண்', 'విశ్లేషణ', 'నేల', 'माती',
      'বিশ্লেষণ', 'মাটি', 'વિશ્લેષણ', 'માટી', 'ਵਿਸ਼ਲੇਸ਼ਣ', 'ਮਿੱਟੀ', 'വിശകലനം', 'മണ്ണ്',
      'ବିଶ୍ଳେଷଣ', 'ମାଟି'];

    if (analyzeKeywords.some(keyword => lowerText.includes(keyword))) {
      setTranscript(t('starting_analysis', currentLanguage));
      setIsAgentProcessing(true);
      autonomousAgentService.setCallbacks(
        (status) => { setAgentStatus(status); setTranscript(status.message); },
        (result) => {
          if (onCommand) onCommand('analysis_complete', { ...result.analysis, audioBlobs: result.audioBlobs, isAgenticWorkflow: result.isAgenticWorkflow });
          setIsAgentProcessing(false);
          setTimeout(() => onClose(), 1000);
        }
      );
      autonomousAgentService.executeAnalysisWorkflow(currentLanguage);
      return;
    }

    const photoKeywords = ['photo', 'picture', 'camera', 'take', 'capture', 'upload',
      'फोटो', 'ಫೋಟೋ', 'புகைப்படம்', 'ఫోటో', 'ছবি', 'ફોટો', 'ਫੋਟੋ', 'ഫോട്ടോ', 'ଫଟୋ', 'ফটো'];
    if (photoKeywords.some(keyword => lowerText.includes(keyword))) {
      setTranscript(t('opening_photo', currentLanguage));
      setTimeout(() => setShowPhotoOptions(true), 500);
      return;
    }

    const commands = {
      history: ['history', 'previous', 'past', 'show', 'इतिहास', 'ಇತಿಹಾಸ', 'வரலாறு', 'చరిత్ర', 'ইতিহাস', 'ઇતિહાસ', 'ਇਤਿਹਾਸ', 'ചരിത്രം', 'ଇତିହାସ', 'record', 'results'],
      settings: ['settings', 'setting', 'सेटिंग', 'ಸೆಟ್ಟಿಂಗ್', 'அமைப்புகள்', 'సెట్టింగ్స్', 'সেটিংস', 'સેટિંગ્સ', 'ਸੈਟਿੰਗਾਂ', 'ക്രമീകരണങ്ങൾ', 'ସେଟିଂସ', 'change language', 'preferences']
    };

    for (const [action, keywords] of Object.entries(commands)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        onCommand(action);
        return;
      }
    }

    onCommand('transcript', text);
  };

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');
      const stream = await sarvamVoiceService.startRecording();
      setIsRecording(true);
      startVisualization(stream);
    } catch (err) {
      setError(err.message);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      stopVisualization();
      const audioBlob = await sarvamVoiceService.stopRecording();
      setIsRecording(false);
      setAudioLevel(0);

      if (audioBlob.size < 1000) {
        setError(t('recording_too_short', currentLanguage));
        return;
      }

      setTranscript(t('processing', currentLanguage));

      try {
        const languageCode = sarvamVoiceService.getLanguageCode(currentLanguage);
        const text = await sarvamVoiceService.speechToText(audioBlob, languageCode);

        if (!text || text.trim() === '') {
          setTranscript(t('no_speech', currentLanguage));
          return;
        }

        setTranscript(text);

        const lowerText = text.toLowerCase();
        const photoKeywords = ['photo', 'picture', 'camera', 'take', 'capture', 'upload',
          'फोटो', 'ಫೋಟೋ', 'புகைப்படம்', 'ఫోటో', 'ছবি', 'ફોટો', 'ਫੋਟੋ', 'ഫോട്ടോ', 'ଫଟୋ', 'ফটো'];
        const isPhotoCommand = photoKeywords.some(keyword => lowerText.includes(keyword));

        handleVoiceCommand(text);

        if (!isPhotoCommand) setTimeout(() => onClose(), 2000);
      } catch (apiError) {
        setError(apiError.message || t('processing_failed', currentLanguage));
        setTranscript('');
      }
    } catch (err) {
      setError(err.message || t('recording_failed', currentLanguage));
      setIsRecording(false);
      setAudioLevel(0);
      stopVisualization();
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (onPhotoCapture) onPhotoCapture(file);
      onClose();
    }
  };

  // Translated hint chips based on language
  const hints = {
    en: ['"Analyze the soil"', '"Take photo"', '"Show history"'],
    hi: ['"मिट्टी का विश्लेषण करें"', '"फोटो लें"', '"इतिहास दिखाएं"'],
    kn: ['"ಮಣ್ಣು ವಿಶ್ಲೇಷಿಸಿ"', '"ಫೋಟೋ ತೆಗೆಯಿರಿ"', '"ಇತಿಹಾಸ ತೋರಿಸಿ"'],
    ta: ['"மண் பகுப்பாய்வு"', '"புகைப்படம் எடு"', '"வரலாறு காட்டு"'],
    te: ['"నేల విశ్లేషించు"', '"ఫోటో తీయి"', '"చరిత్ర చూపు"'],
    mr: ['"माती विश्लेषण करा"', '"फोटो घ्या"', '"इतिहास दाखवा"'],
    bn: ['"মাটি বিশ্লেষণ করুন"', '"ছবি তুলুন"', '"ইতিহাস দেখান"'],
    gu: ['"માટી વિશ્લેષણ"', '"ફોટો લો"', '"ઇતિહાસ બતાવો"'],
    pa: ['"ਮਿੱਟੀ ਵਿਸ਼ਲੇਸ਼ਣ"', '"ਫੋਟੋ ਲਓ"', '"ਇਤਿਹਾਸ ਦਿਖਾਓ"'],
    ml: ['"മണ്ണ് വിശകലനം"', '"ഫോട്ടോ എടുക്കുക"', '"ചരിത്രം കാണുക"'],
    or: ['"ମାଟି ବିଶ୍ଳେଷଣ"', '"ଫଟୋ ନିଅ"', '"ଇତିହାସ ଦେଖ"'],
    as: ['"মাটি বিশ্লেষণ"', '"ফটো লওক"', '"ইতিহাস দেখুৱাওক"'],
  };
  const currentHints = hints[currentLanguage] || hints['en'];

  return (
    <div className="voice-controller-overlay">
      <div className="voice-controller-modal">
        <button className="voice-close-btn" onClick={onClose}>×</button>

        {!showPhotoOptions ? (
          <>
            <div className="voice-header">
              <h2>🎙️ {t('voice_command', currentLanguage)}</h2>
              <p className="voice-subtitle">
                {isRecording ? t('listening', currentLanguage) : t('processing', currentLanguage)}
              </p>
            </div>

            <div className="voice-visualizer-container">
              <canvas ref={canvasRef} className="voice-canvas" width="300" height="120" />
              {!isRecording && audioLevel === 0 && (
                <div className="voice-placeholder">
                  <div className="placeholder-bars">
                    {[...Array(40)].map((_, i) => (
                      <div key={i} className="placeholder-bar"></div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="voice-level-indicator">
              <div className="level-bar">
                <div className="level-fill" style={{ width: `${(audioLevel / 255) * 100}%` }}></div>
              </div>
              <span className="level-text">
                {isRecording ? `${Math.round((audioLevel / 255) * 100)}%` : t('ready', currentLanguage)}
              </span>
            </div>

            {transcript && (
              <div className="voice-transcript"><p>{transcript}</p></div>
            )}

            {error && (
              <div className="voice-error"><p>⚠️ {error}</p></div>
            )}

            {/* Done button — only shown while recording */}
            {isRecording && (
              <div className="voice-controls">
                <button className="voice-stop-btn" onClick={stopRecording}>
                  <span className="stop-icon">⏹️</span>
                  <span>{t('done', currentLanguage)}</span>
                </button>
              </div>
            )}

            <div className="voice-hints">
              <p className="hints-title">{t('try_saying', currentLanguage)}</p>
              <div className="hints-list">
                {currentHints.map((hint, i) => (
                  <span key={i} className="hint-chip">{hint}</span>
                ))}
              </div>
            </div>

            {isAgentProcessing && agentStatus && (
              <div className="agent-status">
                <div className="agent-step">
                  <span className="step-number">{t('step', currentLanguage)} {agentStatus.step}</span>
                  <span className="step-message">{agentStatus.message}</span>
                </div>
                <div className="agent-progress">
                  <div className="progress-bar" style={{ width: `${(agentStatus.step / 6) * 100}%` }}></div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="voice-header">
              <h2>📷 {t('capture_photo', currentLanguage)}</h2>
              <p className="voice-subtitle">{t('choose_option', currentLanguage)}</p>
            </div>

            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} style={{ display: 'none' }} />
            <input ref={galleryInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />

            <div className="photo-options">
              <button className="photo-option-btn" onClick={() => cameraInputRef.current.click()}>
                <span className="option-icon">📷</span>
                <span className="option-text">{t('take_photo', currentLanguage)}</span>
                <span className="option-desc">{t('open_camera', currentLanguage)}</span>
              </button>
              <button className="photo-option-btn" onClick={() => galleryInputRef.current.click()}>
                <span className="option-icon">🖼️</span>
                <span className="option-text">{t('upload_photo', currentLanguage)}</span>
                <span className="option-desc">{t('from_gallery', currentLanguage)}</span>
              </button>
            </div>

            <button className="btn-back-voice" onClick={() => setShowPhotoOptions(false)}>
              ← {t('back_to_voice', currentLanguage)}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default VoiceController;
