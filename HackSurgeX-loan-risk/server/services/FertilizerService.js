/**
 * Fertilizer Service
 * Provides fertilizer recommendations based on soil properties and crop type
 */

import { BaseAPIService } from './BaseAPIService.js';
import { INTELLIGENCE_CONFIG } from '../config/intelligence.config.js';

export class FertilizerService extends BaseAPIService {
  constructor() {
    super(
      'fertilizer',
      INTELLIGENCE_CONFIG.API_ENDPOINTS.fertilizer,
      null // No API key - using built-in database
    );

    // Built-in fertilizer database
    this.fertilizerDatabase = this.initializeFertilizerDatabase();
  }

  /**
   * Initialize fertilizer recommendation database
   * @returns {Object} Fertilizer database
   */
  initializeFertilizerDatabase() {
    return {
      // NPK ratios for different deficiency patterns
      npk_ratios: {
        balanced: '20:20:20',
        nitrogen_high: '30:10:10',
        phosphorus_high: '10:30:10',
        potassium_high: '10:10:30',
        nitrogen_phosphorus: '25:25:10',
        nitrogen_potassium: '25:10:25',
        phosphorus_potassium: '10:25:25',
        all_deficient: '20:20:20'
      },

      // Base dosages per acre (kg)
      base_dosages: {
        rice: 50,
        wheat: 45,
        vegetables: 60,
        cereals: 45,
        pulses: 30,
        general: 40
      },

      // Organic amendments
      organic_amendments: {
        nitrogen: ['Vermicompost 2 tons/acre', 'Farmyard manure 5 tons/acre', 'Green manure'],
        phosphorus: ['Rock phosphate 100 kg/acre', 'Bone meal 150 kg/acre'],
        potassium: ['Wood ash 100 kg/acre', 'Potash 50 kg/acre'],
        general: ['Compost 3 tons/acre', 'Biofertilizers']
      },

      // Application methods
      application_methods: {
        broadcast: 'Broadcast and incorporate into soil',
        side_dressing: 'Apply in bands beside crop rows',
        top_dressing: 'Apply on soil surface around plants',
        foliar: 'Spray diluted solution on leaves'
      }
    };
  }

  /**
   * Get fertilizer recommendation
   * @param {string} soilType - Soil classification
   * @param {Object} nutrientLevels - Current NPK levels
   * @param {string} cropType - Target crop (optional)
   * @returns {Promise<Object>} Fertilizer recommendation
   */
  async getFertilizerRecommendation(soilType, nutrientLevels, cropType = 'general') {
    // Validate inputs
    if (!nutrientLevels || typeof nutrientLevels !== 'object') {
      return {
        data: null,
        source: 'unavailable',
        error: 'Invalid nutrient levels data',
        success: false
      };
    }

    // Determine NPK ratio based on deficiencies
    const npkRatio = this.determineNPKRatio(nutrientLevels);

    // Calculate dosage
    const dosage = this.calculateDosage(nutrientLevels, cropType, soilType);

    // Get organic alternatives
    const organicAlternatives = this.getOrganicAlternatives(nutrientLevels);

    // Determine application method
    const applicationMethod = this.determineApplicationMethod(cropType);

    const recommendation = {
      npk_ratio: npkRatio,
      nitrogen_kg_per_acre: dosage.nitrogen,
      phosphorus_kg_per_acre: dosage.phosphorus,
      potassium_kg_per_acre: dosage.potassium,
      organic_amendments: organicAlternatives,
      application_method: applicationMethod
    };

    return {
      data: recommendation,
      source: 'database',
      error: null,
      success: true
    };
  }

  /**
   * Determine NPK ratio based on nutrient deficiencies
   * @param {Object} nutrientLevels - Nutrient status
   * @returns {string} NPK ratio
   */
  determineNPKRatio(nutrientLevels) {
    const deficiencies = nutrientLevels.deficiencies || [];

    if (deficiencies.length === 0) {
      return this.fertilizerDatabase.npk_ratios.balanced;
    }

    if (deficiencies.length === 3) {
      return this.fertilizerDatabase.npk_ratios.all_deficient;
    }

    if (deficiencies.length === 2) {
      if (deficiencies.includes('nitrogen') && deficiencies.includes('phosphorus')) {
        return this.fertilizerDatabase.npk_ratios.nitrogen_phosphorus;
      }
      if (deficiencies.includes('nitrogen') && deficiencies.includes('potassium')) {
        return this.fertilizerDatabase.npk_ratios.nitrogen_potassium;
      }
      if (deficiencies.includes('phosphorus') && deficiencies.includes('potassium')) {
        return this.fertilizerDatabase.npk_ratios.phosphorus_potassium;
      }
    }

    // Single deficiency
    if (deficiencies.includes('nitrogen')) {
      return this.fertilizerDatabase.npk_ratios.nitrogen_high;
    }
    if (deficiencies.includes('phosphorus')) {
      return this.fertilizerDatabase.npk_ratios.phosphorus_high;
    }
    if (deficiencies.includes('potassium')) {
      return this.fertilizerDatabase.npk_ratios.potassium_high;
    }

    return this.fertilizerDatabase.npk_ratios.balanced;
  }

  /**
   * Calculate fertilizer dosage
   * @param {Object} nutrientLevels - Nutrient status
   * @param {string} cropType - Crop type
   * @param {string} soilType - Soil type
   * @returns {Object} Dosage breakdown
   */
  calculateDosage(nutrientLevels, cropType, soilType) {
    // Get base dosage for crop
    const baseDosage = this.fertilizerDatabase.base_dosages[cropType] || 
                       this.fertilizerDatabase.base_dosages.general;

    // Adjust based on number of deficiencies
    const deficiencies = nutrientLevels.deficiencies || [];
    let totalDosage = baseDosage;

    // Add 10kg per deficiency
    totalDosage += deficiencies.length * 10;

    // Adjust for soil organic carbon if available
    if (nutrientLevels.organic_carbon !== undefined && nutrientLevels.organic_carbon < 1.0) {
      totalDosage += 15;
    }

    // Parse NPK ratio
    const npkRatio = this.determineNPKRatio(nutrientLevels);
    const [n, p, k] = npkRatio.split(':').map(Number);
    const total = n + p + k;

    return {
      nitrogen: Math.round(totalDosage * (n / total)),
      phosphorus: Math.round(totalDosage * (p / total)),
      potassium: Math.round(totalDosage * (k / total)),
      total: totalDosage
    };
  }

  /**
   * Get organic alternatives based on deficiencies
   * @param {Object} nutrientLevels - Nutrient status
   * @returns {Array} List of organic amendments
   */
  getOrganicAlternatives(nutrientLevels) {
    const alternatives = [];
    const deficiencies = nutrientLevels.deficiencies || [];

    if (deficiencies.includes('nitrogen')) {
      alternatives.push(...this.fertilizerDatabase.organic_amendments.nitrogen);
    }

    if (deficiencies.includes('phosphorus')) {
      alternatives.push(...this.fertilizerDatabase.organic_amendments.phosphorus);
    }

    if (deficiencies.includes('potassium')) {
      alternatives.push(...this.fertilizerDatabase.organic_amendments.potassium);
    }

    // Always add general amendments
    alternatives.push(...this.fertilizerDatabase.organic_amendments.general);

    // Remove duplicates
    return [...new Set(alternatives)];
  }

  /**
   * Determine application method based on crop type
   * @param {string} cropType - Crop type
   * @returns {string} Application method
   */
  determineApplicationMethod(cropType) {
    if (cropType === 'rice' || cropType === 'wheat') {
      return this.fertilizerDatabase.application_methods.broadcast;
    }

    if (cropType === 'vegetables') {
      return this.fertilizerDatabase.application_methods.side_dressing;
    }

    return this.fertilizerDatabase.application_methods.broadcast;
  }

  /**
   * Get fertilizer cost estimate
   * @param {number} totalDosage - Total fertilizer in kg
   * @param {string} npkRatio - NPK ratio
   * @returns {number} Estimated cost in local currency
   */
  getFertilizerCost(totalDosage, npkRatio) {
    // Average cost per kg of NPK fertilizer (in INR)
    const costPerKg = {
      '20:20:20': 25,
      '30:10:10': 22,
      '10:30:10': 28,
      '10:10:30': 26,
      '25:25:10': 26,
      '25:10:25': 24,
      '10:25:25': 27
    };

    const cost = costPerKg[npkRatio] || 25;
    return Math.round(totalDosage * cost);
  }
}

export default FertilizerService;
