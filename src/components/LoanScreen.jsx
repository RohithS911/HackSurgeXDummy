import { useState, useRef } from 'react';
import { ChevronLeft, Volume2, StopCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { t } from '../translations';
import './LoanScreen.css';

function LoanScreen({ loanData, onBack, language }) {
  const [speaking, setSpeaking] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [expanded, setExpanded] = useState({});
  const audioRef = useRef(null);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
    setSpeakingIdx(null);
  };

  const speakText = async (text, idx = 'all') => {
    stopAudio();
    setSpeaking(true);
    setSpeakingIdx(idx);

    try {
      // Split into chunks of 400 chars
      const chunks = [];
      const sentences = text.split(/\.\s+/);
      let current = '';
      for (const s of sentences) {
        if ((current + s).length > 400 && current) {
          chunks.push(current.trim());
          current = s + '. ';
        } else {
          current += s + '. ';
        }
      }
      if (current.trim()) chunks.push(current.trim());

      for (const chunk of chunks) {
        if (!speaking && idx !== 'all') break;
        const res = await fetch('http://localhost:3001/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: chunk, language })
        });
        if (!res.ok) break;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        await new Promise((resolve) => {
          audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
          audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
          audio.play();
        });
        await new Promise(r => setTimeout(r, 300));
      }
    } catch (e) {
      console.error('TTS error:', e);
    } finally {
      setSpeaking(false);
      setSpeakingIdx(null);
    }
  };

  const toggle = (i) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  if (!loanData?.recommended_schemes?.length) {
    return (
      <div className="screen loan-screen animate-fade-in">
        <div className="header-glass sticky-header">
          <button className="icon-btn-back" onClick={onBack}><ChevronLeft size={24} /></button>
          <h1 className="screen-title text-gradient">{t('loan_schemes', language)}</h1>
          <div style={{ width: 40 }} />
        </div>
        <div className="loan-empty glass-panel">
          <p>🏦</p>
          <p>{t('no_loans', language)}</p>
        </div>
      </div>
    );
  }

  const { recommended_schemes, summary, disclaimer, tts_full } = loanData;

  return (
    <div className="screen loan-screen animate-fade-in">
      <div className="header-glass sticky-header">
        <button className="icon-btn-back" onClick={onBack}><ChevronLeft size={24} /></button>
        <h1 className="screen-title text-gradient">{t('loan_schemes', language)}</h1>
        <button
          className={`icon-btn-tts ${speaking && speakingIdx === 'all' ? 'active' : ''}`}
          onClick={() => speaking && speakingIdx === 'all' ? stopAudio() : speakText(tts_full, 'all')}
        >
          {speaking && speakingIdx === 'all'
            ? <StopCircle size={22} className="text-primary" />
            : <Volume2 size={22} />}
        </button>
      </div>

      {/* Summary */}
      <div className="loan-summary glass-panel mb-4">
        <p className="loan-summary-text">{summary}</p>
      </div>

      {/* Scheme Cards */}
      <div className="loan-list">
        {recommended_schemes.map((scheme, i) => (
          <div key={i} className={`loan-detail-card glass-panel ${expanded[i] ? 'expanded' : ''}`}>

            {/* Header row */}
            <div className="loan-card-header" onClick={() => toggle(i)}>
              <div className="loan-card-title-row">
                <span className={`loan-badge loan-${scheme.type}`}>{scheme.type}</span>
                <h3 className="loan-card-name">{scheme.name}</h3>
              </div>
              <div className="loan-card-header-right">
                <button
                  className={`tts-mini-btn ${speaking && speakingIdx === i ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    speaking && speakingIdx === i ? stopAudio() : speakText(scheme.tts_description, i);
                  }}
                >
                  {speaking && speakingIdx === i
                    ? <StopCircle size={16} className="text-primary" />
                    : <Volume2 size={16} />}
                </button>
                {expanded[i] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>

            <p className="loan-provider-name">🏛 {scheme.provider}</p>

            {/* Key stats always visible */}
            <div className="loan-stats-row">
              <div className="loan-stat">
                <span className="loan-stat-label">{t('max_amount', language)}</span>
                <span className="loan-stat-value">{scheme.max_amount}</span>
              </div>
              <div className="loan-stat">
                <span className="loan-stat-label">{t('interest_rate_label', language)}</span>
                <span className="loan-stat-value">{scheme.interest_rate}</span>
              </div>
              <div className="loan-stat">
                <span className="loan-stat-label">{t('repayment', language)}</span>
                <span className="loan-stat-value">{scheme.repayment}</span>
              </div>
            </div>

            {/* Expanded details */}
            {expanded[i] && (
              <div className="loan-expanded-body">
                {scheme.subsidy && scheme.subsidy !== 'None' && (
                  <div className="loan-section">
                    <h4>💰 {t('subsidy_details', language)}</h4>
                    <p>{scheme.subsidy}</p>
                  </div>
                )}

                <div className="loan-section">
                  <h4>✅ {t('benefits', language)}</h4>
                  <ul>{scheme.benefits?.map((b, j) => <li key={j}>{b}</li>)}</ul>
                </div>

                {scheme.special_features?.length > 0 && (
                  <div className="loan-section">
                    <h4>⭐ {t('special_features', language)}</h4>
                    <ul>{scheme.special_features.map((f, j) => <li key={j}>{f}</li>)}</ul>
                  </div>
                )}

                <div className="loan-section">
                  <h4>📄 {t('documents_required', language)}</h4>
                  <ul>{scheme.documents?.map((d, j) => <li key={j}>{d}</li>)}</ul>
                </div>

                {scheme.eligibility && (
                  <div className="loan-section">
                    <h4>👤 {t('eligibility', language)}</h4>
                    <p>{t('farmer_type', language)}: {scheme.eligibility.farmer_type}</p>
                    {scheme.eligibility.land_requirement && (
                      <p>{t('land_requirement', language)}: {scheme.eligibility.land_requirement}</p>
                    )}
                    {scheme.eligibility.eligible_states?.length > 0 && (
                      <p>{t('eligible_states', language)}: {scheme.eligibility.eligible_states.join(', ')}</p>
                    )}
                  </div>
                )}

                {scheme.apply_at && (
                  <a
                    href={scheme.apply_at}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="loan-apply-link"
                  >
                    <ExternalLink size={16} />
                    <span>{t('apply_now', language)}</span>
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="loan-disclaimer-box glass-panel mb-8">
        <p>⚠️ {disclaimer}</p>
      </div>
    </div>
  );
}

export default LoanScreen;
