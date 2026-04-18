/**
 * ISRIC SoilGrids Service
 * Retrieves global soil properties data
 */

import axios from 'axios';
import { BaseAPIService } from './BaseAPIService.js';
import { INTELLIGENCE_CONFIG } from '../config/intelligence.config.js';

export class SoilGridsService extends BaseAPIService {
  constructor() {
    super(
      'soilgrids',
      INTELLIGENCE_CONFIG.API_ENDPOINTS.soilgrids,
      null // No API key needed - public API
    );
  }

  /**
   * Get soil properties for a location
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @param {number} depth - Soil depth in cm (default: 5cm = 0-5cm layer)
   * @returns {Promise<Object>} Soil properties or error
   */
  async getSoilProperties(latitude, longitude, depth = 5) {
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

    // Determine depth layer
    const depthLayer = depth <= 5 ? '0-5cm' : depth <= 15 ? '5-15cm' : '15-30cm';

    // Make API call with resilience
    // Note: SoilGrids API requires multiple property values as array
    const properties = ['phh2o', 'nitrogen', 'soc', 'clay', 'sand', 'cec'];
    
    const result = await this.fetchWithResilience(async () => {
      return axios.get(`${this.baseUrl}/properties/query`, {
        params: {
          lon: longitude,
          lat: latitude,
          property: properties,
          depth: depthLayer,
          value: 'mean'
        },
        timeout: this.timeout + 5000, // SoilGrids can be slower
        paramsSerializer: params => {
          // Serialize array parameters correctly for SoilGrids API
          const parts = [];
          parts.push(`lon=${params.lon}`);
          parts.push(`lat=${params.lat}`);
          params.property.forEach(prop => parts.push(`property=${prop}`));
          parts.push(`depth=${params.depth}`);
          parts.push(`value=${params.value}`);
          return parts.join('&');
        }
      });
    });

    // If API call failed, return error
    if (!result.success) {
      return result;
    }

    // Validate response structure
    const validation = this.validateResponse(result.data, {
      required: ['properties'],
      fields: {}
    });

    if (!validation.valid || !result.data.properties || !result.data.properties.layers) {
      return {
        data: null,
        source: 'unavailable',
        error: 'Invalid soil data response',
        success: false
      };
    }

    // Parse soil properties
    const layers = result.data.properties.layers;
    const soilProperties = this.parseSoilLayers(layers, depthLayer);

    // If no data available for this location, return error
    if (soilProperties === null) {
      return {
        data: null,
        source: 'unavailable',
        error: 'No soil data available for this location (possibly urban area)',
        success: false
      };
    }

    // Validate parsed data
    const validationResult = this.validateSoilProperties(soilProperties);
    if (!validationResult.valid) {
      return {
        data: null,
        source: 'unavailable',
        error: `Invalid soil data: ${validationResult.errors.join(', ')}`,
        success: false
      };
    }

    return {
      data: soilProperties,
      source: 'live',
      error: null,
      success: true
    };
  }

  /**
   * Parse soil layers from API response
   * @param {Array} layers - Layers from API response
   * @param {string} depthLayer - Depth layer to extract
   * @returns {Object} Parsed soil properties
   */
  parseSoilLayers(layers, depthLayer) {
    const properties = {
      soil_ph: null,
      nitrogen_content: null,
      organic_carbon: null,
      soil_clay_percentage: null,
      soil_sand_percentage: null,
      cec: null
    };

    let hasAnyData = false;

    for (const layer of layers) {
      const depth = layer.depths.find(d => d.label === depthLayer);
      if (!depth || !depth.values) continue;

      const value = depth.values.mean;
      
      // Skip null values
      if (value === null || value === undefined) continue;
      
      hasAnyData = true;

      switch (layer.name) {
        case 'phh2o':
          // pH is stored as pH * 10, convert to actual pH
          properties.soil_ph = value / 10;
          break;
        case 'nitrogen':
          // Nitrogen is in cg/kg, convert to percentage
          properties.nitrogen_content = value / 1000;
          break;
        case 'soc':
          // Soil organic carbon is in dg/kg, convert to percentage
          properties.organic_carbon = value / 100;
          break;
        case 'clay':
          // Clay is in g/kg, convert to percentage
          properties.soil_clay_percentage = value / 10;
          break;
        case 'sand':
          // Sand is in g/kg, convert to percentage
          properties.soil_sand_percentage = value / 10;
          break;
        case 'cec':
          // CEC is in mmol(c)/kg, keep as is
          properties.cec = value / 10;
          break;
      }
    }

    // If no data was found, return null to indicate no coverage
    if (!hasAnyData) {
      return null;
    }

    return properties;
  }

  /**
   * Validate soil properties are within expected ranges
   * @param {Object} properties - Soil properties to validate
   * @returns {Object} Validation result
   */
  validateSoilProperties(properties) {
    const errors = [];

    // Validate pH (3.0 - 10.0)
    if (properties.soil_ph !== null) {
      if (properties.soil_ph < 3.0 || properties.soil_ph > 10.0) {
        errors.push(`pH ${properties.soil_ph} outside valid range (3.0-10.0)`);
        properties.soil_ph = null; // Reject invalid value
      }
    }

    // Validate nitrogen (0 - 1.0%)
    if (properties.nitrogen_content !== null) {
      if (properties.nitrogen_content < 0 || properties.nitrogen_content > 1.0) {
        errors.push(`Nitrogen ${properties.nitrogen_content} outside valid range (0-1.0%)`);
        properties.nitrogen_content = null;
      }
    }

    // Validate organic carbon (0 - 10.0%)
    if (properties.organic_carbon !== null) {
      if (properties.organic_carbon < 0 || properties.organic_carbon > 10.0) {
        errors.push(`Organic carbon ${properties.organic_carbon} outside valid range (0-10.0%)`);
        properties.organic_carbon = null;
      }
    }

    // Validate clay percentage (0 - 100%)
    if (properties.soil_clay_percentage !== null) {
      if (properties.soil_clay_percentage < 0 || properties.soil_clay_percentage > 100) {
        errors.push(`Clay ${properties.soil_clay_percentage} outside valid range (0-100%)`);
        properties.soil_clay_percentage = null;
      }
    }

    // Validate sand percentage (0 - 100%)
    if (properties.soil_sand_percentage !== null) {
      if (properties.soil_sand_percentage < 0 || properties.soil_sand_percentage > 100) {
        errors.push(`Sand ${properties.soil_sand_percentage} outside valid range (0-100%)`);
        properties.soil_sand_percentage = null;
      }
    }

    // Validate CEC (0 - 50)
    if (properties.cec !== null) {
      if (properties.cec < 0 || properties.cec > 50) {
        errors.push(`CEC ${properties.cec} outside valid range (0-50)`);
        properties.cec = null;
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default SoilGridsService;
