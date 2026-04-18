import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, CloudRain, Wind, MapPin } from 'lucide-react';
import './WeatherAnalytics.css';
import { t } from '../translations';

function WeatherAnalytics({ language }) {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('daily'); // hourly, daily, weekly
  const [locationName, setLocationName] = useState('');
  const [usingDefaultLocation, setUsingDefaultLocation] = useState(false);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);

      let latitude, longitude;

      // Try to get user location
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: false
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        setUsingDefaultLocation(false);
      } catch (geoError) {
        console.warn('Geolocation denied or failed, using default location (Bangalore)');
        // Default to Bangalore, India if geolocation fails
        latitude = 12.9716;
        longitude = 77.5946;
        setLocationName('Bangalore, India');
        setUsingDefaultLocation(true);
      }

      // Fetch weather analytics
      const response = await fetch(
        `http://localhost:3001/api/weather/analytics?latitude=${latitude}&longitude=${longitude}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();
      setWeatherData(data);

      // Get location name if not using default
      if (!usingDefaultLocation && data.current.location) {
        setLocationName(`${data.current.location.city || ''}, ${data.current.location.state || ''}`);
      }

      setError(null);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Custom tooltips for dark theme charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip glass-panel">
          <p className="tooltip-date">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="tooltip-data" style={{ color: entry.color }}>
              <span className="tooltip-label">{entry.name}: </span>
              <span className="tooltip-value">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="weather-analytics loading-state glass-panel">
        <div className="spinner"></div>
        <p className="text-secondary mt-4">{t('loading', language)}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-analytics error-state glass-panel">
        <p className="text-rose-500 mb-4">❌ {error}</p>
        <button className="btn btn-primary" onClick={fetchWeatherData}>
          {t('retry', language)}
        </button>
      </div>
    );
  }

  if (!weatherData) return null;

  const { current, forecast } = weatherData;

  const CustomAxisTick = ({ x, y, stroke, payload }) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="end" fill="var(--text-secondary)" fontSize={12} transform="rotate(-35)">
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <div className="weather-analytics animate-fade-in-up">
      {/* Current Weather Summary */}
      <div className="weather-summary glass-panel mb-6 border-glow">
        <div className="flex-row justify-between mb-4">
          <h2 className="section-title text-gradient">{t('current_weather', language)}</h2>
          {locationName && (
            <div className="location-indicator">
              <MapPin size={16} className="text-primary mr-1" />
              <span>{locationName}</span>
              {usingDefaultLocation && (
                <span className="default-badge ml-2 text-xs">Current Location</span>
              )}
            </div>
          )}
        </div>

        <div className="weather-grid">
          <div className="weather-card glass-panel interactive">
            <div className="weather-icon-wrapper text-rose-500 bg-rose-500/10">
              <Thermometer size={24} />
            </div>
            <div className="weather-info">
              <div className="weather-value">{current.temperature}°C</div>
              <div className="weather-label">{t('temperature', language)}</div>
            </div>
          </div>
          <div className="weather-card glass-panel interactive">
            <div className="weather-icon-wrapper text-blue-400 bg-blue-400/10">
              <Droplets size={24} />
            </div>
            <div className="weather-info">
              <div className="weather-value">{current.humidity}%</div>
              <div className="weather-label">{t('humidity', language)}</div>
            </div>
          </div>
          <div className="weather-card glass-panel interactive">
            <div className="weather-icon-wrapper text-primary bg-primary/10">
              <CloudRain size={24} />
            </div>
            <div className="weather-info">
              <div className="weather-value">{current.rainfall_30d}mm</div>
              <div className="weather-label">{t('rainfall', language)}</div>
            </div>
          </div>
          <div className="weather-card glass-panel interactive">
            <div className="weather-icon-wrapper text-purple-400 bg-purple-400/10">
              <Wind size={24} />
            </div>
            <div className="weather-info">
              <div className="weather-value">{forecast[0].windSpeed.toFixed(1)} km/h</div>
              <div className="weather-label">{t('wind_speed', language)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="view-selector-glass mb-6">
        <button
          className={`view-btn ${viewMode === 'daily' ? 'active' : ''}`}
          onClick={() => setViewMode('daily')}
        >
          {t('daily', language)}
        </button>
        <button
          className={`view-btn ${viewMode === 'weekly' ? 'active' : ''}`}
          onClick={() => setViewMode('weekly')}
        >
          {t('weekly', language)}
        </button>
      </div>

      {/* Charts Grid */}
      <div className="charts-masonry">
        {/* Temperature Trend Chart */}
        <div className="chart-wrapper glass-panel">
          <h3 className="chart-title flex-row gap-2">
            <Thermometer size={18} className="text-rose-500" />
            {t('temperature_trend', language)}
          </h3>
          <div className="chart-inner">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={<CustomAxisTick />} tickLine={false} axisLine={false} height={60} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  name={t('temperature', language)}
                  dot={{ r: 4, fill: '#1a1a24', strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Humidity Trend Chart */}
        <div className="chart-wrapper glass-panel">
          <h3 className="chart-title flex-row gap-2">
            <Droplets size={18} className="text-blue-400" />
            {t('humidity_trend', language)}
          </h3>
          <div className="chart-inner">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={<CustomAxisTick />} tickLine={false} axisLine={false} height={60} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="#60a5fa"
                  strokeWidth={3}
                  name={t('humidity', language)}
                  dot={{ r: 4, fill: '#1a1a24', strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rainfall Forecast Chart */}
        <div className="chart-wrapper glass-panel">
          <h3 className="chart-title flex-row gap-2">
            <CloudRain size={18} className="text-primary" />
            {t('rainfall_forecast', language)}
          </h3>
          <div className="chart-inner">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <defs>
                  <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={<CustomAxisTick />} tickLine={false} axisLine={false} height={60} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar
                  dataKey="rainfall"
                  fill="url(#colorRain)"
                  radius={[4, 4, 0, 0]}
                  name={t('rainfall', language)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wind Speed Trend Chart */}
        <div className="chart-wrapper glass-panel">
          <h3 className="chart-title flex-row gap-2">
            <Wind size={18} className="text-purple-400" />
            {t('wind_speed_trend', language)}
          </h3>
          <div className="chart-inner">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={<CustomAxisTick />} tickLine={false} axisLine={false} height={60} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Line
                  type="monotone"
                  dataKey="windSpeed"
                  stroke="#a78bfa"
                  strokeWidth={3}
                  name={t('wind_speed', language)}
                  dot={{ r: 4, fill: '#1a1a24', strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeatherAnalytics;
