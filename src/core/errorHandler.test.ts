import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ErrorHandler, Logger, ErrorCategory, ErrorSeverity, LogLevel } from './errorHandler';

// Mock VS Code API
const mockOutputChannel = {
  appendLine: vi.fn(),
  show: vi.fn(),
  clear: vi.fn(),
  dispose: vi.fn()
};

vi.mock('vscode', () => ({
  window: {
    showErrorMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showInformationMessage: vi.fn(),
    createOutputChannel: vi.fn(() => mockOutputChannel)
  }
}));

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Get fresh instance
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearErrorHistory();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ErrorHandler.getInstance();
      const instance2 = ErrorHandler.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Parser Error Handling', () => {
    it('should handle parser errors with low severity', () => {
      const testError = new Error('CSS parsing failed');
      
      errorHandler.handleParserError(testError, 'CSS', 'Test context');
      
      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].category).toBe(ErrorCategory.PARSER_ERROR);
      expect(history[0].severity).toBe(ErrorSeverity.LOW);
      expect(history[0].message).toContain('CSS');
      expect(history[0].originalError).toBe(testError);
      expect(history[0].context).toBe('Test context');
      expect(history[0].userNotification).toBe(false);
    });

    it('should not show user notification for parser errors', async () => {
      const testError = new Error('JS parsing failed');
      const { window } = await import('vscode');
      
      errorHandler.handleParserError(testError, 'JavaScript');
      
      expect(window.showErrorMessage).not.toHaveBeenCalled();
      expect(window.showWarningMessage).not.toHaveBeenCalled();
      expect(window.showInformationMessage).not.toHaveBeenCalled();
    });
  });

  describe('Data Load Error Handling', () => {
    it('should handle data load errors with critical severity', () => {
      const testError = new Error('Failed to load web-features');
      
      errorHandler.handleDataLoadError(testError, 'Loading dataset');
      
      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].category).toBe(ErrorCategory.DATA_LOAD_ERROR);
      expect(history[0].severity).toBe(ErrorSeverity.CRITICAL);
      expect(history[0].userNotification).toBe(true);
    });

    it('should show error message for data load errors', async () => {
      const testError = new Error('Failed to load web-features');
      const { window } = await import('vscode');
      vi.mocked(window.showErrorMessage).mockResolvedValue(undefined);
      
      errorHandler.handleDataLoadError(testError);
      
      // Wait for async notification
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load compatibility data'),
        'View Logs',
        'Retry'
      );
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network errors with medium severity', () => {
      const testError = new Error('Network timeout');
      
      errorHandler.handleNetworkError(testError, 'API request');
      
      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].category).toBe(ErrorCategory.NETWORK_ERROR);
      expect(history[0].severity).toBe(ErrorSeverity.MEDIUM);
      expect(history[0].userNotification).toBe(true);
    });
  });

  describe('Validation Error Handling', () => {
    it('should handle validation errors', () => {
      errorHandler.handleValidationError('Invalid input', 'Input validation');
      
      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].category).toBe(ErrorCategory.VALIDATION_ERROR);
      expect(history[0].severity).toBe(ErrorSeverity.MEDIUM);
      expect(history[0].message).toContain('Invalid input');
    });
  });

  describe('Extension Error Handling', () => {
    it('should handle extension errors with high severity', () => {
      const testError = new Error('Extension malfunction');
      
      errorHandler.handleExtensionError(testError, 'Provider registration');
      
      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].category).toBe(ErrorCategory.EXTENSION_ERROR);
      expect(history[0].severity).toBe(ErrorSeverity.HIGH);
      expect(history[0].userNotification).toBe(true);
    });
  });

  describe('Unknown Error Handling', () => {
    it('should handle Error objects', () => {
      const testError = new Error('Unknown issue');
      
      errorHandler.handleUnknownError(testError, 'Unknown operation');
      
      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].category).toBe(ErrorCategory.UNKNOWN_ERROR);
      expect(history[0].severity).toBe(ErrorSeverity.HIGH);
      expect(history[0].originalError).toBe(testError);
    });

    it('should handle string error messages', () => {
      errorHandler.handleUnknownError('String error message');
      
      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].message).toContain('String error message');
      expect(history[0].originalError).toBeUndefined();
    });
  });

  describe('Error History Management', () => {
    it('should maintain error history', () => {
      errorHandler.handleParserError(new Error('Error 1'), 'CSS');
      errorHandler.handleParserError(new Error('Error 2'), 'JS');
      
      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(2);
      expect(history[0].message).toContain('Error 1');
      expect(history[1].message).toContain('Error 2');
    });

    it('should clear error history', () => {
      errorHandler.handleParserError(new Error('Test error'), 'CSS');
      expect(errorHandler.getErrorHistory()).toHaveLength(1);
      
      errorHandler.clearErrorHistory();
      expect(errorHandler.getErrorHistory()).toHaveLength(0);
    });

    it('should filter errors by category', () => {
      errorHandler.handleParserError(new Error('Parser error'), 'CSS');
      errorHandler.handleDataLoadError(new Error('Data error'));
      errorHandler.handleNetworkError(new Error('Network error'));
      
      const parserErrors = errorHandler.getErrorsByCategory(ErrorCategory.PARSER_ERROR);
      const dataErrors = errorHandler.getErrorsByCategory(ErrorCategory.DATA_LOAD_ERROR);
      
      expect(parserErrors).toHaveLength(1);
      expect(dataErrors).toHaveLength(1);
      expect(parserErrors[0].message).toContain('Parser error');
      expect(dataErrors[0].message).toContain('Data error');
    });

    it('should detect critical errors', () => {
      expect(errorHandler.hasCriticalErrors()).toBe(false);
      
      errorHandler.handleDataLoadError(new Error('Critical error'));
      expect(errorHandler.hasCriticalErrors()).toBe(true);
    });
  });

  describe('User Notifications', () => {
    it('should show appropriate notification based on severity', async () => {
      const { window } = await import('vscode');
      vi.mocked(window.showErrorMessage).mockResolvedValue(undefined);
      vi.mocked(window.showWarningMessage).mockResolvedValue(undefined);
      vi.mocked(window.showInformationMessage).mockResolvedValue(undefined);
      
      // Critical error
      errorHandler.handleDataLoadError(new Error('Critical'));
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(window.showErrorMessage).toHaveBeenCalled();
      
      // Medium error
      errorHandler.handleNetworkError(new Error('Medium'));
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(window.showWarningMessage).toHaveBeenCalled();
      
      // Note: Low severity errors don't trigger notifications in parser errors
    });

    it('should format user messages appropriately', async () => {
      const { window } = await import('vscode');
      vi.mocked(window.showErrorMessage).mockResolvedValue(undefined);
      
      errorHandler.handleDataLoadError(new Error('Test error'));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load compatibility data'),
        'View Logs',
        'Retry'
      );
    });
  });
});

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    vi.clearAllMocks();
    logger = Logger.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Log Level Management', () => {
    it('should respect log level settings', () => {
      logger.setLogLevel(LogLevel.WARN);
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
      
      // Only warn and error should be logged
      expect(mockOutputChannel.appendLine).toHaveBeenCalledTimes(2);
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('WARN: Warning message')
      );
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Error message')
      );
    });

    it('should log all levels when set to DEBUG', () => {
      logger.setLogLevel(LogLevel.DEBUG);
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
      
      expect(mockOutputChannel.appendLine).toHaveBeenCalledTimes(4);
    });
  });

  describe('Logging Methods', () => {
    beforeEach(() => {
      logger.setLogLevel(LogLevel.DEBUG);
    });

    it('should log debug messages', () => {
      logger.debug('Debug message', { context: 'test' });
      
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringMatching(/DEBUG: Debug message.*"context":"test"/)
      );
    });

    it('should log info messages', () => {
      logger.info('Info message');
      
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Info message')
      );
    });

    it('should log warning messages', () => {
      logger.warn('Warning message');
      
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('WARN: Warning message')
      );
    });

    it('should log error messages', () => {
      logger.error('Error message');
      
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Error message')
      );
    });
  });

  describe('Structured Error Logging', () => {
    it('should log structured error information', () => {
      const errorInfo = {
        category: ErrorCategory.PARSER_ERROR,
        severity: ErrorSeverity.LOW,
        message: 'Test error message',
        originalError: new Error('Original error'),
        context: 'Test context',
        timestamp: new Date(),
        userNotification: false
      };
      
      logger.logError(errorInfo);
      
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR \[parser:low\].*Test error message/)
      );
    });

    it('should include stack trace when available', () => {
      const originalError = new Error('Test error');
      originalError.stack = 'Error: Test error\n    at test.js:1:1';
      
      const errorInfo = {
        category: ErrorCategory.EXTENSION_ERROR,
        severity: ErrorSeverity.HIGH,
        message: 'Extension error',
        originalError,
        context: 'Test context',
        timestamp: new Date(),
        userNotification: true
      };
      
      logger.logError(errorInfo);
      
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Stack: Error: Test error')
      );
    });
  });

  describe('Output Channel Management', () => {
    it('should show output channel', () => {
      logger.show();
      expect(mockOutputChannel.show).toHaveBeenCalled();
    });

    it('should clear output channel', () => {
      logger.clear();
      expect(mockOutputChannel.clear).toHaveBeenCalled();
    });

    it('should dispose output channel', () => {
      logger.dispose();
      expect(mockOutputChannel.dispose).toHaveBeenCalled();
    });
  });
});

describe('Error Handler Integration', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearErrorHistory();
  });

  it('should integrate with logger for error tracking', () => {
    const testError = new Error('Integration test error');
    
    errorHandler.handleExtensionError(testError, 'Integration test');
    
    // Should log the error
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringMatching(/ERROR \[extension:high\].*Integration test error/)
    );
    
    // Should add to history
    const history = errorHandler.getErrorHistory();
    expect(history).toHaveLength(1);
    expect(history[0].originalError).toBe(testError);
  });

  it('should handle multiple error types in sequence', () => {
    errorHandler.handleParserError(new Error('Parser error'), 'CSS');
    errorHandler.handleDataLoadError(new Error('Data error'));
    errorHandler.handleNetworkError(new Error('Network error'));
    
    const history = errorHandler.getErrorHistory();
    expect(history).toHaveLength(3);
    
    const categories = history.map(error => error.category);
    expect(categories).toContain(ErrorCategory.PARSER_ERROR);
    expect(categories).toContain(ErrorCategory.DATA_LOAD_ERROR);
    expect(categories).toContain(ErrorCategory.NETWORK_ERROR);
  });
});