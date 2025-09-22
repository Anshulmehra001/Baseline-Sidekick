import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceOptimizer } from './performanceOptimizer';
import { CssParser } from './cssParser';
import { JsParser } from './jsParser';
import { HtmlParser } from './htmlParser';

// Mock VS Code
vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((key: string, defaultValue: any) => defaultValue)
    }))
  },
  window: {
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn()
    }))
  },
  Position: class Position {
    constructor(public line: number, public character: number) {}
  },
  Range: class Range {
    constructor(public start: any, public end: any) {}
  }
}));

// Mock ErrorHandler
vi.mock('./errorHandler', () => ({
  ErrorHandler: {
    getInstance: vi.fn(() => ({
      handleExtensionError: vi.fn(),
      handleParserError: vi.fn(),
      handleValidationError: vi.fn()
    }))
  },
  Logger: {
    getInstance: vi.fn(() => ({
      debug: vi.fn(),
      warn: vi.fn(),
      info: vi.fn()
    }))
  }
}));

describe('Performance Benchmarks', () => {
  let optimizer: PerformanceOptimizer;

  beforeEach(() => {
    // Reset singleton instance
    (PerformanceOptimizer as any).instance = undefined;
    optimizer = PerformanceOptimizer.getInstance();
  });

  afterEach(() => {
    optimizer.dispose();
    vi.clearAllMocks();
  });

  describe('Memoization Performance', () => {
    it('should show significant performance improvement with memoization', () => {
      // Create an expensive function that simulates parsing
      let callCount = 0;
      const expensiveFunction = (content: string) => {
        callCount++;
        // Simulate expensive parsing operation
        let result = '';
        for (let i = 0; i < 10000; i++) {
          result += content.charAt(i % content.length);
        }
        return { features: [result.slice(0, 10)], locations: new Map() };
      };

      const keyGenerator = (content: string) => `key-${content.slice(0, 20)}`;
      const memoizedFunction = optimizer.memoize(expensiveFunction, keyGenerator);

      const testContent = 'test content for memoization benchmark';

      // Measure time without memoization (first call)
      const start1 = performance.now();
      const result1 = memoizedFunction(testContent);
      const time1 = performance.now() - start1;

      // Measure time with memoization (second call)
      const start2 = performance.now();
      const result2 = memoizedFunction(testContent);
      const time2 = performance.now() - start2;

      // Results should be identical
      expect(result1).toEqual(result2);
      
      // Second call should be significantly faster (at least 10x)
      expect(time2).toBeLessThan(time1 / 10);
      
      // Function should only be called once due to memoization
      expect(callCount).toBe(1);
    });

    it('should handle cache eviction performance gracefully', () => {
      // Set small cache size for testing
      optimizer.updateConfiguration({ maxCacheSize: 3 });

      const mockFn = vi.fn((x: number) => ({ result: x * 2 }));
      const keyGenerator = (x: number) => `key-${x}`;
      const memoizedFn = optimizer.memoize(mockFn, keyGenerator);

      // Fill cache beyond capacity
      const start = performance.now();
      for (let i = 0; i < 10; i++) {
        memoizedFn(i);
      }
      const timeWithEviction = performance.now() - start;

      // Should complete in reasonable time even with eviction
      expect(timeWithEviction).toBeLessThan(100); // 100ms threshold
      expect(mockFn).toHaveBeenCalledTimes(10);
    });
  });

  describe('Debouncing Performance', () => {
    it('should reduce function calls significantly with debouncing', async () => {
      let callCount = 0;
      const mockFunction = () => {
        callCount++;
        return 'result';
      };

      const debouncedFunction = optimizer.debounce('test', mockFunction, 50);

      // Simulate rapid calls (like typing)
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        debouncedFunction();
      }
      const callTime = performance.now() - start;

      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should complete calls quickly
      expect(callTime).toBeLessThan(50); // 50ms threshold for 100 calls
      
      // Should only execute once due to debouncing
      expect(callCount).toBe(1);
    });

    it('should handle multiple debounce keys efficiently', async () => {
      const callCounts = new Map<string, number>();
      
      const createMockFunction = (key: string) => () => {
        callCounts.set(key, (callCounts.get(key) || 0) + 1);
      };

      const numKeys = 10;
      const debouncedFunctions = [];

      // Create multiple debounced functions
      for (let i = 0; i < numKeys; i++) {
        const key = `key-${i}`;
        const mockFn = createMockFunction(key);
        const debouncedFn = optimizer.debounce(key, mockFn, 30);
        debouncedFunctions.push({ key, fn: debouncedFn });
      }

      // Call each function multiple times rapidly
      const start = performance.now();
      for (let round = 0; round < 10; round++) {
        for (const { fn } of debouncedFunctions) {
          fn();
        }
      }
      const callTime = performance.now() - start;

      // Wait for all debounces to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should handle multiple keys efficiently
      expect(callTime).toBeLessThan(100); // 100ms threshold
      
      // Each key should only be called once
      for (let i = 0; i < numKeys; i++) {
        expect(callCounts.get(`key-${i}`)).toBe(1);
      }
    });
  });

  describe('File Size Checking Performance', () => {
    it('should quickly determine file processing eligibility', () => {
      const createMockDocument = (size: number) => ({
        getText: () => 'x'.repeat(size),
        uri: { fsPath: `test-${size}.txt` }
      });

      const fileSizes = [1000, 10000, 100000, 1000000, 5000000]; // Various sizes
      
      const start = performance.now();
      
      const results = fileSizes.map(size => {
        const doc = createMockDocument(size);
        return {
          size,
          shouldProcess: optimizer.shouldProcessFile(doc as any),
          isLarge: optimizer.isLargeFile(doc as any)
        };
      });
      
      const checkTime = performance.now() - start;

      // Should complete size checks very quickly
      expect(checkTime).toBeLessThan(10); // 10ms threshold for 5 files
      
      // Verify correct categorization
      expect(results.filter(r => r.shouldProcess)).toHaveLength(5); // All files should be processed (default max is 5MB)
      expect(results.filter(r => r.isLarge)).toHaveLength(2); // 1MB and 5MB files are large (threshold is 100KB)
    });
  });

  describe('Parser Performance with Caching', () => {
    it('should show improved CSS parser performance with caching', () => {
      const cssContent = `
        .container {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          container-type: inline-size;
        }
        
        .item {
          aspect-ratio: 16/9;
          object-fit: cover;
          border-radius: 8px;
        }
      `;

      const mockDocument = {
        uri: { fsPath: 'test.css' },
        languageId: 'css'
      };

      // Create memoized parser
      const memoizedParser = optimizer.memoize(
        (content: string, doc: any) => CssParser.parseCss(content, doc),
        (content: string, doc: any) => `css-${doc.uri.fsPath}-${content.length}`
      );

      // First parse (cache miss)
      const start1 = performance.now();
      const result1 = memoizedParser(cssContent, mockDocument);
      const time1 = performance.now() - start1;

      // Second parse (cache hit)
      const start2 = performance.now();
      const result2 = memoizedParser(cssContent, mockDocument);
      const time2 = performance.now() - start2;

      // Results should be identical
      expect(result1.features).toEqual(result2.features);
      
      // Cache hit should be significantly faster
      expect(time2).toBeLessThan(time1 / 5); // At least 5x faster
    });

    it('should show improved JavaScript parser performance with caching', () => {
      const jsContent = `
        async function fetchData() {
          const response = await fetch('/api/data');
          const data = await response.json();
          
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(JSON.stringify(data));
          }
          
          return data.filter(item => item.active);
        }
        
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
            }
          });
        });
      `;

      const mockDocument = {
        uri: { fsPath: 'test.js' },
        languageId: 'javascript'
      };

      // Create memoized parser
      const memoizedParser = optimizer.memoize(
        (content: string, doc: any) => JsParser.parseJavaScript(content, doc),
        (content: string, doc: any) => `js-${doc.uri.fsPath}-${content.length}`
      );

      // First parse (cache miss)
      const start1 = performance.now();
      const result1 = memoizedParser(jsContent, mockDocument);
      const time1 = performance.now() - start1;

      // Second parse (cache hit)
      const start2 = performance.now();
      const result2 = memoizedParser(jsContent, mockDocument);
      const time2 = performance.now() - start2;

      // Results should be identical
      expect(result1.features).toEqual(result2.features);
      
      // Cache hit should be significantly faster
      expect(time2).toBeLessThan(time1 / 5); // At least 5x faster
    });

    it('should show improved HTML parser performance with caching', () => {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Page</title>
        </head>
        <body>
          <dialog id="modal">
            <form method="dialog">
              <input type="text" placeholder="Enter text" required>
              <button type="submit">Submit</button>
            </form>
          </dialog>
          
          <details>
            <summary>More Information</summary>
            <p>This is additional content.</p>
          </details>
          
          <img src="image.jpg" loading="lazy" decoding="async" alt="Test image">
        </body>
        </html>
      `;

      const mockDocument = {
        uri: { fsPath: 'test.html' },
        languageId: 'html'
      };

      // Create memoized parser
      const memoizedParser = optimizer.memoize(
        (content: string, doc: any) => HtmlParser.parseHtml(content, doc),
        (content: string, doc: any) => `html-${doc.uri.fsPath}-${content.length}`
      );

      // First parse (cache miss)
      const start1 = performance.now();
      const result1 = memoizedParser(htmlContent, mockDocument);
      const time1 = performance.now() - start1;

      // Second parse (cache hit)
      const start2 = performance.now();
      const result2 = memoizedParser(htmlContent, mockDocument);
      const time2 = performance.now() - start2;

      // Results should be identical
      expect(result1.features).toEqual(result2.features);
      
      // Cache hit should be significantly faster
      expect(time2).toBeLessThan(time1 / 5); // At least 5x faster
    });
  });

  describe('Memory Management Performance', () => {
    it('should efficiently track and release memory', () => {
      const numOperations = 1000;
      
      const start = performance.now();
      
      // Track many operations
      for (let i = 0; i < numOperations; i++) {
        optimizer.trackMemoryUsage(`op-${i}`, 1024);
      }
      
      const trackTime = performance.now() - start;
      
      // Release all operations
      const releaseStart = performance.now();
      for (let i = 0; i < numOperations; i++) {
        optimizer.releaseMemoryTracking(`op-${i}`);
      }
      const releaseTime = performance.now() - releaseStart;

      // Should handle many operations efficiently
      expect(trackTime).toBeLessThan(100); // 100ms for 1000 operations
      expect(releaseTime).toBeLessThan(100); // 100ms for 1000 operations
      
      // Memory should be fully released
      const stats = optimizer.getPerformanceStats();
      expect(stats.memoryUsage).toBe(0);
    });
  });

  describe('Overall Performance Impact', () => {
    it('should demonstrate overall performance improvement', async () => {
      // Simulate a realistic workload
      const files = [
        { content: '.test { gap: 1rem; display: grid; }', type: 'css' },
        { content: 'fetch("/api").then(r => r.json())', type: 'js' },
        { content: '<dialog><button>Close</button></dialog>', type: 'html' }
      ];

      // Without optimization (direct parser calls)
      const directStart = performance.now();
      for (let round = 0; round < 10; round++) {
        for (const file of files) {
          const mockDoc = { uri: { fsPath: `test-${round}.${file.type}` } };
          
          switch (file.type) {
            case 'css':
              CssParser.parseCss(file.content, mockDoc);
              break;
            case 'js':
              JsParser.parseJavaScript(file.content, mockDoc);
              break;
            case 'html':
              HtmlParser.parseHtml(file.content, mockDoc);
              break;
          }
        }
      }
      const directTime = performance.now() - directStart;

      // With optimization (memoized parsers)
      const optimizedStart = performance.now();
      
      const memoizedCssParser = optimizer.memoize(
        (content: string, doc: any) => CssParser.parseCss(content, doc),
        (content: string, doc: any) => `css-${content.length}`
      );
      
      const memoizedJsParser = optimizer.memoize(
        (content: string, doc: any) => JsParser.parseJavaScript(content, doc),
        (content: string, doc: any) => `js-${content.length}`
      );
      
      const memoizedHtmlParser = optimizer.memoize(
        (content: string, doc: any) => HtmlParser.parseHtml(content, doc),
        (content: string, doc: any) => `html-${content.length}`
      );

      for (let round = 0; round < 10; round++) {
        for (const file of files) {
          const mockDoc = { uri: { fsPath: `test-${round}.${file.type}` } };
          
          switch (file.type) {
            case 'css':
              memoizedCssParser(file.content, mockDoc);
              break;
            case 'js':
              memoizedJsParser(file.content, mockDoc);
              break;
            case 'html':
              memoizedHtmlParser(file.content, mockDoc);
              break;
          }
        }
      }
      const optimizedTime = performance.now() - optimizedStart;

      // Optimized version should be significantly faster for repeated content
      expect(optimizedTime).toBeLessThan(directTime);
      
      // Log performance improvement for visibility
      const improvement = ((directTime - optimizedTime) / directTime * 100).toFixed(1);
      console.log(`Performance improvement: ${improvement}% (${directTime.toFixed(2)}ms → ${optimizedTime.toFixed(2)}ms)`);
    });
  });
});