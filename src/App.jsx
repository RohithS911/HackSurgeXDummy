import { useState, useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import UploadScreen from './components/UploadScreen';
import ResultScreen from './components/ResultScreen';
import HistoryScreen from './components/HistoryScreen';
import SettingsScreen from './components/SettingsScreen';
import MarketWeatherScreen from './components/MarketWeatherScreen';
import BottomNav from './components/BottomNav';
import VoiceAssistant from './components/VoiceAssistant';
import CameraCapture from './components/CameraCapture';
import AgentProcessingOverlay from './components/AgentProcessingOverlay';
import databaseService from './services/database';
import './App.css';

function App() {
  const [screen, setScreen] = useState('home');
  const [language, setLanguage] = useState('en');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voiceCapturedPhoto, setVoiceCapturedPhoto] = useState(null);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [cameraCallbacks, setCameraCallbacks] = useState(null);
  const [agentProcessing, setAgentProcessing] = useState(false);
  const [agentStatus, setAgentStatus] = useState({ step: 1, message: '' });

  useEffect(() => {
    // Load data from database
    loadHistory();
    
    // Load saved language
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
      setLanguage(savedLang);
    }

    // Listen for camera capture events from autonomous agent
    const handleCameraCapture = (event) => {
      console.log('Camera capture event received');
      setCameraCallbacks(event.detail);
      setShowCameraCapture(true);
    };

    // Listen for camera close event from autonomous agent
    const handleCloseCameraModal = () => {
      console.log('Closing camera modal from agent');
      setShowCameraCapture(false);
      setCameraCallbacks(null);
    };

    const handleAgentStart = () => {
      setAgentProcessing(true);
      setAgentStatus({ step: 1, message: 'Starting...' });
    };
    const handleAgentStatus = (e) => {
      setAgentStatus(e.detail);
    };
    const handleAgentEnd = () => {
      setAgentProcessing(false);
    };

    window.addEventListener('openCameraCapture', handleCameraCapture);
    window.addEventListener('closeCameraCapture', handleCloseCameraModal);
    window.addEventListener('agentStart', handleAgentStart);
    window.addEventListener('agentStatus', handleAgentStatus);
    window.addEventListener('agentEnd', handleAgentEnd);

    return () => {
      window.removeEventListener('openCameraCapture', handleCameraCapture);
      window.removeEventListener('closeCameraCapture', handleCloseCameraModal);
      window.removeEventListener('agentStart', handleAgentStart);
      window.removeEventListener('agentStatus', handleAgentStatus);
      window.removeEventListener('agentEnd', handleAgentEnd);
    };
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const analyses = await databaseService.getAllAnalyses();
      setHistory(analyses);
      console.log('Loaded', analyses.length, 'analyses from database');
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = async (data) => {
    try {
      // Add language to the data
      const analysisData = {
        ...data,
        language: language,
        timestamp: Date.now()
      };

      // Save to database
      await databaseService.addAnalysis(analysisData);
      
      // Reload history
      await loadHistory();
      
      console.log('Analysis saved to database');
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const handleAnalysisComplete = (data) => {
    setResult(data);
    saveToHistory(data);
    setScreen('result');
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const handleVoiceCommand = (action, data) => {
    console.log('Voice command received:', action, data);
    
    switch (action) {
      case 'analyze':
        console.log('Navigating to upload screen');
        setScreen('upload');
        break;
      case 'analysis_complete':
        console.log('Autonomous analysis complete, showing results');
        setResult(data);
        saveToHistory(data);
        setScreen('result');
        break;
      case 'history':
        console.log('Navigating to history screen');
        setScreen('history');
        break;
      case 'settings':
        console.log('Navigating to settings screen');
        setScreen('settings');
        break;
      case 'home':
        console.log('Navigating to home screen');
        setScreen('home');
        break;
      case 'transcript':
        console.log('Voice input:', data);
        break;
      default:
        console.log('Unknown command:', action);
        break;
    }
  };

  const handlePhotoCapture = (file) => {
    console.log('Photo captured from voice:', file.name);
    // Store the file in state and navigate to upload screen
    setVoiceCapturedPhoto(file);
    setScreen('upload');
  };

  const handleDeleteItem = async (id) => {
    try {
      await databaseService.deleteAnalysis(id);
      await loadHistory();
      console.log('Analysis deleted:', id);
    } catch (error) {
      console.error('Error deleting analysis:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await databaseService.clearAllAnalyses();
      await loadHistory();
      console.log('All analyses cleared');
    } catch (error) {
      console.error('Error clearing analyses:', error);
    }
  };

  const handleCameraCapture = (file) => {
    console.log('[App] handleCameraCapture called');
    console.log('[App] Photo captured:', file.name, 'Size:', file.size);
    console.log('[App] cameraCallbacks:', cameraCallbacks);
    
    // Call the callback from autonomous agent
    if (cameraCallbacks && cameraCallbacks.onCapture) {
      console.log('[App] Calling autonomous agent callback');
      cameraCallbacks.onCapture(file);
      console.log('[App] Callback called successfully');
      
      // For autonomous mode, keep modal open briefly to show processing
      // The CameraCapture component will close itself
      if (!cameraCallbacks.autoCapture) {
        console.log('[App] Manual mode - closing modal');
        // Manual mode - close immediately
        setShowCameraCapture(false);
        setCameraCallbacks(null);
      } else {
        console.log('[App] Autonomous mode - keeping modal open');
      }
    } else {
      console.log('[App] No callback - closing immediately');
      // No callback - close immediately
      setShowCameraCapture(false);
      setCameraCallbacks(null);
    }
  };

  const handleCameraClose = () => {
    console.log('Camera closed by user');
    
    // Call the cancel callback
    if (cameraCallbacks && cameraCallbacks.onCancel) {
      cameraCallbacks.onCancel();
    }
    
    // Close camera modal
    setShowCameraCapture(false);
    setCameraCallbacks(null);
  };

  return (
    <div className="app">
      <div className="app-content">
        {screen === 'home' && (
          <HomeScreen 
            onUpload={() => setScreen('upload')} 
            language={language}
          />
        )}

        {screen === 'upload' && (
          <UploadScreen 
            onComplete={handleAnalysisComplete}
            onBack={() => {
              setScreen('home');
              setVoiceCapturedPhoto(null);
            }}
            language={language}
            voiceCapturedPhoto={voiceCapturedPhoto}
            onPhotoProcessed={() => setVoiceCapturedPhoto(null)}
          />
        )}

        {screen === 'result' && (
          <ResultScreen 
            result={result}
            onBack={() => setScreen('home')}
            language={language}
          />
        )}

        {screen === 'history' && (
          <HistoryScreen 
            history={history}
            loading={loading}
            onViewResult={(item) => {
              setResult(item);
              setScreen('result');
            }}
            onRefresh={loadHistory}
            onDeleteItem={handleDeleteItem}
            onClearAll={handleClearAll}
          />
        )}

        {screen === 'market' && (
          <MarketWeatherScreen language={language} />
        )}

        {screen === 'settings' && (
          <SettingsScreen 
            language={language}
            onLanguageChange={handleLanguageChange}
          />
        )}
      </div>

      {!['upload', 'result'].includes(screen) && (
        <>
          <VoiceAssistant 
            onLanguageDetected={handleLanguageChange}
            onCommand={handleVoiceCommand}
            onPhotoCapture={handlePhotoCapture}
            currentLanguage={language}
          />
          <BottomNav activeScreen={screen} onNavigate={setScreen} language={language} />
        </>
      )}

      {/* Camera Capture Modal */}
      {showCameraCapture && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={handleCameraClose}
          autoCapture={cameraCallbacks?.autoCapture || false}
        />
      )}

      {/* Agent Processing Overlay — only show after photo is captured (step 2+) */}
      {agentProcessing && agentStatus.step >= 2 && (
        <AgentProcessingOverlay
          currentStep={agentStatus.step}
          message={agentStatus.message}
        />
      )}
    </div>
  );
}

export default App;
