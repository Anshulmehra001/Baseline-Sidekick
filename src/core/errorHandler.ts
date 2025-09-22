import * as vscode from 'vscode';

/**
 * Error categories for different types of errors in the extension
 */
export enum ErrorCategory {
  PARSER_ERROR = 'parser',
  DATA_LOAD_ERROR = 'data_load',
  NETWORK_ERROR = 'network',
  VALIDATION_ERROR = 'validation',
  EXTENSION_ERROR = 'extension',
  UNKNOWN_ERROR = 'unknown'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Interface for structured error information
 */
export interface ErrorInfo {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  context?: string;
  timestamp: Date;
  userNotification?: boolean;
}

/**
 * Comprehensive error handler for the Baseline Sidekick extension
 * Provides categorized error handling, logging, and user notifications
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private logger: Logger;
  private errorHistory: ErrorInfo[] = [];
  private maxHistorySize = 100;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.logger = Logger.getInstance();
  }

  /**
   * Get the singleton instance of ErrorHandler
   */
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle parser-related errors with graceful degradation
   * @param error The original error
   * @param fileType Type of file being parsed (CSS, JS, HTML)
   * @param context Additional context information
   */
  public handleParserError(error: Error, fileType: string, context?: string): void {
    const errorInfo: ErrorInfo = {
      category: ErrorCategory.PARSER_ERROR,
      severity: ErrorSeverity.LOW,
      message: `Failed to parse ${fileType} file: ${error.message}`,
      originalError: error,
      context: context || `Parsing ${fileType} content`,
      timestamp: new Date(),
      userNotification: false
    };

    this.processError(errorInfo);
  }

  /**
   * Handle data loading errors with user notification for critical failures
   * @param error The original error
   * @param context Additional context information
   */
  public handleDataLoadError(error: Error, context?: string): void {
    const errorInfo: ErrorInfo = {
      category: ErrorCategory.DATA_LOAD_ERROR,
      severity: ErrorSeverity.CRITICAL,
      message: `Failed to load web-features data: ${error.message}`,
      originalError: error,
      context: context || 'Loading web-features dataset',
      timestamp: new Date(),
      userNotification: true
    };

    this.processError(errorInfo);
  }

  /**
   * Handle network-related errors with retry suggestions
   * @param error The original error
   * @param context Additional context information
   */
  public handleNetworkError(error: Error, context?: string): void {
    const errorInfo: ErrorInfo = {
      category: ErrorCategory.NETWORK_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: `Network error: ${error.message}`,
      originalError: error,
      context: context || 'Network operation',
      timestamp: new Date(),
      userNotification: true
    };

    this.processError(errorInfo);
  }

  /**
   * Handle validation errors for user input or configuration
   * @param message Error message
   * @param context Additional context information
   */
  public handleValidationError(message: string, context?: string): void {
    const errorInfo: ErrorInfo = {
      category: ErrorCategory.VALIDATION_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: `Validation error: ${message}`,
      context: context || 'Input validation',
      timestamp: new Date(),
      userNotification: true
    };

    this.processError(errorInfo);
  }

  /**
   * Handle general extension errors
   * @param error The original error
   * @param context Additional context information
   */
  public handleExtensionError(error: Error, context?: string): void {
    const errorInfo: ErrorInfo = {
      category: ErrorCategory.EXTENSION_ERROR,
      severity: ErrorSeverity.HIGH,
      message: `Extension error: ${error.message}`,
      originalError: error,
      context: context || 'Extension operation',
      timestamp: new Date(),
      userNotification: true
    };

    this.processError(errorInfo);
  }

  /**
   * Handle unknown or unexpected errors
   * @param error The original error or error message
   * @param context Additional context information
   */
  public handleUnknownError(error: Error | string, context?: string): void {
    const message = error instanceof Error ? error.message : error;
    const originalError = error instanceof Error ? error : undefined;

    const errorInfo: ErrorInfo = {
      category: ErrorCategory.UNKNOWN_ERROR,
      severity: ErrorSeverity.HIGH,
      message: `Unknown error: ${message}`,
      originalError,
      context: context || 'Unknown operation',
      timestamp: new Date(),
      userNotification: true
    };

    this.processError(errorInfo);
  }

  /**
   * Process error information with logging and optional user notification
   * @param errorInfo Structured error information
   */
  private processError(errorInfo: ErrorInfo): void {
    // Add to error history
    this.addToHistory(errorInfo);

    // Log the error
    this.logger.logError(errorInfo);

    // Show user notification if required
    if (errorInfo.userNotification) {
      this.showUserNotification(errorInfo);
    }
  }

  /**
   * Add error to history with size management
   * @param errorInfo Error information to add
   */
  private addToHistory(errorInfo: ErrorInfo): void {
    this.errorHistory.push(errorInfo);
    
    // Maintain history size limit
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  /**
   * Show appropriate user notification based on error severity
   * @param errorInfo Error information
   */
  private async showUserNotification(errorInfo: ErrorInfo): Promise<void> {
    const message = this.formatUserMessage(errorInfo);

    switch (errorInfo.severity) {
      case ErrorSeverity.CRITICAL:
        await vscode.window.showErrorMessage(message, 'View Logs', 'Retry');
        break;
      case ErrorSeverity.HIGH:
        await vscode.window.showErrorMessage(message, 'View Logs');
        break;
      case ErrorSeverity.MEDIUM:
        await vscode.window.showWarningMessage(message);
        break;
      case ErrorSeverity.LOW:
        await vscode.window.showInformationMessage(message);
        break;
    }
  }

  /**
   * Format error message for user display
   * @param errorInfo Error information
   * @returns Formatted user-friendly message
   */
  private formatUserMessage(errorInfo: ErrorInfo): string {
    switch (errorInfo.category) {
      case ErrorCategory.DATA_LOAD_ERROR:
        return 'Baseline Sidekick: Failed to load compatibility data. Some features may not work correctly.';
      case ErrorCategory.NETWORK_ERROR:
        return 'Baseline Sidekick: Network error occurred. Please check your connection and try again.';
      case ErrorCategory.VALIDATION_ERROR:
        return `Baseline Sidekick: ${errorInfo.message}`;
      case ErrorCategory.EXTENSION_ERROR:
        return 'Baseline Sidekick: An extension error occurred. Please check the logs for details.';
      default:
        return `Baseline Sidekick: ${errorInfo.message}`;
    }
  }

  /**
   * Get error history for debugging purposes
   * @returns Array of error information
   */
  public getErrorHistory(): ErrorInfo[] {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  public clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Get errors by category
   * @param category Error category to filter by
   * @returns Array of errors in the specified category
   */
  public getErrorsByCategory(category: ErrorCategory): ErrorInfo[] {
    return this.errorHistory.filter(error => error.category === category);
  }

  /**
   * Check if there are any critical errors
   * @returns True if critical errors exist
   */
  public hasCriticalErrors(): boolean {
    return this.errorHistory.some(error => error.severity === ErrorSeverity.CRITICAL);
  }
}

/**
 * Logging levels for different types of messages
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Logger class for debugging and error tracking
 */
export class Logger {
  private static instance: Logger;
  private outputChannel: vscode.OutputChannel;
  private logLevel: LogLevel = LogLevel.INFO;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.outputChannel = vscode.window.createOutputChannel('Baseline Sidekick');
  }

  /**
   * Get the singleton instance of Logger
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set the logging level
   * @param level Minimum log level to output
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Log debug information
   * @param message Debug message
   * @param context Optional context information
   */
  public debug(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.writeLog(LogLevel.DEBUG, message, context);
    }
  }

  /**
   * Log informational messages
   * @param message Info message
   * @param context Optional context information
   */
  public info(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.writeLog(LogLevel.INFO, message, context);
    }
  }

  /**
   * Log warning messages
   * @param message Warning message
   * @param context Optional context information
   */
  public warn(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.writeLog(LogLevel.WARN, message, context);
    }
  }

  /**
   * Log error messages
   * @param errorInfo Error information or message
   * @param context Optional context information
   */
  public error(errorInfo: ErrorInfo | string, context?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      if (typeof errorInfo === 'string') {
        this.writeLog(LogLevel.ERROR, errorInfo, context);
      } else {
        this.logError(errorInfo);
      }
    }
  }

  /**
   * Log structured error information
   * @param errorInfo Structured error information
   */
  public logError(errorInfo: ErrorInfo): void {
    const timestamp = errorInfo.timestamp.toISOString();
    const contextStr = errorInfo.context ? ` [${errorInfo.context}]` : '';
    const stackTrace = errorInfo.originalError?.stack ? `\nStack: ${errorInfo.originalError.stack}` : '';
    
    const logMessage = `[${timestamp}] ERROR [${errorInfo.category}:${errorInfo.severity}]${contextStr}: ${errorInfo.message}${stackTrace}`;
    
    this.outputChannel.appendLine(logMessage);
    console.error(logMessage);
  }

  /**
   * Write log message to output channel
   * @param level Log level
   * @param message Log message
   * @param context Optional context information
   */
  private writeLog(level: LogLevel, message: string, context?: any): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
    
    this.outputChannel.appendLine(logMessage);
    
    // Also log to console for development
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
    }
  }

  /**
   * Check if message should be logged based on current log level
   * @param level Message log level
   * @returns True if message should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Show the output channel to the user
   */
  public show(): void {
    this.outputChannel.show();
  }

  /**
   * Clear the output channel
   */
  public clear(): void {
    this.outputChannel.clear();
  }

  /**
   * Dispose of the logger and clean up resources
   */
  public dispose(): void {
    this.outputChannel.dispose();
  }
}