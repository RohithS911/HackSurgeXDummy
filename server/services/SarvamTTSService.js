/**
 * Sarvam AI Text-to-Speech Service
 * Handles conversion of text to speech using Sarvam AI API
 */

import axios from 'axios';
import logger from '../utils/logger.js';

class SarvamTTSService {
  constructor() {
    this.apiKey = process.env.SARVAM_API_KEY;
    this.baseUrl = 'https://api.sarvam.ai';
  }

  /**
   * Convert text to speech
   * @param {string} text - Text to convert
   * @param {string} languageCode - Language code (e.g., 'en-IN', 'hi-IN')
   * @param {string} speaker - Speaker name (default: 'ratan')
   * @returns {Promise<Buffer>} Audio buffer
   */
  async textToSpeech(text, languageCode = 'en-IN', speaker = 'ratan') {
    try {
      if (!this.apiKey) {
        throw new Error('Sarvam API key not configured');
      }

      logger.info('Converting text to speech', {
        textLength: text.length,
        languageCode,
        speaker
      });

      const response = await axios.post(
        `${this.baseUrl}/text-to-speech`,
        {
          inputs: [text],
          target_language_code: languageCode,
          speaker: speaker,
          pace: 1.0,
          speech_sample_rate: 8000,
          enable_preprocessing: true,
          model: 'bulbul:v3'
        },
        {
          headers: {
            'api-subscription-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      if (response.data && response.data.audios && response.data.audios.length > 0) {
        // Convert base64 to buffer
        const audioBase64 = response.data.audios[0];
        const audioBuffer = Buffer.from(audioBase64, 'base64');
        
        logger.info('TTS conversion successful', {
          audioSize: audioBuffer.length
        });
        
        return audioBuffer;
      }

      throw new Error('No audio data received from Sarvam API');

    } catch (error) {
      logger.error('Sarvam TTS error', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      if (error.response?.data) {
        throw new Error(`Sarvam TTS API error: ${JSON.stringify(error.response.data)}`);
      }

      throw error;
    }
  }

  /**
   * Get speaker name for language
   * @param {string} lang - Language code
   * @returns {string} Speaker name
   */
  getSpeaker(lang) {
    const speakerMap = {
      'en': 'ratan',
      'hi': 'ratan',
      'kn': 'ratan',
      'ta': 'ratan',
      'te': 'ratan',
      'mr': 'ratan',
      'bn': 'ratan',
      'gu': 'ratan',
      'pa': 'ratan',
      'ml': 'ratan',
      'or': 'ratan',
      'as': 'ratan'
    };
    return speakerMap[lang] || 'ratan';
  }

  /**
   * Get language code for Sarvam AI
   * @param {string} lang - Short language code
   * @returns {string} Sarvam language code
   */
  getLanguageCode(lang) {
    const langMap = {
      'en': 'en-IN',
      'hi': 'hi-IN',
      'kn': 'kn-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'mr': 'mr-IN',
      'bn': 'bn-IN',
      'gu': 'gu-IN',
      'pa': 'pa-IN',
      'ml': 'ml-IN',
      'or': 'or-IN',
      'as': 'as-IN'
    };
    return langMap[lang] || 'en-IN';
  }
}

export default new SarvamTTSService();
