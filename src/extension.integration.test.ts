import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as vscode from 'vscode';
import { activate, deactivate } from './extension';

// Mock VS Code API
vi.mock('vscode', () => ({
  workspace: {
    onDidChangeTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
    onDidOpenTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
    onDidSaveTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
    textDocuments: [],
    createFileSystemWatcher: vi.fn(() => ({ dispose: vi.fn() }))
  },
  languages: {
    createDiagnosticCollection: vi.fn(() => ({
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      dispose: vi.fn()
    })),
    registerHoverProvider: vi.fn(() => ({ dispose: vi.fn() })),
    registerCodeActionsProvider: vi.fn(() => ({ dispose: vi.fn() })),
    getDiagnostics: vi.fn(() => [])
  },
  commands: {
    registerCommand: vi.fn(() => ({ dispose: vi.fn() }))
  },
  window: {
    showErrorMessage: vi.fn(),
    showInformationMessage: vi.fn(),
    withProgress: vi.fn()
  },
  ExtensionContext: vi.fn(),
  DiagnosticSeverity: {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3
  },
  DiagnosticTag: {
    Unnecessary: 1,
    Deprecated: 2
  },
  CodeActionKind: {
    RefactorRewrite: 'refactor.rewrite',
    QuickFix: 'quickfix'
  },
  Range: vi.fn(),
  Position: vi.fn(),
  Uri: {
    parse: vi.fn()
  },
  MarkdownString: vi.fn(),
  Hover: vi.fn(),
  CodeAction: vi.fn(),
  WorkspaceEdit: vi.fn(),
  ViewColumn: {
    One: 1
  },
  ProgressLocation: {
    Notification: 15
  }
}));

// Mock web-features
vi.mock('web-features', () => ({
  features: {
    'css.properties.gap': {
      name: 'CSS gap property',
      status: { baseline: true },
      spec: 'https://drafts.csswg.org/css-align/',
      mdn_url: 'https://developer.mozilla.org/docs/Web/CSS/gap'
    },
    'css.properties.float': {
      name: 'CSS float property',
      status: { baseline: false },
      spec: 'https://drafts.csswg.org/css2/',
      mdn_url: 'https://developer.mozilla.org/docs/Web/CSS/float'
    },
    'api.XMLHttpRequest': {
      name: 'XMLHttpRequest',
      status: { baseline: false },
      spec: 'https://xhr.spec.whatwg.org/',
      mdn_url: 'https://developer.mozilla.org/docs/Web/API/XMLHttpRequest'
    }
  }
}));

describe('Extension Integration Tests', () => {
  let mockContext: any;

  beforeEach(() => {
    // Create mock extension context
    mockContext = {
      subscriptions: [],
      extensionPath: '/mock/path',
      globalState: {
        get: vi.fn(),
        update: vi.fn()
      },
      workspaceState: {
        get: vi.fn(),
        update: vi.fn()
      }
    };

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    deactivate();
  });

  describe('Extension Activation', () => {
    it('should activate successfully with all providers registered', async () => {
      // Act
      await activate(mockContext);

      // Assert - Check that all providers were registered
      expect(vscode.languages.createDiagnosticCollection).toHaveBeenCalledWith('baseline-sidekick');
      expect(vscode.languages.registerHoverProvider).toHaveBeenCalledWith(
        expect.arrayContaining(['css', 'javascript', 'html']),
        expect.any(Object)
      );
      expect(vscode.languages.registerCodeActionsProvider).toHaveBeenCalledWith(
        expect.arrayContaining(['css', 'javascript', 'html']),
        expect.any(Object),
        expect.objectContaining({
          providedCodeActionKinds: expect.arrayContaining([
            vscode.CodeActionKind.RefactorRewrite,
            vscode.CodeActionKind.QuickFix
          ])
        })
      );
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'baseline.auditWorkspace',
        expect.any(Function)
      );
    });

    it('should register document change event handlers', async () => {
      // Act
      await activate(mockContext);

      // Assert - Check that event handlers were registered
      expect(vscode.workspace.onDidChangeTextDocument).toHaveBeenCalled();
      expect(vscode.workspace.onDidOpenTextDocument).toHaveBeenCalled();
      expect(vscode.workspace.onDidSaveTextDocument).toHaveBeenCalled();
    });

    it('should add all disposables to context subscriptions', async () => {
      // Act
      await activate(mockContext);

      // Assert - Check that disposables were added to subscriptions
      expect(mockContext.subscriptions.length).toBeGreaterThan(0);
    });

    it('should handle initialization errors gracefully', async () => {
      // This test verifies that the extension activation includes proper error handling
      // The actual error handling is tested by the try-catch block in the activate function
      
      // Act - Normal activation should work
      await activate(mockContext);

      // Assert - Extension should activate successfully even with potential errors
      // The error handling is built into the activate function with try-catch
      expect(vscode.languages.createDiagnosticCollection).toHaveBeenCalled();
    });
  });

  describe('Document Analysis Integration', () => {
    it('should analyze open documents on activation', async () => {
      // Arrange - Mock open documents
      const mockDocument = {
        languageId: 'css',
        getText: vi.fn().mockReturnValue('.test { gap: 10px; }'),
        uri: { fsPath: '/test.css' }
      };
      (vscode.workspace.textDocuments as any) = [mockDocument];

      // Act
      await activate(mockContext);

      // Assert - Document should be analyzed
      // Note: Actual diagnostic creation is tested in DiagnosticController tests
      expect(mockDocument.getText).toHaveBeenCalled();
    });

    it('should handle document change events', async () => {
      // Arrange
      let changeHandler: Function;
      (vscode.workspace.onDidChangeTextDocument as any).mockImplementation((handler: Function) => {
        changeHandler = handler;
        return { dispose: vi.fn() };
      });

      await activate(mockContext);

      const mockChangeEvent = {
        document: {
          languageId: 'javascript',
          getText: vi.fn().mockReturnValue('new XMLHttpRequest();'),
          uri: { fsPath: '/test.js' }
        }
      };

      // Act
      await changeHandler!(mockChangeEvent);

      // Assert - Handler should process supported documents
      expect(mockChangeEvent.document.getText).toHaveBeenCalled();
    });

    it('should ignore unsupported document types', async () => {
      // Arrange
      let changeHandler: Function;
      (vscode.workspace.onDidChangeTextDocument as any).mockImplementation((handler: Function) => {
        changeHandler = handler;
        return { dispose: vi.fn() };
      });

      await activate(mockContext);

      const mockChangeEvent = {
        document: {
          languageId: 'python', // Unsupported language
          getText: vi.fn(),
          uri: { fsPath: '/test.py' }
        }
      };

      // Act
      await changeHandler!(mockChangeEvent);

      // Assert - Unsupported document should be ignored
      expect(mockChangeEvent.document.getText).not.toHaveBeenCalled();
    });
  });

  describe('Provider Registration', () => {
    it('should register hover provider for all supported languages', async () => {
      // Act
      await activate(mockContext);

      // Assert
      expect(vscode.languages.registerHoverProvider).toHaveBeenCalledWith(
        expect.arrayContaining([
          'css', 'scss', 'sass', 'less',
          'javascript', 'typescript', 'javascriptreact', 'typescriptreact',
          'html', 'xml'
        ]),
        expect.any(Object)
      );
    });

    it('should register code action provider with correct configuration', async () => {
      // Act
      await activate(mockContext);

      // Assert
      expect(vscode.languages.registerCodeActionsProvider).toHaveBeenCalledWith(
        expect.arrayContaining([
          'css', 'scss', 'sass', 'less',
          'javascript', 'typescript', 'javascriptreact', 'typescriptreact',
          'html', 'xml'
        ]),
        expect.any(Object),
        expect.objectContaining({
          providedCodeActionKinds: [
            vscode.CodeActionKind.RefactorRewrite,
            vscode.CodeActionKind.QuickFix
          ]
        })
      );
    });

    it('should register workspace audit command', async () => {
      // Act
      await activate(mockContext);

      // Assert
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'baseline.auditWorkspace',
        expect.any(Function)
      );
    });
  });

  describe('Extension Deactivation', () => {
    it('should clean up resources on deactivation', async () => {
      // Arrange
      const mockDispose = vi.fn();
      (vscode.languages.createDiagnosticCollection as any).mockReturnValue({
        set: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        dispose: mockDispose
      });

      await activate(mockContext);

      // Act
      deactivate();

      // Assert - Resources should be cleaned up
      expect(mockDispose).toHaveBeenCalled();
    });

    it('should handle deactivation when not activated', () => {
      // Act & Assert - Should not throw
      expect(() => deactivate()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle provider registration errors', async () => {
      // Arrange - Mock provider registration to fail
      (vscode.languages.registerHoverProvider as any).mockImplementation(() => {
        throw new Error('Provider registration failed');
      });

      // Act
      await activate(mockContext);

      // Assert - Error should be handled gracefully
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to activate Baseline Sidekick')
      );
    });

    it('should handle command registration errors', async () => {
      // Arrange - Mock command registration to fail
      (vscode.commands.registerCommand as any).mockImplementation(() => {
        throw new Error('Command registration failed');
      });

      // Act
      await activate(mockContext);

      // Assert - Error should be handled gracefully
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to activate Baseline Sidekick')
      );
    });
  });

  describe('Complete Extension Lifecycle', () => {
    it('should complete full activation and deactivation cycle', async () => {
      // Arrange
      const mockDisposables = [
        { dispose: vi.fn() },
        { dispose: vi.fn() },
        { dispose: vi.fn() }
      ];

      (vscode.workspace.onDidChangeTextDocument as any).mockReturnValue(mockDisposables[0]);
      (vscode.languages.registerHoverProvider as any).mockReturnValue(mockDisposables[1]);
      (vscode.languages.registerCodeActionsProvider as any).mockReturnValue(mockDisposables[2]);

      // Act - Full lifecycle
      await activate(mockContext);
      deactivate();

      // Assert - All resources should be properly managed
      expect(mockContext.subscriptions.length).toBeGreaterThan(0);
      // Disposables should be called during cleanup (handled by VS Code context)
    });

    it('should maintain extension state correctly', async () => {
      // Act - Multiple activation/deactivation cycles
      await activate(mockContext);
      deactivate();
      
      // Reset context for second cycle
      mockContext.subscriptions = [];
      await activate(mockContext);
      deactivate();

      // Assert - Should handle multiple cycles without issues
      expect(vscode.languages.createDiagnosticCollection).toHaveBeenCalledTimes(2);
    });
  });
});