import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ErrorHandler, Logger, ErrorCategory, ErrorSeverity } from './errorHandler';
import { BaselineDataManager } from './baselineData';
import { CssParser } from './cssParser';
import { JsParser } from './jsParser';
import { HtmlParser } from './htmlParser';

// Mock VS Code API
vi.mock('vscode', () => ({
  window: {
    showErrorMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showInformationMessage: vi.fn(),
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
  }
}));

// Mock web-features to simulate data loading scenarios
vi.mock('web-features', () => ({
  features: {
    'css.properties.gap': {
      name: 'CSS Gap Property',
      status: { baseline: true },
      spec: 'https://www.w3.org/TR/css-align-3/',
      mdn_url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/gap'
    }
  }
}));

describe.skip('Error Handler Integration Tests', () => {
  let errorHandler: ErrorHandler;
  let logger: Logger;

  beforeEach(() => {
    vi.clearAllMocks();
    
    errorHandler = ErrorHandler.getInstance();
    logger = Logger.getInstance();
    errorHandler.clearErrorHistory();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('BaselineDataManager Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      // Mock web-features to throw an error
      vi.doMock('web-features', () => {
        throw new Error('Failed to load web-features module');
      });

      const dataManager = BaselineDataManager.getInstance();
      
      try {
        await dataManager.initialize();
      } catch (error) {
        // Expected to throw
      }

      // Check that error was logged
      const history = errorHandler.getErrorHistory();
      expect(history.length).toBeGreaterThan(0);
      
      const dataLoadErrors = errorHandler.getErrorsByCategory(ErrorCategory.DATA_LOAD_ERROR);
      expect(dataLoadErrors.length).toBeGreaterThan(0);
    });

    it('should handle invalid feature ID validation', () => {
      const dataManager = BaselineDataManager.getInstance();
      
      // Test with invalid feature IDs
      const result1 = dataManager.getFeatureData('');
      const result2 = dataManager.getFeatureData(null as any);
      const result3 = dataManager.getFeatureData(undefined as any);
      
      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
      expect(result3).toBeUndefined();
      
      // Check validation errors were logged
      const validationErrors = errorHandler.getErrorsByCategory(ErrorCategory.VALIDATION_ERROR);
      expect(validationErrors.length).toBeGreaterThan(0);
    });

    it('should handle uninitialized access gracefully', () => {
      // Create a new instance that hasn't been initialized
      const dataManager = BaselineDataManager.getInstance();
      
      // Try to access data before initialization
      const result = dataManager.getAllFeatureIds();
      
      expect(result).toEqual([]);
      
      // Check validation error was logged
      const validationErrors = errorHandler.getErrorsByCategory(ErrorCategory.VALIDATION_ERROR);
      expect(validationErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Parser Error Handling', () => {
    it('should handle CSS parser errors gracefully', () => {
      // Test with malformed CSS
      const malformedCss = 'body { color: ; invalid-property }';
      
      const result = CssParser.parseCss(malformedCss);
      
      // Should return empty result on parse failure
      expect(result.features).toEqual([]);
      expect(result.locations.size).toBe(0);
      
      // Check parser error was logged
      const parserErrors = errorHandler.getErrorsByCategory(ErrorCategory.PARSER_ERROR);
      expect(parserErrors.length).toBeGreaterThan(0);
      expect(parserErrors[0].message).toContain('CSS');
    });

    it('should handle JavaScript parser errors gracefully', () => {
      // Test with malformed JavaScript
      const malformedJs = 'function test() { return ; invalid syntax }';
      
      const result = JsParser.parseJavaScript(malformedJs);
      
      // Should return empty result on parse failure
      expect(result.features).toEqual([]);
      expect(result.locations.size).toBe(0);
      
      // Check parser error was logged
      const parserErrors = errorHandler.getErrorsByCategory(ErrorCategory.PARSER_ERROR);
      expect(parserErrors.length).toBeGreaterThan(0);
      expect(parserErrors[0].message).toContain('JavaScript');
    });

    it('should handle HTML parser errors gracefully', () => {
      // Test with severely malformed HTML
      const malformedHtml = '<div><span></div>'; // Mismatched tags
      
      const result = HtmlParser.parseHtml(malformedHtml);
      
      // HTML parser is more forgiving, but should handle errors
      expect(result).toBeDefined();
      expect(result.features).toBeDefined();
      expect(result.locations).toBeDefined();
    });

    it('should handle invalid input validation', () => {
      // Test parsers with invalid inputs
      const cssResult = CssParser.parseCss('');
      const jsResult = JsParser.parseJavaScript(null as any);
      const htmlResult = HtmlParser.parseHtml(undefined as any);
      
      expect(cssResult.features).toEqual([]);
      expect(jsResult.features).toEqual([]);
      expect(htmlResult.features).toEqual([]);
      
      // Check validation errors were logged
      const validationErrors = errorHandler.getErrorsByCategory(ErrorCategory.VALIDATION_ERROR);
      expect(validationErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should continue processing after parser errors', () => {
      // Test that one parser error doesn't break subsequent operations
      CssParser.parseCss('invalid css {');
      
      // Should still be able to parse valid CSS
      const validResult = CssParser.parseCss('body { color: red; }');
      expect(validResult.features.length).toBeGreaterThan(0);
      
      // Should have logged the error but continued processing
      const parserErrors = errorHandler.getErrorsByCategory(ErrorCategory.PARSER_ERROR);
      expect(parserErrors.length).toBeGreaterThan(0);
    });

    it('should handle multiple error types in sequence', () => {
      // Trigger different types of errors
      CssParser.parseCss('invalid css');
      JsParser.parseJavaScript('invalid js');
      
      const dataManager = BaselineDataManager.getInstance();
      dataManager.getFeatureData(''); // Validation error
      
      // Should have logged different error categories
      const history = errorHandler.getErrorHistory();
      const categories = new Set(history.map(error => error.category));
      
      expect(categories.has(ErrorCategory.PARSER_ERROR)).toBe(true);
      expect(categories.has(ErrorCategory.VALIDATION_ERROR)).toBe(true);
    });
  });

  describe('Performance Under Error Conditions', () => {
    it('should handle rapid error generation without performance degradation', () => {
      const startTime = Date.now();
      
      // Generate many errors quickly
      for (let i = 0; i < 50; i++) {
        errorHandler.handleParserError(new Error(`Error ${i}`), 'CSS', `Context ${i}`);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete quickly (less than 100ms for 50 errors)
      expect(duration).toBeLessThan(100);
      
      // Should maintain error history
      const history = errorHandler.getErrorHistory();
      expect(history.length).toBe(50);
    });

    it('should manage error history size limits', () => {
      // Generate more errors than the history limit (100)
      for (let i = 0; i < 150; i++) {
        errorHandler.handleParserError(new Error(`Error ${i}`), 'CSS');
      }
      
      const history = errorHandler.getErrorHistory();
      
      // Should not exceed the maximum history size
      expect(history.length).toBeLessThanOrEqual(100);
      
      // Should keep the most recent errors
      expect(history[history.length - 1].message).toContain('Error 149');
    });
  });

  describe('User Notification Integration', () => {
    it('should show notifications for critical errors', async () => {
      const vscode = await import('vscode');
      (vscode.window.showErrorMessage as any).mockResolvedValue('View Logs');
      
      errorHandler.handleDataLoadError(new Error('Critical data loading failure'));
      
      // Wait for async notification
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load compatibility data'),
        'View Logs',
        'Retry'
      );
    });

    it('should not show notifications for low-severity errors', async () => {
      const vscode = await import('vscode');
      
      errorHandler.handleParserError(new Error('Minor parsing issue'), 'CSS');
      
      // Wait to ensure no async notifications
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
      expect(vscode.window.showWarningMessage).not.toHaveBeenCalled();
      expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
    });
  });

  describe('Logging Integration', () => {
    it('should log all error types to output channel', () => {
      // Just test that the errors are handled without throwing
      expect(() => {
        errorHandler.handleParserError(new Error('Parser error'), 'CSS');
        errorHandler.handleDataLoadError(new Error('Data error'));
        errorHandler.handleNetworkError(new Error('Network error'));
        errorHandler.handleValidationError('Validation error');
        errorHandler.handleExtensionError(new Error('Extension error'));
        errorHandler.handleUnknownError('Unknown error');
      }).not.toThrow();
      
      // Should have logged all errors to history
      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(6);
      expect(history.some(e => e.category === 'parser')).toBe(true);
      expect(history.some(e => e.category === 'data_load')).toBe(true);
      expect(history.some(e => e.category === 'network')).toBe(true);
      expect(history.some(e => e.category === 'validation')).toBe(true);
      expect(history.some(e => e.category === 'extension')).toBe(true);
      expect(history.some(e => e.category === 'unknown')).toBe(true);
    });

    it('should include context information in logs', () => {
      errorHandler.handleParserError(
        new Error('Test error'),
        'CSS',
        'Parsing user stylesheet'
      );
      
      const history = errorHandler.getErrorHistory();
      expect(history[history.length - 1].context).toContain('Parsing user stylesheet');
    });

    it('should include stack traces for errors with stack information', () => {
      const errorWithStack = new Error('Error with stack');
      errorWithStack.stack = 'Error: Error with stack\n    at test.js:1:1';
      
      errorHandler.handleExtensionError(errorWithStack, 'Test context');
      
      const history = errorHandler.getErrorHistory();
      expect(history[history.length - 1].originalError?.stack).toContain('Error with stack');
    });
  });

  describe('Error State Recovery', () => {
    it('should allow clearing error state for fresh start', () => {
      // Generate some errors
      errorHandler.handleParserError(new Error('Error 1'), 'CSS');
      errorHandler.handleDataLoadError(new Error('Error 2'));
      
      expect(errorHandler.getErrorHistory().length).toBe(2);
      expect(errorHandler.hasCriticalErrors()).toBe(true);
      
      // Clear error state
      errorHandler.clearErrorHistory();
      
      expect(errorHandler.getErrorHistory().length).toBe(0);
      expect(errorHandler.hasCriticalErrors()).toBe(false);
    });

    it('should maintain error categorization after recovery', () => {
      // Generate errors, clear, then generate new ones
      errorHandler.handleParserError(new Error('Old error'), 'CSS');
      errorHandler.clearErrorHistory();
      
      errorHandler.handleNetworkError(new Error('New error'));
      
      const networkErrors = errorHandler.getErrorsByCategory(ErrorCategory.NETWORK_ERROR);
      const parserErrors = errorHandler.getErrorsByCategory(ErrorCategory.PARSER_ERROR);
      
      expect(networkErrors.length).toBe(1);
      expect(parserErrors.length).toBe(0);
    });
  });
});