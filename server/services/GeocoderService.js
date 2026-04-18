/**
 * OpenCage Geocoder Service
 * Converts GPS coordinates to location information
 */

import axios from 'axios';
import { BaseAPIService } from './BaseAPIService.js';
import { INTELLIGENCE_CONFIG } from '../config/intelligence.config.js';

export class GeocoderService extends BaseAPIService {
  constructor() {
    super(
      'geocoder',
      INTELLIGENCE_CONFIG.API_ENDPOINTS.opencage,
      INTELLIGENCE_CONFIG.API_KEYS.opencage
    );
  }

  /**
   * Reverse geocode coordinates to location details
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Promise<Object>} Location data or error
   */
  async reverseGeocode(latitude, longitude) {
    // Validate inputs
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return {
        data: null,
        source: 'unavailable',
        error: 'Invalid coordinates: latitude and longitude must be numbers',
        success: false
      };
    }

    if (latitude < -90 || latitude > 90) {
      return {
        data: null,
        source: 'unavailable',
        error: 'Invalid latitude: must be between -90 and 90',
        success: false
      };
    }

    if (longitude < -180 || longitude > 180) {
      return {
        data: null,
        source: 'unavailable',
        error: 'Invalid longitude: must be between -180 and 180',
        success: false
      };
    }

    // Check if API key is present
    if (!this.apiKey) {
      return {
        data: null,
        source: 'unavailable',
        error: 'OpenCage API key not configured',
        success: false
      };
    }

    // Make API call with resilience
    const result = await this.fetchWithResilience(async () => {
      return axios.get(`${this.baseUrl}/json`, {
        params: {
          q: `${latitude}+${longitude}`,
          key: this.apiKey,
          no_annotations: 1,
          language: 'en'
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
      required: ['results'],
      fields: {}
    });

    if (!validation.valid || !result.data.results || result.data.results.length === 0) {
      return {
        data: null,
        source: 'unavailable',
        error: 'No location data found for coordinates',
        success: false
      };
    }

    // Extract location data
    const firstResult = result.data.results[0];
    const components = firstResult.components || {};

    const locationData = {
      latitude,
      longitude,
      district: components.county || components.state_district || components.city || 'Unknown',
      state: components.state || 'Unknown',
      country: components.country || 'Unknown',
      formatted_address: firstResult.formatted || `${latitude}, ${longitude}`
    };

    return {
      data: locationData,
      source: 'live',
      error: null,
      success: true
    };
  }

  /**
   * Get location name from coordinates (simplified version)
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Promise<string>} Formatted location name
   */
  async getLocationName(latitude, longitude) {
    const result = await this.reverseGeocode(latitude, longitude);
    
    if (result.success && result.data) {
      return `${result.data.district}, ${result.data.state}, ${result.data.country}`;
    }
    
    return `${latitude}, ${longitude}`;
  }
}

export default GeocoderService;
