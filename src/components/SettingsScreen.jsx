import { useState } from 'react';
import VoiceLanguageSelector from './VoiceLanguageSelector';
import { 
  Globe, Mic, Info, Check, Shield, Trash2,
  ChevronRight, Heart, Leaf, Zap, Eye, Smartphone,
  Database
} from 'lucide-react';
import databaseService from '../services/database';
import './SettingsScreen.css';

function SettingsScreen({ language, onLanguageChange }) {
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'mr', label: 'Marathi', native: 'मराठी' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা' },
    { code: 'gu', label: 'Gujarati', native: 'ગુજরાતી' },
    { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
    { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ' },
    { code: 'as', label: 'Assamese', native: 'অসমীয়া' }
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  const handleClearData = async () => {
    try {
      await databaseService.clearAllAnalyses();
      setShowClearConfirm(false);
      alert('All analysis data cleared successfully.');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  return (
    <div className="screen settings-screen animate-fade-in">
      {/* Header */}
      <div className="settings-header">
        <h1 className="settings-title text-gradient">Settings</h1>
        <p className="settings-subtitle">Customize your experience</p>
      </div>

      {/* Profile / App Identity Card */}
      <div className="settings-profile-card glass-panel">
        <div className="profile-avatar">
          <Leaf size={28} className="profile-avatar-icon" />
        </div>
        <div className="profile-info">
          <h2 className="profile-name">Farmer Soil Analyzer</h2>
          <span className="profile-plan">
            <Zap size={12} />
            AI-Powered Analysis
          </span>
        </div>
        <div className="profile-version-badge">v1.0.0</div>
      </div>

      {/* Language Section */}
      <div className="settings-group">
        <div className="settings-group-header">
          <Globe size={18} className="settings-group-icon" />
          <span>Language</span>
        </div>
        <div className="settings-card glass-panel">
          <div className="settings-row" onClick={() => setShowVoiceSelector(true)}>
            <div className="settings-row-left">
              <Mic size={20} className="row-icon accent-green" />
              <div className="row-text">
                <span className="row-label">Voice Language Select</span>
                <span className="row-desc">Use voice to pick your language</span>
              </div>
            </div>
            <ChevronRight size={18} className="row-chevron" />
          </div>

          <div className="settings-divider" />

          <div className="settings-row-info">
            <div className="settings-row-left">
              <Globe size={20} className="row-icon accent-blue" />
              <div className="row-text">
                <span className="row-label">Current Language</span>
                <span className="row-desc">{currentLang.native} ({currentLang.label})</span>
              </div>
            </div>
          </div>
        </div>

        <div className="language-grid">
          {languages.map(lang => (
            <button
              key={lang.code}
              className={`language-card ${language === lang.code ? 'active' : ''}`}
              onClick={() => onLanguageChange(lang.code)}
            >
              <div className="language-card-content">
                <span className="language-native">{lang.native}</span>
                <span className="language-label">{lang.label}</span>
              </div>
              <div className="check-container">
                {language === lang.code && <Check size={16} className="check-icon" strokeWidth={3} />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="settings-group">
        <div className="settings-group-header">
          <Database size={18} className="settings-group-icon" />
          <span>Data Management</span>
        </div>
        <div className="settings-card glass-panel">
          <div className="settings-row danger-row" onClick={() => setShowClearConfirm(true)}>
            <div className="settings-row-left">
              <Trash2 size={20} className="row-icon accent-red" />
              <div className="row-text">
                <span className="row-label danger-text">Clear All Data</span>
                <span className="row-desc">Remove all analysis history</span>
              </div>
            </div>
            <ChevronRight size={18} className="row-chevron" />
          </div>
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="settings-group">
        <div className="settings-group-header">
          <Shield size={18} className="settings-group-icon" />
          <span>Privacy & Security</span>
        </div>
        <div className="settings-card glass-panel">
          <div className="settings-row-info">
            <div className="settings-row-left">
              <Eye size={20} className="row-icon accent-cyan" />
              <div className="row-text">
                <span className="row-label">Data Privacy</span>
                <span className="row-desc">Your data stays on your device. No cloud storage.</span>
              </div>
            </div>
          </div>

          <div className="settings-divider" />

          <div className="settings-row-info">
            <div className="settings-row-left">
              <Shield size={20} className="row-icon accent-green" />
              <div className="row-text">
                <span className="row-label">Secure Processing</span>
                <span className="row-desc">AI analysis is encrypted end-to-end.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="settings-group">
        <div className="settings-group-header">
          <Info size={18} className="settings-group-icon" />
          <span>About</span>
        </div>
        <div className="settings-card glass-panel">
          <div className="settings-row-info">
            <div className="settings-row-left">
              <Smartphone size={20} className="row-icon accent-blue" />
              <div className="row-text">
                <span className="row-label">App Version</span>
                <span className="row-desc">1.0.0 (Build 2026.03)</span>
              </div>
            </div>
          </div>

          <div className="settings-divider" />

          <div className="settings-row-info">
            <div className="settings-row-left">
              <Leaf size={20} className="row-icon accent-green" />
              <div className="row-text">
                <span className="row-label">Powered by</span>
                <span className="row-desc">Google Gemini AI + Climate APIs</span>
              </div>
            </div>
          </div>

          <div className="settings-divider" />

          <div className="settings-row-info">
            <div className="settings-row-left">
              <Heart size={20} className="row-icon accent-rose" />
              <div className="row-text">
                <span className="row-label">Made with ❤️ for Farmers</span>
                <span className="row-desc">Helping agriculture through technology</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="settings-footer">
        <p>Farmer Soil Analyzer © 2026</p>
        <p>All rights reserved</p>
      </div>

      {/* Voice Language Selector Modal */}
      {showVoiceSelector && (
        <VoiceLanguageSelector
          onLanguageSelect={onLanguageChange}
          onClose={() => setShowVoiceSelector(false)}
        />
      )}

      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal-card glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-icon-wrapper danger">
              <Trash2 size={28} />
            </div>
            <h3 className="modal-title">Clear All Data?</h3>
            <p className="modal-desc">This will permanently delete all your soil analysis history. This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowClearConfirm(false)}>Cancel</button>
              <button className="modal-btn confirm danger" onClick={handleClearData}>Delete All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsScreen;
