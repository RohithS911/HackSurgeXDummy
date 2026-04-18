/**
 * Structured logging utility using Winston
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      )
    }),
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

/**
 * Log API call metrics
 * @param {string} service - API service name
 * @param {number} duration - Duration in milliseconds
 * @param {boolean} success - Whether the call succeeded
 * @param {boolean} cacheHit - Whether data came from cache
 */
export function logAPICall(service, duration, success, cacheHit) {
  logger.info('API call completed', {
    service,
    duration_ms: duration,
    success,
    cache_hit: cacheHit,
    type: 'api_metric'
  });
}

/**
 * Log error with context
 * @param {string} level - Error level: 'critical', 'major', 'minor', 'warning'
 * @param {string} component - Component where error occurred
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
export function logError(level, component, error, context = {}) {
  const logLevel = level === 'critical' || level === 'major' ? 'error' : 'warn';
  
  logger[logLevel]('Error occurred', {
    error_level: level,
    component,
    error: error.message,
    stack: error.stack,
    ...context,
    type: 'error'
  });
}

/**
 * Log user action
 * @param {string} action - Action name
 * @param {Object} metadata - Action metadata
 */
export function logUserAction(action, metadata = {}) {
  logger.info('User action', {
    action,
    ...metadata,
    type: 'user_action'
  });
}

/**
 * Log data quality metrics
 * @param {Object} report - Analysis report
 */
export function logDataQuality(report) {
  logger.info('Data quality metrics', {
    report_id: report.report_id,
    data_completeness: report.metadata.data_sources_used.length / 7,
    confidence_level: report.metadata.confidence_level,
    offline_mode: report.offline_mode,
    cache_usage: Object.values(report.metadata.data_freshness || {})
      .filter(f => typeof f === 'string' && f.startsWith('cached')).length,
    type: 'data_quality'
  });
}

/**
 * Log performance metrics
 * @param {string} operation - Operation name
 * @param {number} duration - Duration in milliseconds
 * @param {Object} metadata - Additional metadata
 */
export function logPerformance(operation, duration, metadata = {}) {
  logger.info('Performance metric', {
    operation,
    duration_ms: duration,
    ...metadata,
    type: 'performance'
  });
}

export default logger;
