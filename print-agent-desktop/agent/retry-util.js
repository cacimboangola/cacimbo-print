let logger;
try {
  logger = require('./logger');
} catch (e) {
  // Fallback logger for standalone testing
  logger = {
    info: (msg) => console.log(`[INFO] ${msg}`),
    warn: (msg) => console.log(`[WARN] ${msg}`),
    error: (msg) => console.log(`[ERROR] ${msg}`),
    debug: (msg) => console.log(`[DEBUG] ${msg}`),
  };
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} baseDelay - Base delay in milliseconds (default: 1000)
 * @returns {Promise<any>} Result of the function
 * @throws {Error} Last error if all retries fail
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn();
      
      if (attempt > 0) {
        logger.info(`✓ Operation succeeded after ${attempt + 1} attempt(s)`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} failed: ${error.message}`);
        logger.info(`Waiting ${delay}ms before next retry...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        logger.error(`All ${maxRetries} retry attempts failed`);
        logger.error(`Final error: ${error.message}`);
        if (error.stack) {
          logger.debug(`Stack trace: ${error.stack}`);
        }
      }
    }
  }
  
  throw lastError;
}

module.exports = {
  retryWithBackoff,
};
