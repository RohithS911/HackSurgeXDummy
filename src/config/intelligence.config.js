/**
 * Configuration for Agricultural Intelligence Engine
 */

export const INTELLIGENCE_CONFIG = {
  // API Timeouts
  API_TIMEOUT_MS: parseInt(import.meta.env.VITE_API_TIMEOUT_MS || '10000'),
  
  // Cache Durations (in hours)
  CACHE_DURATIONS: {
    geocoder: parseInt(import.meta.env.VITE_CACHE_GEOCODER_HOURS || '720'), // 30 days
    soilgrids: parseInt(import.meta.env.VITE_CACHE_SOIL_DAYS || '7') * 24,
    weather: parseInt(import.meta.env.VITE_CACHE_WEATHER_HOURS || '24'),
    satellite: parseInt(import.meta.env.VITE_CACHE_SATELLITE_DAYS || '3') * 24,
    crophealth: parseInt(import.meta.env.VITE_CACHE_SATELLITE_DAYS || '3') * 24,
    fertilizer: 720 // 30 days
  },
  
  // Processing Limits
  MAX_PROCESSING_TIME_MS: 15000,
  MAX_HISTORICAL_REPORTS: parseInt(import.meta.env.VITE_MAX_HISTORICAL_REPORTS || '50'),
  
  // Retry Configuration
  MAX_RETRIES: 2,
  RETRY_DELAY_BASE_MS: 1000,
  
  // Parallel Processing
  PARALLEL_API_REQUESTS: import.meta.env.VITE_PARALLEL_API_REQUESTS !== 'false',
  
  // Fertility Score Weights
  FERTILITY_WEIGHTS: {
    nitrogen: 0.40,
    organic_carbon: 0.35,
    ph: 0.25
  },
  
  // pH Ranges
  PH_RANGES: {
    optimal_min: 6.0,
    optimal_max: 7.5,
    acceptable_min: 5.0,
    acceptable_max: 8.5
  },
  
  // Nutrient Classification Thresholds
  NUTRIENT_THRESHOLDS: {
    nitrogen: {
      deficient: 0.15,
      sufficient: 0.25
    },
    phosphorus: {
      general: { deficient: 10, sufficient: 15 },
      rice: { deficient: 8, sufficient: 12 },
      vegetables: { deficient: 15, sufficient: 25 },
      cereals: { deficient: 10, sufficient: 18 }
    },
    potassium: {
      general: { deficient: 120, sufficient: 180 },
      rice: { deficient: 100, sufficient: 150 },
      vegetables: { deficient: 150, sufficient: 220 },
      cereals: { deficient: 110, sufficient: 170 }
    }
  },
  
  // Crop Priority Weights
  CROP_PRIORITY_WEIGHTS: {
    soil_suitability: 0.35,
    climate_match: 0.25,
    water_requirement_match: 0.20,
    market_potential: 0.20
  },
  
  // Risk Assessment Thresholds
  RISK_THRESHOLDS: {
    drought: {
      rainfall_low: 50,
      rainfall_moderate: 100,
      soil_moisture_low: 0.3,
      soil_moisture_moderate: 0.5
    },
    ndvi: {
      stress_threshold: 0.4
    }
  },
  
  // Irrigation Thresholds
  IRRIGATION_THRESHOLDS: {
    soil_moisture_low: 0.4,
    soil_moisture_high: 0.7,
    rain_threshold_mm: 5
  },
  
  // Soil Texture Volume Multipliers (liters per sqm)
  IRRIGATION_VOLUMES: {
    sandy: 30,
    loamy: 25,
    clayey: 20
  },
  
  // Crop Water Requirement Multipliers
  CROP_WATER_MULTIPLIERS: {
    high: 1.2,
    medium: 1.0,
    low: 0.8
  },
  
  // Supported Languages
  SUPPORTED_LANGUAGES: [
    'en', 'hi', 'kn', 'ta', 'te', 'mr', 'bn', 'gu', 'pa', 'ml', 'or', 'as'
  ]
};

export default INTELLIGENCE_CONFIG;
