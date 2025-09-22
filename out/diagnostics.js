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
exports.DiagnosticController = void 0;
const vscode = __importStar(require("vscode"));
const baselineData_1 = require("./core/baselineData");
const cssParser_1 = require("./core/cssParser");
const jsParser_1 = require("./core/jsParser");
const htmlParser_1 = require("./core/htmlParser");
const errorHandler_1 = require("./core/errorHandler");
const performanceOptimizer_1 = require("./core/performanceOptimizer");
/**
 * Diagnostic controller for managing Baseline compatibility diagnostics across multiple languages
 * Provides real-time analysis of CSS, JavaScript, and HTML files for non-Baseline features
 */
class DiagnosticController {
    /**
     * Creates a new DiagnosticController instance
     * @param context VS Code extension context
     */
    constructor(context) {
        // Create diagnostic collection for Baseline compatibility issues
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('baseline-sidekick');
        this.baselineDataManager = baselineData_1.BaselineDataManager.getInstance();
        this.errorHandler = errorHandler_1.ErrorHandler.getInstance();
        this.logger = errorHandler_1.Logger.getInstance();
        this.performanceOptimizer = performanceOptimizer_1.PerformanceOptimizer.getInstance();
        // Create debounced version of updateDiagnostics
        this.debouncedUpdateDiagnostics = this.performanceOptimizer.debounce('diagnostics', (document) => this.updateDiagnosticsInternal(document));
        // Register for disposal when extension deactivates
        context.subscriptions.push(this.diagnosticCollection);
    }
    /**
     * Updates diagnostics for a document based on its language type (debounced)
     * Switches on document.languageId to call appropriate parser
     * @param document VS Code text document to analyze
     */
    updateDiagnostics(document) {
        // Use debounced version to prevent excessive updates during rapid typing
        this.debouncedUpdateDiagnostics(document);
    }
    /**
     * Internal method that performs the actual diagnostic update
     * @param document VS Code text document to analyze
     */
    async updateDiagnosticsInternal(document) {
        try {
            this.logger.debug(`Updating diagnostics for ${document.uri.fsPath}`, { languageId: document.languageId });
            // Check if file should be processed based on size limits
            if (!this.performanceOptimizer.shouldProcessFile(document)) {
                this.logger.warn(`Skipping analysis of ${document.uri.fsPath} due to size limits`);
                return;
            }
            // Ensure baseline data is loaded
            if (!this.baselineDataManager.isInitialized()) {
                await this.baselineDataManager.initialize();
            }
            // Clear existing diagnostics for this document
            this.diagnosticCollection.delete(document.uri);
            // Track memory usage for this operation
            const fileSize = Buffer.byteLength(document.getText(), 'utf8');
            const operationId = `diagnostics-${document.uri.fsPath}`;
            this.performanceOptimizer.trackMemoryUsage(operationId, fileSize);
            try {
                // Analyze document based on language type with timeout
                const diagnostics = await this.performanceOptimizer.withTimeout(() => this.analyzeDocument(document), this.performanceOptimizer.getConfiguration().parseTimeout);
                // Set new diagnostics if any were found
                if (diagnostics.length > 0) {
                    this.diagnosticCollection.set(document.uri, diagnostics);
                    this.logger.debug(`Found ${diagnostics.length} compatibility issues in ${document.uri.fsPath}`);
                }
            }
            finally {
                // Release memory tracking
                this.performanceOptimizer.releaseMemoryTracking(operationId);
            }
        }
        catch (error) {
            this.errorHandler.handleExtensionError(error instanceof Error ? error : new Error('Unknown error updating diagnostics'), `Updating diagnostics for ${document.uri.fsPath}`);
            // Don't throw error to avoid breaking the extension
            // Just log and continue gracefully
        }
    }
    /**
     * Analyzes a document and generates diagnostics for non-Baseline features
     * @param document VS Code text document to analyze
     * @returns Array of enhanced diagnostics
     */
    async analyzeDocument(document) {
        const diagnostics = [];
        const content = document.getText();
        // Check if this is a large file that should use async processing
        const isLargeFile = this.performanceOptimizer.isLargeFile(document);
        if (isLargeFile) {
            this.logger.debug(`Processing large file asynchronously: ${document.uri.fsPath}`);
        }
        // Switch on document language ID to call appropriate parser
        switch (document.languageId) {
            case 'css':
            case 'scss':
            case 'sass':
            case 'less':
                if (isLargeFile) {
                    await this.analyzeCssDocumentAsync(content, document, diagnostics);
                }
                else {
                    await this.analyzeCssDocument(content, document, diagnostics);
                }
                break;
            case 'javascript':
            case 'typescript':
            case 'javascriptreact':
            case 'typescriptreact':
                if (isLargeFile) {
                    await this.analyzeJavaScriptDocumentAsync(content, document, diagnostics);
                }
                else {
                    await this.analyzeJavaScriptDocument(content, document, diagnostics);
                }
                break;
            case 'html':
            case 'xml':
                if (isLargeFile) {
                    await this.analyzeHtmlDocumentAsync(content, document, diagnostics);
                }
                else {
                    await this.analyzeHtmlDocument(content, document, diagnostics);
                }
                break;
            default:
                // Unsupported language type, no analysis needed
                break;
        }
        return diagnostics;
    }
    /**
     * Analyzes CSS content and generates diagnostics for non-Baseline CSS features
     * @param content CSS content to analyze
     * @param document VS Code document
     * @param diagnostics Array to collect diagnostics
     */
    async analyzeCssDocument(content, document, diagnostics) {
        try {
            // Create cache key based on content hash and document URI
            const cacheKey = `css-${document.uri.fsPath}-${this.hashContent(content)}`;
            // Use memoized parser for better performance
            const memoizedParser = this.performanceOptimizer.memoize((content, document) => cssParser_1.CssParser.parseCss(content, document), (content, document) => `css-${document.uri.fsPath}-${this.hashContent(content)}`);
            // Parse CSS content to extract features and their locations
            const parseResult = memoizedParser(content, document);
            // Check each feature for Baseline compatibility
            for (const featureId of parseResult.features) {
                const isSupported = this.baselineDataManager.isBaselineSupported(featureId);
                if (!isSupported) {
                    // Get feature data for additional information
                    const featureData = this.baselineDataManager.getFeatureData(featureId);
                    // Get locations for this feature
                    const locations = parseResult.locations.get(featureId) || [];
                    // Create diagnostic for each location where the feature is used
                    for (const range of locations) {
                        const diagnostic = this.createEnhancedDiagnostic(range, featureId, featureData?.name || featureId, 'CSS');
                        diagnostics.push(diagnostic);
                    }
                }
            }
        }
        catch (error) {
            this.errorHandler.handleParserError(error instanceof Error ? error : new Error('Unknown error analyzing CSS document'), 'CSS', `Analyzing CSS document: ${document.uri.fsPath}`);
            // Continue gracefully on parse errors
        }
    }
    /**
     * Analyzes CSS content asynchronously for large files
     */
    async analyzeCssDocumentAsync(content, document, diagnostics) {
        return new Promise((resolve) => {
            // Use setImmediate to yield control and prevent blocking
            setImmediate(async () => {
                try {
                    await this.analyzeCssDocument(content, document, diagnostics);
                    resolve();
                }
                catch (error) {
                    this.errorHandler.handleParserError(error instanceof Error ? error : new Error('Unknown error in async CSS analysis'), 'CSS', `Async CSS analysis: ${document.uri.fsPath}`);
                    resolve(); // Resolve even on error to prevent hanging
                }
            });
        });
    }
    /**
     * Analyzes JavaScript content and generates diagnostics for non-Baseline JavaScript features
     * @param content JavaScript content to analyze
     * @param document VS Code document
     * @param diagnostics Array to collect diagnostics
     */
    async analyzeJavaScriptDocument(content, document, diagnostics) {
        try {
            // Use memoized parser for better performance
            const memoizedParser = this.performanceOptimizer.memoize((content, document) => jsParser_1.JsParser.parseJavaScript(content, document), (content, document) => `js-${document.uri.fsPath}-${this.hashContent(content)}`);
            // Parse JavaScript content to extract features and their locations
            const parseResult = memoizedParser(content, document);
            // Check each feature for Baseline compatibility
            for (const featureId of parseResult.features) {
                const isSupported = this.baselineDataManager.isBaselineSupported(featureId);
                if (!isSupported) {
                    // Get feature data for additional information
                    const featureData = this.baselineDataManager.getFeatureData(featureId);
                    // Get locations for this feature
                    const locations = parseResult.locations.get(featureId) || [];
                    // Create diagnostic for each location where the feature is used
                    for (const range of locations) {
                        const diagnostic = this.createEnhancedDiagnostic(range, featureId, featureData?.name || featureId, 'JavaScript');
                        diagnostics.push(diagnostic);
                    }
                }
            }
        }
        catch (error) {
            this.errorHandler.handleParserError(error instanceof Error ? error : new Error('Unknown error analyzing JavaScript document'), 'JavaScript', `Analyzing JavaScript document: ${document.uri.fsPath}`);
            // Continue gracefully on parse errors
        }
    }
    /**
     * Analyzes JavaScript content asynchronously for large files
     */
    async analyzeJavaScriptDocumentAsync(content, document, diagnostics) {
        return new Promise((resolve) => {
            // Use setImmediate to yield control and prevent blocking
            setImmediate(async () => {
                try {
                    await this.analyzeJavaScriptDocument(content, document, diagnostics);
                    resolve();
                }
                catch (error) {
                    this.errorHandler.handleParserError(error instanceof Error ? error : new Error('Unknown error in async JavaScript analysis'), 'JavaScript', `Async JavaScript analysis: ${document.uri.fsPath}`);
                    resolve(); // Resolve even on error to prevent hanging
                }
            });
        });
    }
    /**
     * Analyzes HTML content and generates diagnostics for non-Baseline HTML features
     * @param content HTML content to analyze
     * @param document VS Code document
     * @param diagnostics Array to collect diagnostics
     */
    async analyzeHtmlDocument(content, document, diagnostics) {
        try {
            // Use memoized parser for better performance
            const memoizedParser = this.performanceOptimizer.memoize((content, document) => htmlParser_1.HtmlParser.parseHtml(content, document), (content, document) => `html-${document.uri.fsPath}-${this.hashContent(content)}`);
            // Parse HTML content to extract features and their locations
            const parseResult = memoizedParser(content, document);
            // Check each feature for Baseline compatibility
            for (const featureId of parseResult.features) {
                const isSupported = this.baselineDataManager.isBaselineSupported(featureId);
                if (!isSupported) {
                    // Get feature data for additional information
                    const featureData = this.baselineDataManager.getFeatureData(featureId);
                    // Get locations for this feature
                    const locations = parseResult.locations.get(featureId) || [];
                    // Create diagnostic for each location where the feature is used
                    for (const range of locations) {
                        const diagnostic = this.createEnhancedDiagnostic(range, featureId, featureData?.name || featureId, 'HTML');
                        diagnostics.push(diagnostic);
                    }
                }
            }
        }
        catch (error) {
            this.errorHandler.handleParserError(error instanceof Error ? error : new Error('Unknown error analyzing HTML document'), 'HTML', `Analyzing HTML document: ${document.uri.fsPath}`);
            // Continue gracefully on parse errors
        }
    }
    /**
     * Analyzes HTML content asynchronously for large files
     */
    async analyzeHtmlDocumentAsync(content, document, diagnostics) {
        return new Promise((resolve) => {
            // Use setImmediate to yield control and prevent blocking
            setImmediate(async () => {
                try {
                    await this.analyzeHtmlDocument(content, document, diagnostics);
                    resolve();
                }
                catch (error) {
                    this.errorHandler.handleParserError(error instanceof Error ? error : new Error('Unknown error in async HTML analysis'), 'HTML', `Async HTML analysis: ${document.uri.fsPath}`);
                    resolve(); // Resolve even on error to prevent hanging
                }
            });
        });
    }
    /**
     * Creates an enhanced diagnostic object with featureId stored in code property
     * @param range VS Code range where the feature is used
     * @param featureId Web-features ID
     * @param featureName Human-readable feature name
     * @param languageType Type of language (CSS, JavaScript, HTML)
     * @returns Enhanced diagnostic object
     */
    createEnhancedDiagnostic(range, featureId, featureName, languageType) {
        // Get feature data for more detailed message
        const featureData = this.baselineDataManager.getFeatureData(featureId);
        // Create descriptive message
        let message = `${languageType} feature "${featureName}" is not supported by Baseline`;
        // Add more specific information if available
        if (featureData) {
            const baseline = featureData.status.baseline;
            if (baseline === false) {
                message += ' (not supported by all browsers)';
            }
            else if (baseline === 'low') {
                message += ' (limited browser support)';
            }
        }
        // Create enhanced diagnostic with featureId in code property
        const diagnostic = {
            range,
            message,
            severity: vscode.DiagnosticSeverity.Warning,
            source: 'Baseline Sidekick',
            code: {
                value: featureId,
                target: vscode.Uri.parse(`https://web-platform-dx.github.io/web-features/${featureId}`)
            },
            tags: [vscode.DiagnosticTag.Deprecated] // Mark as potentially problematic
        };
        return diagnostic;
    }
    /**
     * Clears all diagnostics for a document
     * @param document VS Code document to clear diagnostics for
     */
    clearDiagnostics(document) {
        this.diagnosticCollection.delete(document.uri);
    }
    /**
     * Clears all diagnostics from the collection
     */
    clearAllDiagnostics() {
        this.diagnosticCollection.clear();
    }
    /**
     * Gets the diagnostic collection for external access
     * @returns VS Code diagnostic collection
     */
    getDiagnosticCollection() {
        return this.diagnosticCollection;
    }
    /**
     * Creates a simple hash of content for caching purposes
     */
    hashContent(content) {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }
    /**
     * Disposes of the diagnostic controller and cleans up resources
     */
    dispose() {
        this.diagnosticCollection.dispose();
        this.performanceOptimizer.dispose();
    }
}
exports.DiagnosticController = DiagnosticController;
//# sourceMappingURL=diagnostics.js.map