import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env from project root (local dev) or from current dir (production)
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config(); // fallback: load from current working directory (production)
import { analyzeSoilImage, getSoilData, generateAdvice } from './soilAnalyzer.js';
import {
  geocoderService,
  soilGridsService,
  weatherService,
  satelliteService,
  cropHealthService,
  fertilizerService,
  bhuvanService,
  soilHealthCardService,
  faoStatService
} from './services/index.js';
import { AgriculturalAdvisorService } from './services/AgriculturalAdvisorService.js';
import translationService from './services/TranslationService.js';
import sarvamTTSService from './services/SarvamTTSService.js';
import marketPriceService from './services/MarketPriceService.js';
import loanRecommendationService from './services/LoanRecommendationService.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const advisorService = new AgriculturalAdvisorService();

app.use(cors());
app.use(express.json());

app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    const { latitude, longitude, language } = req.body;
    const imageBuffer = req.file?.buffer;

    if (!imageBuffer) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Validate image size (5MB max)
    if (imageBuffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image size exceeds 5MB limit' });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    console.log(`Analyzing soil image (${imageBuffer.length} bytes) for location: ${lat}, ${lon}`);

    // Step 1: Classify soil from image using ML model
    const mlResult = await analyzeSoilImage(imageBuffer);
    console.log('ML Model Result:', mlResult);

    // Step 2: Get REAL data from all agricultural APIs in parallel
    console.log('Fetching real agricultural data from APIs...');
    
    const [
      locationResult,
      soilPropsResult,
      weatherResult,
      satelliteResult,
      soilHealthResult,
      bhuvanMoistureResult,
      faoRecommendationsResult
    ] = await Promise.all([
      geocoderService.reverseGeocode(lat, lon),
      soilGridsService.getSoilProperties(lat, lon),
      weatherService.getWeatherData(lat, lon),
      satelliteService.getSatelliteMetrics(lat, lon),
      soilHealthCardService.getSoilHealthParameters(lat, lon, mlResult.soil_type),
      bhuvanService.getSoilMoisture(lat, lon),
      faoStatService.getRecommendedCrops('IND', mlResult.soil_type)
    ]);

    // Extract data from results
    const locationData = locationResult.success ? locationResult.data : null;
    const soilProps = soilPropsResult.success ? soilPropsResult.data : null;
    const weatherData = weatherResult.success ? weatherResult.data : null;
    const satelliteData = satelliteResult.success ? satelliteResult.data : null;
    const soilHealthData = soilHealthResult.success ? soilHealthResult.data : null;
    const bhuvanMoisture = bhuvanMoistureResult.success ? bhuvanMoistureResult.data : null;
    const faoRecommendations = faoRecommendationsResult.success ? faoRecommendationsResult.data : null;

    console.log('Location Data:', locationData);
    console.log('Soil Properties:', soilProps);
    console.log('Weather Data:', weatherData);
    console.log('Satellite Data:', satelliteData);
    console.log('Soil Health Card Data:', soilHealthData);
    console.log('Bhuvan Soil Moisture:', bhuvanMoisture);
    console.log('FAO Recommendations:', faoRecommendations);

    // If SoilGrids has no data, use estimated values based on soil type
    let effectiveSoilProps = soilProps;
    if (!soilProps) {
      console.log('SoilGrids data unavailable, using estimated values based on soil type');
      effectiveSoilProps = getEstimatedSoilProperties(mlResult.soil_type);
    }

    // Step 3: Get crop health based on NDVI
    let cropHealthData = null;
    if (satelliteData && satelliteData.ndvi) {
      const cropHealthResult = await cropHealthService.getCropHealth(lat, lon, satelliteData.ndvi);
      if (cropHealthResult.success) {
        cropHealthData = cropHealthResult.data;
      }
    }

    // Step 4: Classify nutrient levels based on soil properties
    const nutrientStatus = classifyNutrients(effectiveSoilProps);
    console.log('Nutrient Status:', nutrientStatus);

    // Step 5: Get fertilizer recommendations
    let fertilizerData = null;
    if (effectiveSoilProps && nutrientStatus) {
      const fertResult = await fertilizerService.getFertilizerRecommendation(
        mlResult.soil_type,
        nutrientStatus,
        'general'
      );
      if (fertResult.success) {
        fertilizerData = fertResult.data;
      }
    }

    // Step 6: Combine all data into comprehensive analysis
    let analysis = {
      // ML Model predictions
      soil_type: mlResult.soil_type,
      confidence: mlResult.confidence,
      
      // Location data
      location: locationData,
      
      // Real soil properties from SoilGrids (or estimated)
      ph: effectiveSoilProps?.soil_ph || 6.5,
      organic_carbon: effectiveSoilProps?.organic_carbon || 0,
      clay: effectiveSoilProps?.soil_clay_percentage || 0,
      sand: effectiveSoilProps?.soil_sand_percentage || 0,
      
      // Soil Health Card parameters (Indian government standards)
      soil_health_card: soilHealthData ? {
        macro_nutrients: {
          nitrogen: soilHealthData.nitrogen_n,
          phosphorus: soilHealthData.phosphorus_p,
          potassium: soilHealthData.potassium_k
        },
        micro_nutrients: {
          zinc: soilHealthData.zinc_zn,
          iron: soilHealthData.iron_fe,
          copper: soilHealthData.copper_cu,
          manganese: soilHealthData.manganese_mn,
          boron: soilHealthData.boron_b
        },
        recommendations: soilHealthData.recommendations,
        state: soilHealthData.state
      } : null,
      
      // ISRO Bhuvan soil moisture
      bhuvan_soil_moisture: bhuvanMoisture ? {
        percentage: bhuvanMoisture.soil_moisture_percentage,
        satellite: bhuvanMoisture.satellite,
        resolution: bhuvanMoisture.resolution_meters
      } : null,
      
      // Real nutrient status
      ml_nutrient_status: nutrientStatus,
      nutrient_deficiency: determineDeficiency(effectiveSoilProps, nutrientStatus),
      
      // Real fertilizer recommendations
      fertilizer: fertilizerData ? formatFertilizerRecommendation(fertilizerData) : 'Apply NPK 20:20:20 at 40-50 kg per acre',
      ml_fertilizer: fertilizerData,
      
      // Crop recommendations (combined from FAO and local data)
      recommended_crops: faoRecommendations?.recommended_crops || recommendCrops(mlResult.soil_type, effectiveSoilProps, weatherData),
      fao_crop_recommendations: faoRecommendations,
      
      // Real weather data
      weather: weatherData,
      
      // Real satellite data
      satellite: satelliteData,
      
      // Crop health from NDVI
      crop_health: cropHealthData,
      
      // Data sources used
      data_sources: {
        ml_model: true,
        soilgrids: soilPropsResult.success,
        weather: weatherResult.success,
        satellite: satelliteResult.success,
        location: locationResult.success,
        soil_health_card: soilHealthResult.success,
        bhuvan: bhuvanMoistureResult.success,
        fao: faoRecommendationsResult.success
      }
    };

    // Step 7: Generate localized advice
    const advice = await generateAdvice(analysis, language);
    analysis.advice = advice;

    // Step 8: Generate comprehensive agricultural advisory report
    console.log('Generating agricultural advisory report...');
    const advisoryReport = advisorService.generateReport(analysis, language);
    analysis.advisory_report = advisoryReport;

    // Step 8b: Generate loan recommendations
    console.log('Generating loan recommendations...');
    analysis.loan_recommendations = loanRecommendationService.recommend(analysis);

    // Step 9: Translate results to user's language
    if (language && language !== 'en') {
      console.log(`Translating results to ${language}...`);
      analysis = await translationService.translateAnalysisResults(analysis, language);
      console.log('Translation complete');
    }

    console.log('Analysis complete:', {
      soil_type: analysis.soil_type,
      confidence: analysis.confidence,
      ph: analysis.ph,
      data_sources: analysis.data_sources,
      report_generated: true,
      language: language || 'en'
    });

    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to analyze soil image. Please try again.'
    });
  }
});

/**
 * Get estimated soil properties based on soil type
 * Used as fallback when SoilGrids has no data
 */
function getEstimatedSoilProperties(soilType) {
  const soilTypeLower = soilType.toLowerCase();
  
  // Typical properties for different Indian soil types
  if (soilTypeLower.includes('black')) {
    return {
      soil_ph: 7.2,
      organic_carbon: 0.5,
      soil_clay_percentage: 50,
      soil_sand_percentage: 25,
      nitrogen_content: 0.05,
      cec: 35
    };
  } else if (soilTypeLower.includes('red')) {
    return {
      soil_ph: 6.5,
      organic_carbon: 0.4,
      soil_clay_percentage: 30,
      soil_sand_percentage: 50,
      nitrogen_content: 0.04,
      cec: 15
    };
  } else if (soilTypeLower.includes('alluvial')) {
    return {
      soil_ph: 7.0,
      organic_carbon: 0.8,
      soil_clay_percentage: 35,
      soil_sand_percentage: 40,
      nitrogen_content: 0.08,
      cec: 25
    };
  } else if (soilTypeLower.includes('laterite')) {
    return {
      soil_ph: 5.5,
      organic_carbon: 0.3,
      soil_clay_percentage: 40,
      soil_sand_percentage: 35,
      nitrogen_content: 0.03,
      cec: 10
    };
  } else {
    // Default values
    return {
      soil_ph: 6.5,
      organic_carbon: 0.5,
      soil_clay_percentage: 35,
      soil_sand_percentage: 40,
      nitrogen_content: 0.05,
      cec: 20
    };
  }
}

/**
 * Classify nutrient levels based on soil properties
 */
function classifyNutrients(soilProps) {
  if (!soilProps) {
    return {
      nitrogen: 'Unknown',
      phosphorus: 'Unknown',
      potassium: 'Unknown',
      deficiencies: []
    };
  }

  const deficiencies = [];
  
  // Classify nitrogen based on organic carbon (proxy)
  let nitrogen = 'Medium';
  if (soilProps.organic_carbon < 1.0) {
    nitrogen = 'Low';
    deficiencies.push('nitrogen');
  } else if (soilProps.organic_carbon > 2.0) {
    nitrogen = 'High';
  }
  
  // Classify phosphorus (simplified - would need actual P data)
  const phosphorus = 'Medium';
  
  // Classify potassium (simplified - would need actual K data)
  const potassium = 'Medium';
  
  return {
    nitrogen,
    phosphorus,
    potassium,
    deficiencies,
    organic_carbon: soilProps.organic_carbon
  };
}

/**
 * Format fertilizer recommendation for display
 */
function formatFertilizerRecommendation(fertData) {
  const parts = [];
  
  parts.push(`Apply ${fertData.npk_ratio} fertilizer at ${fertData.nitrogen_kg_per_acre + fertData.phosphorus_kg_per_acre + fertData.potassium_kg_per_acre} kg per acre`);
  
  if (fertData.organic_amendments && fertData.organic_amendments.length > 0) {
    parts.push(`Organic options: ${fertData.organic_amendments.slice(0, 2).join(', ')}`);
  }
  
  return parts.join('. ');
}

function determineDeficiency(soilData, mlNutrientStatus = {}) {
  const { ph, organic_carbon } = soilData || {};
  const deficiencies = [];
  
  // Check pH levels
  if (ph && ph < 5.5) {
    deficiencies.push('Acidic soil - may need lime application');
  } else if (ph && ph > 8.0) {
    deficiencies.push('Alkaline soil - may need sulfur application');
  }
  
  // Check organic matter
  if (organic_carbon && organic_carbon < 1.0) {
    deficiencies.push('Low organic matter - add compost');
  }
  
  // Include ML model nutrient predictions if available
  if (mlNutrientStatus.nitrogen === 'Low') {
    deficiencies.push('Low nitrogen - needs nitrogen-rich fertilizer');
  }
  if (mlNutrientStatus.phosphorus === 'Low') {
    deficiencies.push('Low phosphorus - needs phosphate fertilizer');
  }
  if (mlNutrientStatus.potassium === 'Low') {
    deficiencies.push('Low potassium - needs potash fertilizer');
  }
  
  return deficiencies.length > 0 ? deficiencies.join('. ') : 'Nutrient levels are adequate';
}

function recommendCrops(soilType, soilData, weatherData) {
  const crops = [];
  
  // Base recommendations on soil type
  const soilTypeLower = soilType.toLowerCase();
  
  if (soilTypeLower.includes('black')) {
    crops.push('Cotton', 'Wheat', 'Sorghum', 'Sunflower');
  } else if (soilTypeLower.includes('red')) {
    crops.push('Groundnut', 'Millets', 'Pulses', 'Oilseeds');
  } else if (soilTypeLower.includes('alluvial')) {
    crops.push('Rice', 'Wheat', 'Sugarcane', 'Vegetables');
  } else if (soilTypeLower.includes('laterite')) {
    crops.push('Cashew', 'Coconut', 'Tea', 'Coffee');
  } else {
    crops.push('Rice', 'Wheat', 'Maize', 'Vegetables');
  }
  
  // Adjust based on soil properties
  if (soilData) {
    const { clay, sand, ph } = soilData;
    
    // Sandy soil - add drought-resistant crops
    if (sand > 60) {
      crops.push('Millets', 'Groundnut');
    }
    
    // Clay soil - add water-loving crops
    if (clay > 50) {
      crops.push('Rice', 'Sugarcane');
    }
    
    // Acidic soil
    if (ph < 6.0) {
      crops.push('Tea', 'Potato');
    }
  }
  
  // Remove duplicates and return top 5
  return [...new Set(crops)].slice(0, 5);
}

// Translation endpoint (using Sarvam AI)
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    if (!targetLanguage || targetLanguage === 'en') {
      // No translation needed for English
      return res.json({ translatedText: text });
    }

    console.log(`Translating text to ${targetLanguage}. Text length: ${text.length}`);

    // Use Sarvam AI translation service
    const translatedText = await translationService.translateText(text, targetLanguage);
    console.log(`Translation complete. Output length: ${translatedText.length}`);

    res.json({ translatedText });

  } catch (error) {
    console.error('Translation endpoint error:', error.message);
    res.status(500).json({ 
      error: 'Translation failed',
      details: error.message
    });
  }
});

// Text-to-Speech endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text, language = 'en' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    // Validate text length (max 500 characters per request)
    if (text.length > 500) {
      return res.status(400).json({ error: 'Text exceeds 500 character limit. Please split into chunks.' });
    }

    console.log(`Converting text to speech: ${text.substring(0, 50)}... (${text.length} chars, language: ${language})`);

    const languageCode = sarvamTTSService.getLanguageCode(language);
    const speaker = sarvamTTSService.getSpeaker(language);

    const audioBuffer = await sarvamTTSService.textToSpeech(text, languageCode, speaker);

    // Set response headers for audio
    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    });

    res.send(audioBuffer);

  } catch (error) {
    console.error('TTS endpoint error:', error.message);
    res.status(500).json({ 
      error: 'Text-to-speech conversion failed',
      message: error.message 
    });
  }
});

// Market Price endpoints
app.get('/api/market/search', (req, res) => {
  try {
    const { query } = req.query;
    const crops = marketPriceService.searchCrops(query);
    res.json({ crops });
  } catch (error) {
    console.error('Crop search error:', error);
    res.status(500).json({ error: 'Failed to search crops' });
  }
});

app.get('/api/market/price/:cropName', async (req, res) => {
  try {
    const { cropName } = req.params;
    const { state } = req.query;
    
    const result = await marketPriceService.getCropPrice(cropName, state);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Market price error:', error);
    res.status(500).json({ error: 'Failed to fetch market price' });
  }
});

// Weather Analytics endpoint (enhanced)
app.get('/api/weather/analytics', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    // Get current weather
    const weatherResult = await weatherService.getWeatherData(lat, lon);
    
    if (!weatherResult.success) {
      return res.status(500).json({ error: 'Failed to fetch weather data' });
    }

    // Generate 7-day forecast (mock data for now)
    const forecast = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      forecast.push({
        date: date.toISOString().split('T')[0],
        temperature: weatherResult.data.temperature + (Math.random() * 6 - 3),
        humidity: weatherResult.data.humidity + (Math.random() * 10 - 5),
        rainfall: Math.random() * 20,
        windSpeed: 5 + Math.random() * 10,
        pressure: 1013 + (Math.random() * 10 - 5)
      });
    }

    res.json({
      current: weatherResult.data,
      forecast: forecast,
      location: {
        latitude: lat,
        longitude: lon
      }
    });

  } catch (error) {
    console.error('Weather analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch weather analytics' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
