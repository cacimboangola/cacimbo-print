const { CircuitBreaker } = require('./circuit-breaker');

describe('CircuitBreaker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts in CLOSED state', () => {
    const cb = new CircuitBreaker(3, 1000);
    const state = cb.getState();
    
    expect(state.state).toBe('CLOSED');
    expect(state.failureCount).toBe(0);
  });

  it('opens after threshold failures', async () => {
    const cb = new CircuitBreaker(3, 1000);
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    
    for (let i = 0; i < 3; i++) {
      try {
        await cb.execute(fn);
      } catch (e) {
        // Expected to fail
      }
    }
    
    expect(cb.getState().state).toBe('OPEN');
    expect(cb.getState().failureCount).toBe(3);
  });

  it('blocks requests when OPEN', async () => {
    const cb = new CircuitBreaker(2, 1000);
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    
    // Trigger circuit to open
    try { await cb.execute(fn); } catch (e) {}
    try { await cb.execute(fn); } catch (e) {}
    
    expect(cb.getState().state).toBe('OPEN');
    
    // Next request should be blocked
    await expect(cb.execute(fn)).rejects.toThrow('Circuit breaker is OPEN');
    
    // Function should not be called when circuit is open
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('transitions to HALF_OPEN after timeout', async () => {
    jest.useFakeTimers();
    const cb = new CircuitBreaker(2, 1000);
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    
    // Open the circuit
    try { await cb.execute(fn); } catch (e) {}
    try { await cb.execute(fn); } catch (e) {}
    
    expect(cb.getState().state).toBe('OPEN');
    
    // Advance time past timeout
    jest.advanceTimersByTime(1001);
    
    // Next request should transition to HALF_OPEN and execute
    fn.mockResolvedValue('success');
    const result = await cb.execute(fn);
    
    expect(result).toBe('success');
    expect(cb.getState().state).toBe('CLOSED');
    
    jest.useRealTimers();
  });

  it('closes on success in HALF_OPEN', async () => {
    jest.useFakeTimers();
    const cb = new CircuitBreaker(2, 1000);
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    
    // Open the circuit
    try { await cb.execute(fn); } catch (e) {}
    try { await cb.execute(fn); } catch (e) {}
    
    // Wait for timeout
    jest.advanceTimersByTime(1001);
    
    // Success in HALF_OPEN should close circuit
    fn.mockResolvedValue('success');
    await cb.execute(fn);
    
    expect(cb.getState().state).toBe('CLOSED');
    expect(cb.getState().failureCount).toBe(0);
    
    jest.useRealTimers();
  });

  it('reopens on failure in HALF_OPEN', async () => {
    jest.useFakeTimers();
    const cb = new CircuitBreaker(2, 1000);
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    
    // Open the circuit
    try { await cb.execute(fn); } catch (e) {}
    try { await cb.execute(fn); } catch (e) {}
    
    expect(cb.getState().state).toBe('OPEN');
    
    // Wait for timeout
    jest.advanceTimersByTime(1001);
    
    // Failure in HALF_OPEN should reopen circuit
    try {
      await cb.execute(fn);
    } catch (e) {
      // Expected to fail
    }
    
    expect(cb.getState().state).toBe('OPEN');
    
    jest.useRealTimers();
  });

  it('resets failure count on success', async () => {
    const cb = new CircuitBreaker(5, 1000);
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');
    
    // Two failures
    try { await cb.execute(fn); } catch (e) {}
    try { await cb.execute(fn); } catch (e) {}
    
    expect(cb.getState().failureCount).toBe(2);
    
    // Success should reset count
    await cb.execute(fn);
    
    expect(cb.getState().failureCount).toBe(0);
    expect(cb.getState().state).toBe('CLOSED');
  });

  it('provides seconds until retry when OPEN', async () => {
    jest.useFakeTimers();
    const cb = new CircuitBreaker(2, 5000);
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    
    // Open the circuit
    try { await cb.execute(fn); } catch (e) {}
    try { await cb.execute(fn); } catch (e) {}
    
    const state = cb.getState();
    expect(state.state).toBe('OPEN');
    expect(state.secondsUntilRetry).toBeGreaterThan(0);
    expect(state.secondsUntilRetry).toBeLessThanOrEqual(5);
    
    jest.useRealTimers();
  });

  it('can be manually reset', () => {
    const cb = new CircuitBreaker(2, 1000);
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    
    // Open the circuit
    try { cb.execute(fn); } catch (e) {}
    try { cb.execute(fn); } catch (e) {}
    
    expect(cb.getState().state).toBe('OPEN');
    
    // Reset manually
    cb.reset();
    
    expect(cb.getState().state).toBe('CLOSED');
    expect(cb.getState().failureCount).toBe(0);
  });
});
