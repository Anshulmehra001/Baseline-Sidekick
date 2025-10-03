import * as vscode from 'vscode';
import { BaselineDataManager } from './core/baselineData';
import { CssParser } from './core/cssParser';
import { JsParser } from './core/jsParser';
import { HtmlParser } from './core/htmlParser';
import { ErrorHandler, Logger } from './core/errorHandler';
import { PerformanceOptimizer } from './core/performanceOptimizer';

/**
 * Enhanced diagnostic interface that includes feature ID in the code property
 */
export interface EnhancedDiagnostic extends vscode.Diagnostic {
  code: {
    value: string; // featureId
    target: vscode.Uri;
  };
}

/**
 * Diagnostic controller for managing Baseline compatibility diagnostics across multiple languages
 * Provides real-time analysis of CSS, JavaScript, and HTML files for non-Baseline features
 */
export class DiagnosticController {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private baselineDataManager: BaselineDataManager;
  private errorHandler: ErrorHandler;
  private logger: Logger;
  private performanceOptimizer: PerformanceOptimizer;
  private debouncedUpdateDiagnostics: (document: vscode.TextDocument) => void;

  /**
   * Creates a new DiagnosticController instance
   * @param context VS Code extension context
   */
  constructor(context: vscode.ExtensionContext) {
    // Create diagnostic collection for Baseline compatibility issues
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('baseline-sidekick');
    this.baselineDataManager = BaselineDataManager.getInstance();
    this.errorHandler = ErrorHandler.getInstance();
    this.logger = Logger.getInstance();
    this.performanceOptimizer = PerformanceOptimizer.getInstance();
    
    // Create debounced version of updateDiagnostics
    this.debouncedUpdateDiagnostics = this.performanceOptimizer.debounce(
      'diagnostics',
      (document: vscode.TextDocument) => this.updateDiagnosticsInternal(document)
    );
    
    // Register for disposal when extension deactivates
    context.subscriptions.push(this.diagnosticCollection);
  }

  /**
   * Updates diagnostics for a document based on its language type (debounced)
   * Switches on document.languageId to call appropriate parser
   * @param document VS Code text document to analyze
   */
  public updateDiagnostics(document: vscode.TextDocument): void {
    // Use debounced version to prevent excessive updates during rapid typing
    this.debouncedUpdateDiagnostics(document);
  }

  /**
   * Updates diagnostics immediately (for testing purposes)
   * @param document VS Code text document to analyze
   */
  public async updateDiagnosticsImmediate(document: vscode.TextDocument): Promise<void> {
    return this.updateDiagnosticsInternal(document);
  }

  /**
   * Internal method that performs the actual diagnostic update
   * @param document VS Code text document to analyze
   */
  private async updateDiagnosticsInternal(document: vscode.TextDocument): Promise<void> {
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
        const diagnostics = await this.performanceOptimizer.withTimeout(
          () => this.analyzeDocument(document),
          this.performanceOptimizer.getConfiguration().parseTimeout
        );
        
        // Set new diagnostics if any were found
        if (diagnostics.length > 0) {
          this.diagnosticCollection.set(document.uri, diagnostics);
          this.logger.debug(`Found ${diagnostics.length} compatibility issues in ${document.uri.fsPath}`);
        }
      } finally {
        // Release memory tracking
        this.performanceOptimizer.releaseMemoryTracking(operationId);
      }
    } catch (error) {
      this.errorHandler.handleExtensionError(
        error instanceof Error ? error : new Error('Unknown error updating diagnostics'),
        `Updating diagnostics for ${document.uri.fsPath}`
      );
      // Don't throw error to avoid breaking the extension
      // Just log and continue gracefully
    }
  }

  /**
   * Analyzes a document and generates diagnostics for non-Baseline features
   * @param document VS Code text document to analyze
   * @returns Array of enhanced diagnostics
   */
  private async analyzeDocument(document: vscode.TextDocument): Promise<EnhancedDiagnostic[]> {
    const diagnostics: EnhancedDiagnostic[] = [];
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
        } else {
          await this.analyzeCssDocument(content, document, diagnostics);
        }
        break;
      
      case 'javascript':
      case 'typescript':
      case 'javascriptreact':
      case 'typescriptreact':
        if (isLargeFile) {
          await this.analyzeJavaScriptDocumentAsync(content, document, diagnostics);
        } else {
          await this.analyzeJavaScriptDocument(content, document, diagnostics);
        }
        break;
      
      case 'html':
      case 'xml':
        if (isLargeFile) {
          await this.analyzeHtmlDocumentAsync(content, document, diagnostics);
        } else {
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
  private async analyzeCssDocument(
    content: string,
    document: vscode.TextDocument,
    diagnostics: EnhancedDiagnostic[]
  ): Promise<void> {
    try {
      // Create cache key based on content hash and document URI
      const cacheKey = `css-${document.uri.fsPath}-${this.hashContent(content)}`;
      
      // Use memoized parser for better performance
      const memoizedParser = this.performanceOptimizer.memoize(
        (content: string, document: vscode.TextDocument) => CssParser.parseCss(content, document),
        (content: string, document: vscode.TextDocument) => `css-${document.uri.fsPath}-${this.hashContent(content)}`
      );
      
      // Parse CSS content to extract features and their locations
      const parseResult = memoizedParser(content, document);
      
      // Ensure parseResult is valid
      if (!parseResult || !parseResult.features) {
        this.logger.warn(`CSS parser returned invalid result for ${document.uri.fsPath}`);
        return;
      }
      
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
            const diagnostic = this.createEnhancedDiagnostic(
              range,
              featureId,
              featureData?.name || featureId,
              'CSS'
            );
            diagnostics.push(diagnostic);
          }
        }
      }
    } catch (error) {
      this.errorHandler.handleParserError(
        error instanceof Error ? error : new Error('Unknown error analyzing CSS document'),
        'CSS',
        `Analyzing CSS document: ${document.uri.fsPath}`
      );
      // Continue gracefully on parse errors
    }
  }

  /**
   * Analyzes CSS content asynchronously for large files
   */
  private async analyzeCssDocumentAsync(
    content: string,
    document: vscode.TextDocument,
    diagnostics: EnhancedDiagnostic[]
  ): Promise<void> {
    return new Promise((resolve) => {
      // Use setImmediate to yield control and prevent blocking
      setImmediate(async () => {
        try {
          await this.analyzeCssDocument(content, document, diagnostics);
          resolve();
        } catch (error) {
          this.errorHandler.handleParserError(
            error instanceof Error ? error : new Error('Unknown error in async CSS analysis'),
            'CSS',
            `Async CSS analysis: ${document.uri.fsPath}`
          );
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
  private async analyzeJavaScriptDocument(
    content: string,
    document: vscode.TextDocument,
    diagnostics: EnhancedDiagnostic[]
  ): Promise<void> {
    try {
      // Use memoized parser for better performance
      const memoizedParser = this.performanceOptimizer.memoize(
        (content: string, document: vscode.TextDocument) => JsParser.parseJavaScript(content, document),
        (content: string, document: vscode.TextDocument) => `js-${document.uri.fsPath}-${this.hashContent(content)}`
      );
      
      // Parse JavaScript content to extract features and their locations
      const parseResult = memoizedParser(content, document);
      
      // Ensure parseResult is valid
      if (!parseResult || !parseResult.features) {
        this.logger.warn(`JavaScript parser returned invalid result for ${document.uri.fsPath}`);
        return;
      }
      
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
            const diagnostic = this.createEnhancedDiagnostic(
              range,
              featureId,
              featureData?.name || featureId,
              'JavaScript'
            );
            diagnostics.push(diagnostic);
          }
        }
      }
    } catch (error) {
      this.errorHandler.handleParserError(
        error instanceof Error ? error : new Error('Unknown error analyzing JavaScript document'),
        'JavaScript',
        `Analyzing JavaScript document: ${document.uri.fsPath}`
      );
      // Continue gracefully on parse errors
    }
  }

  /**
   * Analyzes JavaScript content asynchronously for large files
   */
  private async analyzeJavaScriptDocumentAsync(
    content: string,
    document: vscode.TextDocument,
    diagnostics: EnhancedDiagnostic[]
  ): Promise<void> {
    return new Promise((resolve) => {
      // Use setImmediate to yield control and prevent blocking
      setImmediate(async () => {
        try {
          await this.analyzeJavaScriptDocument(content, document, diagnostics);
          resolve();
        } catch (error) {
          this.errorHandler.handleParserError(
            error instanceof Error ? error : new Error('Unknown error in async JavaScript analysis'),
            'JavaScript',
            `Async JavaScript analysis: ${document.uri.fsPath}`
          );
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
  private async analyzeHtmlDocument(
    content: string,
    document: vscode.TextDocument,
    diagnostics: EnhancedDiagnostic[]
  ): Promise<void> {
    try {
      // Use memoized parser for better performance
      const memoizedParser = this.performanceOptimizer.memoize(
        (content: string, document: vscode.TextDocument) => HtmlParser.parseHtml(content, document),
        (content: string, document: vscode.TextDocument) => `html-${document.uri.fsPath}-${this.hashContent(content)}`
      );
      
      // Parse HTML content to extract features and their locations
      const parseResult = memoizedParser(content, document);
      
      // Ensure parseResult is valid
      if (!parseResult || !parseResult.features) {
        this.logger.warn(`HTML parser returned invalid result for ${document.uri.fsPath}`);
        return;
      }
      
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
            const diagnostic = this.createEnhancedDiagnostic(
              range,
              featureId,
              featureData?.name || featureId,
              'HTML'
            );
            diagnostics.push(diagnostic);
          }
        }
      }
    } catch (error) {
      this.errorHandler.handleParserError(
        error instanceof Error ? error : new Error('Unknown error analyzing HTML document'),
        'HTML',
        `Analyzing HTML document: ${document.uri.fsPath}`
      );
      // Continue gracefully on parse errors
    }
  }

  /**
   * Analyzes HTML content asynchronously for large files
   */
  private async analyzeHtmlDocumentAsync(
    content: string,
    document: vscode.TextDocument,
    diagnostics: EnhancedDiagnostic[]
  ): Promise<void> {
    return new Promise((resolve) => {
      // Use setImmediate to yield control and prevent blocking
      setImmediate(async () => {
        try {
          await this.analyzeHtmlDocument(content, document, diagnostics);
          resolve();
        } catch (error) {
          this.errorHandler.handleParserError(
            error instanceof Error ? error : new Error('Unknown error in async HTML analysis'),
            'HTML',
            `Async HTML analysis: ${document.uri.fsPath}`
          );
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
  private createEnhancedDiagnostic(
    range: vscode.Range,
    featureId: string,
    featureName: string,
    languageType: string
  ): EnhancedDiagnostic {
    // Get feature data for more detailed message
    const featureData = this.baselineDataManager.getFeatureData(featureId);
    
    // Create descriptive message
    let message = `${languageType} feature "${featureName}" is not supported by Baseline`;
    
    // Add more specific information if available
    if (featureData) {
      const baseline = featureData.status.baseline;
      if (baseline === false) {
        message += ' (not supported by all browsers)';
      } else if (baseline === 'low') {
        message += ' (limited browser support)';
      }
    }

    // Create enhanced diagnostic with featureId in code property
    const diagnostic: EnhancedDiagnostic = {
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
  public clearDiagnostics(document: vscode.TextDocument): void {
    this.diagnosticCollection.delete(document.uri);
  }

  /**
   * Clears all diagnostics from the collection
   */
  public clearAllDiagnostics(): void {
    this.diagnosticCollection.clear();
  }

  /**
   * Gets the diagnostic collection for external access
   * @returns VS Code diagnostic collection
   */
  public getDiagnosticCollection(): vscode.DiagnosticCollection {
    return this.diagnosticCollection;
  }

  /**
   * Creates a simple hash of content for caching purposes
   */
  private hashContent(content: string): string {
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
  public dispose(): void {
    this.diagnosticCollection.dispose();
    this.performanceOptimizer.dispose();
  }
}