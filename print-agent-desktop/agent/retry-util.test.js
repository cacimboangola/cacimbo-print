const { retryWithBackoff } = require('./retry-util');

describe('retryWithBackoff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('succeeds on first attempt', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await retryWithBackoff(fn, 3, 100);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');
    
    const result = await retryWithBackoff(fn, 3, 100);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after max retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    
    await expect(retryWithBackoff(fn, 3, 100)).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('uses exponential backoff', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    const start = Date.now();
    
    try {
      await retryWithBackoff(fn, 3, 100);
    } catch (e) {
      // Expected to fail
    }
    
    const elapsed = Date.now() - start;
    // 100ms + 200ms + 400ms = 700ms (with margin for execution time)
    expect(elapsed).toBeGreaterThanOrEqual(600);
    expect(elapsed).toBeLessThan(900);
  });

  it('uses custom retry config', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');
    
    const result = await retryWithBackoff(fn, 2, 500);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('logs retry attempts', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');
    
    await retryWithBackoff(fn, 3, 100);
    
    // Should log the retry attempt
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});
