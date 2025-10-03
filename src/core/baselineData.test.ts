import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaselineDataManager } from './baselineData';

// Mock web-features
vi.mock('web-features', () => ({
  features: {
    'css.properties.gap': {
      name: 'CSS Gap Property',
      status: { baseline: false }
    },
    'css.properties.color': {
      name: 'CSS Color Property',
      status: { baseline: true }
    }
  }
}));

describe('BaselineDataManager', () => {
  let baselineDataManager: BaselineDataManager;

  beforeEach(() => {
    baselineDataManager = BaselineDataManager.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = BaselineDataManager.getInstance();
      const instance2 = BaselineDataManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await expect(baselineDataManager.initialize()).resolves.not.toThrow();
      expect(baselineDataManager.isInitialized()).toBe(true);
    });
  });

  describe('isBaselineSupported', () => {
    it('should return false for non-baseline features', () => {
      const result = baselineDataManager.isBaselineSupported('css.properties.gap');
      expect(result).toBe(false);
    });

    it('should return true for baseline features', () => {
      const result = baselineDataManager.isBaselineSupported('css.properties.color');
      expect(result).toBe(true);
    });

    it('should return false for unknown features', () => {
      const result = baselineDataManager.isBaselineSupported('unknown.feature');
      expect(result).toBe(false);
    });
  });

  describe('getFeatureData', () => {
    it('should return feature data for known features', () => {
      const data = baselineDataManager.getFeatureData('css.properties.gap');
      expect(data).toEqual({
        name: 'CSS Gap Property',
        status: { baseline: false }
      });
    });

    it('should return undefined for unknown features', () => {
      const data = baselineDataManager.getFeatureData('unknown.feature');
      expect(data).toBeUndefined();
    });
  });
});