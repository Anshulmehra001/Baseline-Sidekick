import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JsParser } from './jsParser';

describe('JsParser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseJavaScript', () => {
    it('should parse JavaScript and return features', () => {
      const js = 'navigator.clipboard.writeText("test");';
      const result = JsParser.parseJavaScript(js);

      expect(result).toHaveProperty('features');
      expect(result).toHaveProperty('locations');
      expect(Array.isArray(result.features)).toBe(true);
      expect(result.locations instanceof Map).toBe(true);
    });

    it('should handle empty JavaScript', () => {
      const result = JsParser.parseJavaScript('');
      expect(result.features).toEqual([]);
      expect(result.locations.size).toBe(0);
    });

    it('should handle invalid JavaScript gracefully', () => {
      const result = JsParser.parseJavaScript('invalid js syntax {');
      expect(result.features).toEqual([]);
      expect(result.locations.size).toBe(0);
    });

    it('should return empty result for null content', () => {
      const result = JsParser.parseJavaScript(null as any);
      expect(result.features).toEqual([]);
      expect(result.locations.size).toBe(0);
    });
  });

  describe('mapApiToFeatureId', () => {
    it('should map known APIs to feature IDs', () => {
      expect(JsParser['mapApiToFeatureId']('navigator.clipboard')).toBe('api.Clipboard');
      expect(JsParser['mapApiToFeatureId']('fetch')).toBe('api.fetch');
    });

    it('should return null for unknown APIs', () => {
      expect(JsParser['mapApiToFeatureId']('unknown.api')).toBeNull();
    });
  });
});