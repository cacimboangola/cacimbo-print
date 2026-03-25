const { CircuitBreaker } = require('./circuit-breaker');
const { retryWithBackoff } = require('./retry-util');

describe('Reliability Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Retry Logic Integration', () => {
    it('retries operation on temporary failure', async () => {
      let attempts = 0;
      const operation = jest.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const result = await retryWithBackoff(operation, 3, 100);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('fails after max retries on permanent failure', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Permanent failure'));

      await expect(retryWithBackoff(operation, 3, 100)).rejects.toThrow('Permanent failure');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('respects exponential backoff timing', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('fail'));
      const start = Date.now();

      try {
        await retryWithBackoff(operation, 3, 100);
      } catch (e) {
        // Expected
      }

      const elapsed = Date.now() - start;
      // 100ms + 200ms + 400ms = 700ms
      expect(elapsed).toBeGreaterThanOrEqual(600);
      expect(elapsed).toBeLessThan(900);
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('pauses requests when API is offline', async () => {
      const cb = new CircuitBreaker(3, 1000);
      const apiCall = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      // Trigger circuit to open
      for (let i = 0; i < 3; i++) {
        try {
          await cb.execute(apiCall);
        } catch (e) {
          // Expected
        }
      }

      expect(cb.getState().state).toBe('OPEN');

      // Next request should be blocked
      await expect(cb.execute(apiCall)).rejects.toThrow('Circuit breaker is OPEN');

      // API call should not be made when circuit is open
      expect(apiCall).toHaveBeenCalledTimes(3);
    });

    it('resumes requests when API recovers', async () => {
      jest.useFakeTimers();
      const cb = new CircuitBreaker(2, 1000);
      const apiCall = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      // Open circuit
      try { await cb.execute(apiCall); } catch (e) {}
      try { await cb.execute(apiCall); } catch (e) {}

      expect(cb.getState().state).toBe('OPEN');

      // Advance time and simulate API recovery
      jest.advanceTimersByTime(1001);
      apiCall.mockResolvedValue({ data: 'success' });

      const result = await cb.execute(apiCall);

      expect(result).toEqual({ data: 'success' });
      expect(cb.getState().state).toBe('CLOSED');

      jest.useRealTimers();
    });
  });

  describe('Retry + Circuit Breaker Combined', () => {
    it('retries within circuit breaker threshold', async () => {
      const cb = new CircuitBreaker(5, 1000);
      let attempts = 0;

      const operation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      // Wrap operation with retry
      const retryOperation = () => retryWithBackoff(operation, 3, 50);

      const result = await cb.execute(retryOperation);

      expect(result).toBe('success');
      expect(cb.getState().state).toBe('CLOSED');
      expect(cb.getState().failureCount).toBe(0);
    });

    it('circuit breaker opens when retries consistently fail', async () => {
      const cb = new CircuitBreaker(3, 1000);
      const operation = jest.fn().mockRejectedValue(new Error('Permanent failure'));

      // Each retry attempt will fail 3 times, then circuit breaker counts it as 1 failure
      for (let i = 0; i < 3; i++) {
        try {
          await cb.execute(() => retryWithBackoff(operation, 3, 50));
        } catch (e) {
          // Expected
        }
      }

      expect(cb.getState().state).toBe('OPEN');
    });

    it('handles mixed success and failure scenarios', async () => {
      const cb = new CircuitBreaker(5, 1000);
      let callCount = 0;

      const operation = async () => {
        callCount++;
        // Fail first 2 attempts, succeed on 3rd
        if (callCount % 3 === 0) {
          return 'success';
        }
        throw new Error('Temporary failure');
      };

      // Multiple operations with retries
      for (let i = 0; i < 3; i++) {
        const result = await cb.execute(() => retryWithBackoff(operation, 3, 50));
        expect(result).toBe('success');
      }

      // Circuit should still be closed due to eventual successes
      expect(cb.getState().state).toBe('CLOSED');
      expect(cb.getState().failureCount).toBe(0);
    });
  });

  describe('Real-world Scenarios', () => {
    it('handles printer offline then online scenario', async () => {
      let printerOnline = false;
      const printOperation = jest.fn(async () => {
        if (!printerOnline) {
          throw new Error('Printer offline');
        }
        return true;
      });

      // First attempt fails
      await expect(retryWithBackoff(printOperation, 3, 50)).rejects.toThrow('Printer offline');

      // Printer comes online
      printerOnline = true;

      // Second attempt succeeds
      const result = await retryWithBackoff(printOperation, 3, 50);
      expect(result).toBe(true);
    });

    it('handles API rate limiting with circuit breaker', async () => {
      jest.useFakeTimers();
      const cb = new CircuitBreaker(3, 2000);
      let rateLimited = true;

      const apiCall = jest.fn(async () => {
        if (rateLimited) {
          throw new Error('Rate limit exceeded');
        }
        return { data: 'success' };
      });

      // Trigger rate limit errors
      for (let i = 0; i < 3; i++) {
        try {
          await cb.execute(apiCall);
        } catch (e) {
          // Expected
        }
      }

      expect(cb.getState().state).toBe('OPEN');

      // Wait for circuit to allow retry
      jest.advanceTimersByTime(2001);

      // Rate limit lifted
      rateLimited = false;

      const result = await cb.execute(apiCall);
      expect(result).toEqual({ data: 'success' });
      expect(cb.getState().state).toBe('CLOSED');

      jest.useRealTimers();
    });
  });
});
