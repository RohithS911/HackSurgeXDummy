/**
 * Autonomous Agent Service for Hands-Free Soil Analysis
 * Handles the complete workflow from voice command to spoken results
 */

import sarvamVoiceService from './sarvamVoiceService';
import { analyzeSoil } from './soilService';

class AutonomousAgentService {
  constructor() {
    this.isProcessing = false;
    this.currentLanguage = 'en';
    this.statusCallback = null;
    this.resultCallback = null;
  }

  /**
   * Set callbacks for status updates and results
   */
  setCallbacks(statusCallback, resultCallback) {
    this.statusCallback = statusCallback;
    this.resultCallback = resultCallback;
  }

  /**
   * Update status
   */
  updateStatus(step, message) {
    console.log(`[Agent] Step ${step}: ${message}`);
    if (this.statusCallback) {
      this.statusCallback({ step, message });
    }
    // Broadcast to global overlay
    window.dispatchEvent(new CustomEvent('agentStatus', { detail: { step, message } }));
  }

  /**
   * Main autonomous workflow
   * Triggered by voice command "Analyze the soil"
   */
  async executeAnalysisWorkflow(language = 'en') {
    if (this.isProcessing) {
      console.log('[Agent] Already processing, ignoring request');
      return;
    }

    this.isProcessing = true;
    this.currentLanguage = language;
    window.dispatchEvent(new CustomEvent('agentStart'));

    try {
      // Step 1: Activate camera and capture image
      this.updateStatus(1, 'Activating camera...');
      console.log('[Agent] Step 1: Starting camera capture');
      
      const imageFile = await this.captureImage();
      console.log('[Agent] Image captured successfully:', imageFile.name, imageFile.size);

      // Step 2: Run soil analysis pipeline (backend already translates)
      this.updateStatus(2, 'Analyzing soil...');
      console.log('[Agent] Step 2: Starting soil analysis');
      
      const analysisResult = await analyzeSoil(imageFile, language);
      console.log('[Agent] Analysis complete:', analysisResult);

      // Step 3: Generate comprehensive explanation for TTS
      this.updateStatus(3, 'Generating explanation...');
      console.log('[Agent] Step 3: Generating comprehensive explanation for TTS');
      
      const explanation = this.generateComprehensiveExplanation(analysisResult, language);
      console.log('[Agent] Explanation generated:', explanation.substring(0, 150) + '...');

      // Step 4: Convert to speech in chunks via backend
      this.updateStatus(4, 'Converting to speech...');
      console.log('[Agent] Step 4: Converting to speech via backend');
      
      const audioBlobs = [];
      try {
        // Split explanation into chunks (400 characters per request)
        const chunks = this.splitIntoChunks(explanation, 400);
        console.log('[Agent] Split into', chunks.length, 'chunks for TTS');
        console.log('[Agent] TTS Configuration:', { language, model: 'bulbul:v3', speaker: 'ratan' });
        
        for (let i = 0; i < chunks.length; i++) {
          console.log(`[Agent] Converting chunk ${i + 1}/${chunks.length}:`, chunks[i].substring(0, 50) + '...');
          this.updateStatus(4, `Converting to speech (${i + 1}/${chunks.length})...`);
          
          // Call backend TTS endpoint
          const response = await fetch('http://localhost:3001/api/tts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              text: chunks[i],
              language: language
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`TTS API error (${response.status}): ${errorData.message || errorData.error}`);
          }

          // Get audio blob from response
          const audioBlob = await response.blob();
          audioBlobs.push(audioBlob);
          console.log(`[Agent] Chunk ${i + 1} converted successfully, blob size:`, audioBlob.size);
        }
        
        console.log('[Agent] All audio chunks generated:', audioBlobs.length);
      } catch (ttsError) {
        console.error('[Agent] TTS failed with error:', ttsError);
        console.error('[Agent] Error message:', ttsError.message);
        console.error('[Agent] Error stack:', ttsError.stack);
        // Continue without audio - don't fail the whole workflow
      }

      // Step 5: Return results to UI — dismiss overlay immediately so report shows
      this.updateStatus(5, 'Displaying results...');
      console.log('[Agent] Step 5: Returning results to UI');

      if (this.resultCallback) {
        this.resultCallback({
          analysis: analysisResult,
          audioBlobs: audioBlobs,
          isAgenticWorkflow: true
        });
      }

      // Dismiss the overlay NOW so the report is visible
      this.isProcessing = false;
      window.dispatchEvent(new CustomEvent('agentEnd'));

      // Audio is handled entirely by ResultScreen after it renders
      // Do NOT play audio here to avoid overlap

      this.updateStatus(6, 'Complete!');
      console.log('[Agent] Workflow complete!');

    } catch (error) {
      console.error('[Agent] Workflow error:', error);
      this.updateStatus(-1, `Error: ${error.message}`);
      alert(`Analysis Error: ${error.message}\n\nPlease try again.`);
    } finally {
      this.isProcessing = false;
      // agentEnd already dispatched above on success; dispatch again only if not yet done
      if (!window._agentEndDispatched) {
        window.dispatchEvent(new CustomEvent('agentEnd'));
      }
      window._agentEndDispatched = false;
      console.log('[Agent] Workflow ended');
    }
  }

  /**
   * Capture soil image with countdown
   * This method triggers the camera modal which is handled by the UI
   */
  async captureImage() {
    console.log('[Agent] captureImage() called');
    
    return new Promise((resolve, reject) => {
      // Store resolve/reject for later use
      this.captureResolve = resolve;
      this.captureReject = reject;
      
      console.log('[Agent] Creating camera capture event');
      
      // Trigger camera modal event with autoCapture flag
      const event = new CustomEvent('openCameraCapture', {
        detail: {
          autoCapture: true, // Enable automatic countdown and capture
          onCapture: (file) => {
            console.log('[Agent] onCapture callback received file:', file.name, file.size);
            if (this.captureResolve) {
              console.log('[Agent] Resolving promise with file');
              this.captureResolve(file);
              this.captureResolve = null;
              this.captureReject = null;
            } else {
              console.error('[Agent] captureResolve is null!');
            }
          },
          onCancel: () => {
            console.log('[Agent] onCancel callback received');
            if (this.captureReject) {
              this.captureReject(new Error('Camera capture cancelled'));
              this.captureResolve = null;
              this.captureReject = null;
            }
          }
        }
      });
      
      console.log('[Agent] Dispatching openCameraCapture event');
      window.dispatchEvent(event);
      console.log('[Agent] Event dispatched, waiting for capture...');
    });
  }

  /**
   * Generate comprehensive farmer-friendly explanation from complete analysis
   * This creates a detailed, paragraph-by-paragraph explanation for voice output
   * Includes BOTH analysis results AND full advisory report
   */
  generateComprehensiveExplanation(analysis, language) {
    console.log('[Agent] Generating comprehensive explanation for language:', language);
    
    // Collect all available data into one flowing explanation
    const sections = [];
    
    // 1. Introduction and Soil Type
    if (analysis.soil_type) {
      const confidence = analysis.confidence ? `${Math.round(analysis.confidence * 100)} percent` : '';
      sections.push(`Your soil has been analyzed. It is ${analysis.soil_type} with ${confidence} confidence.`);
    }
    
    // 2. pH Level with detailed advice
    if (analysis.ph) {
      sections.push(`The pH level of your soil is ${analysis.ph}. ${this.getPhAdvice(analysis.ph)}`);
    }
    
    // 3. Nutrient Status - Detailed from ML prediction
    if (analysis.ml_nutrient_status) {
      const nutrients = [];
      if (analysis.ml_nutrient_status.nitrogen) {
        nutrients.push(`Nitrogen level is ${analysis.ml_nutrient_status.nitrogen}`);
      }
      if (analysis.ml_nutrient_status.phosphorus) {
        nutrients.push(`Phosphorus level is ${analysis.ml_nutrient_status.phosphorus}`);
      }
      if (analysis.ml_nutrient_status.potassium) {
        nutrients.push(`Potassium level is ${analysis.ml_nutrient_status.potassium}`);
      }
      if (nutrients.length > 0) {
        sections.push(`Regarding nutrients: ${nutrients.join(', ')}.`);
      }
    }
    
    // 4. Nutrient Deficiencies
    if (analysis.nutrient_deficiency) {
      sections.push(`Important nutrient information: ${analysis.nutrient_deficiency}`);
    }
    
    // 5. Fertilizer Recommendations - Detailed
    if (analysis.fertilizer) {
      sections.push(`For fertilizer application: ${analysis.fertilizer}`);
    }
    
    // 6. Soil Health Card Recommendations - ALL recommendations
    if (analysis.soil_health_card && analysis.soil_health_card.recommendations) {
      const allRecs = analysis.soil_health_card.recommendations.join('. ');
      if (allRecs) {
        sections.push(`According to the Soil Health Card program: ${allRecs}`);
      }
    }
    
    // 7. Crop Recommendations - ALL crops
    if (analysis.recommended_crops && analysis.recommended_crops.length > 0) {
      const crops = analysis.recommended_crops.join(', ');
      sections.push(`The best crops suitable for your soil are: ${crops}. These crops will grow well in your soil conditions.`);
    }
    
    // 8. Weather Conditions - Detailed
    if (analysis.weather) {
      sections.push(`Current weather conditions: Temperature is ${analysis.weather.temperature} degrees celsius, humidity is ${analysis.weather.humidity} percent.`);
      if (analysis.weather.rainfall_30d !== undefined) {
        sections.push(`Rainfall in the last 30 days is ${analysis.weather.rainfall_30d} millimeters.`);
      }
      if (analysis.weather.rainfall_forecast) {
        sections.push(`Rainfall forecast: ${analysis.weather.rainfall_forecast} millimeters expected.`);
      }
    }
    
    // 9. Soil Moisture - Detailed
    if (analysis.bhuvan_soil_moisture) {
      sections.push(`Soil moisture level is ${analysis.bhuvan_soil_moisture.percentage?.toFixed(1)} percent according to ISRO Bhuvan satellite data from ${analysis.bhuvan_soil_moisture.satellite} satellite.`);
    }
    
    // 10. Satellite Vegetation Data - Detailed
    if (analysis.satellite && analysis.satellite.ndvi) {
      const ndvi = analysis.satellite.ndvi.toFixed(2);
      sections.push(`Vegetation index is ${ndvi}. ${this.getNDVIAdvice(analysis.satellite.ndvi)}`);
    }
    
    // 11. Crop Health - Detailed
    if (analysis.crop_health) {
      sections.push(`Crop health score is ${analysis.crop_health.health_score} out of 100. Growth stage is ${analysis.crop_health.growth_stage?.replace(/_/g, ' ')}.`);
    }
    
    // 12. FULL Advisory Report - Include ALL sections
    if (analysis.advisory_report && analysis.advisory_report.sections) {
      const report = analysis.advisory_report.sections;
      
      // Soil Analysis Summary
      if (report.soil_analysis && report.soil_analysis.summary) {
        sections.push(`Soil analysis summary: ${report.soil_analysis.summary}`);
      }
      
      // Fertilizer Recommendation - Detailed
      if (report.fertilizer_recommendation) {
        if (report.fertilizer_recommendation.primary_nutrients) {
          sections.push(`Primary nutrients recommendation: ${report.fertilizer_recommendation.primary_nutrients}`);
        }
        if (report.fertilizer_recommendation.application_method) {
          sections.push(`Application method: ${report.fertilizer_recommendation.application_method}`);
        }
      }
      
      // Crop Recommendation - Detailed
      if (report.crop_recommendation && report.crop_recommendation.explanation) {
        sections.push(`Crop recommendation details: ${report.crop_recommendation.explanation}`);
      }
      
      // Irrigation advice - Detailed
      if (report.irrigation_advice) {
        if (report.irrigation_advice.explanation) {
          sections.push(`For irrigation: ${report.irrigation_advice.explanation}`);
        }
        if (report.irrigation_advice.recommendation) {
          sections.push(`Irrigation recommendation: ${report.irrigation_advice.recommendation}`);
        }
      }
      
      // Risk assessment - ALL risks
      if (report.risk_assessment && report.risk_assessment.risks) {
        const allRisks = report.risk_assessment.risks.map(r => `${r.type}: ${r.description}`).join('. ');
        if (allRisks) {
          sections.push(`Important risks to consider: ${allRisks}`);
        }
      }
      
      // Climate-smart practices - ALL practices
      if (report.climate_smart_practices && report.climate_smart_practices.practices) {
        const allPractices = report.climate_smart_practices.practices.map(p => p.practice).join('. ');
        if (allPractices) {
          sections.push(`Recommended climate-smart farming practices: ${allPractices}`);
        }
      }

      // Cost Breakdown - simple farmer language
      if (report.cost_breakdown) {
        const cb = report.cost_breakdown;
        const total = cb.total ? `rupees ${cb.total.toLocaleString('en-IN')}` : '';
        sections.push(`For growing ${cb.crop} on one acre, your estimated total cost is ${total}. This includes seed cost, fertilizer, pesticide, and labour.`);
      }

      // Profit Estimation - simple language
      if (report.profit_estimation) {
        const pe = report.profit_estimation;
        const profit = pe.expected_profit >= 0
          ? `You may earn a profit of rupees ${pe.expected_profit.toLocaleString('en-IN')} per acre.`
          : `This crop may not be profitable this season. Please consider other crops.`;
        sections.push(`Expected yield is ${pe.yield_label}. Market price is ${pe.market_price_label}. ${profit}`);
        if (pe.profit_label) sections.push(pe.profit_label);
      }

      // Risk Level - simple language
      if (report.risk_analysis) {
        const ra = report.risk_analysis;
        sections.push(`The risk level for growing ${ra.crop} is ${ra.risk_level}. ${ra.risk_reasons?.join('. ')}.`);
      }

      // Weather Impact - simple language
      if (report.weather_impact) {
        const wi = report.weather_impact;
        sections.push(`Weather impact: ${wi.season_effect} ${wi.rainfall_effect}`);
        if (wi.warnings?.length > 0) {
          sections.push(`Important weather warning: ${wi.warnings.join(' ')}`);
        }
      }
    }
    
    // 13. Location Information
    if (analysis.location) {
      sections.push(`Your farm location is in ${analysis.location.district} district, ${analysis.location.state} state.`);
    }
    
    // 14. Closing
    sections.push(`This completes your comprehensive soil analysis and agricultural advisory report. Follow these recommendations for better crop yield and sustainable farming. Thank you.`);
    
    // Join all sections with pauses
    const fullExplanation = sections.join(' ... ');
    
    console.log('[Agent] Generated comprehensive explanation length:', fullExplanation.length, 'characters');
    console.log('[Agent] Number of sections:', sections.length);
    return fullExplanation;
  }

  /**
   * Split text into chunks for TTS (Sarvam has character limits)
   */
  splitIntoChunks(text, maxLength = 400) {
    const chunks = [];
    const sentences = text.split(/\.\s+/); // Split by sentences
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const testChunk = currentChunk + sentence + '. ';
      
      if (testChunk.length > maxLength && currentChunk.length > 0) {
        // Current chunk is full, save it and start new one
        chunks.push(currentChunk.trim());
        currentChunk = sentence + '. ';
      } else {
        currentChunk = testChunk;
      }
    }
    
    // Add remaining chunk
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  /**
   * Get pH-specific advice
   */
  getPhAdvice(ph) {
    if (ph < 5.5) {
      return 'This is acidic soil. You may need to add lime to increase pH.';
    } else if (ph > 8.0) {
      return 'This is alkaline soil. You may need to add sulfur to decrease pH.';
    } else if (ph >= 6.0 && ph <= 7.5) {
      return 'This is good pH level for most crops.';
    }
    return 'This pH level is acceptable.';
  }

  /**
   * Get NDVI-specific advice
   */
  getNDVIAdvice(ndvi) {
    if (ndvi < 0.2) {
      return 'Vegetation is sparse. Consider improving soil health and irrigation.';
    } else if (ndvi >= 0.2 && ndvi < 0.5) {
      return 'Vegetation is moderate. Continue with good farming practices.';
    } else if (ndvi >= 0.5) {
      return 'Vegetation is healthy and dense. Your crops are growing well.';
    }
    return '';
  }

  /**
   * Get error message in user's language
   */
  getErrorMessage(error, language) {
    const messages = {
      en: `Sorry, there was an error: ${error}. Please try again.`,
      hi: `क्षमा करें, एक त्रुटि हुई: ${error}। कृपया पुनः प्रयास करें।`,
      kn: `ಕ್ಷಮಿಸಿ, ದೋಷ ಸಂಭವಿಸಿದೆ: ${error}. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ।`,
      ta: `மன்னிக்கவும், பிழை ஏற்பட்டது: ${error}. மீண்டும் முயற்சிக்கவும்.`,
      te: `క్షమించండి, లోపం సంభవించింది: ${error}. దయచేసి మళ్లీ ప్రయత్నించండి.`,
      mr: `क्षमस्व, त्रुटी आली: ${error}. कृपया पुन्हा प्रयत्न करा.`
    };
    
    return messages[language] || messages['en'];
  }
}

export default new AutonomousAgentService();
