import * as vscode from 'vscode';
import { ErrorHandler, Logger } from './errorHandler';

/**
 * Configuration interface for performance optimization settings
 */
export interface PerformanceConfig {
  /** Debounce delay for diagnostic updates in milliseconds */
  debounceDelay: number;
  /** Maximum file size to analyze in bytes */
  maxFileSize: number;
  /** Maximum number of features to cache */
  maxCacheSize: number;
  /** Timeout for parsing operations in milliseconds */
  parseTimeout: number;
  /** Maximum analysis depth for nested structures */
  maxAnalysisDepth: number;
  /** Enable/disable async processing for large files */
  enableAsyncProcessing: boolean;
  /** Threshold for considering a file "large" in bytes */
  largeFileThreshold: number;
}

/**
 * Default performance configuration
 */
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  debounceDelay: 300,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxCacheSize: 10000,
  parseTimeout: 5000, // 5 seconds
  maxAnalysisDepth: 50,
  enableAsyncProcessing: true,
  largeFileThreshold: 100 * 1024 // 100KB
};

/**
 * Cache entry interface for memoization
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
}

/**
 * Performance optimizer class that provides debouncing, caching, and memory management
 */
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private config: PerformanceConfig;
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private parseCache = new Map<string, CacheEntry<any>>();
  private memoryUsageTracker = new Map<string, number>();
  private errorHandler: ErrorHandler;
  private logger: Logger;

  private constructor() {
    this.config = { ...DEFAULT_PERFORMANCE_CONFIG };
    this.errorHandler = ErrorHandler.getInstance();
    this.logger = Logger.getInstance();
    
    // Load configuration from VS Code settings
    this.loadConfiguration();
    
    // Set up periodic cache cleanup
    this.setupCacheCleanup();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Load configuration from VS Code settings
   */
  private loadConfiguration(): void {
    try {
      const config = (vscode as any)?.workspace?.getConfiguration
        ? vscode.workspace.getConfiguration('baselineSidekick.performance')
        : {
            get: (_key: string, def: any) => def,
          } as any;
      
      this.config = {
        debounceDelay: config.get('debounceDelay', DEFAULT_PERFORMANCE_CONFIG.debounceDelay),
        maxFileSize: config.get('maxFileSize', DEFAULT_PERFORMANCE_CONFIG.maxFileSize),
        maxCacheSize: config.get('maxCacheSize', DEFAULT_PERFORMANCE_CONFIG.maxCacheSize),
        parseTimeout: config.get('parseTimeout', DEFAULT_PERFORMANCE_CONFIG.parseTimeout),
        maxAnalysisDepth: config.get('maxAnalysisDepth', DEFAULT_PERFORMANCE_CONFIG.maxAnalysisDepth),
        enableAsyncProcessing: config.get('enableAsyncProcessing', DEFAULT_PERFORMANCE_CONFIG.enableAsyncProcessing),
        largeFileThreshold: config.get('largeFileThreshold', DEFAULT_PERFORMANCE_CONFIG.largeFileThreshold)
      };

      this.logger.debug('Performance configuration loaded', this.config);
    } catch (error) {
      this.errorHandler.handleExtensionError(
        error instanceof Error ? error : new Error('Unknown error loading performance configuration'),
        'Loading performance configuration'
      );
      // Use default configuration on error
      this.config = { ...DEFAULT_PERFORMANCE_CONFIG };
    }
  }

  /**
   * Debounce a function call with a unique key
   */
  public debounce<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay?: number
  ): (...args: Parameters<T>) => void {
    const debounceDelay = delay ?? this.config.debounceDelay;
    
    return (...args: Parameters<T>) => {
      // Clear existing timer for this key
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(() => {
        this.debounceTimers.delete(key);
        try {
          fn(...args);
        } catch (error) {
          this.errorHandler.handleExtensionError(
            error instanceof Error ? error : new Error('Unknown error in debounced function'),
            `Executing debounced function for key: ${key}`
          );
        }
      }, debounceDelay);

      this.debounceTimers.set(key, timer);
    };
  }

  /**
   * Check if a file should be processed based on size limits
   */
  public shouldProcessFile(document: vscode.TextDocument): boolean {
    const fileSize = Buffer.byteLength(document.getText(), 'utf8');
    
    if (fileSize > this.config.maxFileSize) {
      this.logger.warn(`File ${document.uri.fsPath} exceeds maximum size limit (${fileSize} > ${this.config.maxFileSize})`);
      return false;
    }

    return true;
  }

  /**
   * Check if a file is considered large and should use async processing
   */
  public isLargeFile(document: vscode.TextDocument): boolean {
    const fileSize = Buffer.byteLength(document.getText(), 'utf8');
    return fileSize > this.config.largeFileThreshold;
  }

  /**
   * Memoize a function with LRU cache
   */
  public memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator: (...args: Parameters<T>) => string
  ): T {
    return ((...args: Parameters<T>) => {
      const key = keyGenerator(...args);
      const cached = this.parseCache.get(key);
      
      if (cached) {
        // Update access count and timestamp
        cached.accessCount++;
        cached.timestamp = Date.now();
        this.logger.debug(`Cache hit for key: ${key}`);
        return cached.value;
      }

      // Execute function and cache result
      try {
        const result = fn(...args);
        this.setCacheEntry(key, result);
        this.logger.debug(`Cache miss for key: ${key}, result cached`);
        return result;
      } catch (error) {
        this.errorHandler.handleExtensionError(
          error instanceof Error ? error : new Error('Unknown error in memoized function'),
          `Executing memoized function for key: ${key}`
        );
        throw error;
      }
    }) as T;
  }

  /**
   * Set a cache entry with LRU eviction
   */
  private setCacheEntry<T>(key: string, value: T): void {
    // Check if cache is full
    if (this.parseCache.size >= this.config.maxCacheSize) {
      this.evictLeastRecentlyUsed();
    }

    this.parseCache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1
    });
  }

  /**
   * Evict least recently used cache entries
   */
  private evictLeastRecentlyUsed(): void {
    // Sort by access count and timestamp (LRU)
    const entries = Array.from(this.parseCache.entries())
      .sort(([, a], [, b]) => {
        // First sort by access count, then by timestamp
        if (a.accessCount !== b.accessCount) {
          return a.accessCount - b.accessCount;
        }
        return a.timestamp - b.timestamp;
      });

    // Remove oldest 25% of entries
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      const [key] = entries[i];
      this.parseCache.delete(key);
    }

    this.logger.debug(`Evicted ${toRemove} cache entries`);
  }

  /**
   * Clear cache for a specific pattern or all cache
   */
  public clearCache(pattern?: string): void {
    if (pattern) {
      const keysToDelete = Array.from(this.parseCache.keys())
        .filter(key => key.includes(pattern));
      
      keysToDelete.forEach(key => this.parseCache.delete(key));
      this.logger.debug(`Cleared ${keysToDelete.length} cache entries matching pattern: ${pattern}`);
    } else {
      this.parseCache.clear();
      this.logger.debug('Cleared all cache entries');
    }
  }

  /**
   * Execute a function with timeout
   */
  public async withTimeout<T>(
    fn: () => Promise<T> | T,
    timeout?: number
  ): Promise<T> {
    const timeoutMs = timeout ?? this.config.parseTimeout;
    
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      Promise.resolve(fn())
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Track memory usage for a specific operation
   */
  public trackMemoryUsage(operationId: string, sizeBytes: number): void {
    this.memoryUsageTracker.set(operationId, sizeBytes);
    
    // Log warning if memory usage is high
    const totalMemory = Array.from(this.memoryUsageTracker.values())
      .reduce((sum, size) => sum + size, 0);
    
    if (totalMemory > 50 * 1024 * 1024) { // 50MB threshold
      this.logger.warn(`High memory usage detected: ${totalMemory / 1024 / 1024}MB`);
    }
  }

  /**
   * Release memory tracking for an operation
   */
  public releaseMemoryTracking(operationId: string): void {
    this.memoryUsageTracker.delete(operationId);
  }

  /**
   * Get current performance statistics
   */
  public getPerformanceStats(): {
    cacheSize: number;
    cacheHitRate: number;
    memoryUsage: number;
    activeDebouncers: number;
  } {
    const totalAccesses = Array.from(this.parseCache.values())
      .reduce((sum, entry) => sum + entry.accessCount, 0);
    
    const cacheHits = Array.from(this.parseCache.values())
      .reduce((sum, entry) => sum + (entry.accessCount - 1), 0);
    
    const totalMemory = Array.from(this.memoryUsageTracker.values())
      .reduce((sum, size) => sum + size, 0);

    return {
      cacheSize: this.parseCache.size,
      cacheHitRate: totalAccesses > 0 ? cacheHits / totalAccesses : 0,
      memoryUsage: totalMemory,
      activeDebouncers: this.debounceTimers.size
    };
  }

  /**
   * Set up periodic cache cleanup
   */
  private setupCacheCleanup(): void {
    // Clean up cache every 5 minutes
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    let removedCount = 0;
    for (const [key, entry] of this.parseCache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.parseCache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.debug(`Cleaned up ${removedCount} expired cache entries`);
    }
  }

  /**
   * Dispose of the performance optimizer
   */
  public dispose(): void {
    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Clear cache
    this.parseCache.clear();
    
    // Clear memory tracking
    this.memoryUsageTracker.clear();
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfiguration(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.debug('Performance configuration updated', this.config);
  }
}