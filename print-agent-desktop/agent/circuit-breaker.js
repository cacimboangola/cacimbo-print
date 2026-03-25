let logger;
try {
  logger = require('./logger');
} catch (e) {
  // Fallback logger for standalone testing
  logger = {
    info: (msg) => console.log(`[INFO] ${msg}`),
    warn: (msg) => console.log(`[WARN] ${msg}`),
    error: (msg) => console.log(`[ERROR] ${msg}`),
  };
}

/**
 * Circuit Breaker pattern implementation
 * Prevents overwhelming a failing service with requests
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests are blocked
 * - HALF_OPEN: Testing if service has recovered
 */
class CircuitBreaker {
  /**
   * @param {number} failureThreshold - Number of failures before opening circuit (default: 5)
   * @param {number} resetTimeout - Milliseconds to wait before attempting reconnection (default: 30000)
   */
  constructor(failureThreshold = 5, resetTimeout = 30000) {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this.nextAttempt = null;
    this.lastStateChange = Date.now();
  }

  /**
   * Execute a function through the circuit breaker
   * @param {Function} fn - Async function to execute
   * @returns {Promise<any>} Result of the function
   * @throws {Error} If circuit is OPEN or function fails
   */
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      
      // Time to test reconnection
      this._transitionTo('HALF_OPEN');
      logger.info('🔄 Testing API reconnection...');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  onSuccess() {
    const wasOpen = this.state !== 'CLOSED';
    
    this.failureCount = 0;
    this._transitionTo('CLOSED');
    
    if (wasOpen) {
      logger.info('✅ API back online, resuming normal polling');
    }
  }

  /**
   * Handle failed execution
   */
  onFailure() {
    this.failureCount++;
    
    if (this.state === 'HALF_OPEN') {
      // Failed while testing - go back to OPEN
      this._transitionTo('OPEN');
      this.nextAttempt = Date.now() + this.resetTimeout;
      logger.warn(`⚠️  API still offline, extending pause for ${this.resetTimeout / 1000}s`);
    } else if (this.failureCount >= this.failureThreshold) {
      // Threshold reached - open circuit
      this._transitionTo('OPEN');
      this.nextAttempt = Date.now() + this.resetTimeout;
      logger.error(`🔴 API offline detected (${this.failureCount} failures), pausing polling for ${this.resetTimeout / 1000}s`);
    }
  }

  /**
   * Get current circuit breaker state
   * @returns {object} State information
   */
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      nextAttempt: this.nextAttempt,
      secondsUntilRetry: this.nextAttempt ? Math.max(0, Math.ceil((this.nextAttempt - Date.now()) / 1000)) : 0,
    };
  }

  /**
   * Transition to a new state
   * @private
   */
  _transitionTo(newState) {
    if (this.state !== newState) {
      this.state = newState;
      this.lastStateChange = Date.now();
    }
  }

  /**
   * Reset circuit breaker to initial state
   */
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.nextAttempt = null;
    logger.info('Circuit breaker reset to CLOSED state');
  }
}

module.exports = {
  CircuitBreaker,
};
