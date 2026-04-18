/**
 * Translation Service using Sarvam AI
 * Translates agricultural advisory content to user's selected language
 */

import axios from 'axios';
import logger from '../utils/logger.js';

// Language code mapping to Sarvam AI format
const LANGUAGE_MAP = {
  'en': 'en-IN',
  'hi': 'hi-IN',
  'kn': 'kn-IN',
  'ta': 'ta-IN',
  'te': 'te-IN',
  'mr': 'mr-IN',
  'gu': 'gu-IN',
  'bn': 'bn-IN',
  'ml': 'ml-IN',
  'pa': 'pa-IN',
  'or': 'or-IN',
  'as': 'as-IN',
  'ur': 'ur-IN'
};

class TranslationService {
  constructor() {
    this.apiKey = process.env.SARVAM_API_KEY;
    this.apiUrl = 'https://api.sarvam.ai/translate';
  }

  /**
   * Translate text to target language using Sarvam AI
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language code
   * @returns {Promise<string>} Translated text
   */
  async translateText(text, targetLang = 'en') {
    // If target is English or text is empty, return as-is
    if (!text || targetLang === 'en' || !this.apiKey) {
      return text;
    }

    try {
      const targetLangCode = LANGUAGE_MAP[targetLang] || 'en-IN';
      
      logger.info('Translating with Sarvam AI', {
        textLength: text.length,
        targetLang: targetLangCode
      });

      const response = await axios.post(
        this.apiUrl,
        {
          input: text,
          source_language_code: 'en-IN',
          target_language_code: targetLangCode,
          speaker_gender: 'Male',
          mode: 'formal',
          model: 'mayura:v1',
          enable_preprocessing: true
        },
        {
          headers: {
            'api-subscription-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data && response.data.translated_text) {
        logger.info('Sarvam translation successful');
        return response.data.translated_text;
      }

      // If no translation in response, return original
      logger.warn('No translation in Sarvam response, returning original text');
      return text;

    } catch (error) {
      logger.error('Sarvam translation error', {
        message: error.message,
        response: error.response?.data
      });

      // Return original text on error
      return text;
    }
  }

  /**
   * Translate analysis results object - ALL fields
   * @param {Object} analysis - Analysis results object
   * @param {string} targetLang - Target language code
   * @returns {Promise<Object>} Translated analysis object
   */
  async translateAnalysisResults(analysis, targetLang = 'en') {
    if (!analysis || targetLang === 'en') {
      return analysis;
    }

    try {
      logger.info('Translating analysis results', { targetLang });

      const translated = { ...analysis };

      // Translate soil type
      if (analysis.soil_type) {
        translated.soil_type = await this.translateText(analysis.soil_type, targetLang);
      }

      // Translate fertilizer advice
      if (analysis.fertilizer) {
        translated.fertilizer = await this.translateText(analysis.fertilizer, targetLang);
      }

      // Translate nutrient deficiency
      if (analysis.nutrient_deficiency) {
        translated.nutrient_deficiency = await this.translateText(analysis.nutrient_deficiency, targetLang);
      }

      // Translate advice
      if (analysis.advice) {
        translated.advice = await this.translateText(analysis.advice, targetLang);
      }

      // Translate nutrient status descriptions
      if (analysis.ml_nutrient_status) {
        const nutrientStatus = { ...analysis.ml_nutrient_status };
        if (nutrientStatus.nitrogen) nutrientStatus.nitrogen = await this.translateText(nutrientStatus.nitrogen, targetLang);
        if (nutrientStatus.phosphorus) nutrientStatus.phosphorus = await this.translateText(nutrientStatus.phosphorus, targetLang);
        if (nutrientStatus.potassium) nutrientStatus.potassium = await this.translateText(nutrientStatus.potassium, targetLang);
        translated.ml_nutrient_status = nutrientStatus;
      }

      // Translate recommended crops array
      if (analysis.recommended_crops && Array.isArray(analysis.recommended_crops)) {
        translated.recommended_crops = await Promise.all(
          analysis.recommended_crops.map(crop => this.translateText(crop, targetLang))
        );
      }

      // Translate weather description
      if (analysis.weather && analysis.weather.description) {
        translated.weather = {
          ...analysis.weather,
          description: await this.translateText(analysis.weather.description, targetLang)
        };
      }

      // Translate location data
      if (analysis.location) {
        const location = { ...analysis.location };
        if (location.city) location.city = await this.translateText(location.city, targetLang);
        if (location.state) location.state = await this.translateText(location.state, targetLang);
        if (location.country) location.country = await this.translateText(location.country, targetLang);
        translated.location = location;
      }

      // Translate loan recommendations
      if (analysis.loan_recommendations?.recommended_schemes?.length > 0) {
        const translatedSchemes = await Promise.all(
          analysis.loan_recommendations.recommended_schemes.map(async (scheme) => ({
            ...scheme,
            name: await this.translateText(scheme.name, targetLang),
            provider: await this.translateText(scheme.provider, targetLang),
            max_amount: await this.translateText(scheme.max_amount, targetLang),
            interest_rate: await this.translateText(scheme.interest_rate, targetLang),
            repayment: await this.translateText(scheme.repayment, targetLang),
            subsidy: scheme.subsidy ? await this.translateText(scheme.subsidy, targetLang) : scheme.subsidy,
            benefits: await Promise.all(scheme.benefits.map(b => this.translateText(b, targetLang))),
            special_features: await Promise.all((scheme.special_features || []).map(f => this.translateText(f, targetLang))),
            tts_description: await this.translateText(scheme.tts_description, targetLang)
          }))
        );
        translated.loan_recommendations = {
          ...analysis.loan_recommendations,
          recommended_schemes: translatedSchemes,
          summary: await this.translateText(analysis.loan_recommendations.summary, targetLang),
          disclaimer: await this.translateText(analysis.loan_recommendations.disclaimer, targetLang),
          tts_full: await this.translateText(analysis.loan_recommendations.tts_full, targetLang)
        };
      }

      logger.info('Analysis results translated successfully');
      return translated;

    } catch (error) {
      logger.error('Error translating analysis results', { error: error.message });
      return analysis; // Return original on error
    }
  }
}

export default new TranslationService();
