import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceOptimizer, DEFAULT_PERFORMANCE_CONFIG } from './performanceOptimizer';

// Mock VS Code
vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((key: string, defaultValue: any) => defaultValue)
    }))
  },
  window: {
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn()
    }))
  }
}));

describe('PerformanceOptimizer', () => {
  let optimizer: PerformanceOptimizer;

  beforeEach(() => {
    // Reset singleton instance
    (PerformanceOptimizer as any).instance = undefined;
    optimizer = PerformanceOptimizer.getInstance();
  });

  afterEach(() => {
    optimizer.dispose();
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PerformanceOptimizer.getInstance();
      const instance2 = PerformanceOptimizer.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Configuration', () => {
    it('should load default configuration', () => {
      const config = optimizer.getConfiguration();
      expect(config).toEqual(DEFAULT_PERFORMANCE_CONFIG);
    });

    it('should update configuration', () => {
      const newConfig = { debounceDelay: 500 };
      optimizer.updateConfiguration(newConfig);
      
      const config = optimizer.getConfiguration();
      expect(config.debounceDelay).toBe(500);
      expect(config.maxFileSize).toBe(DEFAULT_PERFORMANCE_CONFIG.maxFileSize);
    });
  });

  describe('Debouncing', () => {
    it('should debounce function calls', async () => {
      const mockFn = vi.fn();
      const debouncedFn = optimizer.debounce('test', mockFn, 100);

      // Call multiple times rapidly
      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      // Should not be called immediately
      expect(mockFn).not.toHaveBeenCalled();

      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be called only once with the last arguments
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    it('should handle different debounce keys separately', async () => {
      const mockFn1 = vi.fn();
      const mockFn2 = vi.fn();
      
      const debouncedFn1 = optimizer.debounce('key1', mockFn1, 50);
      const debouncedFn2 = optimizer.debounce('key2', mockFn2, 50);

      debouncedFn1('test1');
      debouncedFn2('test2');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFn1).toHaveBeenCalledWith('test1');
      expect(mockFn2).toHaveBeenCalledWith('test2');
    });
  });

  describe('File Size Checking', () => {
    it('should allow processing of small files', () => {
      const mockDocument = {
        getText: () => 'small content',
        uri: { fsPath: 'test.js' }
      };

      const shouldProcess = optimizer.shouldProcessFile(mockDocument as any);
      expect(shouldProcess).toBe(true);
    });

    it('should reject processing of large files', () => {
      const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB
      const mockDocument = {
        getText: () => largeContent,
        uri: { fsPath: 'large.js' }
      };

      const shouldProcess = optimizer.shouldProcessFile(mockDocument as any);
      expect(shouldProcess).toBe(false);
    });

    it('should identify large files correctly', () => {
      const largeContent = 'x'.repeat(200 * 1024); // 200KB
      const smallContent = 'small';
      
      const largeDocument = {
        getText: () => largeContent,
        uri: { fsPath: 'large.js' }
      };
      
      const smallDocument = {
        getText: () => smallContent,
        uri: { fsPath: 'small.js' }
      };

      expect(optimizer.isLargeFile(largeDocument as any)).toBe(true);
      expect(optimizer.isLargeFile(smallDocument as any)).toBe(false);
    });
  });

  describe('Memoization', () => {
    it('should cache function results', () => {
      const expensiveFn = vi.fn((x: number) => x * 2);
      const keyGenerator = (x: number) => `key-${x}`;
      
      const memoizedFn = optimizer.memoize(expensiveFn, keyGenerator);

      // First call
      const result1 = memoizedFn(5);
      expect(result1).toBe(10);
      expect(expensiveFn).toHaveBeenCalledTimes(1);

      // Second call with same argument - should use cache
      const result2 = memoizedFn(5);
      expect(result2).toBe(10);
      expect(expensiveFn).toHaveBeenCalledTimes(1); // Still only called once

      // Third call with different argument
      const result3 = memoizedFn(3);
      expect(result3).toBe(6);
      expect(expensiveFn).toHaveBeenCalledTimes(2);
    });

    it('should handle cache eviction when full', () => {
      // Set a small cache size for testing
      optimizer.updateConfiguration({ maxCacheSize: 2 });

      const mockFn = vi.fn((x: number) => x);
      const keyGenerator = (x: number) => `key-${x}`;
      const memoizedFn = optimizer.memoize(mockFn, keyGenerator);

      // Fill cache beyond capacity
      memoizedFn(1);
      memoizedFn(2);
      memoizedFn(3); // Should trigger eviction

      expect(mockFn).toHaveBeenCalledTimes(3);

      // Call first item again - should be evicted and need recalculation
      memoizedFn(1);
      expect(mockFn).toHaveBeenCalledTimes(4);
    });
  });

  describe('Timeout Handling', () => {
    it('should resolve fast functions normally', async () => {
      const fastFn = () => Promise.resolve('success');
      
      const result = await optimizer.withTimeout(fastFn, 1000);
      expect(result).toBe('success');
    });

    it('should timeout slow functions', async () => {
      const slowFn = () => new Promise(resolve => setTimeout(() => resolve('slow'), 1000));
      
      await expect(optimizer.withTimeout(slowFn, 100)).rejects.toThrow('Operation timed out after 100ms');
    });

    it('should handle synchronous functions', async () => {
      const syncFn = () => 'sync result';
      
      const result = await optimizer.withTimeout(syncFn, 100);
      expect(result).toBe('sync result');
    });
  });

  describe('Memory Tracking', () => {
    it('should track and release memory usage', () => {
      const operationId = 'test-operation';
      const sizeBytes = 1024;

      optimizer.trackMemoryUsage(operationId, sizeBytes);
      
      const stats = optimizer.getPerformanceStats();
      expect(stats.memoryUsage).toBe(sizeBytes);

      optimizer.releaseMemoryTracking(operationId);
      
      const statsAfter = optimizer.getPerformanceStats();
      expect(statsAfter.memoryUsage).toBe(0);
    });

    it('should accumulate memory usage from multiple operations', () => {
      optimizer.trackMemoryUsage('op1', 1000);
      optimizer.trackMemoryUsage('op2', 2000);
      
      const stats = optimizer.getPerformanceStats();
      expect(stats.memoryUsage).toBe(3000);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache by pattern', () => {
      const mockFn = vi.fn((x: string) => x);
      const keyGenerator = (x: string) => x;
      const memoizedFn = optimizer.memoize(mockFn, keyGenerator);

      // Add some cached items
      memoizedFn('test-1');
      memoizedFn('test-2');
      memoizedFn('other-1');

      expect(mockFn).toHaveBeenCalledTimes(3);

      // Clear cache for items matching pattern
      optimizer.clearCache('test');

      // These should be recalculated
      memoizedFn('test-1');
      memoizedFn('test-2');
      // This should still be cached
      memoizedFn('other-1');

      expect(mockFn).toHaveBeenCalledTimes(5); // 3 original + 2 recalculated
    });

    it('should clear all cache when no pattern provided', () => {
      const mockFn = vi.fn((x: string) => x);
      const keyGenerator = (x: string) => x;
      const memoizedFn = optimizer.memoize(mockFn, keyGenerator);

      memoizedFn('test-1');
      memoizedFn('test-2');
      expect(mockFn).toHaveBeenCalledTimes(2);

      optimizer.clearCache();

      // All should be recalculated
      memoizedFn('test-1');
      memoizedFn('test-2');
      expect(mockFn).toHaveBeenCalledTimes(4);
    });
  });

  describe('Performance Statistics', () => {
    it('should provide accurate performance statistics', () => {
      const mockFn = vi.fn((x: number) => x);
      const keyGenerator = (x: number) => `key-${x}`;
      const memoizedFn = optimizer.memoize(mockFn, keyGenerator);

      // Create some cache entries
      memoizedFn(1);
      memoizedFn(2);
      memoizedFn(1); // Cache hit

      // Track some memory
      optimizer.trackMemoryUsage('test', 1000);

      // Create a debouncer and call it to create an active timer
      const debouncedFn = optimizer.debounce('test-debounce', () => {}, 100);
      debouncedFn(); // This creates an active timer

      const stats = optimizer.getPerformanceStats();
      
      expect(stats.cacheSize).toBe(2);
      expect(stats.cacheHitRate).toBeGreaterThan(0);
      expect(stats.memoryUsage).toBe(1000);
      expect(stats.activeDebouncers).toBe(1);
    });
  });

  describe('Disposal', () => {
    it('should clean up resources on disposal', () => {
      const mockFn = vi.fn();
      const debouncedFn = optimizer.debounce('test', mockFn, 1000);
      
      optimizer.trackMemoryUsage('test', 1000);
      
      // Trigger debounce
      debouncedFn();
      
      // Dispose
      optimizer.dispose();
      
      const stats = optimizer.getPerformanceStats();
      expect(stats.activeDebouncers).toBe(0);
      expect(stats.memoryUsage).toBe(0);
      expect(stats.cacheSize).toBe(0);
    });
  });
});