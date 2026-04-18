/**
 * Soil Health Card Service
 * Access to Indian government soil health data
 * Data source: Ministry of Agriculture & Farmers Welfare, Government of India
 */

import axios from 'axios';
import { BaseAPIService } from './BaseAPIService.js';

export class SoilHealthCardService extends BaseAPIService {
  constructor() {
    super(
      'soil_health_card',
      'https://soilhealth.dac.gov.in',
      null // No API key needed - public portal
    );
  }

  /**
   * Get soil health parameters based on location
   * Note: The Soil Health Card portal doesn't have a public REST API
   * This service provides estimated values based on Indian soil health standards
   * 
   * Soil Health Card tests 12 parameters:
   * - Macro nutrients: N, P, K
   * - Secondary nutrients: S (Sulphur)
   * - Micro nutrients: Zn, Fe, Cu, Mn, B
   * - Physical properties: pH, EC, OC
   * 
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @param {string} soilType - Soil type from ML model
   * @returns {Promise<Object>} Soil health card parameters
   */
  async getSoilHealthParameters(latitude, longitude, soilType = 'Unknown') {
    // Validate inputs
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return {
        data: null,
        source: 'unavailable',
        error: 'Invalid coordinates',
        success: false
      };
    }

    // Get state from coordinates (simplified - based on lat/long ranges)
    const state = this.getStateFromCoordinates(latitude, longitude);
    
    // Get typical soil health parameters for the soil type
    const parameters = this.getTypicalParameters(soilType, state);

    return {
      data: {
        ...parameters,
        state: state,
        soil_type: soilType,
        recommendations: this.getRecommendations(parameters),
        note: 'Based on Soil Health Card standards. For official data, visit soilhealth.dac.gov.in'
      },
      source: 'estimated',
      error: null,
      success: true
    };
  }

  /**
   * Get state from coordinates (simplified mapping)
   */
  getStateFromCoordinates(lat, lon) {
    // Simplified state detection based on lat/long ranges
    if (lat >= 8 && lat <= 18 && lon >= 74 && lon <= 80) return 'Karnataka';
    if (lat >= 18 && lat <= 22 && lon >= 73 && lon <= 80) return 'Maharashtra';
    if (lat >= 8 && lat <= 13 && lon >= 76 && lon <= 80) return 'Tamil Nadu';
    if (lat >= 23 && lat <= 30 && lon >= 68 && lon <= 75) return 'Rajasthan';
    if (lat >= 20 && lat <= 27 && lon >= 82 && lon <= 88) return 'Madhya Pradesh';
    if (lat >= 24 && lat <= 32 && lon >= 74 && lon <= 80) return 'Uttar Pradesh';
    if (lat >= 21 && lat <= 27 && lon >= 85 && lon <= 90) return 'West Bengal';
    if (lat >= 15 && lat <= 20 && lon >= 78 && lon <= 85) return 'Telangana';
    if (lat >= 15 && lat <= 20 && lon >= 78 && lon <= 85) return 'Andhra Pradesh';
    if (lat >= 26 && lat <= 31 && lon >= 73 && lon <= 78) return 'Punjab';
    if (lat >= 8 && lat <= 13 && lon >= 75 && lon <= 77) return 'Kerala';
    return 'India';
  }

  /**
   * Get typical soil health parameters based on soil type
   */
  getTypicalParameters(soilType, state) {
    const soilTypeLower = soilType.toLowerCase();
    
    // Default parameters
    let params = {
      // Macro nutrients (kg/ha)
      nitrogen_n: 250,
      phosphorus_p: 25,
      potassium_k: 150,
      
      // Secondary nutrients (ppm)
      sulphur_s: 15,
      
      // Micro nutrients (ppm)
      zinc_zn: 1.2,
      iron_fe: 8.0,
      copper_cu: 0.5,
      manganese_mn: 5.0,
      boron_b: 0.8,
      
      // Physical properties
      ph: 6.5,
      electrical_conductivity_ec: 0.4, // dS/m
      organic_carbon_oc: 0.5 // %
    };

    // Adjust based on soil type
    if (soilTypeLower.includes('black')) {
      params.ph = 7.5;
      params.nitrogen_n = 200;
      params.potassium_k = 300;
      params.organic_carbon_oc = 0.4;
    } else if (soilTypeLower.includes('red')) {
      params.ph = 6.0;
      params.nitrogen_n = 180;
      params.phosphorus_p = 15;
      params.iron_fe = 12.0;
      params.organic_carbon_oc = 0.3;
    } else if (soilTypeLower.includes('alluvial')) {
      params.ph = 7.0;
      params.nitrogen_n = 280;
      params.phosphorus_p = 30;
      params.potassium_k = 200;
      params.organic_carbon_oc = 0.8;
    } else if (soilTypeLower.includes('laterite')) {
      params.ph = 5.5;
      params.nitrogen_n = 150;
      params.phosphorus_p = 10;
      params.iron_fe = 15.0;
      params.organic_carbon_oc = 0.2;
    }

    return params;
  }

  /**
   * Get recommendations based on soil health parameters
   */
  getRecommendations(params) {
    const recommendations = [];

    // pH recommendations
    if (params.ph < 5.5) {
      recommendations.push('Apply lime @ 2-4 quintals/ha to correct soil acidity');
    } else if (params.ph > 8.5) {
      recommendations.push('Apply gypsum @ 2-3 quintals/ha to correct alkalinity');
    }

    // Nitrogen recommendations
    if (params.nitrogen_n < 200) {
      recommendations.push('Low nitrogen - Apply urea @ 100-120 kg/ha or FYM @ 10 tons/ha');
    }

    // Phosphorus recommendations
    if (params.phosphorus_p < 20) {
      recommendations.push('Low phosphorus - Apply DAP @ 80-100 kg/ha or SSP @ 150-200 kg/ha');
    }

    // Potassium recommendations
    if (params.potassium_k < 120) {
      recommendations.push('Low potassium - Apply MOP @ 60-80 kg/ha');
    }

    // Organic carbon recommendations
    if (params.organic_carbon_oc < 0.5) {
      recommendations.push('Low organic matter - Apply FYM/compost @ 10-15 tons/ha');
    }

    // Zinc recommendations
    if (params.zinc_zn < 0.6) {
      recommendations.push('Zinc deficiency - Apply zinc sulphate @ 25 kg/ha');
    }

    // Iron recommendations
    if (params.iron_fe < 4.5) {
      recommendations.push('Iron deficiency - Apply ferrous sulphate @ 25 kg/ha');
    }

    if (recommendations.length === 0) {
      recommendations.push('Soil health is good. Maintain with balanced fertilization.');
    }

    return recommendations;
  }

  /**
   * Get fertilizer recommendations in Soil Health Card format
   */
  getFertilizerDose(soilType, cropType = 'general') {
    const soilTypeLower = soilType.toLowerCase();
    
    // Fertilizer doses in kg/ha
    let dose = {
      nitrogen: 120,
      phosphorus: 60,
      potassium: 40
    };

    // Adjust based on soil type
    if (soilTypeLower.includes('black')) {
      dose = { nitrogen: 100, phosphorus: 50, potassium: 60 };
    } else if (soilTypeLower.includes('red')) {
      dose = { nitrogen: 150, phosphorus: 75, potassium: 50 };
    } else if (soilTypeLower.includes('alluvial')) {
      dose = { nitrogen: 120, phosphorus: 60, potassium: 40 };
    } else if (soilTypeLower.includes('laterite')) {
      dose = { nitrogen: 180, phosphorus: 90, potassium: 60 };
    }

    return {
      data: {
        nitrogen_kg_per_ha: dose.nitrogen,
        phosphorus_kg_per_ha: dose.phosphorus,
        potassium_kg_per_ha: dose.potassium,
        npk_ratio: `${Math.round(dose.nitrogen/10)}:${Math.round(dose.phosphorus/10)}:${Math.round(dose.potassium/10)}`,
        application_method: 'Split application - 50% basal, 25% at 30 days, 25% at 60 days',
        note: 'Based on Soil Health Card recommendations'
      },
      source: 'estimated',
      error: null,
      success: true
    };
  }
}

export default SoilHealthCardService;
