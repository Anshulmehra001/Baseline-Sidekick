import { describe, it, expect } from 'vitest';
import { HtmlParser } from './htmlParser';

describe('HtmlParser Integration Tests', () => {
  describe('Real-world HTML parsing', () => {
    it('should parse a complete HTML5 document', () => {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Modern Web App</title>
          <link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>
          <link rel="stylesheet" href="styles.css">
          <script type="module" src="app.js" defer></script>
          <script nomodule src="fallback.js"></script>
        </head>
        <body>
          <header>
            <nav>
              <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </nav>
          </header>
          
          <main>
            <section id="hero">
              <h1>Welcome to Our App</h1>
              <p>This is a modern web application.</p>
              <img src="hero.jpg" alt="Hero image" loading="lazy" decoding="async" 
                   srcset="hero-400.jpg 400w, hero-800.jpg 800w" 
                   sizes="(max-width: 600px) 100vw, 50vw">
            </section>
            
            <section id="features">
              <h2>Features</h2>
              <article>
                <h3>Feature 1</h3>
                <p>Description of feature 1</p>
              </article>
              <aside>
                <h3>Related Info</h3>
                <p>Additional information</p>
              </aside>
            </section>
            
            <section id="contact">
              <h2>Contact Us</h2>
              <form novalidate>
                <fieldset>
                  <legend>Personal Information</legend>
                  <label for="name">Name:</label>
                  <input type="text" id="name" name="name" required autocomplete="name" 
                         placeholder="Enter your name">
                  
                  <label for="email">Email:</label>
                  <input type="email" id="email" name="email" required autocomplete="email"
                         pattern="[^@]+@[^@]+" placeholder="Enter your email">
                  
                  <label for="age">Age:</label>
                  <input type="number" id="age" name="age" min="18" max="120" step="1">
                  
                  <label for="country">Country:</label>
                  <input type="text" id="country" name="country" list="countries" autocomplete="country">
                  <datalist id="countries">
                    <option value="United States">
                    <option value="Canada">
                    <option value="United Kingdom">
                  </datalist>
                </fieldset>
                
                <fieldset>
                  <legend>Message</legend>
                  <label for="message">Message:</label>
                  <textarea id="message" name="message" rows="5" cols="50" 
                            placeholder="Enter your message" spellcheck="true"></textarea>
                </fieldset>
                
                <button type="submit">Send Message</button>
                <button type="reset">Clear Form</button>
              </form>
            </section>
            
            <section id="media">
              <h2>Media Examples</h2>
              
              <video controls autoplay muted loop playsinline poster="video-poster.jpg" preload="metadata">
                <source src="video.mp4" type="video/mp4">
                <source src="video.webm" type="video/webm">
                <track kind="subtitles" src="subtitles-en.vtt" srclang="en" label="English">
                <track kind="subtitles" src="subtitles-es.vtt" srclang="es" label="Spanish">
                <p>Your browser doesn't support video.</p>
              </video>
              
              <audio controls preload="auto">
                <source src="audio.mp3" type="audio/mp3">
                <source src="audio.ogg" type="audio/ogg">
                <p>Your browser doesn't support audio.</p>
              </audio>
              
              <figure>
                <img src="chart.svg" alt="Sales chart" loading="lazy">
                <figcaption>Monthly sales data</figcaption>
              </figure>
            </section>
            
            <section id="interactive">
              <h2>Interactive Elements</h2>
              
              <details>
                <summary>Click to expand</summary>
                <p>This content is hidden by default and can be expanded.</p>
              </details>
              
              <dialog id="modal">
                <h3>Modal Dialog</h3>
                <p>This is a modal dialog.</p>
                <button onclick="document.getElementById('modal').close()">Close</button>
              </dialog>
              
              <button onclick="document.getElementById('modal').showModal()">Open Modal</button>
              
              <progress value="70" max="100">70%</progress>
              <meter value="0.7" min="0" max="1">70%</meter>
            </section>
            
            <section id="embedded">
              <h2>Embedded Content</h2>
              
              <iframe src="https://example.com/widget" 
                      loading="lazy"
                      sandbox="allow-scripts allow-same-origin"
                      allow="camera; microphone; geolocation"
                      referrerpolicy="strict-origin-when-cross-origin"
                      width="400" height="300">
                <p>Your browser doesn't support iframes.</p>
              </iframe>
              
              <object data="document.pdf" type="application/pdf" width="400" height="300">
                <p>Your browser doesn't support PDF embedding.</p>
              </object>
              
              <embed src="flash-content.swf" type="application/x-shockwave-flash" width="400" height="300">
            </section>
          </main>
          
          <footer>
            <p>&copy; 2024 Our Company. All rights reserved.</p>
            <address>
              <p>Contact us at: <a href="mailto:info@example.com">info@example.com</a></p>
            </address>
          </footer>
        </body>
        </html>
      `;

      const result = HtmlParser.parseHtml(html);
      
      // Verify structural elements
      expect(result.features).toContain('html.elements.html');
      expect(result.features).toContain('html.elements.head');
      expect(result.features).toContain('html.elements.body');
      expect(result.features).toContain('html.elements.main');
      expect(result.features).toContain('html.elements.header');
      expect(result.features).toContain('html.elements.footer');
      expect(result.features).toContain('html.elements.nav');
      expect(result.features).toContain('html.elements.section');
      expect(result.features).toContain('html.elements.article');
      expect(result.features).toContain('html.elements.aside');
      
      // Verify form elements
      expect(result.features).toContain('html.elements.form');
      expect(result.features).toContain('html.elements.fieldset');
      expect(result.features).toContain('html.elements.legend');
      expect(result.features).toContain('html.elements.label');
      expect(result.features).toContain('html.elements.input');
      expect(result.features).toContain('html.elements.textarea');
      expect(result.features).toContain('html.elements.button');
      expect(result.features).toContain('html.elements.datalist');
      expect(result.features).toContain('html.elements.option');
      
      // Verify media elements
      expect(result.features).toContain('html.elements.video');
      expect(result.features).toContain('html.elements.audio');
      expect(result.features).toContain('html.elements.source');
      expect(result.features).toContain('html.elements.track');
      expect(result.features).toContain('html.elements.img');
      expect(result.features).toContain('html.elements.figure');
      expect(result.features).toContain('html.elements.figcaption');
      
      // Verify interactive elements
      expect(result.features).toContain('html.elements.details');
      expect(result.features).toContain('html.elements.summary');
      expect(result.features).toContain('html.elements.dialog');
      expect(result.features).toContain('html.elements.progress');
      expect(result.features).toContain('html.elements.meter');
      
      // Verify embedded content
      expect(result.features).toContain('html.elements.iframe');
      expect(result.features).toContain('html.elements.object');
      expect(result.features).toContain('html.elements.embed');
      
      // Verify modern attributes
      expect(result.features).toContain('html.elements.script.type');
      expect(result.features).toContain('html.elements.script.defer');
      expect(result.features).toContain('html.elements.script.nomodule');
      expect(result.features).toContain('html.elements.link.as');
      expect(result.features).toContain('html.elements.img.loading');
      expect(result.features).toContain('html.elements.img.decoding');
      expect(result.features).toContain('html.elements.img.srcset');
      expect(result.features).toContain('html.elements.img.sizes');
      expect(result.features).toContain('html.elements.form.novalidate');
      expect(result.features).toContain('html.elements.input.required');
      expect(result.features).toContain('html.elements.input.autocomplete');
      expect(result.features).toContain('html.elements.input.placeholder');
      expect(result.features).toContain('html.elements.input.pattern');
      expect(result.features).toContain('html.elements.input.min');
      expect(result.features).toContain('html.elements.input.max');
      expect(result.features).toContain('html.elements.input.step');
      expect(result.features).toContain('html.elements.input.list');
      expect(result.features).toContain('html.elements.video.controls');
      expect(result.features).toContain('html.elements.video.autoplay');
      expect(result.features).toContain('html.elements.video.muted');
      expect(result.features).toContain('html.elements.video.loop');
      expect(result.features).toContain('html.elements.video.playsinline');
      expect(result.features).toContain('html.elements.video.poster');
      expect(result.features).toContain('html.elements.video.preload');
      expect(result.features).toContain('html.elements.iframe.loading');
      expect(result.features).toContain('html.elements.iframe.sandbox');
      expect(result.features).toContain('html.elements.iframe.allow');
      expect(result.features).toContain('html.elements.iframe.referrerpolicy');
      expect(result.features).toContain('html.global_attributes.spellcheck');
      
      // Verify meta elements
      expect(result.features).toContain('html.elements.meta');
      expect(result.features).toContain('html.elements.meta.charset');
    });

    it('should parse web components and custom elements', () => {
      const html = `<custom-header>
  <slot name="title">Default Title</slot>
</custom-header>

<my-component is="enhanced-div" part="container shadow-part">
  <template>
    <style>
      :host {
        display: block;
      }
    </style>
    <div part="content">
      <slot></slot>
    </div>
  </template>
</my-component>

<div is="custom-div" part="main-content">
  <span slot="content">Regular div enhanced as custom element</span>
</div>`;

      const result = HtmlParser.parseHtml(html);
      
      // Custom elements should be detected
      expect(result.features).toContain('html.elements.custom-header');
      expect(result.features).toContain('html.elements.my-component');
      expect(result.features).toContain('html.elements.template');
      expect(result.features).toContain('html.elements.style');
      expect(result.features).toContain('html.elements.div');
      expect(result.features).toContain('html.elements.slot');
      expect(result.features).toContain('html.elements.span');
      
      // Web component attributes
      expect(result.features).toContain('html.global_attributes.is');
      expect(result.features).toContain('html.global_attributes.part');
      expect(result.features).toContain('html.global_attributes.slot');
    });

    it('should parse progressive web app features', () => {
      const html = `
        <head>
          <link rel="manifest" href="/manifest.json">
          <link rel="icon" href="/icon-192.png" sizes="192x192" type="image/png">
          <link rel="apple-touch-icon" href="/icon-180.png">
          <meta name="theme-color" content="#000000">
          <meta name="apple-mobile-web-app-capable" content="yes">
          <meta name="apple-mobile-web-app-status-bar-style" content="black">
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        </head>
        <body>
          <div id="app">
            <noscript>
              <p>This app requires JavaScript to run.</p>
            </noscript>
          </div>
        </body>
      `;

      const result = HtmlParser.parseHtml(html);
      
      expect(result.features).toContain('html.elements.link');
      expect(result.features).toContain('html.elements.meta');
      expect(result.features).toContain('html.elements.noscript');
    });

    it('should handle complex nested structures', () => {
      const html = `
        <table>
          <caption>Sales Data</caption>
          <colgroup>
            <col span="2" style="background-color: #f0f0f0;">
            <col style="background-color: #e0e0e0;">
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Q1</th>
              <th scope="col">Q2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Widget A</th>
              <td>100</td>
              <td>150</td>
            </tr>
            <tr>
              <th scope="row">Widget B</th>
              <td>200</td>
              <td>180</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              <td>300</td>
              <td>330</td>
            </tr>
          </tfoot>
        </table>
      `;

      const result = HtmlParser.parseHtml(html);
      
      expect(result.features).toContain('html.elements.table');
      expect(result.features).toContain('html.elements.caption');
      expect(result.features).toContain('html.elements.colgroup');
      expect(result.features).toContain('html.elements.col');
      expect(result.features).toContain('html.elements.thead');
      expect(result.features).toContain('html.elements.tbody');
      expect(result.features).toContain('html.elements.tfoot');
      expect(result.features).toContain('html.elements.tr');
      expect(result.features).toContain('html.elements.th');
      expect(result.features).toContain('html.elements.td');
    });

    it('should handle performance and optimization attributes', () => {
      const html = `
        <head>
          <link rel="preload" href="critical.css" as="style">
          <link rel="prefetch" href="next-page.html">
          <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
          <link rel="dns-prefetch" href="https://api.example.com">
        </head>
        <body>
          <img src="hero.jpg" alt="Hero" loading="lazy" decoding="async" fetchpriority="high">
          <img src="gallery1.jpg" alt="Gallery 1" loading="lazy" decoding="async" fetchpriority="low">
          <script src="analytics.js" async></script>
          <script src="app.js" defer></script>
        </body>
      `;

      const result = HtmlParser.parseHtml(html);
      
      expect(result.features).toContain('html.elements.link');
      expect(result.features).toContain('html.elements.img');
      expect(result.features).toContain('html.elements.script');
      expect(result.features).toContain('html.elements.link.crossorigin');
      expect(result.features).toContain('html.elements.link.as');
      expect(result.features).toContain('html.elements.img.loading');
      expect(result.features).toContain('html.elements.img.decoding');
      expect(result.features).toContain('html.elements.script.async');
      expect(result.features).toContain('html.elements.script.defer');
      
      // fetchpriority is a newer attribute that should be detected
      expect(result.features).toContain('html.attributes.fetchpriority');
    });
  });

  describe('Performance with large documents', () => {
    it('should handle large HTML documents efficiently', () => {
      // Generate a large HTML document
      let html = '<html><body>';
      
      // Add 1000 div elements with various attributes
      for (let i = 0; i < 1000; i++) {
        html += `<div id="item-${i}" class="item" data-index="${i}">`;
        html += `  <h3>Item ${i}</h3>`;
        html += `  <p>Description for item ${i}</p>`;
        html += `  <img src="image-${i}.jpg" alt="Image ${i}" loading="lazy">`;
        html += `</div>`;
      }
      
      html += '</body></html>';

      const startTime = Date.now();
      const result = HtmlParser.parseHtml(html);
      const endTime = Date.now();
      
      // Should complete within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      
      // Should detect the expected elements
      expect(result.features).toContain('html.elements.html');
      expect(result.features).toContain('html.elements.body');
      expect(result.features).toContain('html.elements.div');
      expect(result.features).toContain('html.elements.h3');
      expect(result.features).toContain('html.elements.p');
      expect(result.features).toContain('html.elements.img');
      expect(result.features).toContain('html.elements.img.loading');
      
      // Should not have duplicates
      const divFeatures = result.features.filter(f => f === 'html.elements.div');
      expect(divFeatures).toHaveLength(1);
    });
  });
});