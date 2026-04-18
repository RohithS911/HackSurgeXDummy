/**
 * Porcupine Wake Word Detection Service
 * Enables hands-free voice activation with custom wake words
 */

import * as PorcupineWeb from '@picovoice/porcupine-web';
import { WebVoiceProcessor } from '@picovoice/web-voice-processor';

const { PorcupineWorker } = PorcupineWeb;

class PorcupineWakeWordService {
  constructor() {
    this.porcupineWorker = null;
    this.isListening = false;
    this.onWakeWordDetected = null;
    this.accessKey = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Porcupine with access key
   * @param {string} accessKey - Picovoice access key
   * @param {Function} callback - Callback when wake word is detected
   * @param {Object} options - Configuration options
   */
  async initialize(accessKey, callback, options = {}) {
    if (!accessKey) {
      throw new Error('Porcupine access key is required');
    }

    // Validate access key format
    const trimmedKey = accessKey.trim();
    if (!trimmedKey || trimmedKey.length < 20) {
      throw new Error('Invalid Porcupine access key format');
    }

    this.accessKey = trimmedKey;
    this.onWakeWordDetected = callback;

    try {
      console.log('Initializing Porcupine wake word detection...');
      console.log('Access key length:', trimmedKey.length);
      
      // Configuration: Switch between built-in and custom wake word
      // To use custom "sita ai" wake word:
      // 1. Train at console.picovoice.ai
      // 2. Download .ppn file
      // 3. Place in public/models/sita-ai.ppn
      // 4. Set USE_CUSTOM_WAKE_WORD = true
      
      const USE_CUSTOM_WAKE_WORD = true; // Custom "sita ai" wake word enabled!
      
      let keyword;
      let wakeWordLabel;
      
      if (USE_CUSTOM_WAKE_WORD) {
        // Custom "sita ai" wake word
        keyword = {
          publicPath: '/models/sita-ai.ppn',
          label: 'sita ai',
          sensitivity: 0.5
        };
        wakeWordLabel = 'Sita AI';
        console.log('Using custom wake word: Sita AI');
      } else {
        // Built-in "Porcupine" wake word (temporary)
        keyword = PorcupineWeb.BuiltInKeyword.Porcupine;
        wakeWordLabel = 'Porcupine';
        console.log('Using built-in wake word: Porcupine');
      }
      
      // Model configuration - use local model file from public directory
      const porcupineModel = {
        publicPath: '/porcupine_params.pv',
        forceWrite: true
      };

      console.log('Creating Porcupine worker...');

      // Create Porcupine worker with proper error handling
      // API: create(accessKey, keyword, callback, model, options?)
      this.porcupineWorker = await PorcupineWorker.create(
        trimmedKey,
        keyword,
        (detection) => {
          // detection object contains: { label }
          console.log(`Wake word detected: ${detection.label}`);
          if (this.onWakeWordDetected) {
            this.onWakeWordDetected(detection.index || 0, detection.label);
          }
        },
        porcupineModel
      );

      this.isInitialized = true;
      this.wakeWordLabel = wakeWordLabel;
      console.log('✅ Porcupine wake word detection initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Porcupine:', error);
      
      // Provide more specific error messages
      let errorMessage = error.message;
      if (error.message.includes('AccessKey')) {
        errorMessage = 'Invalid or expired Porcupine access key. Please check your key at console.picovoice.ai';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error: Unable to load Porcupine models. Check your internet connection.';
      } else if (error.message.includes('CORS')) {
        errorMessage = 'CORS error: Unable to load Porcupine models from CDN.';
      }
      
      console.error('Error details:', {
        message: errorMessage,
        originalError: error.message,
        stack: error.stack
      });
      
      this.isInitialized = false;
      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = error;
      throw enhancedError;
    }
  }

  /**
   * Start listening for wake word
   */
  async startListening() {
    if (!this.porcupineWorker) {
      throw new Error('Porcupine not initialized. Call initialize() first.');
    }

    if (this.isListening) {
      console.log('Already listening for wake word');
      return;
    }

    try {
      console.log('Starting WebVoiceProcessor...');
      await WebVoiceProcessor.subscribe(this.porcupineWorker);
      this.isListening = true;
      console.log('Started listening for wake word');
    } catch (error) {
      console.error('Failed to start listening:', error);
      throw error;
    }
  }

  /**
   * Stop listening for wake word
   */
  async stopListening() {
    if (!this.isListening) {
      return;
    }

    try {
      await WebVoiceProcessor.unsubscribe(this.porcupineWorker);
      this.isListening = false;
      console.log('Stopped listening for wake word');
    } catch (error) {
      console.error('Failed to stop listening:', error);
      throw error;
    }
  }

  /**
   * Release resources
   */
  async release() {
    try {
      if (this.isListening) {
        await this.stopListening();
      }
      
      if (this.porcupineWorker) {
        await this.porcupineWorker.release();
        this.porcupineWorker = null;
      }
      
      this.isInitialized = false;
      console.log('Porcupine resources released');
    } catch (error) {
      console.error('Failed to release Porcupine:', error);
    }
  }

  /**
   * Check if currently listening
   */
  getIsListening() {
    return this.isListening;
  }

  /**
   * Check if initialized
   */
  getIsInitialized() {
    return this.isInitialized;
  }

  /**
   * Get current wake word label
   */
  getWakeWordLabel() {
    return this.wakeWordLabel || 'Porcupine';
  }

  /**
   * Get available built-in wake words
   */
  static getBuiltInKeywords() {
    return [
      'Porcupine',
      'Picovoice', 
      'Bumblebee',
      'Alexa',
      'Computer',
      'Jarvis',
      'Terminator',
      'Grasshopper',
      'Hey Google',
      'Hey Siri',
      'Okay Google',
      'Americano',
      'Blueberry',
      'Grapefruit'
    ];
  }
}

// Create singleton instance
const porcupineService = new PorcupineWakeWordService();

export default porcupineService;
