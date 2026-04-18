/**
 * Crop Health Service
 * Analyzes crop health indicators based on NDVI and other metrics
 */

import { BaseAPIService } from './BaseAPIService.js';
import { INTELLIGENCE_CONFIG } from '../config/intelligence.config.js';

export class CropHealthService extends BaseAPIService {
  constructor() {
    super(
      'crophealth',
      INTELLIGENCE_CONFIG.API_ENDPOINTS.crop_health,
      INTELLIGENCE_CONFIG.API_KEYS.crop_health
    );
  }

  /**
   * Get crop health indicators
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @param {number} ndvi - NDVI value from satellite
   * @returns {Promise<Object>} Crop health data or error
   */
  async getCropHealth(latitude, longitude, ndvi) {
    // Validate inputs
    if (typeof ndvi !== 'number' || ndvi < -1.0 || ndvi > 1.0) {
      return {
        data: null,
        source: 'unavailable',
        error: 'Invalid NDVI value: must be between -1.0 and 1.0',
        success: false
      };
    }

    // For now, use NDVI-based calculations since crop health API is placeholder
    // In production, this would call an actual crop health API
    const cropHealthData = this.calculateCropHealthFromNDVI(ndvi);

    return {
      data: cropHealthData,
      source: 'calculated',
      error: null,
      success: true
    };
  }

  /**
   * Calculate crop health indicators from NDVI
   * @param {number} ndvi - NDVI value
   * @returns {Object} Crop health indicators
   */
  calculateCropHealthFromNDVI(ndvi) {
    const stressIndicators = [];
    let growthStage = 'unknown';
    let healthScore = 0;

    // Determine health score (0-100)
    if (ndvi > 0.6) {
      healthScore = 80 + (ndvi - 0.6) * 50; // 80-100
      growthStage = 'vegetative';
    } else if (ndvi > 0.4) {
      healthScore = 60 + (ndvi - 0.4) * 100; // 60-80
      growthStage = 'vegetative';
    } else if (ndvi > 0.2) {
      healthScore = 40 + (ndvi - 0.2) * 100; // 40-60
      growthStage = 'early_vegetative';
      stressIndicators.push('mild_water_stress');
    } else {
      healthScore = ndvi * 200; // 0-40
      growthStage = 'stressed';
      stressIndicators.push('severe_water_stress');
      stressIndicators.push('nutrient_deficiency');
    }

    // Add specific stress indicators based on NDVI ranges
    if (ndvi < 0.5) {
      stressIndicators.push('low_chlorophyll');
    }

    if (ndvi < 0.3) {
      stressIndicators.push('poor_vegetation_cover');
    }

    return {
      crop_stress_indicators: stressIndicators,
      vegetation_growth_stage: growthStage,
      health_score: Math.round(healthScore)
    };
  }

  /**
   * Assess crop stress level
   * @param {number} ndvi - NDVI value
   * @param {number} soilMoisture - Soil moisture index
   * @param {Object} weather - Weather data
   * @returns {Promise<Object>} Stress assessment
   */
  async assessCropStress(ndvi, soilMoisture, weather) {
    const stressFactors = [];
    let stressLevel = 'low';

    // NDVI-based stress
    if (ndvi < 0.4) {
      stressFactors.push('Low vegetation index');
      stressLevel = 'high';
    } else if (ndvi < 0.5) {
      stressFactors.push('Moderate vegetation index');
      stressLevel = stressLevel === 'high' ? 'high' : 'medium';
    }

    // Soil moisture stress
    if (soilMoisture < 0.3) {
      stressFactors.push('Low soil moisture');
      stressLevel = 'high';
    } else if (soilMoisture < 0.5) {
      stressFactors.push('Moderate soil moisture');
      stressLevel = stressLevel === 'high' ? 'high' : 'medium';
    }

    // Weather-based stress
    if (weather && weather.rainfall_30d < 50) {
      stressFactors.push('Low rainfall in past 30 days');
      stressLevel = stressLevel === 'low' ? 'medium' : 'high';
    }

    if (weather && weather.temperature > 35) {
      stressFactors.push('High temperature stress');
      stressLevel = stressLevel === 'low' ? 'medium' : 'high';
    }

    return {
      data: {
        stress_level: stressLevel,
        stress_factors: stressFactors,
        recommendation: this.getStressRecommendation(stressLevel, stressFactors)
      },
      source: 'calculated',
      error: null,
      success: true
    };
  }

  /**
   * Get recommendation based on stress level
   * @param {string} stressLevel - Stress level (low/medium/high)
   * @param {Array} stressFactors - List of stress factors
   * @returns {string} Recommendation text
   */
  getStressRecommendation(stressLevel, stressFactors) {
    if (stressLevel === 'high') {
      return 'Immediate action required: Increase irrigation, check for nutrient deficiencies, and monitor for pests/diseases.';
    } else if (stressLevel === 'medium') {
      return 'Monitor closely: Consider supplemental irrigation and foliar nutrient application if conditions worsen.';
    } else {
      return 'Crops are healthy: Continue current management practices and monitor regularly.';
    }
  }

  /**
   * Predict growth stage from NDVI trend
   * @param {Array} ndviHistory - Array of NDVI values over time
   * @returns {Object} Growth stage prediction
   */
  predictGrowthStage(ndviHistory) {
    if (!ndviHistory || ndviHistory.length < 2) {
      return {
        stage: 'unknown',
        confidence: 'low'
      };
    }

    const latest = ndviHistory[ndviHistory.length - 1];
    const previous = ndviHistory[ndviHistory.length - 2];
    const trend = latest - previous;

    let stage = 'unknown';
    let confidence = 'medium';

    if (latest > 0.6 && trend > 0) {
      stage = 'peak_vegetative';
      confidence = 'high';
    } else if (latest > 0.6 && trend < 0) {
      stage = 'flowering';
      confidence = 'high';
    } else if (latest > 0.4 && trend > 0) {
      stage = 'vegetative';
      confidence = 'high';
    } else if (latest > 0.4 && trend < 0) {
      stage = 'maturity';
      confidence = 'medium';
    } else if (latest < 0.4) {
      stage = 'early_vegetative_or_stressed';
      confidence = 'low';
    }

    return {
      stage,
      confidence,
      trend: trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable'
    };
  }
}

export default CropHealthService;
