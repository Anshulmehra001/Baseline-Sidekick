import { describe, it, expect } from 'vitest';
import { HtmlParser } from './htmlParser';

describe('HtmlParser', () => {
  describe('parseHtml', () => {
    it('should parse basic HTML elements', () => {
      const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Test</title>
  </head>
  <body>
    <div>Content</div>
    <p>Paragraph</p>
  </body>
</html>`;

      const result = HtmlParser.parseHtml(html);
      
      expect(result.features).toContain('html.elements.html');
      expect(result.features).toContain('html.elements.head');
      expect(result.features).toContain('html.elements.title');
      expect(result.features).toContain('html.elements.body');
      expect(result.features).toContain('html.elements.div');
      expect(result.features).toContain('html.elements.p');
    });

    it('should parse modern HTML elements', () => {
      const html = `
        <main>
          <section>
            <article>
              <header>
                <h1>Title</h1>
              </header>
              <aside>Sidebar</aside>
              <footer>Footer</footer>
            </article>
          </section>
          <nav>Navigation</nav>
          <dialog open>Modal</dialog>
          <details>
            <summary>Summary</summary>
            <p>Details content</p>
          </details>
        </main>
      `;

      const result = HtmlParser.parseHtml(html);
      
      expect(result.features).toContain('html.elements.main');
      expect(result.features).toContain('html.elements.section');
      expect(result.features).toContain('html.elements.article');
      expect(result.features).toContain('html.elements.header');
      expect(result.features).toContain('html.elements.aside');
      expect(result.features).toContain('html.elements.footer');
      expect(result.features).toContain('html.elements.nav');
      expect(result.features).toContain('html.elements.dialog');
      expect(result.features).toContain('html.elements.details');
      expect(result.features).toContain('html.elements.summary');
    });

    it('should parse input elements with modern attributes', () => {
      const html = `
        <form novalidate>
          <input type="email" placeholder="Enter email" required autocomplete="email" pattern="[^@]+@[^@]+">
          <input type="number" min="0" max="100" step="5">
          <input type="text" list="suggestions">
          <datalist id="suggestions">
            <option value="Option 1">
            <option value="Option 2">
          </datalist>
        </form>
      `;

      const result = HtmlParser.parseHtml(html);
      
      expect(result.features).toContain('html.elements.form');
      expect(result.features).toContain('html.elements.input');
      expect(result.features).toContain('html.elements.datalist');
      expect(result.features).toContain('html.elements.option');
      
      // Check for modern attributes
      expect(result.features).toContain('html.elements.form.novalidate');
      expect(result.features).toContain('html.elements.input.placeholder');
      expect(result.features).toContain('html.elements.input.required');
      expect(result.features).toContain('html.elements.input.autocomplete');
      expect(result.features).toContain('html.elements.input.pattern');
      expect(result.features).toContain('html.elements.input.min');
      expect(result.features).toContain('html.elements.input.max');
      expect(result.features).toContain('html.elements.input.step');
      expect(result.features).toContain('html.elements.input.list');
    });

    it('should parse media elements with modern attributes', () => {
      const html = `
        <video controls autoplay muted loop playsinline poster="poster.jpg" preload="metadata">
          <source src="video.mp4" type="video/mp4">
          <track kind="subtitles" src="subtitles.vtt" srclang="en">
        </video>
        <audio controls autoplay loop muted preload="auto">
          <source src="audio.mp3" type="audio/mp3">
        </audio>
      `;

      const result = HtmlParser.parseHtml(html);
      
      expect(result.features).toContain('html.elements.video');
      expect(result.features).toContain('html.elements.audio');
      expect(result.features).toContain('html.elements.source');
      expect(result.features).toContain('html.elements.track');
      
      // Check for media attributes
      expect(result.features).toContain('html.elements.video.controls');
      expect(result.features).toContain('html.elements.video.autoplay');
      expect(result.features).toContain('html.elements.video.muted');
      expect(result.features).toContain('html.elements.video.loop');
      expect(result.features).toContain('html.elements.video.playsinline');
      expect(result.features).toContain('html.elements.video.poster');
      expect(result.features).toContain('html.elements.video.preload');
      
      expect(result.features).toContain('html.elements.audio.controls');
      expect(result.features).toContain('html.elements.audio.autoplay');
      expect(result.features).toContain('html.elements.audio.loop');
      expect(result.features).toContain('html.elements.audio.muted');
      expect(result.features).toContain('html.elements.audio.preload');
    });

    it('should parse images with modern attributes', () => {
      const html = `
        <img src="image.jpg" 
             alt="Description" 
             loading="lazy" 
             decoding="async"
             sizes="(max-width: 600px) 100vw, 50vw"
             srcset="image-400.jpg 400w, image-800.jpg 800w">
      `;

      const result = HtmlParser.parseHtml(html);
      
      expect(result.features).toContain('html.elements.img');
      expect(result.features).toContain('html.elements.img.loading');
      expect(result.features).toContain('html.elements.img.decoding');
      expect(result.features).toContain('html.elements.img.sizes');
      expect(result.features).toContain('html.elements.img.srcset');
    });

    it('should parse scripts and links with modern attributes', () => {
      const html = `
        <head>
          <script src="module.js" type="module" async defer crossorigin="anonymous" integrity="sha256-abc" referrerpolicy="no-referrer"></script>
          <script nomodule>
            // Fallback for older browsers
          </script>
          <link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin="anonymous" integrity="sha256-def" referrerpolicy="no-referrer">
          <meta charset="utf-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
        </head>
      `;

      const result = HtmlParser.parseHtml(html);
      
      expect(result.features).toContain('html.elements.script');
      expect(result.features).toContain('html.elements.link');
      expect(result.features).toContain('html.elements.meta');
      
      // Check for modern script attributes
      expect(result.features).toContain('html.elements.script.async');
      expect(result.features).toContain('html.elements.script.defer');
      expect(result.features).toContain('html.elements.script.type');
      expect(result.features).toContain('html.elements.script.nomodule');
      expect(result.features).toContain('html.elements.script.crossorigin');
      expect(result.features).toContain('html.elements.script.integrity');
      expect(result.features).toContain('html.elements.script.referrerpolicy');
      
      // Check for modern link attributes
      expect(result.features).toContain('html.elements.link.crossorigin');
      expect(result.features).toContain('html.elements.link.integrity');
      expect(result.features).toContain('html.elements.link.referrerpolicy');
      expect(result.features).toContain('html.elements.link.as');
      
      // Check for meta attributes
      expect(result.features).toContain('html.elements.meta.charset');
      expect(result.features).toContain('html.elements.meta.http-equiv');
    });

    it('should parse iframe with modern attributes', () => {
      const html = `
        <iframe src="https://example.com" 
                loading="lazy"
                sandbox="allow-scripts allow-same-origin"
                allow="camera; microphone; geolocation"
                referrerpolicy="strict-origin-when-cross-origin">
        </iframe>
      `;

      const result = HtmlParser.parseHtml(html);
      
      expect(result.features).toContain('html.elements.iframe');
      expect(result.features).toContain('html.elements.iframe.loading');
      expect(result.features).toContain('html.elements.iframe.sandbox');
      expect(result.features).toContain('html.elements.iframe.allow');
      expect(result.features).toContain('html.elements.iframe.referrerpolicy');
    });

    it('should parse global attributes', () => {
      const html = `
        <div contenteditable="true" 
             draggable="true" 
             hidden 
             spellcheck="false"
             translate="no"
             autocapitalize="words"
             enterkeyhint="search"
             inputmode="numeric"
             is="custom-element"
             itemscope
             itemtype="https://schema.org/Person"
             itemprop="name"
             nonce="abc123"
             part="button"
             slot="content">
          Content
        </div>
      `;

      const result = HtmlParser.parseHtml(html);
      
      expect(result.features).toContain('html.elements.div');
      expect(result.features).toContain('html.global_attributes.contenteditable');
      expect(result.features).toContain('html.global_attributes.draggable');
      expect(result.features).toContain('html.global_attributes.hidden');
      expect(result.features).toContain('html.global_attributes.spellcheck');
      expect(result.features).toContain('html.global_attributes.translate');
      expect(result.features).toContain('html.global_attributes.autocapitalize');
      expect(result.features).toContain('html.global_attributes.enterkeyhint');
      expect(result.features).toContain('html.global_attributes.inputmode');
      expect(result.features).toContain('html.global_attributes.is');
      expect(result.features).toContain('html.global_attributes.itemscope');
      expect(result.features).toContain('html.global_attributes.itemtype');
      expect(result.features).toContain('html.global_attributes.itemprop');
      expect(result.features).toContain('html.global_attributes.nonce');
      expect(result.features).toContain('html.global_attributes.part');
      expect(result.features).toContain('html.global_attributes.slot');
    });

    it('should not flag common global attributes', () => {
      const html = `
        <div class="container" id="main" style="color: red;" title="Tooltip" lang="en" dir="ltr">
          Content
        </div>
      `;

      const result = HtmlParser.parseHtml(html);
      
      expect(result.features).toContain('html.elements.div');
      // These common attributes should not be flagged
      expect(result.features).not.toContain('html.global_attributes.class');
      expect(result.features).not.toContain('html.global_attributes.id');
      expect(result.features).not.toContain('html.global_attributes.style');
      expect(result.features).not.toContain('html.global_attributes.title');
      expect(result.features).not.toContain('html.global_attributes.lang');
      expect(result.features).not.toContain('html.global_attributes.dir');
    });

    it('should not flag data and aria attributes', () => {
      const html = `
        <div data-value="123" 
             data-custom-attr="test"
             aria-label="Button"
             aria-expanded="false"
             onclick="handleClick()">
          Content
        </div>
      `;

      const result = HtmlParser.parseHtml(html);
      
      expect(result.features).toContain('html.elements.div');
      // Data, aria, and event handler attributes should not be flagged
      expect(result.features.filter(f => f.includes('data-'))).toHaveLength(0);
      expect(result.features.filter(f => f.includes('aria-'))).toHaveLength(0);
      expect(result.features.filter(f => f.includes('onclick'))).toHaveLength(0);
    });

    it('should handle malformed HTML gracefully', () => {
      const malformedHtml = `<div>
  <p>Unclosed paragraph
  <span>Nested span</div>
<img src="image.jpg" alt="Missing closing tag">
<script>
  // Unclosed script
</script>`;

      const result = HtmlParser.parseHtml(malformedHtml);
      
      // Should still extract what it can
      expect(result.features).toContain('html.elements.div');
      expect(result.features).toContain('html.elements.p');
      expect(result.features).toContain('html.elements.span');
      expect(result.features).toContain('html.elements.img');
      expect(result.features).toContain('html.elements.script');
    });

    it('should handle empty HTML', () => {
      const result = HtmlParser.parseHtml('');
      
      // Parse5 auto-generates html, head, body for empty content, but we filter them out
      expect(result.features).toEqual([]);
      expect(result.locations.size).toBe(0);
    });

    it('should handle HTML with only text', () => {
      const result = HtmlParser.parseHtml('Just plain text');
      
      // Parse5 auto-generates html, head, body for text content, but we filter them out
      expect(result.features).toEqual([]);
      expect(result.locations.size).toBe(0);
    });

    it('should handle HTML comments', () => {
      const html = `
        <!-- This is a comment -->
        <div>Content</div>
        <!-- Another comment -->
      `;

      const result = HtmlParser.parseHtml(html);
      
      expect(result.features).toContain('html.elements.div');
      // Comments should not generate features
      expect(result.features.filter(f => f.includes('comment'))).toHaveLength(0);
    });

    it('should not duplicate features', () => {
      const html = `
        <div>First div</div>
        <div>Second div</div>
        <div>Third div</div>
      `;

      const result = HtmlParser.parseHtml(html);
      
      // Should only have one instance of html.elements.div
      const divFeatures = result.features.filter(f => f === 'html.elements.div');
      expect(divFeatures).toHaveLength(1);
    });

    it('should handle self-closing elements', () => {
      const html = `
        <img src="image.jpg" alt="Image" />
        <br />
        <hr />
        <input type="text" />
        <meta charset="utf-8" />
      `;

      const result = HtmlParser.parseHtml(html);
      
      expect(result.features).toContain('html.elements.img');
      expect(result.features).toContain('html.elements.br');
      expect(result.features).toContain('html.elements.hr');
      expect(result.features).toContain('html.elements.input');
      expect(result.features).toContain('html.elements.meta');
      expect(result.features).toContain('html.elements.meta.charset');
    });

    it('should handle nested elements correctly', () => {
      const html = `
        <article>
          <header>
            <h1>Title</h1>
            <nav>
              <ul>
                <li><a href="#section1">Section 1</a></li>
                <li><a href="#section2">Section 2</a></li>
              </ul>
            </nav>
          </header>
          <main>
            <section id="section1">
              <h2>Section 1</h2>
              <p>Content</p>
            </section>
          </main>
        </article>
      `;

      const result = HtmlParser.parseHtml(html);
      
      expect(result.features).toContain('html.elements.article');
      expect(result.features).toContain('html.elements.header');
      expect(result.features).toContain('html.elements.h1');
      expect(result.features).toContain('html.elements.nav');
      expect(result.features).toContain('html.elements.ul');
      expect(result.features).toContain('html.elements.li');
      expect(result.features).toContain('html.elements.a');
      expect(result.features).toContain('html.elements.main');
      expect(result.features).toContain('html.elements.section');
      expect(result.features).toContain('html.elements.h2');
      expect(result.features).toContain('html.elements.p');
    });
  });

  describe('extractFeatures', () => {
    it('should extract features without location information', () => {
      const html = `
        <main>
          <dialog open>
            <form>
              <input type="email" required>
            </form>
          </dialog>
        </main>
      `;

      const features = HtmlParser.extractFeatures(html);
      
      expect(features).toContain('html.elements.main');
      expect(features).toContain('html.elements.dialog');
      expect(features).toContain('html.elements.form');
      expect(features).toContain('html.elements.input');
      expect(features).toContain('html.elements.dialog.open');
      expect(features).toContain('html.elements.input.required');
    });
  });

  describe('error handling', () => {
    it('should handle parsing errors gracefully', () => {
      // Test with invalid HTML that might cause parsing issues
      const invalidHtml = '<div><p>Unclosed tags<span>nested</div>';

      const result = HtmlParser.parseHtml(invalidHtml);
      
      // Should still return a result, even if not perfect
      expect(result.features).toBeDefined();
      expect(result.locations).toBeDefined();
      expect(Array.isArray(result.features)).toBe(true);
      expect(result.locations instanceof Map).toBe(true);
    });
  });
});