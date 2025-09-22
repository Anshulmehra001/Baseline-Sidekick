import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import * as vscode from 'vscode';
import { DiagnosticController } from './diagnostics';
import { BaselineDataManager } from './core/baselineData';

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
  }
}));

// Mock BaselineDataManager
vi.mock('./core/baselineData', () => ({
  BaselineDataManager: {
    getInstance: vi.fn()
  }
}));

describe('DiagnosticController Integration Tests', () => {
  let diagnosticController: DiagnosticController;
  let mockContext: vscode.ExtensionContext;
  let mockDiagnosticCollection: any;

  beforeEach(() => {
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
  });

  describe('real parser integration', () => {
    it('should analyze CSS content with real parser', async () => {
      // Mock BaselineDataManager to return non-Baseline for gap
      const mockBaselineDataManager = {
        isInitialized: vi.fn().mockReturnValue(true),
        initialize: vi.fn().mockResolvedValue(undefined),
        isBaselineSupported: vi.fn().mockImplementation((featureId: string) => {
          return featureId !== 'css.properties.gap';
        }),
        getFeatureData: vi.fn().mockImplementation((featureId: string) => {
          if (featureId === 'css.properties.gap') {
            return {
              name: 'CSS Gap Property',
              status: { baseline: false }
            };
          }
          return null;
        })
      };

      (BaselineDataManager.getInstance as Mock).mockReturnValue(mockBaselineDataManager);
      
      diagnosticController = new DiagnosticController(mockContext);

      const mockDocument = {
        uri: { toString: () => 'file:///test.css' },
        getText: vi.fn().mockReturnValue('.container { gap: 10px; }'),
        languageId: 'css'
      } as any;

      await diagnosticController.updateDiagnostics(mockDocument);

      // Should have called set with diagnostics for gap
      expect(mockDiagnosticCollection.set).toHaveBeenCalled();
      
      const setCall = mockDiagnosticCollection.set.mock.calls[0];
      const diagnostics = setCall[1];
      
      expect(diagnostics.length).toBeGreaterThan(0);
      expect(diagnostics[0].code.value).toBe('css.properties.gap');
    });

    it('should analyze JavaScript content with real parser', async () => {
      // Mock BaselineDataManager to return non-Baseline for clipboard
      const mockBaselineDataManager = {
        isInitialized: vi.fn().mockReturnValue(true),
        initialize: vi.fn().mockResolvedValue(undefined),
        isBaselineSupported: vi.fn().mockImplementation((featureId: string) => {
          return featureId !== 'api.Clipboard.writeText';
        }),
        getFeatureData: vi.fn().mockImplementation((featureId: string) => {
          if (featureId === 'api.Clipboard.writeText') {
            return {
              name: 'Clipboard API writeText',
              status: { baseline: false }
            };
          }
          return null;
        })
      };

      (BaselineDataManager.getInstance as Mock).mockReturnValue(mockBaselineDataManager);
      
      diagnosticController = new DiagnosticController(mockContext);

      const mockDocument = {
        uri: { toString: () => 'file:///test.js' },
        getText: vi.fn().mockReturnValue('navigator.clipboard.writeText("test");'),
        languageId: 'javascript'
      } as any;

      await diagnosticController.updateDiagnostics(mockDocument);

      // Should have called set with diagnostics for clipboard
      expect(mockDiagnosticCollection.set).toHaveBeenCalled();
      
      const setCall = mockDiagnosticCollection.set.mock.calls[0];
      const diagnostics = setCall[1];
      
      expect(diagnostics.length).toBeGreaterThan(0);
      expect(diagnostics[0].code.value).toBe('api.Clipboard.writeText');
    });

    it('should analyze HTML content with real parser', async () => {
      // Mock BaselineDataManager to return non-Baseline for dialog
      const mockBaselineDataManager = {
        isInitialized: vi.fn().mockReturnValue(true),
        initialize: vi.fn().mockResolvedValue(undefined),
        isBaselineSupported: vi.fn().mockImplementation((featureId: string) => {
          return featureId !== 'html.elements.dialog';
        }),
        getFeatureData: vi.fn().mockImplementation((featureId: string) => {
          if (featureId === 'html.elements.dialog') {
            return {
              name: 'HTML Dialog Element',
              status: { baseline: false }
            };
          }
          return null;
        })
      };

      (BaselineDataManager.getInstance as Mock).mockReturnValue(mockBaselineDataManager);
      
      diagnosticController = new DiagnosticController(mockContext);

      const mockDocument = {
        uri: { toString: () => 'file:///test.html' },
        getText: vi.fn().mockReturnValue('<dialog>Content</dialog>'),
        languageId: 'html'
      } as any;

      await diagnosticController.updateDiagnostics(mockDocument);

      // Should have called set with diagnostics for dialog
      expect(mockDiagnosticCollection.set).toHaveBeenCalled();
      
      const setCall = mockDiagnosticCollection.set.mock.calls[0];
      const diagnostics = setCall[1];
      
      expect(diagnostics.length).toBeGreaterThan(0);
      expect(diagnostics[0].code.value).toBe('html.elements.dialog');
    });

    it('should handle mixed content with multiple languages', async () => {
      // Mock BaselineDataManager to return all features as non-Baseline
      const mockBaselineDataManager = {
        isInitialized: vi.fn().mockReturnValue(true),
        initialize: vi.fn().mockResolvedValue(undefined),
        isBaselineSupported: vi.fn().mockReturnValue(false),
        getFeatureData: vi.fn().mockReturnValue({
          name: 'Test Feature',
          status: { baseline: false }
        })
      };

      (BaselineDataManager.getInstance as Mock).mockReturnValue(mockBaselineDataManager);
      
      diagnosticController = new DiagnosticController(mockContext);

      const mockDocument = {
        uri: { toString: () => 'file:///test.vue' },
        getText: vi.fn().mockReturnValue('<dialog>Content</dialog>'),
        languageId: 'html'
      } as any;

      await diagnosticController.updateDiagnostics(mockDocument);

      // Should analyze as HTML and find elements
      expect(mockDiagnosticCollection.set).toHaveBeenCalled();
      
      const setCall = mockDiagnosticCollection.set.mock.calls[0];
      const diagnostics = setCall[1];
      
      expect(diagnostics.length).toBeGreaterThan(0);
    });

    it('should handle empty documents gracefully', async () => {
      const mockBaselineDataManager = {
        isInitialized: vi.fn().mockReturnValue(true),
        initialize: vi.fn().mockResolvedValue(undefined),
        isBaselineSupported: vi.fn().mockReturnValue(true),
        getFeatureData: vi.fn().mockReturnValue(null)
      };

      (BaselineDataManager.getInstance as Mock).mockReturnValue(mockBaselineDataManager);
      
      diagnosticController = new DiagnosticController(mockContext);

      const mockDocument = {
        uri: { toString: () => 'file:///empty.css' },
        getText: vi.fn().mockReturnValue(''),
        languageId: 'css'
      } as any;

      await diagnosticController.updateDiagnostics(mockDocument);

      // Should clear diagnostics but not set any new ones
      expect(mockDiagnosticCollection.delete).toHaveBeenCalledWith(mockDocument.uri);
      expect(mockDiagnosticCollection.set).not.toHaveBeenCalled();
    });

    it('should handle documents with only Baseline-supported features', async () => {
      const mockBaselineDataManager = {
        isInitialized: vi.fn().mockReturnValue(true),
        initialize: vi.fn().mockResolvedValue(undefined),
        isBaselineSupported: vi.fn().mockReturnValue(true), // All features are Baseline
        getFeatureData: vi.fn().mockReturnValue({
          name: 'Standard CSS Property',
          status: { baseline: true }
        })
      };

      (BaselineDataManager.getInstance as Mock).mockReturnValue(mockBaselineDataManager);
      
      diagnosticController = new DiagnosticController(mockContext);

      const mockDocument = {
        uri: { toString: () => 'file:///baseline.css' },
        getText: vi.fn().mockReturnValue('.container { color: red; }'),
        languageId: 'css'
      } as any;

      await diagnosticController.updateDiagnostics(mockDocument);

      // Should clear diagnostics but not set any new ones since all features are Baseline
      expect(mockDiagnosticCollection.delete).toHaveBeenCalledWith(mockDocument.uri);
      expect(mockDiagnosticCollection.set).not.toHaveBeenCalled();
    });
  });
});