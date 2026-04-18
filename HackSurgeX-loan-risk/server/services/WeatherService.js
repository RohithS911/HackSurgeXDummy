/**
 * Weather API Service
 * Retrieves current weather and forecast data
 */

import axios from 'axios';
import { BaseAPIService } from './BaseAPIService.js';
import { INTELLIGENCE_CONFIG } from '../config/intelligence.config.js';

export class WeatherService extends BaseAPIService {
  constructor() {
    super(
      'weather',
      INTELLIGENCE_CONFIG.API_ENDPOINTS.weather,
      INTELLIGENCE_CONFIG.API_KEYS.weather
    );
  }

  /**
   * Get weather data including current conditions and 7-day forecast
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Promise<Object>} Weather data or error
   */
  async getWeatherData(latitude, longitude) {
    // Validate inputs
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return {
        data: null,
        source: 'unavailable',
        error: 'Invalid coordinates: latitude and longitude must be numbers',
        success: false
      };
    }

    // Check if API key is present
    if (!this.apiKey) {
      return {
        data: null,
        source: 'unavailable',
        error: 'Weather API key not configured',
        success: false
      };
    }

    // Make API call with resilience
    const result = await this.fetchWithResilience(async () => {
      return axios.get(`${this.baseUrl}/forecast.json`, {
        params: {
          key: this.apiKey,
          q: `${latitude},${longitude}`,
          days: 7,
          aqi: 'no',
          alerts: 'no'
        },
        timeout: this.timeout
      });
    });

    // If API call failed, return error
    if (!result.success) {
      return result;
    }

    // Validate response structure
    const validation = this.validateResponse(result.data, {
      required: ['current', 'forecast'],
      fields: {}
    });

    if (!validation.valid) {
      return {
        data: null,
        source: 'unavailable',
        error: 'Invalid weather data response',
        success: false
      };
    }

    // Parse weather data
    const weatherData = this.parseWeatherData(result.data);

    return {
      data: weatherData,
      source: 'live',
      error: null,
      success: true
    };
  }

  /**
   * Parse weather data from API response
   * @param {Object} data - Raw API response
   * @returns {Object} Parsed weather data
   */
  parseWeatherData(data) {
    const current = data.current;
    const forecast = data.forecast.forecastday;

    // Calculate 30-day rainfall (use available forecast + estimate)
    // Note: WeatherAPI only provides 7-day forecast, so we'll use that
    const rainfall7d = forecast.reduce((sum, day) => {
      return sum + (day.day.totalprecip_mm || 0);
    }, 0);

    // Estimate 30-day rainfall (rough approximation)
    const rainfall_30d = rainfall7d * (30 / 7);

    // Parse 7-day forecast
    const weather_forecast_7_days = forecast.map(day => ({
      date: day.date,
      temp_max: day.day.maxtemp_c,
      temp_min: day.day.mintemp_c,
      rainfall_mm: day.day.totalprecip_mm || 0,
      humidity: day.day.avghumidity
    }));

    return {
      temperature: current.temp_c,
      rainfall_30d: Math.round(rainfall_30d * 10) / 10, // Round to 1 decimal
      humidity: current.humidity,
      weather_forecast_7_days
    };
  }

  /**
   * Get rainfall forecast for next N days
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @param {number} days - Number of days to forecast (max 7)
   * @returns {Promise<Object>} Rainfall forecast or error
   */
  async getRainfallForecast(latitude, longitude, days = 7) {
    const result = await this.getWeatherData(latitude, longitude);
    
    if (!result.success) {
      return result;
    }

    const forecast = result.data.weather_forecast_7_days.slice(0, days);
    const totalRainfall = forecast.reduce((sum, day) => sum + day.rainfall_mm, 0);

    return {
      data: {
        forecast,
        total_rainfall_mm: totalRainfall,
        days_with_rain: forecast.filter(d => d.rainfall_mm > 0).length
      },
      source: 'live',
      error: null,
      success: true
    };
  }

  /**
   * Check if rain is forecasted within N days
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @param {number} days - Number of days to check
   * @param {number} threshold - Minimum rainfall in mm to consider (default 5mm)
   * @returns {Promise<Object>} Rain forecast check result
   */
  async isRainForecasted(latitude, longitude, days = 3, threshold = 5) {
    const result = await this.getWeatherData(latitude, longitude);
    
    if (!result.success) {
      return result;
    }

    const forecast = result.data.weather_forecast_7_days.slice(0, days);
    const rainyDays = forecast.filter(d => d.rainfall_mm >= threshold);

    return {
      data: {
        rain_expected: rainyDays.length > 0,
        days_until_rain: rainyDays.length > 0 
          ? forecast.findIndex(d => d.rainfall_mm >= threshold)
          : null,
        rainy_days: rainyDays,
        total_rainfall_mm: forecast.reduce((sum, d) => sum + d.rainfall_mm, 0)
      },
      source: 'live',
      error: null,
      success: true
    };
  }
}

export default WeatherService;
