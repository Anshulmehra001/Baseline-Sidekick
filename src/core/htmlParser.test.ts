import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HtmlParser } from './htmlParser';

describe('HtmlParser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseHtml', () => {
    it('should parse HTML and return features', () => {
      const html = '<dialog><p>Hello World</p></dialog>';
      const result = HtmlParser.parseHtml(html);

      expect(result).toHaveProperty('features');
      expect(result).toHaveProperty('locations');
      expect(Array.isArray(result.features)).toBe(true);
      expect(result.locations instanceof Map).toBe(true);
    });

    it('should handle empty HTML', () => {
      const result = HtmlParser.parseHtml('');
      expect(result.features).toEqual([]);
      expect(result.locations.size).toBe(0);
    });

    it('should handle invalid HTML gracefully', () => {
      const result = HtmlParser.parseHtml('<invalid html');
      expect(result.features).toEqual([]);
      expect(result.locations.size).toBe(0);
    });

    it('should return empty result for null content', () => {
      const result = HtmlParser.parseHtml(null as any);
      expect(result.features).toEqual([]);
      expect(result.locations.size).toBe(0);
    });
  });

  describe('mapElementToFeatureId', () => {
    it('should map known HTML elements to feature IDs', () => {
      expect(HtmlParser['mapElementToFeatureId']('dialog')).toBe('html.elements.dialog');
      expect(HtmlParser['mapElementToFeatureId']('details')).toBe('html.elements.details');
    });

    it('should return null for unknown elements', () => {
      expect(HtmlParser['mapElementToFeatureId']('unknown-element')).toBeNull();
    });
  });
});