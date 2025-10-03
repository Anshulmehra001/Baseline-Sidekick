"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = exports.ErrorHandler = exports.ErrorSeverity = exports.ErrorCategory = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Error categories for different types of errors in the extension
 */
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["PARSER_ERROR"] = "parser";
    ErrorCategory["DATA_LOAD_ERROR"] = "data_load";
    ErrorCategory["NETWORK_ERROR"] = "network";
    ErrorCategory["VALIDATION_ERROR"] = "validation";
    ErrorCategory["EXTENSION_ERROR"] = "extension";
    ErrorCategory["UNKNOWN_ERROR"] = "unknown";
})(ErrorCategory = exports.ErrorCategory || (exports.ErrorCategory = {}));
/**
 * Error severity levels
 */
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity = exports.ErrorSeverity || (exports.ErrorSeverity = {}));
/**
 * Comprehensive error handler for the Baseline Sidekick extension
 * Provides categorized error handling, logging, and user notifications
 */
class ErrorHandler {
    /**
     * Private constructor to enforce singleton pattern
     */
    constructor() {
        this.errorHistory = [];
        this.maxHistorySize = 100;
        this.logger = Logger.getInstance();
    }
    /**
     * Get the singleton instance of ErrorHandler
     */
    static getInstance() {
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
    handleParserError(error, fileType, context) {
        const errorInfo = {
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
    handleDataLoadError(error, context) {
        const errorInfo = {
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
    handleNetworkError(error, context) {
        const errorInfo = {
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
    handleValidationError(message, context) {
        const errorInfo = {
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
    handleExtensionError(error, context) {
        const errorInfo = {
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
    handleUnknownError(error, context) {
        const message = error instanceof Error ? error.message : error;
        const originalError = error instanceof Error ? error : undefined;
        const errorInfo = {
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
    processError(errorInfo) {
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
    addToHistory(errorInfo) {
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
    async showUserNotification(errorInfo) {
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
    formatUserMessage(errorInfo) {
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
    getErrorHistory() {
        return [...this.errorHistory];
    }
    /**
     * Clear error history
     */
    clearErrorHistory() {
        this.errorHistory = [];
    }
    /**
     * Get errors by category
     * @param category Error category to filter by
     * @returns Array of errors in the specified category
     */
    getErrorsByCategory(category) {
        return this.errorHistory.filter(error => error.category === category);
    }
    /**
     * Check if there are any critical errors
     * @returns True if critical errors exist
     */
    hasCriticalErrors() {
        return this.errorHistory.some(error => error.severity === ErrorSeverity.CRITICAL);
    }
}
exports.ErrorHandler = ErrorHandler;
/**
 * Logging levels for different types of messages
 */
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
/**
 * Logger class for debugging and error tracking
 */
class Logger {
    /**
     * Private constructor to enforce singleton pattern
     */
    constructor() {
        this.logLevel = LogLevel.INFO;
        // Some tests mock vscode without window or createOutputChannel; fall back to console
        let oc;
        try {
            const win = vscode.window;
            if (win && typeof win.createOutputChannel === 'function') {
                oc = win.createOutputChannel('Baseline Sidekick');
            }
        }
        catch {
            // Accessing missing export on Vitest mocks can throw; ignore and use fallback
            oc = undefined;
        }
        if (oc) {
            this.outputChannel = oc;
        }
        else {
            const consoleChannel = {
                appendLine: (msg) => console.log(msg),
                clear: () => { },
                show: () => { },
                dispose: () => { },
            };
            this.outputChannel = consoleChannel;
        }
    }
    /**
     * Get the singleton instance of Logger
     */
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    /**
     * Set the logging level
     * @param level Minimum log level to output
     */
    setLogLevel(level) {
        this.logLevel = level;
    }
    /**
     * Log debug information
     * @param message Debug message
     * @param context Optional context information
     */
    debug(message, context) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            this.writeLog(LogLevel.DEBUG, message, context);
        }
    }
    /**
     * Log informational messages
     * @param message Info message
     * @param context Optional context information
     */
    info(message, context) {
        if (this.shouldLog(LogLevel.INFO)) {
            this.writeLog(LogLevel.INFO, message, context);
        }
    }
    /**
     * Log warning messages
     * @param message Warning message
     * @param context Optional context information
     */
    warn(message, context) {
        if (this.shouldLog(LogLevel.WARN)) {
            this.writeLog(LogLevel.WARN, message, context);
        }
    }
    /**
     * Log error messages
     * @param errorInfo Error information or message
     * @param context Optional context information
     */
    error(errorInfo, context) {
        if (this.shouldLog(LogLevel.ERROR)) {
            if (typeof errorInfo === 'string') {
                this.writeLog(LogLevel.ERROR, errorInfo, context);
            }
            else {
                this.logError(errorInfo);
            }
        }
    }
    /**
     * Log structured error information
     * @param errorInfo Structured error information
     */
    logError(errorInfo) {
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
    writeLog(level, message, context) {
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
    shouldLog(level) {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        const currentLevelIndex = levels.indexOf(this.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= currentLevelIndex;
    }
    /**
     * Show the output channel to the user
     */
    show() {
        this.outputChannel.show();
    }
    /**
     * Clear the output channel
     */
    clear() {
        this.outputChannel.clear();
    }
    /**
     * Dispose of the logger and clean up resources
     */
    dispose() {
        this.outputChannel.dispose();
    }
}
exports.Logger = Logger;
//# sourceMappingURL=errorHandler.js.map