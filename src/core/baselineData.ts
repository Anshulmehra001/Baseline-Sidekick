import * as webFeatures from 'web-features';
import { ErrorHandler } from './errorHandler';

/**
 * Interface representing a web feature from the web-features dataset
 */
export interface Feature {
  name: string;
  status: {
    baseline: boolean | 'high' | 'low' | false;
    baseline_low_date?: string;
    baseline_high_date?: string;
  };
  spec: string;
  mdn_url?: string;
  usage_stats?: object;
}

/**
 * Interface for the web-features dataset structure
 */
export interface WebFeaturesData {
  [featureId: string]: Feature;
}

/**
 * Singleton class for managing baseline compatibility data with caching
 * Provides centralized access to web-features dataset with performance optimization
 */
export class BaselineDataManager {
  private static instance: BaselineDataManager;
  private featuresData: WebFeaturesData | null = null;
  private isLoaded = false;
  private loadingPromise: Promise<void> | null = null;
  private errorHandler: ErrorHandler;
  private featureCache = new Map<string, Feature | undefined>();
  private baselineCache = new Map<string, boolean>();

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  /**
   * Get the singleton instance of BaselineDataManager
   * @returns The singleton instance
   */
  public static getInstance(): BaselineDataManager {
    if (!BaselineDataManager.instance) {
      BaselineDataManager.instance = new BaselineDataManager();
    }
    return BaselineDataManager.instance;
  }

  /**
   * Initialize the data manager by loading web-features data
   * @returns Promise that resolves when data is loaded
   */
  public async initialize(): Promise<void> {
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
  private async loadWebFeaturesData(): Promise<void> {
    try {
      // Load the web-features data - the features are in the 'features' property
      this.featuresData = (webFeatures as any).features as WebFeaturesData;
      this.isLoaded = true;
      // Log success using Logger instead of ErrorHandler
      const logger = require('./errorHandler').Logger.getInstance();
      logger.info('Web-features data loaded successfully');
    } catch (error) {
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
  public getFeatureData(featureId: string): Feature | undefined {
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
      let result: Feature | undefined;
      if (featureId in this.featuresData) {
        result = this.featuresData[featureId];
      } else {
        result = undefined;
      }

      // Cache the result
      this.featureCache.set(featureId, result);
      
      return result;
    } catch (error) {
      this.errorHandler.handleUnknownError(error instanceof Error ? error : new Error('Unknown error in getFeatureData'), 'Getting feature data');
      return undefined;
    }
  }

  /**
   * Check if a feature is supported by Baseline
   * @param featureId The web-features ID to check
   * @returns true if the feature is Baseline supported, false otherwise
   */
  public isBaselineSupported(featureId: string): boolean {
    try {
      // Check cache first
      if (this.baselineCache.has(featureId)) {
        return this.baselineCache.get(featureId)!;
      }

      const featureData = this.getFeatureData(featureId);
      
      let result: boolean;
      if (!featureData) {
        result = false;
      } else {
        // A feature is Baseline supported if status.baseline is true, 'high', or 'low'
        const baseline = featureData.status.baseline;
        result = baseline === true || baseline === 'high' || baseline === 'low';
      }

      // Cache the result
      this.baselineCache.set(featureId, result);
      
      return result;
    } catch (error) {
      this.errorHandler.handleUnknownError(error instanceof Error ? error : new Error('Unknown error in isBaselineSupported'), 'Checking baseline support');
      return false;
    }
  }

  /**
   * Construct MDN documentation URL from feature data
   * @param featureData The feature data object
   * @returns MDN URL string or empty string if not available
   */
  public getMdnUrl(featureData: Feature): string {
    return featureData.mdn_url || '';
  }

  /**
   * Check if the data manager is initialized and ready to use
   * @returns true if initialized, false otherwise
   */
  public isInitialized(): boolean {
    return this.isLoaded;
  }

  /**
   * Get all available feature IDs
   * @returns Array of feature IDs
   */
  public getAllFeatureIds(): string[] {
    try {
      if (!this.isLoaded || !this.featuresData) {
        this.errorHandler.handleValidationError('BaselineDataManager not initialized. Call initialize() first.', 'Getting all feature IDs');
        return [];
      }

      return Object.keys(this.featuresData);
    } catch (error) {
      this.errorHandler.handleUnknownError(error instanceof Error ? error : new Error('Unknown error in getAllFeatureIds'), 'Getting all feature IDs');
      return [];
    }
  }
}