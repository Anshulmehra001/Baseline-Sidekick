import { describe, it, expect } from 'vitest';
import { JsParser } from './jsParser';

describe('JsParser', () => {
  describe('parseJavaScript', () => {
    it('should parse navigator.clipboard API usage', () => {
      const code = `
        navigator.clipboard.writeText('Hello World');
        const text = await navigator.clipboard.readText();
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      expect(result.features).toContain('api.Clipboard.writeText');
      expect(result.features).toContain('api.Clipboard.readText');
    });

    it('should parse document API usage', () => {
      const code = `
        const element = document.querySelector('.my-class');
        const elements = document.querySelectorAll('div');
        const newDiv = document.createElement('div');
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      expect(result.features).toContain('api.Document.querySelector');
      expect(result.features).toContain('api.Document.querySelectorAll');
      expect(result.features).toContain('api.Document.createElement');
    });

    it('should parse global function calls', () => {
      const code = `
        fetch('/api/data').then(response => response.json());
        requestAnimationFrame(animate);
        queueMicrotask(() => console.log('microtask'));
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      expect(result.features).toContain('api.fetch');
      expect(result.features).toContain('api.Window.requestAnimationFrame');
      expect(result.features).toContain('api.queueMicrotask');
    });

    it('should parse Array methods', () => {
      const code = `
        const arr = [1, 2, 3];
        const last = arr.at(-1);
        const found = arr.find(x => x > 2);
        const includes = arr.includes(2);
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      expect(result.features).toContain('api.Array.at');
      expect(result.features).toContain('api.Array.find');
      expect(result.features).toContain('api.Array.includes');
    });

    it('should parse String methods', () => {
      const code = `
        const str = 'hello world';
        const includes = str.includes('world');
        const starts = str.startsWith('hello');
        const padded = str.padStart(20, '0');
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      expect(result.features).toContain('api.String.includes');
      expect(result.features).toContain('api.String.startsWith');
      expect(result.features).toContain('api.String.padStart');
    });

    it('should parse Object methods', () => {
      const code = `
        const obj = { a: 1, b: 2 };
        const merged = Object.assign({}, obj);
        const entries = Object.entries(obj);
        const values = Object.values(obj);
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      expect(result.features).toContain('api.Object.assign');
      expect(result.features).toContain('api.Object.entries');
      expect(result.features).toContain('api.Object.values');
    });

    it('should parse Promise methods', () => {
      const code = `
        const promises = [Promise.resolve(1), Promise.reject(2)];
        Promise.allSettled(promises);
        Promise.any(promises);
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      expect(result.features).toContain('api.Promise.allSettled');
      expect(result.features).toContain('api.Promise.any');
    });

    it('should parse navigator APIs', () => {
      const code = `
        navigator.geolocation.getCurrentPosition(success, error);
        navigator.serviceWorker.register('/sw.js');
        navigator.share({ title: 'Test', url: 'https://example.com' });
        navigator.vibrate([200, 100, 200]);
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      expect(result.features).toContain('api.Geolocation.getCurrentPosition');
      expect(result.features).toContain('api.ServiceWorker');
      expect(result.features).toContain('api.Navigator.share');
      expect(result.features).toContain('api.Navigator.vibrate');
    });

    it('should parse media APIs', () => {
      const code = `
        navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const stream = await navigator.mediaDevices.getDisplayMedia();
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      expect(result.features).toContain('api.MediaDevices.getUserMedia');
      expect(result.features).toContain('api.MediaDevices');
    });

    it('should parse storage APIs', () => {
      const code = `
        localStorage.setItem('key', 'value');
        sessionStorage.getItem('key');
        const db = indexedDB.open('myDB');
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      expect(result.features).toContain('api.Storage');
      expect(result.features).toContain('api.IDBFactory');
    });

    it('should parse element APIs', () => {
      const code = `
        element.closest('.parent');
        element.matches('.selector');
        element.animate([{ opacity: 0 }, { opacity: 1 }], 1000);
        element.scrollIntoView({ behavior: 'smooth' });
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      expect(result.features).toContain('api.Element.closest');
      expect(result.features).toContain('api.Element.matches');
      expect(result.features).toContain('api.Element.animate');
      expect(result.features).toContain('api.Element.scrollIntoView');
    });

    it('should handle TypeScript syntax', () => {
      const code = `
        interface User {
          name: string;
          age: number;
        }
        
        const user: User = { name: 'John', age: 30 };
        fetch('/api/users').then((response: Response) => response.json());
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      expect(result.features).toContain('api.fetch');
    });

    it('should handle JSX syntax', () => {
      const code = `
        const Component = () => {
          const handleClick = () => {
            navigator.clipboard.writeText('Copied!');
          };
          
          return <button onClick={handleClick}>Copy</button>;
        };
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      expect(result.features).toContain('api.Clipboard.writeText');
    });

    it('should not duplicate features', () => {
      const code = `
        fetch('/api/data1');
        fetch('/api/data2');
        fetch('/api/data3');
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      expect(result.features.filter(f => f === 'api.fetch')).toHaveLength(1);
    });

    it('should handle parsing errors gracefully', () => {
      const invalidCode = `
        const invalid = {
          unclosed: 'string
        };
      `;
      
      const result = JsParser.parseJavaScript(invalidCode);
      
      expect(result.features).toEqual([]);
      expect(result.locations.size).toBe(0);
    });

    it('should handle computed property access', () => {
      const code = `
        const prop = 'clipboard';
        navigator[prop].writeText('test'); // Should not be detected
        navigator['clipboard'].writeText('test'); // Should be detected
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      expect(result.features).toContain('api.Clipboard.writeText');
      expect(result.features.filter(f => f === 'api.Clipboard.writeText')).toHaveLength(1);
    });

    it('should handle method chaining', () => {
      const code = `
        document.querySelector('.container')
          .querySelector('.item')
          .addEventListener('click', handler);
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      expect(result.features).toContain('api.Document.querySelector');
      // Note: Chained method calls on unknown objects are harder to detect
      // The parser detects the initial document.querySelector but not the chained calls
      // since it doesn't know the return type of querySelector
    });

    it('should handle window prefix', () => {
      const code = `
        window.fetch('/api/data');
        window.requestAnimationFrame(animate);
        window.localStorage.setItem('key', 'value');
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      expect(result.features).toContain('api.fetch');
      expect(result.features).toContain('api.Window.requestAnimationFrame');
      expect(result.features).toContain('api.Storage');
    });
  });

  describe('extractFeatures', () => {
    it('should return only feature IDs without locations', () => {
      const code = `
        navigator.clipboard.writeText('test');
        fetch('/api/data');
      `;
      
      const features = JsParser.extractFeatures(code);
      
      expect(features).toContain('api.Clipboard.writeText');
      expect(features).toContain('api.fetch');
      expect(Array.isArray(features)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty code', () => {
      const result = JsParser.parseJavaScript('');
      
      expect(result.features).toEqual([]);
      expect(result.locations.size).toBe(0);
    });

    it('should handle code with only comments', () => {
      const code = `
        // This is a comment
        /* This is a block comment */
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      expect(result.features).toEqual([]);
    });

    it('should handle complex nested expressions', () => {
      const code = `
        const result = await fetch('/api/data')
          .then(response => response.json())
          .then(data => {
            navigator.clipboard.writeText(JSON.stringify(data));
            return data;
          });
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      expect(result.features).toContain('api.fetch');
      expect(result.features).toContain('api.Clipboard.writeText');
    });

    it('should handle destructuring with API calls', () => {
      const code = `
        const { clipboard } = navigator;
        clipboard.writeText('test');
        
        const { querySelector } = document;
        querySelector('.test');
        
        // But should still detect direct API usage
        navigator.geolocation.getCurrentPosition();
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      // Should detect the direct API usage
      expect(result.features).toContain('api.Geolocation.getCurrentPosition');
      // Destructured usage is harder to track and may not be detected
    });

    it('should handle async/await syntax', () => {
      const code = `
        async function getData() {
          const response = await fetch('/api/data');
          const text = await navigator.clipboard.readText();
          return { response, text };
        }
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      expect(result.features).toContain('api.fetch');
      expect(result.features).toContain('api.Clipboard.readText');
    });

    it('should handle arrow functions and modern syntax', () => {
      const code = `
        const getData = async () => {
          const [response, text] = await Promise.allSettled([
            fetch('/api/data'),
            navigator.clipboard.readText()
          ]);
          return { response, text };
        };
      `;
      
      const result = JsParser.parseJavaScript(code);
      
      expect(result.features).toContain('api.Promise.allSettled');
      expect(result.features).toContain('api.fetch');
      expect(result.features).toContain('api.Clipboard.readText');
    });
  });
});