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
exports.BaselineDataManager = void 0;
const webFeatures = __importStar(require("web-features"));
const errorHandler_1 = require("./errorHandler");
/**
 * Singleton class for managing baseline compatibility data with caching
 * Provides centralized access to web-features dataset with performance optimization
 */
class BaselineDataManager {
    /**
     * Private constructor to enforce singleton pattern
     */
    constructor() {
        this.featuresData = null;
        this.isLoaded = false;
        this.loadingPromise = null;
        this.featureCache = new Map();
        this.baselineCache = new Map();
        this.errorHandler = errorHandler_1.ErrorHandler.getInstance();
    }
    /**
     * Get the singleton instance of BaselineDataManager
     * @returns The singleton instance
     */
    static getInstance() {
        if (!BaselineDataManager.instance) {
            BaselineDataManager.instance = new BaselineDataManager();
        }
        return BaselineDataManager.instance;
    }
    /**
     * Initialize the data manager by loading web-features data
     * @returns Promise that resolves when data is loaded
     */
    async initialize() {
        if (this.isLoaded) {
            return;
        }
        if (this.loadingPromise) {
            return this.loadingPromise;
        }
        this.loadingPromise = this.loadWebFeaturesData();
        return this.loadingPromise;
    }
    /**
     * Load the web-features dataset
     * @private
     */
    async loadWebFeaturesData() {
        try {
            // Load the web-features data - the features are in the 'features' property
            this.featuresData = webFeatures.features;
            this.isLoaded = true;
            // Log success using Logger
            try {
                const { Logger } = await Promise.resolve().then(() => __importStar(require('./errorHandler')));
                Logger.getInstance().info('Web-features data loaded successfully');
            }
            catch {
                // Ignore logging failure in test environments
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error : new Error('Unknown error loading web-features data');
            this.errorHandler.handleDataLoadError(errorMessage, 'Loading web-features dataset');
            throw errorMessage;
        }
    }
    /**
     * Get feature data by feature ID
     * @param featureId The web-features ID to lookup
     * @returns Feature data or undefined if not found
     */
    getFeatureData(featureId) {
        try {
            // Check cache first
            if (this.featureCache.has(featureId)) {
                return this.featureCache.get(featureId);
            }
            if (!this.isLoaded || !this.featuresData) {
                this.errorHandler.handleValidationError('BaselineDataManager not initialized. Call initialize() first.', 'Getting feature data');
                return undefined;
            }
            // Validate feature ID
            if (!featureId || typeof featureId !== 'string') {
                this.errorHandler.handleValidationError(`Invalid feature ID: ${featureId}`, 'Feature ID validation');
                return undefined;
            }
            // Check if the feature exists in the data
            let result;
            if (featureId in this.featuresData) {
                result = this.featuresData[featureId];
            }
            else {
                result = undefined;
            }
            // Cache the result
            this.featureCache.set(featureId, result);
            return result;
        }
        catch (error) {
            this.errorHandler.handleUnknownError(error instanceof Error ? error : new Error('Unknown error in getFeatureData'), 'Getting feature data');
            return undefined;
        }
    }
    /**
     * Check if a feature is supported by Baseline
     * @param featureId The web-features ID to check
     * @returns true if the feature is Baseline supported, false otherwise
     */
    isBaselineSupported(featureId) {
        try {
            // Check cache first
            if (this.baselineCache.has(featureId)) {
                return this.baselineCache.get(featureId);
            }
            const featureData = this.getFeatureData(featureId);
            let result;
            if (!featureData) {
                // If feature doesn't exist in web-features data, assume it's baseline
                // This prevents false positives on universal properties like 'display', 'padding'
                console.log(`[Baseline Sidekick] Feature not found in database, assuming baseline: ${featureId}`);
                result = true;
            }
            else {
                // A feature is Baseline supported if status.baseline is true, 'high', or 'low'
                const baseline = featureData.status.baseline;
                result = baseline === true || baseline === 'high' || baseline === 'low';
                // Debug logging for development
                if (!result) {
                    console.log(`[Baseline Sidekick] Non-baseline feature detected: ${featureId}, status:`, featureData.status);
                }
            }
            // Cache the result
            this.baselineCache.set(featureId, result);
            return result;
        }
        catch (error) {
            this.errorHandler.handleUnknownError(error instanceof Error ? error : new Error('Unknown error in isBaselineSupported'), 'Checking baseline support');
            return true; // Default to baseline on error to prevent false positives
        }
    }
    /**
     * Construct MDN documentation URL from feature data
     * @param featureData The feature data object
     * @returns MDN URL string or empty string if not available
     */
    getMdnUrl(featureData) {
        return featureData.mdn_url || '';
    }
    /**
     * Check if the data manager is initialized and ready to use
     * @returns true if initialized, false otherwise
     */
    isInitialized() {
        return this.isLoaded;
    }
    /**
     * Get all available feature IDs
     * @returns Array of feature IDs
     */
    getAllFeatureIds() {
        try {
            if (!this.isLoaded || !this.featuresData) {
                this.errorHandler.handleValidationError('BaselineDataManager not initialized. Call initialize() first.', 'Getting all feature IDs');
                return [];
            }
            return Object.keys(this.featuresData);
        }
        catch (error) {
            this.errorHandler.handleUnknownError(error instanceof Error ? error : new Error('Unknown error in getAllFeatureIds'), 'Getting all feature IDs');
            return [];
        }
    }
}
exports.BaselineDataManager = BaselineDataManager;
//# sourceMappingURL=baselineData.js.map