"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceOptimizer = exports.DEFAULT_PERFORMANCE_CONFIG = void 0;
const vscode = __importStar(require("vscode"));
const errorHandler_1 = require("./errorHandler");
/**
 * Default performance configuration
 */
exports.DEFAULT_PERFORMANCE_CONFIG = {
    debounceDelay: 300,
    maxFileSize: 5 * 1024 * 1024,
    maxCacheSize: 10000,
    parseTimeout: 5000,
    maxAnalysisDepth: 50,
    enableAsyncProcessing: true,
    largeFileThreshold: 100 * 1024 // 100KB
};
/**
 * Performance optimizer class that provides debouncing, caching, and memory management
 */
class PerformanceOptimizer {
    constructor() {
        this.debounceTimers = new Map();
        this.parseCache = new Map();
        this.memoryUsageTracker = new Map();
        this.config = { ...exports.DEFAULT_PERFORMANCE_CONFIG };
        this.errorHandler = errorHandler_1.ErrorHandler.getInstance();
        this.logger = errorHandler_1.Logger.getInstance();
        // Load configuration from VS Code settings
        this.loadConfiguration();
        // Set up periodic cache cleanup
        this.setupCacheCleanup();
    }
    /**
     * Get the singleton instance
     */
    static getInstance() {
        if (!PerformanceOptimizer.instance) {
            PerformanceOptimizer.instance = new PerformanceOptimizer();
        }
        return PerformanceOptimizer.instance;
    }
    /**
     * Load configuration from VS Code settings
     */
    loadConfiguration() {
        try {
            const config = vscode.workspace.getConfiguration('baselineSidekick.performance');
            this.config = {
                debounceDelay: config.get('debounceDelay', exports.DEFAULT_PERFORMANCE_CONFIG.debounceDelay),
                maxFileSize: config.get('maxFileSize', exports.DEFAULT_PERFORMANCE_CONFIG.maxFileSize),
                maxCacheSize: config.get('maxCacheSize', exports.DEFAULT_PERFORMANCE_CONFIG.maxCacheSize),
                parseTimeout: config.get('parseTimeout', exports.DEFAULT_PERFORMANCE_CONFIG.parseTimeout),
                maxAnalysisDepth: config.get('maxAnalysisDepth', exports.DEFAULT_PERFORMANCE_CONFIG.maxAnalysisDepth),
                enableAsyncProcessing: config.get('enableAsyncProcessing', exports.DEFAULT_PERFORMANCE_CONFIG.enableAsyncProcessing),
                largeFileThreshold: config.get('largeFileThreshold', exports.DEFAULT_PERFORMANCE_CONFIG.largeFileThreshold)
            };
            this.logger.debug('Performance configuration loaded', this.config);
        }
        catch (error) {
            this.errorHandler.handleExtensionError(error instanceof Error ? error : new Error('Unknown error loading performance configuration'), 'Loading performance configuration');
            // Use default configuration on error
            this.config = { ...exports.DEFAULT_PERFORMANCE_CONFIG };
        }
    }
    /**
     * Debounce a function call with a unique key
     */
    debounce(key, fn, delay) {
        const debounceDelay = delay ?? this.config.debounceDelay;
        return (...args) => {
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
                }
                catch (error) {
                    this.errorHandler.handleExtensionError(error instanceof Error ? error : new Error('Unknown error in debounced function'), `Executing debounced function for key: ${key}`);
                }
            }, debounceDelay);
            this.debounceTimers.set(key, timer);
        };
    }
    /**
     * Check if a file should be processed based on size limits
     */
    shouldProcessFile(document) {
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
    isLargeFile(document) {
        const fileSize = Buffer.byteLength(document.getText(), 'utf8');
        return fileSize > this.config.largeFileThreshold;
    }
    /**
     * Memoize a function with LRU cache
     */
    memoize(fn, keyGenerator) {
        return ((...args) => {
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
            }
            catch (error) {
                this.errorHandler.handleExtensionError(error instanceof Error ? error : new Error('Unknown error in memoized function'), `Executing memoized function for key: ${key}`);
                throw error;
            }
        });
    }
    /**
     * Set a cache entry with LRU eviction
     */
    setCacheEntry(key, value) {
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
    evictLeastRecentlyUsed() {
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
    clearCache(pattern) {
        if (pattern) {
            const keysToDelete = Array.from(this.parseCache.keys())
                .filter(key => key.includes(pattern));
            keysToDelete.forEach(key => this.parseCache.delete(key));
            this.logger.debug(`Cleared ${keysToDelete.length} cache entries matching pattern: ${pattern}`);
        }
        else {
            this.parseCache.clear();
            this.logger.debug('Cleared all cache entries');
        }
    }
    /**
     * Execute a function with timeout
     */
    async withTimeout(fn, timeout) {
        const timeoutMs = timeout ?? this.config.parseTimeout;
        return new Promise((resolve, reject) => {
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
    trackMemoryUsage(operationId, sizeBytes) {
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
    releaseMemoryTracking(operationId) {
        this.memoryUsageTracker.delete(operationId);
    }
    /**
     * Get current performance statistics
     */
    getPerformanceStats() {
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
    setupCacheCleanup() {
        // Clean up cache every 5 minutes
        setInterval(() => {
            this.cleanupExpiredEntries();
        }, 5 * 60 * 1000);
    }
    /**
     * Clean up expired cache entries
     */
    cleanupExpiredEntries() {
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
    dispose() {
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
    getConfiguration() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    updateConfiguration(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.logger.debug('Performance configuration updated', this.config);
    }
}
exports.PerformanceOptimizer = PerformanceOptimizer;
//# sourceMappingURL=performanceOptimizer.js.map