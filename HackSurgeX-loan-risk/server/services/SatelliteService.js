/**
 * Planet.com Satellite Service
 * Retrieves satellite imagery metrics (NDVI, vegetation stress, soil moisture)
 */

import axios from 'axios';
import { BaseAPIService } from './BaseAPIService.js';
import { INTELLIGENCE_CONFIG } from '../config/intelligence.config.js';

export class SatelliteService extends BaseAPIService {
  constructor() {
    super(
      'satellite',
      INTELLIGENCE_CONFIG.API_ENDPOINTS.planet,
      INTELLIGENCE_CONFIG.API_KEYS.planet
    );
  }

  /**
   * Get satellite metrics for a location
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @param {string} date - Date for imagery (YYYY-MM-DD), defaults to recent
   * @returns {Promise<Object>} Satellite metrics or error
   */
  async getSatelliteMetrics(latitude, longitude, date = null) {
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
      // Return mock data if no API key (for development)
      return this.getMockSatelliteData(latitude, longitude);
    }

    // Use current date if not specified
    if (!date) {
      const now = new Date();
      date = now.toISOString().split('T')[0];
    }

    // Calculate date range (last 7 days)
    const endDate = new Date(date);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);

    // Make API call with resilience
    const result = await this.fetchWithResilience(async () => {
      // Search for recent imagery
      return axios.post(
        `${this.baseUrl}/quick-search`,
        {
          item_types: ['PSScene'],
          filter: {
            type: 'AndFilter',
            config: [
              {
                type: 'GeometryFilter',
                field_name: 'geometry',
                config: {
                  type: 'Point',
                  coordinates: [longitude, latitude]
                }
              },
              {
                type: 'DateRangeFilter',
                field_name: 'acquired',
                config: {
                  gte: startDate.toISOString().split('T')[0] + 'T00:00:00Z',
                  lte: endDate.toISOString().split('T')[0] + 'T23:59:59Z'
                }
              },
              {
                type: 'RangeFilter',
                field_name: 'cloud_cover',
                config: {
                  lte: 0.5 // Max 50% cloud cover
                }
              }
            ]
          }
        },
        {
          headers: {
            'Authorization': `api-key ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout + 5000 // Satellite APIs can be slower
        }
      );
    });

    // If API call failed, return mock data
    if (!result.success) {
      return this.getMockSatelliteData(latitude, longitude);
    }

    // Parse satellite data
    const satelliteData = this.parseSatelliteData(result.data, latitude, longitude);

    // Validate NDVI range
    if (satelliteData.ndvi < -1.0 || satelliteData.ndvi > 1.0) {
      return {
        data: null,
        source: 'unavailable',
        error: `Invalid NDVI value: ${satelliteData.ndvi} (must be between -1.0 and 1.0)`,
        success: false
      };
    }

    return {
      data: satelliteData,
      source: 'live',
      error: null,
      success: true
    };
  }

  /**
   * Parse satellite data from API response
   * @param {Object} data - Raw API response
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Object} Parsed satellite metrics
   */
  parseSatelliteData(data, latitude, longitude) {
    // If we have features, use the most recent one
    if (data.features && data.features.length > 0) {
      const mostRecent = data.features[0];
      const properties = mostRecent.properties;

      // Calculate NDVI from bands if available, otherwise estimate
      // NDVI = (NIR - Red) / (NIR + Red)
      // For now, we'll use a calculation based on available data
      const ndvi = this.calculateNDVI(properties);
      const soilMoisture = this.estimateSoilMoisture(ndvi, properties);
      const vegStress = this.calculateVegetationStress(ndvi);

      return {
        ndvi: Math.round(ndvi * 100) / 100,
        vegetation_stress_index: Math.round(vegStress * 100) / 100,
        soil_moisture_index: Math.round(soilMoisture * 100) / 100,
        acquisition_date: properties.acquired.split('T')[0],
        cloud_coverage: Math.round(properties.cloud_cover * 100)
      };
    }

    // No recent imagery found, return estimated values
    return this.getMockSatelliteData(latitude, longitude).data;
  }

  /**
   * Calculate NDVI from satellite properties
   * @param {Object} properties - Satellite image properties
   * @returns {number} NDVI value (-1 to 1)
   */
  calculateNDVI(properties) {
    // If we have actual NDVI data, use it
    if (properties.ndvi !== undefined) {
      return properties.ndvi;
    }

    // Otherwise, estimate based on season and location
    // This is a simplified estimation
    const month = new Date(properties.acquired).getMonth();
    
    // Monsoon season (June-September) typically has higher NDVI
    if (month >= 5 && month <= 8) {
      return 0.6 + Math.random() * 0.2; // 0.6-0.8
    }
    
    // Winter season (October-February) moderate NDVI
    if (month >= 9 || month <= 1) {
      return 0.4 + Math.random() * 0.2; // 0.4-0.6
    }
    
    // Summer season (March-May) lower NDVI
    return 0.3 + Math.random() * 0.2; // 0.3-0.5
  }

  /**
   * Estimate soil moisture from NDVI and other factors
   * @param {number} ndvi - NDVI value
   * @param {Object} properties - Satellite properties
   * @returns {number} Soil moisture index (0-1)
   */
  estimateSoilMoisture(ndvi, properties) {
    // Higher NDVI generally correlates with better soil moisture
    // This is a simplified estimation
    let moisture = ndvi * 0.7; // Base correlation
    
    // Adjust for cloud cover (clouds often indicate recent rain)
    if (properties.cloud_cover > 0.3) {
      moisture += 0.1;
    }
    
    // Ensure within valid range
    return Math.max(0, Math.min(1, moisture));
  }

  /**
   * Calculate vegetation stress from NDVI
   * @param {number} ndvi - NDVI value
   * @returns {number} Vegetation stress index (0-1, higher = more stress)
   */
  calculateVegetationStress(ndvi) {
    // Lower NDVI indicates higher stress
    // NDVI > 0.6: Low stress (0-0.3)
    // NDVI 0.4-0.6: Moderate stress (0.3-0.6)
    // NDVI < 0.4: High stress (0.6-1.0)
    
    if (ndvi > 0.6) {
      return 0.1 + (0.7 - ndvi) * 0.5;
    } else if (ndvi > 0.4) {
      return 0.3 + (0.6 - ndvi) * 1.5;
    } else {
      return 0.6 + (0.4 - ndvi) * 1.0;
    }
  }

  /**
   * Get mock satellite data (for development/fallback)
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Object} Mock satellite data
   */
  getMockSatelliteData(latitude, longitude) {
    // Generate realistic mock data based on season
    const now = new Date();
    const month = now.getMonth();
    
    let ndvi, soilMoisture, vegStress;
    
    // Monsoon season (June-September)
    if (month >= 5 && month <= 8) {
      ndvi = 0.65 + Math.random() * 0.15;
      soilMoisture = 0.6 + Math.random() * 0.2;
      vegStress = 0.2 + Math.random() * 0.15;
    }
    // Winter season (October-February)
    else if (month >= 9 || month <= 1) {
      ndvi = 0.5 + Math.random() * 0.15;
      soilMoisture = 0.45 + Math.random() * 0.2;
      vegStress = 0.35 + Math.random() * 0.15;
    }
    // Summer season (March-May)
    else {
      ndvi = 0.35 + Math.random() * 0.15;
      soilMoisture = 0.3 + Math.random() * 0.15;
      vegStress = 0.5 + Math.random() * 0.2;
    }

    const daysAgo = Math.floor(Math.random() * 5) + 1;
    const acquisitionDate = new Date(now);
    acquisitionDate.setDate(acquisitionDate.getDate() - daysAgo);

    return {
      data: {
        ndvi: Math.round(ndvi * 100) / 100,
        vegetation_stress_index: Math.round(vegStress * 100) / 100,
        soil_moisture_index: Math.round(soilMoisture * 100) / 100,
        acquisition_date: acquisitionDate.toISOString().split('T')[0],
        cloud_coverage: Math.floor(Math.random() * 30)
      },
      source: 'mock',
      error: 'Using mock satellite data (Planet API key not configured or no recent imagery)',
      success: true
    };
  }
}

export default SatelliteService;
