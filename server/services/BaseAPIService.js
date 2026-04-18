/**
 * Base API Service with resilience features
 * Provides timeout, retry logic, and error handling for all API services
 */

import axios from 'axios';
import { logAPICall, logError } from '../utils/logger.js';
import { INTELLIGENCE_CONFIG } from '../config/intelligence.config.js';

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Base API Service Class
 * All API services should extend this class
 */
export class BaseAPIService {
  constructor(serviceName, baseUrl, apiKey = null) {
    this.serviceName = serviceName;
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.timeout = INTELLIGENCE_CONFIG.API_TIMEOUT_MS;
    this.maxRetries = INTELLIGENCE_CONFIG.MAX_RETRIES;
    this.retryDelayBase = INTELLIGENCE_CONFIG.RETRY_DELAY_BASE_MS;
  }

  /**
   * Fetch with resilience (timeout, retry, error handling)
   * @param {Function} apiCall - Async function that makes the API call
   * @param {Object} options - Options for resilience
   * @returns {Promise<Object>} Result with data, source, and error
   */
  async fetchWithResilience(apiCall, options = {}) {
    const {
      timeout = this.timeout,
      maxRetries = this.maxRetries,
      retryOn429 = true
    } = options;

    const startTime = Date.now();
    let lastError = null;

    // Try the API call with retries
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        );

        // Race between API call and timeout
        const response = await Promise.race([
          apiCall(),
          timeoutPromise
        ]);

        // Success - log and return
        const duration = Date.now() - startTime;
        logAPICall(this.serviceName, duration, true, false);

        return {
          data: response.data,
          source: 'live',
          error: null,
          success: true
        };

      } catch (error) {
        lastError = error;
        const duration = Date.now() - startTime;

        // Check if it's a rate limit error (429)
        if (error.response && error.response.status === 429 && retryOn429) {
          const retryAfter = error.response.headers['retry-after'];
          const delay = retryAfter 
            ? parseInt(retryAfter) * 1000 
            : Math.pow(2, attempt) * this.retryDelayBase;

          logError('minor', this.serviceName, error, {
            attempt: attempt + 1,
            retry_after_ms: delay,
            message: 'Rate limit hit, retrying with exponential backoff'
          });

          if (attempt < maxRetries) {
            await sleep(delay);
            continue;
          }
        }

        // Check if it's a timeout
        if (error.message === 'Request timeout') {
          logError('minor', this.serviceName, error, {
            attempt: attempt + 1,
            timeout_ms: timeout,
            message: 'Request timed out'
          });

          // Don't retry on timeout
          break;
        }

        // Check if it's a network error that should be retried
        if (this.shouldRetry(error) && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * this.retryDelayBase;
          
          logError('minor', this.serviceName, error, {
            attempt: attempt + 1,
            retry_delay_ms: delay,
            message: 'Retrying after error'
          });

          await sleep(delay);
          continue;
        }

        // No more retries, log final error
        logAPICall(this.serviceName, duration, false, false);
        logError('major', this.serviceName, error, {
          final_attempt: true,
          total_attempts: attempt + 1
        });

        break;
      }
    }

    // All retries failed
    return {
      data: null,
      source: 'unavailable',
      error: lastError ? lastError.message : 'Unknown error',
      success: false
    };
  }

  /**
   * Determine if an error should trigger a retry
   * @param {Error} error - The error object
   * @returns {boolean} True if should retry
   */
  shouldRetry(error) {
    // Retry on network errors
    if (error.code === 'ECONNREFUSED' || 
        error.code === 'ENOTFOUND' || 
        error.code === 'ETIMEDOUT') {
      return true;
    }

    // Retry on 5xx server errors
    if (error.response && error.response.status >= 500) {
      return true;
    }

    // Don't retry on 4xx client errors (except 429 which is handled separately)
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      return false;
    }

    // Retry on other errors
    return true;
  }

  /**
   * Validate response data against expected schema
   * @param {Object} data - Response data
   * @param {Object} schema - Expected schema with required fields
   * @returns {Object} Validation result
   */
  validateResponse(data, schema) {
    const errors = [];
    const missing = [];

    for (const field of schema.required || []) {
      if (data[field] === undefined || data[field] === null) {
        missing.push(field);
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check field types if specified
    if (schema.fields) {
      for (const [field, expectedType] of Object.entries(schema.fields)) {
        if (data[field] !== undefined && data[field] !== null) {
          const actualType = typeof data[field];
          if (actualType !== expectedType) {
            errors.push(`Invalid type for ${field}: expected ${expectedType}, got ${actualType}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      missing
    };
  }

  /**
   * Create axios instance with common configuration
   * @param {Object} headers - Additional headers
   * @returns {Object} Axios instance
   */
  createAxiosInstance(headers = {}) {
    const config = {
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    // Add API key to headers if present
    if (this.apiKey) {
      config.headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return axios.create(config);
  }

  /**
   * Log API usage metrics
   * @param {string} endpoint - API endpoint called
   * @param {number} duration - Duration in ms
   * @param {boolean} success - Whether call succeeded
   */
  logMetrics(endpoint, duration, success) {
    logAPICall(this.serviceName, duration, success, false);
  }
}

export default BaseAPIService;
