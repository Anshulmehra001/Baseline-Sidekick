import { describe, it, expect } from 'vitest';
import { CssParser } from './cssParser';

describe('CssParser', () => {
  describe('parseCss', () => {
    it('should extract basic CSS properties', () => {
      const css = `
        .container {
          display: flex;
          gap: 1rem;
          grid-template-columns: 1fr 1fr;
        }
      `;
      
      const result = CssParser.parseCss(css);
      
      expect(result.features).toContain('css.properties.display');
      expect(result.features).toContain('css.properties.gap');
      expect(result.features).toContain('css.properties.grid-template-columns');
    });

    it('should handle vendor prefixes correctly', () => {
      const css = `
        .element {
          -webkit-transform: rotate(45deg);
          -moz-user-select: none;
          -ms-filter: blur(5px);
          -o-transition: all 0.3s;
        }
      `;
      
      const result = CssParser.parseCss(css);
      
      expect(result.features).toContain('css.properties.transform');
      expect(result.features).toContain('css.properties.user-select');
      expect(result.features).toContain('css.properties.filter');
      expect(result.features).toContain('css.properties.transition');
    });

    it('should extract at-rules', () => {
      const css = `
        @supports (display: grid) {
          .grid { display: grid; }
        }
        
        @container (min-width: 300px) {
          .card { padding: 2rem; }
        }
        
        @layer base, components, utilities;
      `;
      
      const result = CssParser.parseCss(css);
      
      expect(result.features).toContain('css.at-rules.supports');
      expect(result.features).toContain('css.at-rules.container');
      expect(result.features).toContain('css.at-rules.layer');
    });

    it('should handle nested rules', () => {
      const css = `
        .parent {
          color: blue;
          
          .child {
            margin: 1rem;
            
            &:hover {
              opacity: 0.8;
            }
          }
        }
      `;
      
      const result = CssParser.parseCss(css);
      
      expect(result.features).toContain('css.properties.color');
      expect(result.features).toContain('css.properties.margin');
      expect(result.features).toContain('css.properties.opacity');
    });

    it('should handle complex selectors and pseudo-elements', () => {
      const css = `
        .element::before {
          content: "";
          backdrop-filter: blur(10px);
        }
        
        .item:has(.selected) {
          border: 1px solid blue;
        }
        
        .container:where(.active, .focused) {
          outline: 2px solid red;
        }
      `;
      
      const result = CssParser.parseCss(css);
      
      expect(result.features).toContain('css.properties.content');
      expect(result.features).toContain('css.properties.backdrop-filter');
      expect(result.features).toContain('css.properties.border');
      expect(result.features).toContain('css.properties.outline');
    });

    it('should handle CSS custom properties', () => {
      const css = `
        :root {
          --primary-color: #007acc;
          --spacing: 1rem;
        }
        
        .element {
          color: var(--primary-color);
          margin: var(--spacing);
        }
      `;
      
      const result = CssParser.parseCss(css);
      
      expect(result.features).toContain('css.properties.--primary-color');
      expect(result.features).toContain('css.properties.--spacing');
      expect(result.features).toContain('css.properties.color');
      expect(result.features).toContain('css.properties.margin');
    });

    it('should handle media queries', () => {
      const css = `
        @media (min-width: 768px) {
          .responsive {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        @media (prefers-color-scheme: dark) {
          body {
            background-color: #1a1a1a;
          }
        }
      `;
      
      const result = CssParser.parseCss(css);
      
      expect(result.features).toContain('css.at-rules.media');
      expect(result.features).toContain('css.properties.display');
      expect(result.features).toContain('css.properties.grid-template-columns');
      expect(result.features).toContain('css.properties.background-color');
    });

    it('should handle keyframes', () => {
      const css = `
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animated {
          animation: slideIn 0.3s ease-in-out;
        }
      `;
      
      const result = CssParser.parseCss(css);
      
      expect(result.features).toContain('css.at-rules.keyframes');
      expect(result.features).toContain('css.properties.transform');
      expect(result.features).toContain('css.properties.opacity');
      expect(result.features).toContain('css.properties.animation');
    });

    it('should not duplicate features', () => {
      const css = `
        .element1 {
          display: flex;
          gap: 1rem;
        }
        
        .element2 {
          display: grid;
          gap: 2rem;
        }
      `;
      
      const result = CssParser.parseCss(css);
      
      const displayCount = result.features.filter(f => f === 'css.properties.display').length;
      const gapCount = result.features.filter(f => f === 'css.properties.gap').length;
      
      expect(displayCount).toBe(1);
      expect(gapCount).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle malformed CSS gracefully', () => {
      const malformedCss = `
        .broken {
          color: blue
          margin 1rem;
          display flex;
        }
        
        .incomplete {
          background-color: #ff
      `;
      
      const result = CssParser.parseCss(malformedCss);
      
      // Should return empty result without throwing
      expect(result.features).toEqual([]);
      expect(result.locations.size).toBe(0);
    });

    it('should handle completely invalid CSS', () => {
      const invalidCss = `
        this is not css at all
        { broken syntax }
        random text
      `;
      
      const result = CssParser.parseCss(invalidCss);
      
      expect(result.features).toEqual([]);
      expect(result.locations.size).toBe(0);
    });

    it('should handle empty CSS', () => {
      const result = CssParser.parseCss('');
      
      expect(result.features).toEqual([]);
      expect(result.locations.size).toBe(0);
    });

    it('should handle CSS with only comments', () => {
      const css = `
        /* This is a comment */
        /*
         * Multi-line comment
         */
      `;
      
      const result = CssParser.parseCss(css);
      
      expect(result.features).toEqual([]);
      expect(result.locations.size).toBe(0);
    });
  });

  describe('extractFeatures', () => {
    it('should return only feature IDs', () => {
      const css = `
        .element {
          display: flex;
          gap: 1rem;
        }
      `;
      
      const features = CssParser.extractFeatures(css);
      
      expect(features).toContain('css.properties.display');
      expect(features).toContain('css.properties.gap');
      expect(Array.isArray(features)).toBe(true);
    });
  });

  describe('feature ID mapping', () => {
    it('should map properties to correct web-features format', () => {
      const css = `
        .test {
          backdrop-filter: blur(5px);
          container-type: inline-size;
          scroll-snap-type: x mandatory;
        }
      `;
      
      const result = CssParser.parseCss(css);
      
      expect(result.features).toContain('css.properties.backdrop-filter');
      expect(result.features).toContain('css.properties.container-type');
      expect(result.features).toContain('css.properties.scroll-snap-type');
    });

    it('should map at-rules to correct web-features format', () => {
      const css = `
        @import url('styles.css');
        @namespace url(http://www.w3.org/1999/xhtml);
        @supports (display: grid) {
          .grid { display: grid; }
        }
      `;
      
      const result = CssParser.parseCss(css);
      
      expect(result.features).toContain('css.at-rules.import');
      expect(result.features).toContain('css.at-rules.namespace');
      expect(result.features).toContain('css.at-rules.supports');
    });
  });

  describe('complex CSS scenarios', () => {
    it('should handle CSS Grid properties', () => {
      const css = `
        .grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          grid-template-rows: auto 1fr auto;
          grid-gap: 1rem;
          grid-template-areas: 
            "header header"
            "sidebar main"
            "footer footer";
        }
        
        .grid-item {
          grid-area: main;
          justify-self: center;
          align-self: start;
        }
      `;
      
      const result = CssParser.parseCss(css);
      
      expect(result.features).toContain('css.properties.display');
      expect(result.features).toContain('css.properties.grid-template-columns');
      expect(result.features).toContain('css.properties.grid-template-rows');
      expect(result.features).toContain('css.properties.grid-gap');
      expect(result.features).toContain('css.properties.grid-template-areas');
      expect(result.features).toContain('css.properties.grid-area');
      expect(result.features).toContain('css.properties.justify-self');
      expect(result.features).toContain('css.properties.align-self');
    });

    it('should handle Flexbox properties', () => {
      const css = `
        .flex-container {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .flex-item {
          flex: 1 1 auto;
          align-self: stretch;
          order: 2;
        }
      `;
      
      const result = CssParser.parseCss(css);
      
      expect(result.features).toContain('css.properties.display');
      expect(result.features).toContain('css.properties.flex-direction');
      expect(result.features).toContain('css.properties.justify-content');
      expect(result.features).toContain('css.properties.align-items');
      expect(result.features).toContain('css.properties.flex-wrap');
      expect(result.features).toContain('css.properties.gap');
      expect(result.features).toContain('css.properties.flex');
      expect(result.features).toContain('css.properties.align-self');
      expect(result.features).toContain('css.properties.order');
    });

    it('should handle modern CSS features', () => {
      const css = `
        .modern {
          aspect-ratio: 16/9;
          container-type: inline-size;
          scroll-snap-type: x mandatory;
          overscroll-behavior: contain;
          backdrop-filter: blur(10px);
          mask-image: linear-gradient(to bottom, black, transparent);
        }
        
        @container (min-width: 400px) {
          .responsive {
            font-size: clamp(1rem, 2.5vw, 2rem);
          }
        }
      `;
      
      const result = CssParser.parseCss(css);
      
      expect(result.features).toContain('css.properties.aspect-ratio');
      expect(result.features).toContain('css.properties.container-type');
      expect(result.features).toContain('css.properties.scroll-snap-type');
      expect(result.features).toContain('css.properties.overscroll-behavior');
      expect(result.features).toContain('css.properties.backdrop-filter');
      expect(result.features).toContain('css.properties.mask-image');
      expect(result.features).toContain('css.at-rules.container');
      expect(result.features).toContain('css.properties.font-size');
    });
  });
});