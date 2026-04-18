import axios from 'axios';
import FormData from 'form-data';

/**
 * Analyze soil image using ML model via ngrok endpoint
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Object>} Soil analysis result
 */
export async function analyzeSoilImage(imageBuffer) {
  const SOIL_API_URL = process.env.SOIL_CLASSIFY_API_URL;
  
  // If no API URL configured, use mock data
  if (!SOIL_API_URL || SOIL_API_URL.includes('your-ngrok-url')) {
    console.warn('Soil classification API not configured, using mock data');
    return getMockSoilAnalysis();
  }

  try {
    // Create form data with image
    const formData = new FormData();
    // Try 'file' field first (FastAPI default), fallback to 'image'
    formData.append('file', imageBuffer, {
      filename: 'soil.jpg',
      contentType: 'image/jpeg'
    });

    // Send to ngrok ML model endpoint
    const response = await axios.post(SOIL_API_URL, formData, {
      headers: {
        ...formData.getHeaders(),
        'ngrok-skip-browser-warning': 'true' // Skip ngrok browser warning
      },
      timeout: 30000, // 30 second timeout for ML inference
      maxContentLength: 5 * 1024 * 1024, // 5MB max
      maxBodyLength: 5 * 1024 * 1024
    });

    // Validate response structure
    if (!response.data || !response.data.soil_type) {
      console.error('Invalid response from soil classification API:', response.data);
      return getMockSoilAnalysis();
    }

    // Return the ML model prediction
    return {
      soil_type: response.data.soil_type,
      confidence: response.data.confidence || 0.0,
      ph_level: response.data.ph_level || null,
      nutrient_status: response.data.nutrient_status || {},
      fertilizer_recommendation: response.data.fertilizer_recommendation || null
    };

  } catch (error) {
    console.error('Soil classification API error:', error.message);
    
    // Log more details for debugging
    if (error.response) {
      console.error('API Response Status:', error.response.status);
      console.error('API Response Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from API');
    }
    
    // Fallback to mock data
    console.warn('Falling back to mock soil analysis');
    return getMockSoilAnalysis();
  }
}

/**
 * Generate mock soil analysis for development/fallback
 * @returns {Object} Mock soil analysis
 */
function getMockSoilAnalysis() {
  const mockTypes = [
    { type: 'Black Soil', ph: 6.5, confidence: 0.89 },
    { type: 'Red Soil', ph: 6.2, confidence: 0.85 },
    { type: 'Alluvial Soil', ph: 7.0, confidence: 0.92 },
    { type: 'Laterite Soil', ph: 5.8, confidence: 0.87 },
    { type: 'Sandy Soil', ph: 6.8, confidence: 0.83 }
  ];
  
  const selected = mockTypes[Math.floor(Math.random() * mockTypes.length)];
  
  return {
    soil_type: selected.type,
    confidence: selected.confidence,
    ph_level: selected.ph,
    nutrient_status: {
      nitrogen: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
      phosphorus: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
      potassium: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
    },
    fertilizer_recommendation: 'NPK 20:20:20 at 40-50 kg/acre'
  };
}

// Get soil data from SoilGrids API
export async function getSoilData(latitude, longitude) {
  try {
    const properties = ['phh2o', 'ocd', 'clay', 'sand', 'silt'];
    const depth = '0-5cm';
    
    const url = `https://rest.isric.org/soilgrids/v2.0/properties/query`;
    const params = {
      lon: longitude,
      lat: latitude,
      property: properties,
      depth: depth,
      value: 'mean'
    };

    const response = await axios.get(url, { params, timeout: 10000 });
    const data = response.data;

    return {
      ph: extractValue(data, 'phh2o') / 10, // pH is in pH*10
      organic_carbon: extractValue(data, 'ocd') / 10, // g/kg to %
      clay: extractValue(data, 'clay') / 10, // g/kg to %
      sand: extractValue(data, 'sand') / 10,
      silt: extractValue(data, 'silt') / 10
    };
  } catch (error) {
    console.error('SoilGrids API error:', error.message);
    // Return default values if API fails
    return {
      ph: 6.5,
      organic_carbon: 1.5,
      clay: 25,
      sand: 40,
      silt: 35
    };
  }
}

function extractValue(data, property) {
  try {
    const layer = data.properties.layers.find(l => l.name === property);
    return layer?.depths[0]?.values?.mean || 0;
  } catch {
    return 0;
  }
}

// Generate localized advice using Sarvam AI
export async function generateAdvice(analysis, language) {
  try {
    const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
    
    if (!SARVAM_API_KEY) {
      return generateFallbackAdvice(analysis, language);
    }

    const prompt = `Soil Type: ${analysis.soil_type}
pH: ${analysis.ph}
Nutrient Status: ${analysis.nutrient_deficiency}
Fertilizer: ${analysis.fertilizer}
Recommended Crops: ${analysis.recommended_crops.join(', ')}

Provide simple farming advice for a farmer in 2-3 sentences.`;

    const response = await axios.post(
      'https://api.sarvam.ai/translate',
      {
        input: prompt,
        source_language_code: 'en-IN',
        target_language_code: getLanguageCode(language),
        speaker_gender: 'Male',
        mode: 'formal'
      },
      {
        headers: {
          'api-subscription-key': SARVAM_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    return response.data.translated_text || generateFallbackAdvice(analysis, language);
  } catch (error) {
    console.error('Sarvam AI error:', error.message);
    return generateFallbackAdvice(analysis, language);
  }
}

function generateFallbackAdvice(analysis, language) {
  const advice = `Your soil is ${analysis.soil_type} with pH ${analysis.ph}. ${analysis.fertilizer}. Best crops: ${analysis.recommended_crops.join(', ')}.`;
  return advice;
}

function getLanguageCode(lang) {
  const map = {
    'hi': 'hi-IN',
    'kn': 'kn-IN',
    'ta': 'ta-IN',
    'te': 'te-IN',
    'en': 'en-IN',
    'mr': 'mr-IN',
    'bn': 'bn-IN',
    'gu': 'gu-IN',
    'pa': 'pa-IN',
    'ml': 'ml-IN',
    'or': 'or-IN',
    'as': 'as-IN'
  };
  return map[lang] || 'en-IN';
}
9019493289