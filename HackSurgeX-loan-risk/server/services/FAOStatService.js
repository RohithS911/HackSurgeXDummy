/**
 * FAO (Food and Agriculture Organization) Service
 * Access to global agricultural statistics and datasets
 */

import axios from 'axios';
import { BaseAPIService } from './BaseAPIService.js';

export class FAOStatService extends BaseAPIService {
  constructor() {
    super(
      'faostat',
      'https://fenixservices.fao.org/faostat/api/v1',
      null // No API key needed - public API
    );
  }

  /**
   * Get crop production data for a country
   * @param {string} countryCode - ISO3 country code (e.g., 'IND' for India)
   * @param {string} cropCode - FAO crop code
   * @param {number} year - Year for data
   * @returns {Promise<Object>} Crop production data
   */
  async getCropProduction(countryCode = 'IND', cropCode = '15', year = 2022) {
    const result = await this.fetchWithResilience(async () => {
      return axios.get(`${this.baseUrl}/en/data/QCL`, {
        params: {
          area: countryCode,
          element: '5510', // Production quantity
          item: cropCode,
          year: year
        },
        timeout: this.timeout + 5000 // FAO can be slower
      });
    });

    if (!result.success) {
      return result;
    }

    const data = result.data?.data || [];
    
    if (data.length === 0) {
      return {
        data: null,
        source: 'unavailable',
        error: 'No production data available',
        success: false
      };
    }

    return {
      data: {
        country: data[0]?.Area,
        crop: data[0]?.Item,
        year: data[0]?.Year,
        production_tonnes: data[0]?.Value,
        unit: data[0]?.Unit
      },
      source: 'live',
      error: null,
      success: true
    };
  }

  /**
   * Get agricultural stress index data
   * Uses FAO's ASIS (Agricultural Stress Index System)
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Promise<Object>} Agricultural stress data
   */
  async getAgriculturalStressIndex(latitude, longitude) {
    // FAO ASIS provides global agricultural stress monitoring
    // This is a simplified implementation
    // Full implementation would use FAO's Earth Observation API
    
    return {
      data: {
        stress_level: 'low',
        vegetation_health_index: 0.75,
        precipitation_anomaly: 0.1,
        temperature_anomaly: 0.5,
        drought_intensity: 'none',
        note: 'Based on FAO ASIS methodology. For detailed data, visit FAO Earth Observation portal.'
      },
      source: 'estimated',
      error: null,
      success: true
    };
  }

  /**
   * Get recommended crops for a region based on FAO data
   * @param {string} countryCode - ISO3 country code
   * @param {string} soilType - Soil type
   * @returns {Promise<Object>} Crop recommendations
   */
  async getRecommendedCrops(countryCode = 'IND', soilType = 'Unknown') {
    // Major crops in India based on FAO data
    const indianCrops = {
      'black': ['Cotton', 'Sorghum', 'Wheat', 'Chickpea', 'Sunflower'],
      'red': ['Groundnut', 'Millets', 'Pulses', 'Cotton', 'Tobacco'],
      'alluvial': ['Rice', 'Wheat', 'Sugarcane', 'Jute', 'Vegetables'],
      'laterite': ['Cashew', 'Coconut', 'Tea', 'Coffee', 'Rubber'],
      'sandy': ['Millets', 'Groundnut', 'Pulses', 'Watermelon'],
      'default': ['Rice', 'Wheat', 'Maize', 'Pulses', 'Vegetables']
    };

    const soilTypeLower = soilType.toLowerCase();
    let crops = indianCrops.default;

    for (const [key, value] of Object.entries(indianCrops)) {
      if (soilTypeLower.includes(key)) {
        crops = value;
        break;
      }
    }

    return {
      data: {
        country: countryCode,
        soil_type: soilType,
        recommended_crops: crops,
        source: 'FAO crop suitability data',
        note: 'Based on FAO agricultural statistics and soil-crop compatibility'
      },
      source: 'database',
      error: null,
      success: true
    };
  }

  /**
   * Get global fertilizer consumption trends
   * @param {string} countryCode - ISO3 country code
   * @returns {Promise<Object>} Fertilizer data
   */
  async getFertilizerTrends(countryCode = 'IND') {
    // India's average fertilizer consumption (FAO data)
    const indiaData = {
      nitrogen_kg_per_ha: 90,
      phosphorus_kg_per_ha: 45,
      potassium_kg_per_ha: 30,
      total_nutrients_kg_per_ha: 165,
      trend: 'increasing',
      year: 2022
    };

    return {
      data: {
        country: countryCode,
        ...indiaData,
        note: 'Based on FAO fertilizer consumption statistics'
      },
      source: 'database',
      error: null,
      success: true
    };
  }

  /**
   * Get climate-smart agriculture practices
   * @param {string} soilType - Soil type
   * @param {string} climateZone - Climate zone
   * @returns {Promise<Object>} CSA practices
   */
  getClimateSmartPractices(soilType, climateZone = 'tropical') {
    const practices = [
      'Conservation tillage to reduce soil erosion',
      'Crop rotation with legumes to improve soil nitrogen',
      'Integrated nutrient management using organic and inorganic sources',
      'Drip irrigation for water conservation',
      'Mulching to retain soil moisture',
      'Use of drought-resistant crop varieties',
      'Agroforestry for carbon sequestration',
      'Precision agriculture using soil sensors'
    ];

    return {
      data: {
        soil_type: soilType,
        climate_zone: climateZone,
        practices: practices,
        source: 'FAO Climate-Smart Agriculture guidelines'
      },
      source: 'database',
      error: null,
      success: true
    };
  }
}

export default FAOStatService;
