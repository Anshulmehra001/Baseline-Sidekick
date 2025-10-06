import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import * as vscode from 'vscode';
import { DiagnosticController, EnhancedDiagnostic } from './diagnostics';
import { BaselineDataManager } from './core/baselineData';
import { CssParser } from './core/cssParser';
import { JsParser } from './core/jsParser';
import { HtmlParser } from './core/htmlParser';

// Mock VS Code API
vi.mock('vscode', () => ({
  languages: {
    createDiagnosticCollection: vi.fn(() => ({
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      dispose: vi.fn()
    }))
  },
  DiagnosticSeverity: {
    Warning: 1
  },
  DiagnosticTag: {
    Deprecated: 1
  },
  Position: class Position {
    constructor(public line: number, public character: number) {}
  },
  Range: class Range {
    constructor(public start: any, public end: any) {}
  },
  Uri: {
    parse: vi.fn((url: string) => ({ toString: () => url }))
  },
  StatusBarAlignment: {
    Left: 1,
    Right: 2
  },
  window: {
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn()
    })),
    createStatusBarItem: vi.fn(() => ({
      text: '',
      tooltip: '',
      show: vi.fn(),
      hide: vi.fn(),
      dispose: vi.fn()
    })),
    showErrorMessage: vi.fn().mockResolvedValue(undefined),
    showWarningMessage: vi.fn().mockResolvedValue(undefined),
    showInformationMessage: vi.fn().mockResolvedValue(undefined)
  },
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((_key: string, defaultValue: any) => defaultValue)
    }))
  }
}));

// Mock BaselineDataManager
vi.mock('./core/baselineData', () => ({
  BaselineDataManager: {
    getInstance: vi.fn(() => ({
      isInitialized: vi.fn(),
      initialize: vi.fn(),
      isBaselineSupported: vi.fn(),
      getFeatureData: vi.fn()
    }))
  }
}));

// Mock PerformanceOptimizer
vi.mock('./core/performanceOptimizer', () => ({
  PerformanceOptimizer: {
    getInstance: vi.fn(() => ({
      shouldProcessFile: vi.fn().mockReturnValue(true),
      debounce: vi.fn((key: string, fn: any) => fn), // Return unwrapped function for testing
      memoize: vi.fn((fn: any) => fn), // Return unwrapped function for testing
      withTimeout: vi.fn((fn: any) => fn()), // Execute immediately for testing
      trackMemoryUsage: vi.fn(),
      releaseMemoryTracking: vi.fn(),
      isLargeFile: vi.fn().mockReturnValue(false),
      getConfiguration: vi.fn().mockReturnValue({
        parseTimeout: 5000,
        maxFileSize: 5 * 1024 * 1024
      }),
      dispose: vi.fn() // Add dispose method
    }))
  }
}));

// Mock ErrorHandler
vi.mock('./core/errorHandler', () => ({
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

// Mock parsers
vi.mock('./core/cssParser', () => ({
  CssParser: {
    parseCss: vi.fn().mockReturnValue({
      features: [],
      locations: new Map()
    })
  }
}));

vi.mock('./core/jsParser', () => ({
  JsParser: {
    parseJavaScript: vi.fn().mockReturnValue({
      features: [],
      locations: new Map()
    })
  }
}));

vi.mock('./core/htmlParser', () => ({
  HtmlParser: {
    parseHtml: vi.fn().mockReturnValue({
      features: [],
      locations: new Map()
    })
  }
}));

describe('DiagnosticController', () => {
  let diagnosticController: DiagnosticController;
  let mockContext: vscode.ExtensionContext;
  let mockDocument: any;
  let mockBaselineDataManager: any;
  let mockDiagnosticCollection: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock context
    mockContext = {
      subscriptions: []
    } as any;

    // Setup mock diagnostic collection
    mockDiagnosticCollection = {
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      dispose: vi.fn()
    };

    (vscode.languages.createDiagnosticCollection as Mock).mockReturnValue(mockDiagnosticCollection);

    // Setup mock baseline data manager
    mockBaselineDataManager = {
      isInitialized: vi.fn().mockReturnValue(true),
      initialize: vi.fn().mockResolvedValue(undefined),
      isBaselineSupported: vi.fn(),
      getFeatureData: vi.fn()
    };

    (BaselineDataManager.getInstance as Mock).mockReturnValue(mockBaselineDataManager);

    // Setup mock document
    mockDocument = {
      uri: { toString: () => 'file:///test.css' },
      getText: vi.fn().mockReturnValue('body { gap: 10px; }'),
      languageId: 'css'
    };

    diagnosticController = new DiagnosticController(mockContext);
  });

  describe('constructor', () => {
    it('should create diagnostic collection with correct name', () => {
      expect(vscode.languages.createDiagnosticCollection).toHaveBeenCalledWith('baseline-sidekick');
    });

    it('should register diagnostic collection for disposal', () => {
      expect(mockContext.subscriptions).toContain(mockDiagnosticCollection);
    });

    it('should get BaselineDataManager instance', () => {
      expect(BaselineDataManager.getInstance).toHaveBeenCalled();
    });
  });

  describe('updateDiagnostics', () => {
    it('should initialize baseline data manager if not initialized', async () => {
      mockBaselineDataManager.isInitialized.mockReturnValue(false);

      await diagnosticController.updateDiagnosticsImmediate(mockDocument);

      expect(mockBaselineDataManager.initialize).toHaveBeenCalled();
    });

    it('should clear existing diagnostics for document', async () => {
      await diagnosticController.updateDiagnosticsImmediate(mockDocument);

      expect(mockDiagnosticCollection.delete).toHaveBeenCalledWith(mockDocument.uri);
    });

    it('should handle initialization errors gracefully', async () => {
      mockBaselineDataManager.isInitialized.mockReturnValue(false);
      mockBaselineDataManager.initialize.mockRejectedValue(new Error('Init failed'));

      // Should not throw
      await expect(diagnosticController.updateDiagnosticsImmediate(mockDocument)).resolves.toBeUndefined();
    });

    it('should set diagnostics when non-Baseline features are found', async () => {
      // Mock CSS parser to return non-Baseline feature
      const mockRange = new vscode.Range(new vscode.Position(0, 7), new vscode.Position(0, 10));
      (CssParser.parseCss as Mock).mockReturnValue({
        features: ['css.properties.gap'],
        locations: new Map([['css.properties.gap', [mockRange]]])
      });

      // Mock baseline data manager to return feature as not supported
      mockBaselineDataManager.isBaselineSupported.mockReturnValue(false);
      mockBaselineDataManager.getFeatureData.mockReturnValue({
        name: 'CSS Gap Property',
        status: { baseline: false }
      });

      await diagnosticController.updateDiagnosticsImmediate(mockDocument);

      expect(mockDiagnosticCollection.set).toHaveBeenCalledWith(
        mockDocument.uri,
        expect.arrayContaining([
          expect.objectContaining({
            range: mockRange,
            message: expect.stringContaining('CSS feature "CSS Gap Property" is not supported by Baseline'),
            severity: vscode.DiagnosticSeverity.Warning,
            source: 'Baseline Sidekick',
            code: {
              value: 'css.properties.gap',
              target: expect.any(Object)
            }
          })
        ])
      );
    });

    it('should not set diagnostics when no non-Baseline features are found', async () => {
      // Mock CSS parser to return Baseline-supported feature
      (CssParser.parseCss as Mock).mockReturnValue({
        features: ['css.properties.color'],
        locations: new Map([['css.properties.color', []]])
      });

      // Mock baseline data manager to return feature as supported
      mockBaselineDataManager.isBaselineSupported.mockReturnValue(true);

      await diagnosticController.updateDiagnosticsImmediate(mockDocument);

      expect(mockDiagnosticCollection.set).not.toHaveBeenCalled();
    });
  });

  describe('language-specific analysis', () => {
    it('should analyze CSS documents', async () => {
      mockDocument.languageId = 'css';
      const mockRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 3));
      
      (CssParser.parseCss as Mock).mockReturnValue({
        features: ['css.properties.gap'],
        locations: new Map([['css.properties.gap', [mockRange]]])
      });
      
      mockBaselineDataManager.isBaselineSupported.mockReturnValue(false);

      await diagnosticController.updateDiagnosticsImmediate(mockDocument);

      expect(CssParser.parseCss).toHaveBeenCalledWith('body { gap: 10px; }', mockDocument);
    });

    it('should analyze SCSS documents', async () => {
      const scssDocument = { ...mockDocument, languageId: 'scss' };
      
      (CssParser.parseCss as Mock).mockReturnValue({
        features: [],
        locations: new Map()
      });

      await diagnosticController.updateDiagnosticsImmediate(scssDocument);

      expect(CssParser.parseCss).toHaveBeenCalled();
    });

    it('should analyze JavaScript documents', async () => {
      const jsDocument = {
        ...mockDocument,
        languageId: 'javascript',
        getText: vi.fn().mockReturnValue('navigator.clipboard.writeText("test");')
      };
      
      const mockRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 17));
      
      (JsParser.parseJavaScript as Mock).mockReturnValue({
        features: ['api.Clipboard.writeText'],
        locations: new Map([['api.Clipboard.writeText', [mockRange]]])
      });
      
      mockBaselineDataManager.isBaselineSupported.mockReturnValue(false);

      await diagnosticController.updateDiagnosticsImmediate(jsDocument);

      expect(JsParser.parseJavaScript).toHaveBeenCalledWith('navigator.clipboard.writeText("test");', jsDocument);
    });

    it('should analyze TypeScript documents', async () => {
      const tsDocument = { ...mockDocument, languageId: 'typescript' };
      
      (JsParser.parseJavaScript as Mock).mockReturnValue({
        features: [],
        locations: new Map()
      });

      await diagnosticController.updateDiagnosticsImmediate(tsDocument);

      expect(JsParser.parseJavaScript).toHaveBeenCalled();
    });

    it('should analyze HTML documents', async () => {
      const htmlDocument = {
        ...mockDocument,
        languageId: 'html',
        getText: vi.fn().mockReturnValue('<dialog>Content</dialog>')
      };
      
      const mockRange = new vscode.Range(new vscode.Position(0, 1), new vscode.Position(0, 7));
      
      (HtmlParser.parseHtml as Mock).mockReturnValue({
        features: ['html.elements.dialog'],
        locations: new Map([['html.elements.dialog', [mockRange]]])
      });
      
      mockBaselineDataManager.isBaselineSupported.mockReturnValue(false);

      await diagnosticController.updateDiagnosticsImmediate(htmlDocument);

      expect(HtmlParser.parseHtml).toHaveBeenCalledWith('<dialog>Content</dialog>', htmlDocument);
    });

    it('should handle unsupported language types', async () => {
      const pythonDocument = { ...mockDocument, languageId: 'python' };

      await diagnosticController.updateDiagnosticsImmediate(pythonDocument);

      expect(CssParser.parseCss).not.toHaveBeenCalled();
      expect(JsParser.parseJavaScript).not.toHaveBeenCalled();
      expect(HtmlParser.parseHtml).not.toHaveBeenCalled();
    });
  });

  describe('createEnhancedDiagnostic', () => {
    it('should create diagnostic with correct properties', async () => {
      const mockRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 3));
      
      (CssParser.parseCss as Mock).mockReturnValue({
        features: ['css.properties.gap'],
        locations: new Map([['css.properties.gap', [mockRange]]])
      });
      
      mockBaselineDataManager.isBaselineSupported.mockReturnValue(false);
      mockBaselineDataManager.getFeatureData.mockReturnValue({
        name: 'CSS Gap Property',
        status: { baseline: false }
      });

      await diagnosticController.updateDiagnosticsImmediate(mockDocument);

      const setCall = (mockDiagnosticCollection.set as Mock).mock.calls[0];
      const diagnostics = setCall[1] as EnhancedDiagnostic[];
      const diagnostic = diagnostics[0];

      expect(diagnostic).toMatchObject({
        range: mockRange,
        message: 'CSS feature "CSS Gap Property" is not supported by Baseline (not supported by all browsers)',
        severity: vscode.DiagnosticSeverity.Warning,
        source: 'Baseline Sidekick',
        code: {
          value: 'css.properties.gap',
          target: expect.any(Object)
        },
        tags: [vscode.DiagnosticTag.Deprecated]
      });
    });

    it('should handle features with limited support', async () => {
      const mockRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 3));
      
      (CssParser.parseCss as Mock).mockReturnValue({
        features: ['css.properties.gap'],
        locations: new Map([['css.properties.gap', [mockRange]]])
      });
      
      mockBaselineDataManager.isBaselineSupported.mockReturnValue(false);
      mockBaselineDataManager.getFeatureData.mockReturnValue({
        name: 'CSS Gap Property',
        status: { baseline: 'low' }
      });

      await diagnosticController.updateDiagnosticsImmediate(mockDocument);

      const setCall = (mockDiagnosticCollection.set as Mock).mock.calls[0];
      const diagnostics = setCall[1] as EnhancedDiagnostic[];
      const diagnostic = diagnostics[0];

      expect(diagnostic.message).toContain('(limited browser support)');
    });

    it('should handle features without detailed data', async () => {
      const mockRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 3));
      
      (CssParser.parseCss as Mock).mockReturnValue({
        features: ['css.properties.unknown'],
        locations: new Map([['css.properties.unknown', [mockRange]]])
      });
      
      mockBaselineDataManager.isBaselineSupported.mockReturnValue(false);
      mockBaselineDataManager.getFeatureData.mockReturnValue(undefined);

      await diagnosticController.updateDiagnosticsImmediate(mockDocument);

      const setCall = (mockDiagnosticCollection.set as Mock).mock.calls[0];
      const diagnostics = setCall[1] as EnhancedDiagnostic[];
      const diagnostic = diagnostics[0];

      expect(diagnostic.message).toBe('CSS feature "css.properties.unknown" is not supported by Baseline');
    });
  });

  describe('error handling', () => {
    it('should handle CSS parser errors gracefully', async () => {
      (CssParser.parseCss as Mock).mockImplementation(() => {
        throw new Error('CSS parse error');
      });

      // Should not throw
      await expect(diagnosticController.updateDiagnosticsImmediate(mockDocument)).resolves.toBeUndefined();
      
      // Should still clear diagnostics
      expect(mockDiagnosticCollection.delete).toHaveBeenCalledWith(mockDocument.uri);
    });

    it('should handle JavaScript parser errors gracefully', async () => {
      const jsDocument = { ...mockDocument, languageId: 'javascript' };
      
      (JsParser.parseJavaScript as Mock).mockImplementation(() => {
        throw new Error('JS parse error');
      });

      // Should not throw
      await expect(diagnosticController.updateDiagnosticsImmediate(jsDocument)).resolves.toBeUndefined();
    });

    it('should handle HTML parser errors gracefully', async () => {
      const htmlDocument = { ...mockDocument, languageId: 'html' };
      
      (HtmlParser.parseHtml as Mock).mockImplementation(() => {
        throw new Error('HTML parse error');
      });

      // Should not throw
      await expect(diagnosticController.updateDiagnosticsImmediate(htmlDocument)).resolves.toBeUndefined();
    });
  });

  describe('utility methods', () => {
    it('should clear diagnostics for specific document', () => {
      diagnosticController.clearDiagnostics(mockDocument);
      
      expect(mockDiagnosticCollection.delete).toHaveBeenCalledWith(mockDocument.uri);
    });

    it('should clear all diagnostics', () => {
      diagnosticController.clearAllDiagnostics();
      
      expect(mockDiagnosticCollection.clear).toHaveBeenCalled();
    });

    it('should return diagnostic collection', () => {
      const collection = diagnosticController.getDiagnosticCollection();
      
      expect(collection).toBe(mockDiagnosticCollection);
    });

    it('should dispose properly', () => {
      diagnosticController.dispose();
      
      expect(mockDiagnosticCollection.dispose).toHaveBeenCalled();
    });
  });

  describe('multiple features and locations', () => {
    it('should handle multiple features in one document', async () => {
      const mockRange1 = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 3));
      const mockRange2 = new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 4));
      
      (CssParser.parseCss as Mock).mockReturnValue({
        features: ['css.properties.gap', 'css.properties.grid'],
        locations: new Map([
          ['css.properties.gap', [mockRange1]],
          ['css.properties.grid', [mockRange2]]
        ])
      });
      
      mockBaselineDataManager.isBaselineSupported.mockReturnValue(false);
      mockBaselineDataManager.getFeatureData.mockImplementation((featureId: string) => ({
        name: featureId === 'css.properties.gap' ? 'CSS Gap Property' : 'CSS Grid',
        status: { baseline: false }
      }));

      await diagnosticController.updateDiagnosticsImmediate(mockDocument);

      const setCall = (mockDiagnosticCollection.set as Mock).mock.calls[0];
      const diagnostics = setCall[1] as EnhancedDiagnostic[];
      
      expect(diagnostics).toHaveLength(2);
      expect(diagnostics[0].code.value).toBe('css.properties.gap');
      expect(diagnostics[1].code.value).toBe('css.properties.grid');
    });

    it('should handle multiple locations for same feature', async () => {
      const mockRange1 = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 3));
      const mockRange2 = new vscode.Range(new vscode.Position(2, 0), new vscode.Position(2, 3));
      
      (CssParser.parseCss as Mock).mockReturnValue({
        features: ['css.properties.gap'],
        locations: new Map([
          ['css.properties.gap', [mockRange1, mockRange2]]
        ])
      });
      
      mockBaselineDataManager.isBaselineSupported.mockReturnValue(false);
      mockBaselineDataManager.getFeatureData.mockReturnValue({
        name: 'CSS Gap Property',
        status: { baseline: false }
      });

      await diagnosticController.updateDiagnosticsImmediate(mockDocument);

      const setCall = (mockDiagnosticCollection.set as Mock).mock.calls[0];
      const diagnostics = setCall[1] as EnhancedDiagnostic[];
      
      expect(diagnostics).toHaveLength(2);
      expect(diagnostics[0].range).toEqual(mockRange1);
      expect(diagnostics[1].range).toEqual(mockRange2);
      expect(diagnostics[0].code.value).toBe('css.properties.gap');
      expect(diagnostics[1].code.value).toBe('css.properties.gap');
    });
  });
});