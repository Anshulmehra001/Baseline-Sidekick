import { describe, it, expect } from 'vitest';
import { CssParser } from './cssParser';
import { BaselineDataManager } from './baselineData';

describe('CssParser Integration', () => {
  it('should work with BaselineDataManager to identify non-baseline features', async () => {
    // Initialize the baseline data manager
    const dataManager = BaselineDataManager.getInstance();
    await dataManager.initialize();
    
    // CSS with mix of baseline and non-baseline features
    const css = `
      .container {
        display: flex;          /* Baseline supported */
        gap: 1rem;             /* May not be baseline */
        backdrop-filter: blur(5px); /* Likely not baseline */
        container-type: inline-size; /* Definitely not baseline */
      }
    `;
    
    const result = CssParser.parseCss(css);
    
    // Verify we extracted the expected features
    expect(result.features).toContain('css.properties.display');
    expect(result.features).toContain('css.properties.gap');
    expect(result.features).toContain('css.properties.backdrop-filter');
    expect(result.features).toContain('css.properties.container-type');
    
    // Test integration with baseline data (if available)
    for (const featureId of result.features) {
      const featureData = dataManager.getFeatureData(featureId);
      const isBaseline = dataManager.isBaselineSupported(featureId);
      
      // These should not throw errors
      expect(typeof isBaseline).toBe('boolean');
      
      if (featureData) {
        const mdnUrl = dataManager.getMdnUrl(featureData);
        expect(typeof mdnUrl).toBe('string');
      }
    }
  });

  it('should handle CSS with no recognizable features', () => {
    const css = `
      /* Just comments */
      .empty {
        /* No properties */
      }
    `;
    
    const result = CssParser.parseCss(css);
    expect(result.features).toEqual([]);
    expect(result.locations.size).toBe(0);
  });

  it('should extract features from complex real-world CSS', () => {
    const css = `
      @layer reset, base, components, utilities;
      
      @supports (backdrop-filter: blur(1px)) {
        .modal {
          backdrop-filter: blur(10px);
        }
      }
      
      @container sidebar (min-width: 300px) {
        .card {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: clamp(1rem, 2vw, 2rem);
          aspect-ratio: 16/9;
        }
      }
      
      .interactive {
        scroll-snap-type: x mandatory;
        overscroll-behavior: contain;
        touch-action: pan-x;
      }
      
      .modern-layout {
        container-type: inline-size;
        view-transition-name: main-content;
      }
    `;
    
    const result = CssParser.parseCss(css);
    
    // Should extract modern CSS features
    expect(result.features).toContain('css.at-rules.layer');
    expect(result.features).toContain('css.at-rules.supports');
    expect(result.features).toContain('css.at-rules.container');
    expect(result.features).toContain('css.properties.backdrop-filter');
    expect(result.features).toContain('css.properties.display');
    expect(result.features).toContain('css.properties.grid-template-columns');
    expect(result.features).toContain('css.properties.gap');
    expect(result.features).toContain('css.properties.aspect-ratio');
    expect(result.features).toContain('css.properties.scroll-snap-type');
    expect(result.features).toContain('css.properties.overscroll-behavior');
    expect(result.features).toContain('css.properties.touch-action');
    expect(result.features).toContain('css.properties.container-type');
    expect(result.features).toContain('css.properties.view-transition-name');
    
    // Should not have duplicates
    const uniqueFeatures = [...new Set(result.features)];
    expect(result.features.length).toBe(uniqueFeatures.length);
  });
});