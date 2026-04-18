import { useState } from 'react';
import './AdvisoryReport.css';
import { t } from '../translations';

function AdvisoryReport({ report, loanRecommendations, onBack, language = 'en' }) {
  const [expandedSections, setExpandedSections] = useState({
    soil_analysis: true,
    nutrient_status: false,
    fertilizer_recommendation: false,
    crop_recommendation: false,
    cost_breakdown: true,
    profit_estimation: true,
    risk_analysis: true,
    weather_impact: true,
    irrigation_advice: false,
    risk_assessment: false,
    climate_smart_practices: false,
    loan_schemes: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!report || !report.sections) {
    return null;
  }

  const { sections } = report;

  return (
    <div className="advisory-report">
      <div className="report-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h1 className="report-title">🌾 {t('agricultural_advisory_report', language)}</h1>
      </div>

      {/* Farm Location */}
      <div className="report-section location-section">
        <div className="section-icon">📍</div>
        <div className="section-content">
          <h2>{t('farm_location', language)}</h2>
          <p className="location-text">{sections.farm_location.content}</p>
        </div>
      </div>

      {/* Soil Analysis */}
      <div className="report-section collapsible">
        <div className="section-header" onClick={() => toggleSection('soil_analysis')}>
          <div className="section-icon">🌍</div>
          <h2>{t('soil_analysis', language)}</h2>
          <span className="toggle-icon">{expandedSections.soil_analysis ? '▼' : '▶'}</span>
        </div>
        {expandedSections.soil_analysis && (
          <div className="section-content">
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Soil Type:</span>
                <span className="value">{sections.soil_analysis.soil_type}</span>
              </div>
              <div className="info-item">
                <span className="label">Texture:</span>
                <span className="value">{sections.soil_analysis.texture}</span>
              </div>
              <div className="info-item">
                <span className="label">Confidence:</span>
                <span className="value">{sections.soil_analysis.confidence}</span>
              </div>
              <div className="info-item">
                <span className="label">Fertility:</span>
                <span className={`value fertility-${sections.soil_analysis.fertility}`}>
                  {sections.soil_analysis.fertility}
                </span>
              </div>
              <div className="info-item">
                <span className="label">pH Status:</span>
                <span className="value">{sections.soil_analysis.ph_status}</span>
              </div>
              <div className="info-item">
                <span className="label">Organic Matter:</span>
                <span className="value">{sections.soil_analysis.organic_matter}</span>
              </div>
            </div>
            <p className="interpretation">{sections.soil_analysis.interpretation}</p>
          </div>
        )}
      </div>

      {/* Nutrient Status */}
      <div className="report-section collapsible">
        <div className="section-header" onClick={() => toggleSection('nutrient_status')}>
          <div className="section-icon">🧪</div>
          <h2>{t('nutrient_status', language)}</h2>
          <span className="toggle-icon">{expandedSections.nutrient_status ? '▼' : '▶'}</span>
        </div>
        {expandedSections.nutrient_status && (
          <div className="section-content">
            <div className="deficiency-tags">
              {sections.nutrient_status.deficiencies.map((def, idx) => (
                <span key={idx} className={`deficiency-tag ${def === 'None detected' ? 'none' : 'deficient'}`}>
                  {def}
                </span>
              ))}
            </div>
            <p className="explanation">{sections.nutrient_status.explanation}</p>
          </div>
        )}
      </div>

      {/* Fertilizer Recommendation */}
      <div className="report-section collapsible highlight">
        <div className="section-header" onClick={() => toggleSection('fertilizer_recommendation')}>
          <div className="section-icon">💊</div>
          <h2>{t('fertilizer_recommendation', language)}</h2>
          <span className="toggle-icon">{expandedSections.fertilizer_recommendation ? '▼' : '▶'}</span>
        </div>
        {expandedSections.fertilizer_recommendation && (
          <div className="section-content">
            <div className="npk-display">
              <span className="npk-label">NPK Ratio:</span>
              <span className="npk-value">{sections.fertilizer_recommendation.npk_ratio}</span>
            </div>
            <div className="dosage-grid">
              <div className="dosage-item">
                <span className="nutrient-name">Nitrogen (N)</span>
                <span className="nutrient-dose">{sections.fertilizer_recommendation.dosage.nitrogen}</span>
              </div>
              <div className="dosage-item">
                <span className="nutrient-name">Phosphorus (P)</span>
                <span className="nutrient-dose">{sections.fertilizer_recommendation.dosage.phosphorus}</span>
              </div>
              <div className="dosage-item">
                <span className="nutrient-name">Potassium (K)</span>
                <span className="nutrient-dose">{sections.fertilizer_recommendation.dosage.potassium}</span>
              </div>
            </div>
            
            <h3>Application Schedule</h3>
            <ol className="schedule-list">
              {sections.fertilizer_recommendation.schedule.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>

            <h3>Organic Alternatives</h3>
            <ul className="organic-list">
              {sections.fertilizer_recommendation.organic_options.map((option, idx) => (
                <li key={idx}>{option}</li>
              ))}
            </ul>

            {sections.fertilizer_recommendation.specific_recommendations.length > 0 && (
              <>
                <h3>Specific Recommendations</h3>
                <ul className="recommendations-list">
                  {sections.fertilizer_recommendation.specific_recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      {/* Crop Recommendation */}
      <div className="report-section collapsible">
        <div className="section-header" onClick={() => toggleSection('crop_recommendation')}>
          <div className="section-icon">🌾</div>
          <h2>{t('crop_recommendation', language)}</h2>
          <span className="toggle-icon">{expandedSections.crop_recommendation ? '▼' : '▶'}</span>
        </div>
        {expandedSections.crop_recommendation && (
          <div className="section-content">
            <p className="explanation">{sections.crop_recommendation.explanation}</p>
            <div className="crops-detailed">
              {sections.crop_recommendation.top_crops.map((crop, idx) => (
                <div key={idx} className="crop-card">
                  <h4>{crop.name}</h4>
                  <p>{crop.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══ Cost Breakdown ══ */}
      {sections.cost_breakdown && (
        <div className="report-section collapsible highlight-gold">
          <div className="section-header" onClick={() => toggleSection('cost_breakdown')}>
            <div className="section-icon">💰</div>
            <h2>Cost Per Acre — {sections.cost_breakdown.crop}</h2>
            <span className="toggle-icon">{expandedSections.cost_breakdown ? '▼' : '▶'}</span>
          </div>
          {expandedSections.cost_breakdown && (
            <div className="section-content">
              <p className="section-note">{sections.cost_breakdown.note}</p>
              <div className="cost-table">
                {sections.cost_breakdown.items.map((item, idx) => (
                  <div key={idx} className="cost-row">
                    <span className="cost-icon">{item.icon}</span>
                    <span className="cost-label">{item.label}</span>
                    <span className="cost-value">₹{item.value.toLocaleString('en-IN')}</span>
                    <div className="cost-bar-wrap">
                      <div
                        className="cost-bar"
                        style={{ width: `${Math.min(100, (item.value / sections.cost_breakdown.total) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="cost-total-row">
                  <span>📊 Total Cost per Acre</span>
                  <span className="cost-total-val">₹{sections.cost_breakdown.total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ Profit Estimation ══ */}
      {sections.profit_estimation && (
        <div className="report-section collapsible">
          <div className="section-header" onClick={() => toggleSection('profit_estimation')}>
            <div className="section-icon">📈</div>
            <h2>Yield &amp; Profit Estimation</h2>
            <span className="toggle-icon">{expandedSections.profit_estimation ? '▼' : '▶'}</span>
          </div>
          {expandedSections.profit_estimation && (
            <div className="section-content">
              <div className="profit-stats-grid">
                <div className="profit-stat">
                  <span className="ps-label">Expected Yield</span>
                  <span className="ps-value primary">{sections.profit_estimation.yield_label}</span>
                </div>
                <div className="profit-stat">
                  <span className="ps-label">Market Price</span>
                  <span className="ps-value">{sections.profit_estimation.market_price_label}</span>
                </div>
                <div className="profit-stat">
                  <span className="ps-label">Gross Revenue</span>
                  <span className="ps-value green">₹{sections.profit_estimation.gross_revenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="profit-stat">
                  <span className="ps-label">Total Cost</span>
                  <span className="ps-value red">₹{sections.profit_estimation.total_cost.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="profit-card">
                <div className="profit-emoji">{sections.profit_estimation.expected_profit >= 0 ? '🤑' : '📉'}</div>
                <div className="profit-detail">
                  <span className="profit-amount" style={{ color: sections.profit_estimation.expected_profit >= 0 ? '#34d399' : '#f87171' }}>
                    {sections.profit_estimation.expected_profit >= 0 ? '+' : ''}
                    ₹{sections.profit_estimation.expected_profit.toLocaleString('en-IN')}
                  </span>
                  <span className="profit-subtext">Expected Profit per Acre</span>
                </div>
                <div className="return-ratio-badge">×{sections.profit_estimation.return_ratio}</div>
              </div>
              <p className="ratio-statement">{sections.profit_estimation.profit_label}</p>
            </div>
          )}
        </div>
      )}

      {/* ══ Risk Analysis ══ */}
      {sections.risk_analysis && (
        <div className="report-section collapsible">
          <div className="section-header" onClick={() => toggleSection('risk_analysis')}>
            <div className="section-icon">⚖️</div>
            <h2>Risk vs Reward</h2>
            <span className="toggle-icon">{expandedSections.risk_analysis ? '▼' : '▶'}</span>
          </div>
          {expandedSections.risk_analysis && (
            <div className="section-content">
              <div className="risk-level-banner risk-" data-level={sections.risk_analysis.risk_level}>
                <span className="risk-level-icon">
                  {sections.risk_analysis.risk_level === 'Low' ? '🟢' :
                   sections.risk_analysis.risk_level === 'Medium' ? '🟡' : '🔴'}
                </span>
                <span className="risk-level-text">Risk Level: <strong>{sections.risk_analysis.risk_level}</strong></span>
                <span className={`risk-badge risk-badge-${sections.risk_analysis.risk_level.toLowerCase()}`}>{sections.risk_analysis.risk_level}</span>
              </div>
              <ul className="risk-reasons-list">
                {sections.risk_analysis.risk_reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
              <div className="ratio-box">
                <p className="ratio-statement big">{sections.risk_analysis.ratio_statement}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ Weather Impact ══ */}
      {sections.weather_impact && (
        <div className="report-section collapsible">
          <div className="section-header" onClick={() => toggleSection('weather_impact')}>
            <div className="section-icon">🌦️</div>
            <h2>Weather Impact — {sections.weather_impact.crop}</h2>
            <span className="toggle-icon">{expandedSections.weather_impact ? '▼' : '▶'}</span>
          </div>
          {expandedSections.weather_impact && (
            <div className="section-content">
              <div className="weather-impact-list">
                <div className="wi-row">
                  <span className="wi-icon">🗓️</span>
                  <p>{sections.weather_impact.season_effect}</p>
                </div>
                <div className="wi-row">
                  <span className="wi-icon">🌧️</span>
                  <p>{sections.weather_impact.rainfall_effect}</p>
                </div>
                <div className="wi-row">
                  <span className="wi-icon">🌡️</span>
                  <p>{sections.weather_impact.temperature_effect}</p>
                </div>
              </div>
              {sections.weather_impact.warnings?.length > 0 && (
                <div className="weather-warnings">
                  {sections.weather_impact.warnings.map((w, idx) => (
                    <div key={idx} className="weather-warning-item">{w}</div>
                  ))}
                </div>
              )}
              <p className="wi-summary">{sections.weather_impact.overall_summary}</p>
            </div>
          )}
        </div>
      )}

      {/* Irrigation Advice */}
      <div className="report-section collapsible">
        <div className="section-header" onClick={() => toggleSection('irrigation_advice')}>
          <div className="section-icon">💧</div>
          <h2>{t('irrigation_advice', language)}</h2>
          <span className="toggle-icon">{expandedSections.irrigation_advice ? '▼' : '▶'}</span>
        </div>
        {expandedSections.irrigation_advice && (
          <div className="section-content">
            <p className="current-status">{sections.irrigation_advice.current_moisture}</p>
            <p className="explanation">{sections.irrigation_advice.explanation}</p>
            
            <div className="irrigation-details">
              <div className="detail-item">
                <strong>Timing:</strong> {sections.irrigation_advice.timing}
              </div>
              <div className="detail-item">
                <strong>Frequency:</strong> {sections.irrigation_advice.frequency}
              </div>
              <div className="detail-item">
                <strong>Method:</strong> {sections.irrigation_advice.method}
              </div>
              <div className="detail-item">
                <strong>Water Requirement:</strong> {sections.irrigation_advice.water_requirement}
              </div>
            </div>

            <h3>Irrigation Tips</h3>
            <ul className="tips-list">
              {sections.irrigation_advice.tips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Risk Assessment */}
      <div className="report-section collapsible">
        <div className="section-header" onClick={() => toggleSection('risk_assessment')}>
          <div className="section-icon">⚠️</div>
          <h2>{t('risk_assessment', language)}</h2>
          <span className="toggle-icon">{expandedSections.risk_assessment ? '▼' : '▶'}</span>
        </div>
        {expandedSections.risk_assessment && (
          <div className="section-content">
            <p className="explanation">{sections.risk_assessment.explanation}</p>
            
            <h3>Identified Risks</h3>
            <div className="risks-list">
              {sections.risk_assessment.risks.map((risk, idx) => (
                <div key={idx} className={`risk-card severity-${risk.severity.toLowerCase()}`}>
                  <div className="risk-header">
                    <span className="risk-type">{risk.type}</span>
                    <span className="risk-severity">{risk.severity}</span>
                  </div>
                  <p className="risk-description">{risk.description}</p>
                </div>
              ))}
            </div>

            <h3>Mitigation Strategies</h3>
            <ul className="mitigation-list">
              {sections.risk_assessment.mitigation.map((strategy, idx) => (
                <li key={idx}>{strategy}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Climate-Smart Practices */}
      <div className="report-section collapsible">
        <div className="section-header" onClick={() => toggleSection('climate_smart_practices')}>
          <div className="section-icon">🌱</div>
          <h2>{t('climate_smart_practices', language)}</h2>
          <span className="toggle-icon">{expandedSections.climate_smart_practices ? '▼' : '▶'}</span>
        </div>
        {expandedSections.climate_smart_practices && (
          <div className="section-content">
            <p className="explanation">{sections.climate_smart_practices.explanation}</p>
            
            <div className="practices-list">
              {sections.climate_smart_practices.practices.map((practice, idx) => (
                <div key={idx} className="practice-card">
                  <h4>{practice.practice}</h4>
                  <p className="benefit"><strong>Benefit:</strong> {practice.benefit}</p>
                  <p className="implementation"><strong>How to implement:</strong> {practice.implementation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vegetation Status */}
      {sections.vegetation_status && (
        <div className="report-section">
          <div className="section-icon">🌿</div>
          <div className="section-content">
            <h2>{t('vegetation_status', language)}</h2>
            <div className="vegetation-info">
              <span>NDVI: {sections.vegetation_status.ndvi}</span>
              <span className={`health-badge health-${sections.vegetation_status.health}`}>
                {sections.vegetation_status.health}
              </span>
            </div>
            <p>{sections.vegetation_status.advice}</p>
          </div>
        </div>
      )}

      {/* Loan Schemes */}
      {loanRecommendations?.recommended_schemes?.length > 0 && (
        <div className="report-section collapsible">
          <div className="section-header" onClick={() => toggleSection('loan_schemes')}>
            <div className="section-icon">🏦</div>
            <h2>{t('loan_schemes', language)}</h2>
            <span className="toggle-icon">{expandedSections.loan_schemes ? '▼' : '▶'}</span>
          </div>
          {expandedSections.loan_schemes && (
            <div className="section-content">
              <p className="explanation">{loanRecommendations.summary}</p>

              {/* Recommended Loan Option banner */}
              {loanRecommendations.recommended_loan_option && (
                <div className="recommended-loan-banner">
                  <span className="rl-star">⭐</span>
                  <div className="rl-content">
                    <span className="rl-label">Recommended Loan Option</span>
                    <p className="rl-text">{loanRecommendations.recommended_loan_option}</p>
                  </div>
                </div>
              )}

              <div className="loan-cards">
                {loanRecommendations.recommended_schemes.map((scheme, idx) => (
                  <div key={idx} className={`loan-card ${scheme.best_match ? 'loan-best-match' : ''}`}>
                    <div className="loan-header">
                      <h4>
                        {scheme.best_match && <span className="best-match-star">⭐ </span>}
                        {scheme.name}
                      </h4>
                      <div className="loan-badges">
                        <span className={`loan-type-badge loan-${scheme.type}`}>{scheme.type}</span>
                        {scheme.repayment_ease && (
                          <span className={`ease-badge ease-${scheme.repayment_ease.toLowerCase()}`}>{scheme.repayment_ease}</span>
                        )}
                      </div>
                    </div>
                    <p className="loan-provider">🏛 {scheme.provider}</p>
                    <div className="loan-details-grid">
                      <div className="loan-detail">
                        <span className="loan-label">{t('max_amount', language)}</span>
                        <span className="loan-value">{scheme.max_amount}</span>
                      </div>
                      <div className="loan-detail">
                        <span className="loan-label">{t('interest_rate_label', language)}</span>
                        <span className="loan-value">{scheme.interest_rate}</span>
                      </div>
                      <div className="loan-detail">
                        <span className="loan-label">{t('repayment', language)}</span>
                        <span className="loan-value">{scheme.repayment}</span>
                      </div>
                    </div>
                    {scheme.subsidy && scheme.subsidy !== 'None' && (
                      <p className="loan-subsidy">💰 {scheme.subsidy}</p>
                    )}
                    <ul className="loan-benefits">
                      {scheme.benefits.map((b, i) => <li key={i}>✓ {b}</li>)}
                    </ul>
                    {scheme.apply_at && (
                      <a href={scheme.apply_at} target="_blank" rel="noopener noreferrer" className="loan-apply-btn">
                        {t('apply_now', language)} →
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <p className="loan-disclaimer">⚠️ {loanRecommendations.disclaimer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdvisoryReport;
