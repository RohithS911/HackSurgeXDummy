/**
 * ISRO Bhuvan Service
 * Access to Indian satellite imagery and geospatial data
 */

import axios from 'axios';
import { BaseAPIService } from './BaseAPIService.js';
import { INTELLIGENCE_CONFIG } from '../config/intelligence.config.js';

export class BhuvanService extends BaseAPIService {
  constructor() {
    super(
      'bhuvan',
      'https://bhuvan.nrsc.gov.in',
      null // No API key needed - public API
    );
  }

  /**
   * Search for place information using Bhuvan Search API
   * @param {string} placeName - Name of the place to search
   * @returns {Promise<Object>} Place information with coordinates
   */
  async searchPlace(placeName) {
    if (!placeName || typeof placeName !== 'string') {
      return {
        data: null,
        source: 'unavailable',
        error: 'Invalid place name',
        success: false
      };
    }

    const result = await this.fetchWithResilience(async () => {
      return axios.get(`${this.baseUrl}/search/placename`, {
        params: {
          name: placeName
        },
        timeout: this.timeout
      });
    });

    if (!result.success) {
      return result;
    }

    // Parse Bhuvan response
    const places = result.data?.results || [];
    
    if (places.length === 0) {
      return {
        data: null,
        source: 'unavailable',
        error: 'Place not found',
        success: false
      };
    }

    // Return first match
    const place = places[0];
    
    return {
      data: {
        name: place.name,
        latitude: place.lat,
        longitude: place.lon,
        district: place.district,
        state: place.state,
        type: place.type
      },
      source: 'live',
      error: null,
      success: true
    };
  }

  /**
   * Get soil moisture data from ISRO EOS-04 satellite
   * Note: This is a placeholder for when ISRO releases public API
   * Currently returns estimated values based on location
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Promise<Object>} Soil moisture data
   */
  async getSoilMoisture(latitude, longitude) {
    // Validate inputs
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return {
        data: null,
        source: 'unavailable',
        error: 'Invalid coordinates',
        success: false
      };
    }

    // ISRO's operational soil moisture product is available but API access is limited
    // For now, we'll return estimated values based on season and location
    // When API becomes available, this can be updated
    
    const currentMonth = new Date().getMonth() + 1; // 1-12
    
    // Estimate based on monsoon season in India
    let soilMoisture = 0.3; // Default 30%
    
    // Monsoon season (June-September)
    if (currentMonth >= 6 && currentMonth <= 9) {
      soilMoisture = 0.6; // Higher moisture during monsoon
    }
    // Winter (October-February)
    else if (currentMonth >= 10 || currentMonth <= 2) {
      soilMoisture = 0.4; // Moderate moisture
    }
    // Summer (March-May)
    else {
      soilMoisture = 0.2; // Lower moisture in summer
    }

    return {
      data: {
        soil_moisture_percentage: soilMoisture * 100,
        soil_moisture_index: soilMoisture,
        resolution_meters: 500,
        satellite: 'EOS-04 (RISAT-1A)',
        sensor: 'C-band SAR',
        note: 'Estimated based on seasonal patterns. Direct API access pending ISRO release.'
      },
      source: 'estimated',
      error: null,
      success: true
    };
  }

  /**
   * Get agricultural stress index from Bhuvan
   * Note: Placeholder for future API integration
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Promise<Object>} Agricultural stress data
   */
  async getAgriculturalStress(latitude, longitude) {
    // This would integrate with Bhuvan's agricultural monitoring services
    // Currently returns estimated values
    
    return {
      data: {
        stress_level: 'low',
        vegetation_health: 'good',
        water_stress: 'moderate',
        note: 'Estimated values. Direct Bhuvan API integration pending.'
      },
      source: 'estimated',
      error: null,
      success: true
    };
  }
}

export default BhuvanService;
