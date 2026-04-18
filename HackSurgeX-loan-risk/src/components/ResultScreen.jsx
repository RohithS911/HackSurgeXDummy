import { useState, useEffect, useRef } from 'react';
import {
  FileText, ShieldCheck, PlayCircle, StopCircle, Volume2,
  MapPin, Atom, TestTube, AlertTriangle, Pill, Wheat,
  CloudSun, Satellite, Activity, FileBadge, Droplet, BookOpen, ChevronLeft,
  Download
} from 'lucide-react';
import './ResultScreen.css';
import AdvisoryReport from './AdvisoryReport';
import LoanScreen from './LoanScreen';
import { t } from '../translations';
import sarvamVoiceService from '../services/sarvamVoiceService';

function ResultScreen({ result, onBack, language }) {
  const [speaking, setSpeaking] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showLoans, setShowLoans] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [currentChunk, setCurrentChunk] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (result.isAgenticWorkflow && result.audioBlobs && result.audioBlobs.length > 0) {
      // Wait for report to fully render before starting audio
      const timer = setTimeout(() => playAgenticAudio(), 2000);
      return () => {
        clearTimeout(timer);
        stopAllAudio();
      };
    }
    return () => stopAllAudio();
  }, [result]);

  const stopAllAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setAudioPlaying(false);
    setCurrentChunk(0);
  };

  const playAgenticAudio = async () => {
    if (!result.audioBlobs || result.audioBlobs.length === 0) return;
    setAudioPlaying(true);

    try {
      for (let i = 0; i < result.audioBlobs.length; i++) {
        if (!audioPlaying && i > 0) break;

        setCurrentChunk(i + 1);
        const audioUrl = URL.createObjectURL(result.audioBlobs[i]);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        await new Promise((resolve, reject) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            audioRef.current = null;
            resolve();
          };
          audio.onerror = (error) => {
            URL.revokeObjectURL(audioUrl);
            audioRef.current = null;
            reject(error);
          };
          audio.play().catch(reject);
        });

        if (i < result.audioBlobs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('[ResultScreen] Audio playback error:', error);
    } finally {
      setAudioPlaying(false);
      setCurrentChunk(0);
      audioRef.current = null;
    }
  };

  if (showLoans) {
    return <LoanScreen loanData={(result.analysis || result).loan_recommendations} onBack={() => setShowLoans(false)} language={language} />;
  }

  if (showReport && result.advisory_report) {
    const analysis = result.analysis || result;
    return <AdvisoryReport
      report={result.advisory_report}
      loanRecommendations={analysis.loan_recommendations}
      onBack={() => setShowReport(false)}
      language={language}
    />;
  }

  const analysis = result.analysis || result;

  const downloadReport = () => {
    const lines = [];
    const divider = '═'.repeat(50);
    const thinDiv = '─'.repeat(50);
    
    lines.push(divider);
    lines.push('  FARMER SOIL ANALYSIS REPORT');
    lines.push('  Generated: ' + new Date().toLocaleString());
    lines.push(divider);
    lines.push('');

    if (analysis.soil_type) {
      lines.push('▸ SOIL TYPE');
      lines.push('  ' + analysis.soil_type);
      lines.push('');
    }

    if (analysis.ph || analysis.ml_ph_level) {
      lines.push('▸ pH LEVEL');
      lines.push('  ' + (analysis.ph || analysis.ml_ph_level || 'N/A'));
      if (analysis.ml_ph_level && analysis.ph && analysis.ml_ph_level !== analysis.ph) {
        lines.push('  ML estimated: ' + analysis.ml_ph_level);
      }
      lines.push('');
    }

    if (analysis.ml_nutrient_status) {
      lines.push('▸ NUTRIENT STATUS');
      lines.push('  Nitrogen:   ' + (analysis.ml_nutrient_status.nitrogen || 'N/A'));
      lines.push('  Phosphorus: ' + (analysis.ml_nutrient_status.phosphorus || 'N/A'));
      lines.push('  Potassium:  ' + (analysis.ml_nutrient_status.potassium || 'N/A'));
      lines.push('');
    }

    if (analysis.nutrient_deficiency) {
      lines.push('▸ NUTRIENT DEFICIENCY WARNING');
      lines.push('  ' + analysis.nutrient_deficiency);
      lines.push('');
    }

    if (analysis.fertilizer) {
      lines.push('▸ FERTILIZER RECOMMENDATION');
      lines.push('  ' + analysis.fertilizer);
      lines.push('');
    }

    if (analysis.recommended_crops?.length > 0) {
      lines.push('▸ RECOMMENDED CROPS');
      lines.push('  ' + analysis.recommended_crops.join(', '));
      lines.push('');
    }

    if (analysis.location) {
      lines.push('▸ LOCATION');
      lines.push('  ' + [analysis.location.district, analysis.location.state, analysis.location.country].filter(Boolean).join(', '));
      lines.push('');
    }

    if (analysis.weather) {
      lines.push('▸ WEATHER CONDITIONS');
      lines.push('  Temperature: ' + analysis.weather.temperature + '°C');
      lines.push('  Humidity:    ' + analysis.weather.humidity + '%');
      lines.push('  Rainfall (30d): ' + analysis.weather.rainfall_30d + 'mm');
      lines.push('');
    }

    if (analysis.satellite) {
      lines.push('▸ SATELLITE DATA');
      lines.push('  NDVI: ' + (analysis.satellite.ndvi?.toFixed(2) || 'N/A'));
      if (analysis.satellite.source) lines.push('  Source: ' + analysis.satellite.source);
      lines.push('');
    }

    if (analysis.bhuvan_soil_moisture) {
      lines.push('▸ SOIL MOISTURE');
      lines.push('  Moisture: ' + (analysis.bhuvan_soil_moisture.percentage?.toFixed(1) || 'N/A') + '%');
      if (analysis.bhuvan_soil_moisture.satellite) lines.push('  Satellite: ' + analysis.bhuvan_soil_moisture.satellite);
      lines.push('');
    }

    if (analysis.advice) {
      lines.push(thinDiv);
      lines.push('▸ DETAILED ADVICE');
      lines.push('  ' + analysis.advice);
      lines.push('');
    }

    // Advisory report sections
    if (analysis.advisory_report?.sections) {
      const s = analysis.advisory_report.sections;
      lines.push(divider);
      lines.push('  DETAILED ADVISORY REPORT');
      lines.push(divider);
      lines.push('');

      if (s.farm_location) {
        lines.push('▸ FARM LOCATION');
        lines.push('  ' + s.farm_location.content);
        lines.push('');
      }

      if (s.fertilizer_recommendation) {
        lines.push('▸ FERTILIZER RECOMMENDATION');
        lines.push('  NPK Ratio: ' + s.fertilizer_recommendation.npk_ratio);
        const d = s.fertilizer_recommendation.dosage;
        if (d) {
          lines.push('  Nitrogen:   ' + d.nitrogen);
          lines.push('  Phosphorus: ' + d.phosphorus);
          lines.push('  Potassium:  ' + d.potassium);
        }
        if (s.fertilizer_recommendation.schedule?.length) {
          lines.push('  Schedule:');
          s.fertilizer_recommendation.schedule.forEach((step, i) => {
            lines.push('    ' + (i + 1) + '. ' + step);
          });
        }
        if (s.fertilizer_recommendation.organic_options?.length) {
          lines.push('  Organic Alternatives:');
          s.fertilizer_recommendation.organic_options.forEach(o => lines.push('    • ' + o));
        }
        lines.push('');
      }

      if (s.crop_recommendation) {
        lines.push('▸ CROP RECOMMENDATIONS');
        lines.push('  ' + s.crop_recommendation.explanation);
        s.crop_recommendation.top_crops?.forEach(crop => {
          lines.push('  • ' + crop.name + ': ' + crop.reason);
        });
        lines.push('');
      }

      if (s.irrigation_advice) {
        lines.push('▸ IRRIGATION ADVICE');
        lines.push('  Timing:    ' + s.irrigation_advice.timing);
        lines.push('  Frequency: ' + s.irrigation_advice.frequency);
        lines.push('  Method:    ' + s.irrigation_advice.method);
        lines.push('  Water Req: ' + s.irrigation_advice.water_requirement);
        if (s.irrigation_advice.tips?.length) {
          lines.push('  Tips:');
          s.irrigation_advice.tips.forEach(t => lines.push('    • ' + t));
        }
        lines.push('');
      }

      if (s.risk_assessment) {
        lines.push('▸ RISK ASSESSMENT');
        s.risk_assessment.risks?.forEach(risk => {
          lines.push('  [' + risk.severity + '] ' + risk.type + ': ' + risk.description);
        });
        if (s.risk_assessment.mitigation?.length) {
          lines.push('  Mitigation:');
          s.risk_assessment.mitigation.forEach(m => lines.push('    • ' + m));
        }
        lines.push('');
      }
    }

    lines.push(divider);
    lines.push('  © Farmer Soil Analyzer 2026');
    lines.push(divider);

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const soilType = (analysis.soil_type || 'soil').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    a.download = `soil_report_${soilType}_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const text = result.advice || `Soil type: ${result.soil_type}. pH: ${result.ph}. ${result.fertilizer}`;
      const utterance = new SpeechSynthesisUtterance(text);

      const langMap = {
        'kn': 'kn-IN', 'hi': 'hi-IN', 'ta': 'ta-IN', 'te': 'te-IN', 'en': 'en-IN'
      };

      utterance.lang = langMap[language] || 'en-IN';
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const renderConfidenceCircle = (confidence) => {
    if (!confidence) return null;
    const strokeDasharray = `${confidence * 100} 100`;
    return (
      <div className="confidence-circle-wrapper">
        <svg viewBox="0 0 36 36" className="circular-chart">
          <path className="circle-bg"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path className="circle"
            strokeDasharray={strokeDasharray}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span className="percentage">{Math.round(confidence * 100)}%</span>
      </div>
    );
  };

  return (
    <div className="screen result-screen animate-fade-in">
      <div className="header-glass sticky-header">
        <button className="icon-btn-back" onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="screen-title text-gradient">{t('analysis_results', language)}</h1>
        <div style={{ width: 40 }}></div>
      </div>

      <div className="status-hero glass-card mb-6">
        <div className="status-icon-glow">
          {result.isAgenticWorkflow ? <Activity size={32} /> : <ShieldCheck size={32} />}
        </div>
        <div className="status-hero-text">
          <h2 className="text-gradient-primary">
            {result.isAgenticWorkflow ? t('autonomous_analysis', language) : t('analysis_complete', language)}
          </h2>
          <p className="text-tertiary">{t('verified_data', language)}</p>
        </div>
        {renderConfidenceCircle(analysis.confidence)}
      </div>

      {result.isAgenticWorkflow && result.audioBlobs?.length > 0 && (
        <div className="audio-player glass-panel mb-6">
          {audioPlaying ? (
            <div className="audio-active">
              <div className="wave-animation">
                {[...Array(5)].map((_, i) => <span key={i} className="wave-bar"></span>)}
              </div>
              <p className="flex-1 text-sm">
                <Volume2 size={16} className="inline mr-2 text-primary" />
                {t('speaking', language)} ({currentChunk}/{result.audioBlobs.length})
              </p>
              <button className="icon-btn-danger" onClick={stopAllAudio}>
                <StopCircle size={24} />
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={playAgenticAudio}>
              <PlayCircle size={20} />
              <span>{t('play_audio', language)}</span>
            </button>
          )}
        </div>
      )}

      <div className="results-grid">
        {/* Basic Info */}
        <div className="data-card glass-panel">
          <div className="data-header">
            <MapPin size={20} className="text-primary" />
            <h3>{t('soil_type', language)}</h3>
          </div>
          <div className="data-value main-value text-gradient">{analysis.soil_type}</div>
        </div>

        <div className="data-card glass-panel">
          <div className="data-header">
            <Atom size={20} className="text-secondary" />
            <h3>{t('ph_level', language)}</h3>
          </div>
          <div className="data-value temp-value">{analysis.ph || analysis.ml_ph_level || 'N/A'}</div>
          {analysis.ml_ph_level && analysis.ph && analysis.ml_ph_level !== analysis.ph && (
            <div className="micro-tag bg-surface">ML: {analysis.ml_ph_level}</div>
          )}
        </div>

        {/* Nutrients */}
        {analysis.ml_nutrient_status && (
          <div className="data-card glass-panel col-span-2">
            <div className="data-header border-b">
              <TestTube size={20} className="text-primary" />
              <h3>{t('nutrient_levels', language)}</h3>
            </div>
            <div className="npk-grid mt-4">
              {['nitrogen', 'phosphorus', 'potassium'].map((n) => (
                <div key={n} className={`npk-item ${analysis.ml_nutrient_status[n]?.toLowerCase()}`}>
                  <span className="npk-label">{t(n, language)}</span>
                  <span className="npk-val">{t(analysis.ml_nutrient_status[n]?.toLowerCase(), language)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts & Advice */}
        {analysis.nutrient_deficiency && (
          <div className="data-card glass-panel col-span-2 border-warning">
            <div className="data-header">
              <AlertTriangle size={20} className="text-warning" />
              <h3 className="text-warning">{t('nutrient_status', language)}</h3>
            </div>
            <p className="data-p mt-2">{analysis.nutrient_deficiency}</p>
          </div>
        )}

        <div className="data-card glass-panel col-span-2 gradient-border">
          <div className="data-header">
            <Pill size={20} className="text-primary" />
            <h3>{t('fertilizer_advice', language)}</h3>
          </div>
          <p className="data-p mt-2 font-medium">{analysis.fertilizer}</p>
        </div>

        {/* Crops */}
        {analysis.recommended_crops?.length > 0 && (
          <div className="data-card glass-panel col-span-2">
            <div className="data-header">
              <Wheat size={20} className="text-tertiary" />
              <h3>{t('recommended_crops', language)}</h3>
            </div>
            <div className="tags-container mt-3">
              {analysis.recommended_crops.map((crop, idx) => (
                <span key={idx} className="glass-tag">{crop}</span>
              ))}
            </div>
          </div>
        )}

        {/* Contextual Data */}
        {analysis.location && (
          <div className="data-card glass-panel col-span-2">
            <div className="data-header">
              <MapPin size={18} className="text-secondary" />
              <h3>{t('location', language)}</h3>
            </div>
            <p className="data-p mt-2">{analysis.location.district}, {analysis.location.state}, {analysis.location.country}</p>
          </div>
        )}

        {analysis.weather && (
          <div className="data-card glass-panel col-span-2">
            <div className="data-header border-b">
              <CloudSun size={18} className="text-primary" />
              <h3>{t('current_weather', language)}</h3>
            </div>
            <div className="weather-grid mt-3">
              <div className="weather-stat">
                <span className="w-icon">🌡️</span>
                <span>{analysis.weather.temperature}°C</span>
              </div>
              <div className="weather-stat">
                <span className="w-icon">💧</span>
                <span>{analysis.weather.humidity}%</span>
              </div>
              <div className="weather-stat">
                <span className="w-icon">🌧️</span>
                <span>{analysis.weather.rainfall_30d}mm</span>
              </div>
            </div>
          </div>
        )}

        {analysis.satellite && (
          <div className="data-card glass-panel col-span-2">
            <div className="data-header">
              <Satellite size={18} className="text-tertiary" />
              <h3>{t('satellite_data', language)}</h3>
            </div>
            <div className="flex-row justify-between mt-2">
              <span className="font-semibold text-primary">NDVI: {analysis.satellite.ndvi?.toFixed(2)}</span>
              {analysis.satellite.source && <span className="micro-tag">{analysis.satellite.source}</span>}
            </div>
          </div>
        )}

        {analysis.bhuvan_soil_moisture && (
          <div className="data-card glass-panel col-span-2">
            <div className="data-header">
              <Droplet size={18} className="text-secondary" />
              <h3>{t('soil_moisture', language)}</h3>
            </div>
            <div className="flex-row justify-between mt-2">
              <span className="text-xl font-bold">{analysis.bhuvan_soil_moisture.percentage?.toFixed(1)}%</span>
              <div className="flex-col right">
                <span className="text-xs text-tertiary">{analysis.bhuvan_soil_moisture.satellite}</span>
                <span className="text-xs text-tertiary">{analysis.bhuvan_soil_moisture.resolution}m res</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {result.advice && (
        <div className="data-card glass-panel mb-6 advice-highlight">
          <div className="data-header">
            <BookOpen size={20} className="text-primary" />
            <h3 className="text-primary">{t('detailed_advice', language)}</h3>
          </div>
          <p className="data-p mt-3">{analysis.advice}</p>
        </div>
      )}

      <div className="action-stack mb-8">
        {analysis.advisory_report && (
          <button className="btn btn-primary" onClick={() => setShowReport(true)}>
            <FileText size={20} />
            <span>{t('view_detailed_report', language)}</span>
          </button>
        )}

        {analysis.loan_recommendations?.recommended_schemes?.length > 0 && (
          <button className="btn btn-loan" onClick={() => setShowLoans(true)}>
            <span style={{fontSize:'1.1rem'}}>🏦</span>
            <span>{t('view_loan_schemes', language)}</span>
          </button>
        )}

        <button className="btn btn-secondary" onClick={downloadReport}>
          <Download size={20} />
          <span>{t('download_report', language)}</span>
        </button>

        <button className="btn btn-secondary" onClick={handleSpeak} disabled={speaking}>
          {speaking ? <Volume2 className="animate-pulse text-primary" size={20} /> : <Volume2 size={20} />}
          <span>{speaking ? t('speaking_label', language) : t('listen_advice', language)}</span>
        </button>
      </div>

    </div>
  );
}

export default ResultScreen;
