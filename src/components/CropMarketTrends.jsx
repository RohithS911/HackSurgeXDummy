import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Search, TrendingUp, TrendingDown, Volume2, MapPin, Database } from 'lucide-react';
import './CropMarketTrends.css';
import { t } from '../translations';

function CropMarketTrends({ language }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewPeriod, setViewPeriod] = useState('7'); // 7, 30, 90 days
  const [speaking, setSpeaking] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState(null);

  const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

  useEffect(() => {
    // Load popular crops on mount
    searchCrops('');
  }, []);

  const searchCrops = async (query) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/market/search?query=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSearchResults(data.crops);
    } catch (error) {
      console.error('Crop search error:', error);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchCrops(query);
  };

  const selectCrop = async (cropName) => {
    setSelectedCrop(cropName);
    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:3001/api/market/price/${encodeURIComponent(cropName)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Check if data has error
      if (data.error) {
        throw new Error(data.error);
      }

      setMarketData(data);

      // Fetch crop image from Pexels
      if (PEXELS_API_KEY) {
        try {
          const pexelsResponse = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(cropName)}&per_page=1`,
            {
              headers: {
                Authorization: PEXELS_API_KEY
              }
            }
          );
          if (pexelsResponse.ok) {
            const pexelsData = await pexelsResponse.json();
            if (pexelsData.photos && pexelsData.photos.length > 0) {
              setCropImageUrl(pexelsData.photos[0].src.medium);
            } else {
              setCropImageUrl(null);
            }
          }
        } catch (imgErr) {
          console.error('Failed to fetch crop image', imgErr);
          setCropImageUrl(null);
        }
      }

    } catch (error) {
      console.error('Market data fetch error:', error);
      alert(`Failed to fetch market data: ${error.message}`);
      setSelectedCrop(null);
    } finally {
      setLoading(false);
    }
  };

  const explainMarketTrend = async () => {
    if (!marketData || speaking) return;

    setSpeaking(true);

    try {
      // Generate explanation text
      const trend = marketData.priceChange > 0 ? 'increasing' : 'decreasing';
      const explanation = `Market analysis for ${marketData.crop}. Current price is ${marketData.currentPrice} rupees per quintal. Price is ${trend} by ${Math.abs(marketData.percentageChange)} percent. ${marketData.priceChange > 0 ? 'This is a good time to sell.' : 'Consider waiting for better prices.'}`;

      // Translate to user's language
      const translateResponse = await fetch('http://localhost:3001/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: explanation,
          targetLanguage: language
        })
      });

      const { translatedText } = await translateResponse.json();

      // Convert to speech
      const ttsResponse = await fetch('http://localhost:3001/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: translatedText,
          language: language
        })
      });

      const audioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setSpeaking(false);
      };

      await audio.play();

    } catch (error) {
      console.error('TTS error:', error);
      setSpeaking(false);
    }
  };

  const getFilteredData = () => {
    if (!marketData) return [];

    const days = parseInt(viewPeriod);
    const filteredData = marketData.priceHistory.slice(-days);

    // Format dates for better display
    return filteredData.map(item => ({
      ...item,
      date: formatDate(item.date, days)
    }));
  };

  const formatDate = (dateString, days) => {
    const date = new Date(dateString);

    // For 7 days, show day name
    if (days <= 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    // For 30 days, show date
    if (days <= 30) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // For 90 days, show month/day
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip glass-panel">
          <p className="tooltip-date">{label}</p>
          <p className="tooltip-data" style={{ color: payload[0].color }}>
            <span className="tooltip-label">{t('price', language)}: </span>
            <span className="tooltip-value">₹{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomAxisTick = ({ x, y, stroke, payload, rotation = -35 }) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="end" fill="var(--text-secondary)" fontSize={12} transform={`rotate(${rotation})`}>
          {payload.value}
        </text>
      </g>
    );
  };

  const isPositiveTrend = marketData && marketData.priceChange >= 0;
  const trendColor = isPositiveTrend ? '#10b981' : '#f43f5e';

  return (
    <div className="crop-market-trends animate-fade-in-up">
      {/* Search Section */}
      <div className="search-section glass-panel mb-6 border-glow">
        <h2 className="section-title text-gradient mb-4">{t('search_crops', language)}</h2>

        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={t('search_placeholder', language)}
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        <div className="crop-chips">
          {searchResults.slice(0, 10).map((crop) => (
            <button
              key={crop}
              className={`crop-chip ${selectedCrop === crop ? 'active' : ''}`}
              onClick={() => selectCrop(crop)}
            >
              {crop}
            </button>
          ))}
        </div>
      </div>

      {/* Market Data Display */}
      {loading && (
        <div className="loading-state glass-panel">
          <div className="spinner"></div>
          <p className="text-secondary mt-4">{t('loading', language)}...</p>
        </div>
      )}

      {marketData && !loading && (
        <>
          {/* Price Summary */}
          <div className="price-summary glass-panel mb-6 border-glow relative overflow-hidden">
            {/* Minimal background glow for trend */}
            <div className="trend-bg-glow" style={{ background: trendColor }}></div>

            <div className="crop-header-layout">
              {/* Clean Circular Avatar for Crop Image */}
              {cropImageUrl ? (
                <div
                  className="crop-avatar"
                  style={{
                    borderColor: trendColor,
                    backgroundImage: `url(${cropImageUrl})`
                  }}
                />
              ) : (
                <div className="crop-avatar placeholder"
                  style={{
                    borderColor: trendColor,
                    background: `${trendColor}20`
                  }}>
                  <span style={{ color: trendColor }}>
                    {marketData.crop.charAt(0)}
                  </span>
                </div>
              )}

              {/* Crop Title & Meta Container */}
              <div className="crop-title-container">
                <div className="crop-title-header">
                  <div>
                    <h3 className="crop-main-title">{marketData.crop}</h3>
                    <div className="crop-location">
                      <MapPin size={14} />
                      <span>{marketData.market}, {marketData.district}</span>
                    </div>
                  </div>
                  {marketData.variety && marketData.variety !== 'General' && (
                    <span className="variety-badge">{marketData.variety}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="price-main mb-6">
              <div className="flex-row items-end gap-2 mb-2">
                <span className="text-4xl font-bold text-primary">₹{marketData.currentPrice}</span>
                <span className="text-secondary pb-1">/{marketData.unit}</span>
              </div>

              <div className={`trend-indicator flex-row items-center gap-2 px-3 py-1.5 rounded-lg w-fit ${isPositiveTrend ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {isPositiveTrend ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span className="font-semibold">₹{Math.abs(marketData.priceChange)} ({marketData.percentageChange}%)</span>
              </div>
            </div>

            {/* Price Range */}
            <div className="metrics-grid mb-6">
              <div className="metric-box">
                <span className="metric-label">{t('min_price', language)}</span>
                <span className="metric-value">₹{marketData.minPrice}</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">{t('max_price', language)}</span>
                <span className="metric-value">₹{marketData.maxPrice}</span>
              </div>
              {marketData.arrivals > 0 && (
                <div className="metric-box">
                  <span className="metric-label">{t('arrivals', language)}</span>
                  <span className="metric-value">{marketData.arrivals} Qtl</span>
                </div>
              )}
            </div>

            <div className="flex-row justify-between items-center border-t border-light pt-4 mt-4">
              {/* Data Source */}
              {marketData.source && (
                <div className="flex-row items-center gap-2 text-sm text-tertiary">
                  <Database size={14} />
                  <span>{t('source', language)}: {marketData.source}</span>
                </div>
              )}

              <button
                className={`icon-btn-secondary explain-btn ${speaking ? 'pulsing' : ''}`}
                onClick={explainMarketTrend}
                disabled={speaking}
                title={t('explain_trend', language)}
              >
                <Volume2 size={20} className="text-primary" />
                {speaking && <span className="ml-2 pr-2 text-sm text-primary">{t('speaking_label', language)}</span>}
              </button>
            </div>
          </div>

          {/* Period Selector */}
          <div className="period-selector-glass mb-4">
            <button
              className={`period-btn ${viewPeriod === '7' ? 'active' : ''}`}
              onClick={() => setViewPeriod('7')}
            >
              7 {t('days', language)}
            </button>
            <button
              className={`period-btn ${viewPeriod === '30' ? 'active' : ''}`}
              onClick={() => setViewPeriod('30')}
            >
              30 {t('days', language)}
            </button>
            <button
              className={`period-btn ${viewPeriod === '90' ? 'active' : ''}`}
              onClick={() => setViewPeriod('90')}
            >
              90 {t('days', language)}
            </button>
          </div>

          {/* Price Chart */}
          <div className="chart-wrapper glass-panel mb-6 border-glow">
            <h3 className="chart-title mb-4 font-semibold text-primary">{t('price_trend', language)}</h3>
            <div className="chart-inner">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getFilteredData()} margin={{ top: 20, right: 10, left: -10, bottom: 40 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={trendColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={trendColor} stopOpacity={0} />
                    </linearGradient>
                    <filter id="glow" height="300%" width="300%" x="-75%" y="-75%">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />

                  <XAxis
                    dataKey="date"
                    tick={<CustomAxisTick rotation={-45} />}
                    tickLine={false}
                    axisLine={false}
                    height={60}
                  />

                  <YAxis
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value}`}
                    width={50}
                  />

                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />

                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={trendColor}
                    strokeWidth={3}
                    name={t('price', language)}
                    dot={{ r: 4, fill: '#1a1a24', strokeWidth: 2, stroke: trendColor }}
                    activeDot={{ r: 6, fill: trendColor, stroke: '#fff', strokeWidth: 2 }}
                    filter="url(#glow)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Market Locations */}
          <div className="market-locations glass-panel border-glow">
            <h3 className="font-semibold text-primary mb-4 flex-row items-center gap-2">
              <MapPin size={18} />
              {t('market_locations', language)}
            </h3>
            <div className="flex-col gap-3">
              {marketData.marketLocations.map((location, idx) => (
                <div key={idx} className="location-item flex-row justify-between items-center p-3 rounded-xl bg-surface/50 border border-light">
                  <span className="location-name text-secondary">{location.name}</span>
                  <span className="location-price font-bold text-primary">₹{location.price}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!selectedCrop && !loading && (
        <div className="empty-state glass-panel border-glow mt-8">
          <div className="empty-icon text-4xl mb-4 bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center">
            <LineChart className="text-primary w-10 h-10" />
          </div>
          <p className="text-secondary text-lg text-center">{t('select_crop_message', language)}</p>
        </div>
      )}
    </div>
  );
}

export default CropMarketTrends;
