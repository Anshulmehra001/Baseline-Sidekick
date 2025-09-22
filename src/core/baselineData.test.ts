import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaselineDataManager, Feature, WebFeaturesData } from './baselineData';

// Mock web-features module
vi.mock('web-features', () => ({
  features: {
    'css.properties.gap': {
      name: 'CSS gap property',
      status: {
        baseline: true,
        baseline_low_date: '2021-09-14',
        baseline_high_date: '2023-03-14'
      },
      spec: 'https://drafts.csswg.org/css-align-3/#gap-shorthand',
      mdn_url: 'https://developer.mozilla.org/docs/Web/CSS/gap'
    },
    'api.Clipboard': {
      name: 'Clipboard API',
      status: {
        baseline: false
      },
      spec: 'https://w3c.github.io/clipboard-apis/',
      mdn_url: 'https://developer.mozilla.org/docs/Web/API/Clipboard'
    },
    'css.properties.container-type': {
      name: 'CSS container-type property',
      status: {
        baseline: 'low',
        baseline_low_date: '2023-02-14'
      },
      spec: 'https://drafts.csswg.org/css-contain-3/#container-type',
      mdn_url: 'https://developer.mozilla.org/docs/Web/CSS/container-type'
    },
    'html.elements.dialog': {
      name: 'HTML dialog element',
      status: {
        baseline: 'high',
        baseline_low_date: '2022-03-14',
        baseline_high_date: '2024-09-14'
      },
      spec: 'https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element',
      mdn_url: 'https://developer.mozilla.org/docs/Web/HTML/Element/dialog'
    },
    'feature.without.mdn': {
      name: 'Feature without MDN URL',
      status: {
        baseline: true
      },
      spec: 'https://example.com/spec'
    }
  }
}));

describe('BaselineDataManager', () => {
  let manager: BaselineDataManager;

  beforeEach(async () => {
    // Reset singleton instance for each test
    (BaselineDataManager as any).instance = undefined;
    manager = BaselineDataManager.getInstance();
    await manager.initialize();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = BaselineDataManager.getInstance();
      const instance2 = BaselineDataManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const newManager = BaselineDataManager.getInstance();
      await newManager.initialize();
      
      expect(newManager.isInitialized()).toBe(true);
    });

    it('should handle multiple initialization calls gracefully', async () => {
      await manager.initialize();
      await manager.initialize(); // Should not throw or cause issues
      
      expect(manager.isInitialized()).toBe(true);
    });

    it('should throw error when accessing data before initialization', () => {
      const uninitializedManager = BaselineDataManager.getInstance();
      (uninitializedManager as any).isLoaded = false;
      
      expect(() => {
        uninitializedManager.getFeatureData('css.properties.gap');
      }).toThrow('BaselineDataManager not initialized. Call initialize() first.');
    });
  });

  describe('getFeatureData', () => {
    it('should return feature data for existing feature', () => {
      const featureData = manager.getFeatureData('css.properties.gap');
      
      expect(featureData).toBeDefined();
      expect(featureData?.name).toBe('CSS gap property');
      expect(featureData?.status.baseline).toBe(true);
      expect(featureData?.mdn_url).toBe('https://developer.mozilla.org/docs/Web/CSS/gap');
    });

    it('should return undefined for non-existing feature', () => {
      const featureData = manager.getFeatureData('non.existing.feature');
      
      expect(featureData).toBeUndefined();
    });

    it('should handle empty string feature ID', () => {
      const featureData = manager.getFeatureData('');
      
      expect(featureData).toBeUndefined();
    });
  });

  describe('isBaselineSupported', () => {
    it('should return true for baseline: true features', () => {
      const isSupported = manager.isBaselineSupported('css.properties.gap');
      
      expect(isSupported).toBe(true);
    });

    it('should return false for baseline: false features', () => {
      const isSupported = manager.isBaselineSupported('api.Clipboard');
      
      expect(isSupported).toBe(false);
    });

    it('should return true for baseline: "low" features', () => {
      const isSupported = manager.isBaselineSupported('css.properties.container-type');
      
      expect(isSupported).toBe(true);
    });

    it('should return true for baseline: "high" features', () => {
      const isSupported = manager.isBaselineSupported('html.elements.dialog');
      
      expect(isSupported).toBe(true);
    });

    it('should return false for non-existing features', () => {
      const isSupported = manager.isBaselineSupported('non.existing.feature');
      
      expect(isSupported).toBe(false);
    });
  });

  describe('getMdnUrl', () => {
    it('should return MDN URL when available', () => {
      const featureData = manager.getFeatureData('css.properties.gap');
      const mdnUrl = manager.getMdnUrl(featureData!);
      
      expect(mdnUrl).toBe('https://developer.mozilla.org/docs/Web/CSS/gap');
    });

    it('should return empty string when MDN URL is not available', () => {
      const featureData = manager.getFeatureData('feature.without.mdn');
      const mdnUrl = manager.getMdnUrl(featureData!);
      
      expect(mdnUrl).toBe('');
    });
  });

  describe('getAllFeatureIds', () => {
    it('should return array of all feature IDs', () => {
      const featureIds = manager.getAllFeatureIds();
      
      expect(Array.isArray(featureIds)).toBe(true);
      expect(featureIds).toContain('css.properties.gap');
      expect(featureIds).toContain('api.Clipboard');
      expect(featureIds).toContain('css.properties.container-type');
      expect(featureIds).toContain('html.elements.dialog');
      expect(featureIds).toContain('feature.without.mdn');
    });

    it('should throw error when not initialized', () => {
      const uninitializedManager = BaselineDataManager.getInstance();
      (uninitializedManager as any).isLoaded = false;
      
      expect(() => {
        uninitializedManager.getAllFeatureIds();
      }).toThrow('BaselineDataManager not initialized. Call initialize() first.');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed feature data gracefully', () => {
      // Test with a feature that might have incomplete data
      const featureData = manager.getFeatureData('feature.without.mdn');
      
      expect(featureData).toBeDefined();
      expect(manager.getMdnUrl(featureData!)).toBe('');
    });
  });

  describe('Performance Requirements', () => {
    it('should return feature data within 10ms (Requirement 6.2)', () => {
      const startTime = performance.now();
      manager.getFeatureData('css.properties.gap');
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(10);
    });

    it('should return baseline support status within 10ms (Requirement 6.2)', () => {
      const startTime = performance.now();
      manager.isBaselineSupported('css.properties.gap');
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(10);
    });
  });
});