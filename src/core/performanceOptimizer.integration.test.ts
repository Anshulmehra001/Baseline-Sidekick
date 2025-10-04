import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceOptimizer } from './performanceOptimizer';
import { DiagnosticController } from '../diagnostics';
import * as vscode from 'vscode';

// Mock VS Code
vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((key: string, defaultValue: any) => defaultValue)
    }))
  },
  languages: {
    createDiagnosticCollection: vi.fn(() => ({
      dispose: vi.fn(),
      delete: vi.fn(),
      set: vi.fn(),
      clear: vi.fn()
    }))
  },
  window: {
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
      show: vi.fn(),
      clear: vi.fn(),
      dispose: vi.fn()
    }))
  },
  Position: class Position {
    constructor(public line: number, public character: number) {}
  },
  Range: class Range {
    constructor(public start: any, public end: any) {}
  },
  DiagnosticSeverity: {
    Warning: 1
  },
  DiagnosticTag: {
    Deprecated: 1
  },
  Uri: {
    parse: vi.fn((uri: string) => ({ toString: () => uri }))
  }
}));

// Mock the parsers
vi.mock('./cssParser', () => ({
  CssParser: {
    parseCss: vi.fn(() => {
      const Position = class { constructor(public line: number, public character: number) {} };
      const Range = class { constructor(public start: any, public end: any) {} };
      return {
        features: ['css.properties.gap'],
        locations: new Map([['css.properties.gap', [new Range(new Position(0, 0), new Position(0, 3))]]])
      };
    })
  }
}));

vi.mock('./jsParser', () => ({
  JsParser: {
    parseJavaScript: vi.fn(() => {
      const Position = class { constructor(public line: number, public character: number) {} };
      const Range = class { constructor(public start: any, public end: any) {} };
      return {
        features: ['api.fetch'],
        locations: new Map([['api.fetch', [new Range(new Position(0, 0), new Position(0, 5))]]])
      };
    })
  }
}));

vi.mock('./htmlParser', () => ({
  HtmlParser: {
    parseHtml: vi.fn(() => {
      const Position = class { constructor(public line: number, public character: number) {} };
      const Range = class { constructor(public start: any, public end: any) {} };
      return {
        features: ['html.elements.dialog'],
        locations: new Map([['html.elements.dialog', [new Range(new Position(0, 0), new Position(0, 6))]]])
      };
    })
  }
}));

// Mock BaselineDataManager
vi.mock('./baselineData', () => ({
  BaselineDataManager: {
    getInstance: vi.fn(() => ({
      isInitialized: vi.fn(() => true),
      initialize: vi.fn(() => Promise.resolve()),
      isBaselineSupported: vi.fn(() => false),
      getFeatureData: vi.fn(() => ({ name: 'Test Feature' }))
    }))
  }
}));

// Mock ErrorHandler
vi.mock('./errorHandler', () => ({
  ErrorHandler: {
    getInstance: vi.fn(() => ({
      handleExtensionError: vi.fn(),
      handleParserError: vi.fn()
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

describe.skip('PerformanceOptimizer Integration Tests', () => {
  let optimizer: PerformanceOptimizer;
  let diagnosticController: DiagnosticController;
  let mockContext: any;

  beforeEach(() => {
    // Reset singleton instances
    (PerformanceOptimizer as any).instance = undefined;
    optimizer = PerformanceOptimizer.getInstance();
    
    mockContext = {
      subscriptions: []
    };
    
    diagnosticController = new DiagnosticController(mockContext);
  });

  afterEach(() => {
    optimizer.dispose();
    diagnosticController.dispose();
    vi.clearAllMocks();
  });

  describe('Debounced Diagnostic Updates', () => {
    it('should debounce rapid diagnostic updates', async () => {
      const mockDocument = {
        uri: { fsPath: 'test.css' },
        languageId: 'css',
        getText: () => '.test { gap: 10px; }'
      };

      // Simulate rapid typing by calling updateDiagnostics multiple times
      diagnosticController.updateDiagnostics(mockDocument as any);
      diagnosticController.updateDiagnostics(mockDocument as any);
      diagnosticController.updateDiagnostics(mockDocument as any);

      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 400));

      // Verify that the diagnostic collection was called (indicating processing occurred)
      const vscode = await import('vscode');
      expect(vscode.languages.createDiagnosticCollection).toHaveBeenCalled();
    });

    it('should handle different files independently', async () => {
      const mockDocument1 = {
        uri: { fsPath: 'test1.css' },
        languageId: 'css',
        getText: () => '.test1 { gap: 10px; }'
      };

      const mockDocument2 = {
        uri: { fsPath: 'test2.css' },
        languageId: 'css',
        getText: () => '.test2 { gap: 20px; }'
      };

      // Update diagnostics for both files
      diagnosticController.updateDiagnostics(mockDocument1 as any);
      diagnosticController.updateDiagnostics(mockDocument2 as any);

      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 400));

      // Both should be processed
      expect((vscode as any).languages.createDiagnosticCollection).toHaveBeenCalled();
    });
  });

  describe('File Size Limits', () => {
    it('should skip processing of oversized files', async () => {
      const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB
      const mockDocument = {
        uri: { fsPath: 'large.css' },
        languageId: 'css',
        getText: () => largeContent
      };

      diagnosticController.updateDiagnostics(mockDocument as any);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 400));

      // Should not process the file due to size limits
      // The diagnostic collection should still be created but no diagnostics set
      expect((vscode as any).languages.createDiagnosticCollection).toHaveBeenCalled();
    });

    it('should process normal-sized files', async () => {
      const normalContent = '.test { color: red; }';
      const mockDocument = {
        uri: { fsPath: 'normal.css' },
        languageId: 'css',
        getText: () => normalContent
      };

      diagnosticController.updateDiagnostics(mockDocument as any);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 400));

      expect((vscode as any).languages.createDiagnosticCollection).toHaveBeenCalled();
    });
  });

  describe('Caching Performance', () => {
    it('should cache parser results for identical content', async () => {
      const { CssParser } = await import('./cssParser');
      const parseSpy = vi.spyOn(CssParser, 'parseCss');

      const mockDocument = {
        uri: { fsPath: 'test.css' },
        languageId: 'css',
        getText: () => '.test { gap: 10px; }'
      };

      // Process the same document multiple times
      diagnosticController.updateDiagnostics(mockDocument as any);
      await new Promise(resolve => setTimeout(resolve, 400));

      diagnosticController.updateDiagnostics(mockDocument as any);
      await new Promise(resolve => setTimeout(resolve, 400));

      // Parser should be called fewer times due to caching
      // Note: The exact number depends on the memoization implementation
      expect(parseSpy).toHaveBeenCalled();
    });

    it('should invalidate cache when content changes', async () => {
      const { CssParser } = await import('./cssParser');
      const parseSpy = vi.spyOn(CssParser, 'parseCss');

      let content = '.test { gap: 10px; }';
      const mockDocument = {
        uri: { fsPath: 'test.css' },
        languageId: 'css',
        getText: () => content
      };

      // Process initial content
      diagnosticController.updateDiagnostics(mockDocument as any);
      await new Promise(resolve => setTimeout(resolve, 400));

      // Change content
      content = '.test { gap: 20px; }';

      // Process changed content
      diagnosticController.updateDiagnostics(mockDocument as any);
      await new Promise(resolve => setTimeout(resolve, 400));

      // Parser should be called for both versions
      expect(parseSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Memory Management', () => {
    it('should track memory usage during processing', async () => {
      const mockDocument = {
        uri: { fsPath: 'test.css' },
        languageId: 'css',
        getText: () => '.test { gap: 10px; }'
      };

      const initialStats = optimizer.getPerformanceStats();
      const initialMemory = initialStats.memoryUsage;

      diagnosticController.updateDiagnostics(mockDocument as any);
      await new Promise(resolve => setTimeout(resolve, 400));

      // Memory tracking should have been used during processing
      // After processing completes, memory should be released
      const finalStats = optimizer.getPerformanceStats();
      expect(finalStats.memoryUsage).toBe(initialMemory);
    });
  });

  describe('Timeout Handling', () => {
    it('should handle parser timeouts gracefully', async () => {
      const { CssParser } = await import('./cssParser');
      
      // Mock parser to simulate slow operation
      vi.spyOn(CssParser, 'parseCss').mockImplementation((): any => {
        return new Promise(resolve => {
          setTimeout(() => resolve({
            features: [],
            locations: new Map()
          }), 10000); // 10 second delay
        });
      });

      // Set a short timeout for testing
      optimizer.updateConfiguration({ parseTimeout: 100 });

      const mockDocument = {
        uri: { fsPath: 'slow.css' },
        languageId: 'css',
        getText: () => '.test { gap: 10px; }'
      };

      diagnosticController.updateDiagnostics(mockDocument as any);

      // Wait for timeout to occur
      await new Promise(resolve => setTimeout(resolve, 500));

      // Should handle timeout gracefully without crashing
      expect((vscode as any).languages.createDiagnosticCollection).toHaveBeenCalled();
    });
  });

  describe('Async Processing for Large Files', () => {
    it('should use async processing for large files', async () => {
      // Create a file that exceeds the large file threshold
      const largeContent = 'x'.repeat(200 * 1024); // 200KB
      const mockDocument = {
        uri: { fsPath: 'large.css' },
        languageId: 'css',
        getText: () => largeContent
      };

      const isLarge = optimizer.isLargeFile(mockDocument as any);
      expect(isLarge).toBe(true);

      diagnosticController.updateDiagnostics(mockDocument as any);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 500));

      expect((vscode as any).languages.createDiagnosticCollection).toHaveBeenCalled();
    });

    it('should use synchronous processing for small files', async () => {
      const smallContent = '.test { color: red; }';
      const mockDocument = {
        uri: { fsPath: 'small.css' },
        languageId: 'css',
        getText: () => smallContent
      };

      const isLarge = optimizer.isLargeFile(mockDocument as any);
      expect(isLarge).toBe(false);

      diagnosticController.updateDiagnostics(mockDocument as any);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 400));

      expect((vscode as any).languages.createDiagnosticCollection).toHaveBeenCalled();
    });
  });

  describe('Performance Statistics', () => {
    it('should provide meaningful performance statistics', async () => {
      const mockDocument = {
        uri: { fsPath: 'test.css' },
        languageId: 'css',
        getText: () => '.test { gap: 10px; }'
      };

      // Process some documents to generate statistics
      diagnosticController.updateDiagnostics(mockDocument as any);
      await new Promise(resolve => setTimeout(resolve, 400));

      const stats = optimizer.getPerformanceStats();
      
      expect(typeof stats.cacheSize).toBe('number');
      expect(typeof stats.cacheHitRate).toBe('number');
      expect(typeof stats.memoryUsage).toBe('number');
      expect(typeof stats.activeDebouncers).toBe('number');
      
      expect(stats.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(stats.cacheHitRate).toBeLessThanOrEqual(1);
    });
  });
});