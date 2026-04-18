import { useState } from 'react';
import './MarketWeatherScreen.css';
import WeatherAnalytics from './WeatherAnalytics';
import CropMarketTrends from './CropMarketTrends';
import { Cloud, LineChart } from 'lucide-react';
import { t } from '../translations';

function MarketWeatherScreen({ language }) {
  const [activeTab, setActiveTab] = useState('weather'); // weather or market

  return (
    <div className="screen market-weather-screen animate-fade-in">
      <div className="market-weather-header header-glass mb-4">
        <h1 className="screen-title text-gradient">{t('market_weather', language)}</h1>
      </div>

      <div className="tab-pill-container glass-panel">
        <button
          className={`tab-pill-btn ${activeTab === 'weather' ? 'active' : ''}`}
          onClick={() => setActiveTab('weather')}
        >
          <Cloud size={18} className={activeTab === 'weather' ? 'text-primary' : 'text-secondary'} />
          <span>{t('weather_analytics', language)}</span>
        </button>
        <button
          className={`tab-pill-btn ${activeTab === 'market' ? 'active' : ''}`}
          onClick={() => setActiveTab('market')}
        >
          <LineChart size={18} className={activeTab === 'market' ? 'text-primary' : 'text-secondary'} />
          <span>{t('crop_market', language)}</span>
        </button>      </div>

      <div className="tab-content relative">
        {activeTab === 'weather' && <WeatherAnalytics language={language} />}
        {activeTab === 'market' && <CropMarketTrends language={language} />}
      </div>
    </div>
  );
}

export default MarketWeatherScreen;
