import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CssParser } from './cssParser';

describe('CssParser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseCss', () => {
    it('should parse CSS and return features', () => {
      const css = 'body { gap: 10px; color: red; }';
      const result = CssParser.parseCss(css);

      expect(result).toHaveProperty('features');
      expect(result).toHaveProperty('locations');
      expect(Array.isArray(result.features)).toBe(true);
      expect(result.locations instanceof Map).toBe(true);
    });

    it('should handle empty CSS', () => {
      const result = CssParser.parseCss('');
      expect(result.features).toEqual([]);
      expect(result.locations.size).toBe(0);
    });

    it('should handle invalid CSS gracefully', () => {
      const result = CssParser.parseCss('invalid css {');
      expect(result.features).toEqual([]);
      expect(result.locations.size).toBe(0);
    });

    it('should return empty result for null content', () => {
      const result = CssParser.parseCss(null as any);
      expect(result.features).toEqual([]);
      expect(result.locations.size).toBe(0);
    });
  });

  describe('mapCssPropertyToFeatureId', () => {
    it('should map known CSS properties to feature IDs', () => {
      expect(CssParser['mapCssPropertyToFeatureId']('gap')).toBe('css.properties.gap');
      expect(CssParser['mapCssPropertyToFeatureId']('grid')).toBe('css.properties.grid');
    });

    it('should return null for unknown properties', () => {
      expect(CssParser['mapCssPropertyToFeatureId']('unknown-property')).toBeNull();
    });
  });
});