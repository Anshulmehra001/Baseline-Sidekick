import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import { WorkspaceAuditor, registerAuditCommand } from './audit';

// Mock VS Code API for integration testing
vi.mock('vscode', () => ({
  window: {
    withProgress: vi.fn(),
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    showTextDocument: vi.fn()
  },
  workspace: {
    findFiles: vi.fn(),
    openTextDocument: vi.fn(),
    asRelativePath: vi.fn()
  },
  commands: {
    registerCommand: vi.fn()
  },
  languages: {
    createDiagnosticCollection: vi.fn()
  },
  ProgressLocation: {
    Notification: 15
  },
  ViewColumn: {
    One: 1
  },
  Range: vi.fn().mockImplementation((start, end) => ({ start, end })),
  Position: vi.fn().mockImplementation((line, character) => ({ line, character })),
  Uri: {
    parse: vi.fn()
  },
  DiagnosticSeverity: {
    Warning: 1
  },
  DiagnosticTag: {
    Deprecated: 1
  }
}));

// Mock BaselineDataManager
vi.mock('../core/baselineData');

// Mock parsers
vi.mock('../core/cssParser', () => ({
  CssParser: {
    parseCss: vi.fn()
  }
}));

vi.mock('../core/jsParser', () => ({
  JsParser: {
    parseJavaScript: vi.fn()
  }
}));

vi.mock('../core/htmlParser', () => ({
  HtmlParser: {
    parseHtml: vi.fn()
  }
}));

describe('Audit Integration Tests', () => {
  let mockContext: vscode.ExtensionContext;
  let mockProgress: any;
  let mockToken: any;
  let mockBaselineDataManager: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock extension context
    mockContext = {
      subscriptions: []
    } as any;

    // Setup progress and cancellation token mocks
    mockProgress = {
      report: vi.fn()
    };
    
    mockToken = {
      isCancellationRequested: false
    };

    // Setup BaselineDataManager mock
    mockBaselineDataManager = {
      getInstance: vi.fn(),
      isInitialized: vi.fn().mockReturnValue(true),
      initialize: vi.fn(),
      isBaselineSupported: vi.fn().mockReturnValue(false),
      getFeatureData: vi.fn().mockReturnValue({
        name: 'test feature',
        status: { baseline: false }
      }),
      getMdnUrl: vi.fn().mockReturnValue('https://developer.mozilla.org/test')
    };
    
    const { BaselineDataManager } = await import('../core/baselineData');
    (BaselineDataManager.getInstance as any).mockReturnValue(mockBaselineDataManager);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('registerAuditCommand', () => {
    it('should register the audit command correctly', () => {
      registerAuditCommand(mockContext);

      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'baseline.auditWorkspace',
        expect.any(Function)
      );
      expect(mockContext.subscriptions).toHaveLength(1);
    });

    it('should execute audit when command is called', async () => {
      let commandCallback: Function;
      
      (vscode.commands.registerCommand as any).mockImplementation((commandId: string, callback: Function) => {
        commandCallback = callback;
        return { dispose: vi.fn() };
      });

      // Mock empty workspace
      (vscode.workspace.findFiles as any).mockResolvedValue([]);
      (vscode.window.withProgress as any).mockImplementation(async (options, callback) => {
        return await callback(mockProgress, mockToken);
      });

      registerAuditCommand(mockContext);

      // Execute the registered command
      await commandCallback!();

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'No CSS, JavaScript, or HTML files found in workspace.'
      );
    });
  });

  describe('End-to-End Audit Workflow', () => {
    it('should complete full audit workflow with mixed file types', async () => {
      // Mock file discovery with different file types
      const mockFiles = [
        { fsPath: '/project/styles.css' },
        { fsPath: '/project/script.js' },
        { fsPath: '/project/index.html' }
      ];
      (vscode.workspace.findFiles as any).mockResolvedValue(mockFiles);

      // Mock document reading for each file type
      const mockDocuments = {
        '/project/styles.css': {
          languageId: 'css',
          getText: () => '.container { display: grid; gap: 10px; }'
        },
        '/project/script.js': {
          languageId: 'javascript',
          getText: () => 'navigator.clipboard.writeText("test");'
        },
        '/project/index.html': {
          languageId: 'html',
          getText: () => '<dialog><p>Hello World</p></dialog>'
        }
      };

      (vscode.workspace.openTextDocument as any).mockImplementation((uri: any) => {
        return Promise.resolve(mockDocuments[uri.fsPath as keyof typeof mockDocuments]);
      });

      (vscode.workspace.asRelativePath as any).mockImplementation((uri: any) => {
        return uri.fsPath.split('/').pop();
      });

      // Mock report document creation
      let reportContent = '';
      (vscode.workspace.openTextDocument as any).mockImplementation((options: any) => {
        if (options && options.content) {
          reportContent = options.content;
          return Promise.resolve({ uri: { fsPath: 'report.md' } });
        }
        // Return the appropriate mock document based on the URI
        const uri = options;
        return Promise.resolve(mockDocuments[uri.fsPath as keyof typeof mockDocuments]);
      });

      (vscode.window.withProgress as any).mockImplementation(async (options, callback) => {
        return await callback(mockProgress, mockToken);
      });

      const auditor = new WorkspaceAuditor();
      await auditor.auditWorkspace();

      // Verify progress reporting
      expect(mockProgress.report).toHaveBeenCalledWith({
        increment: 0,
        message: 'Discovering files...'
      });
      expect(mockProgress.report).toHaveBeenCalledWith({
        increment: 20,
        message: 'Found 3 files. Scanning...'
      });

      // Verify file scanning
      expect(vscode.workspace.openTextDocument).toHaveBeenCalledTimes(4); // 3 files + 1 report

      // Verify report generation and opening
      expect(reportContent).toContain('# Baseline Compatibility Audit Report');
      expect(reportContent).toContain('**Files Scanned:** 3');
      expect(vscode.window.showTextDocument).toHaveBeenCalledWith(
        expect.anything(),
        {
          preview: false,
          viewColumn: vscode.ViewColumn.One
        }
      );
    });

    it('should handle large workspace with progress updates', async () => {
      // Mock large number of files
      const mockFiles = Array.from({ length: 50 }, (_, i) => ({
        fsPath: `/project/file${i}.css`
      }));
      (vscode.workspace.findFiles as any).mockResolvedValue(mockFiles);

      // Mock document reading
      const mockDocument = {
        languageId: 'css',
        getText: () => 'body { color: red; }' // No baseline issues
      };
      (vscode.workspace.openTextDocument as any).mockResolvedValue(mockDocument);
      (vscode.workspace.asRelativePath as any).mockImplementation((uri: any) => 
        uri.fsPath.split('/').pop()
      );

      (vscode.window.withProgress as any).mockImplementation(async (options, callback) => {
        return await callback(mockProgress, mockToken);
      });

      const auditor = new WorkspaceAuditor();
      await auditor.auditWorkspace();

      // Verify progress was reported for file discovery and scanning
      expect(mockProgress.report).toHaveBeenCalledWith({
        increment: 0,
        message: 'Discovering files...'
      });
      expect(mockProgress.report).toHaveBeenCalledWith({
        increment: 20,
        message: 'Found 50 files. Scanning...'
      });

      // Should have progress updates for individual files
      const scanningCalls = (mockProgress.report as any).mock.calls.filter((call: any) => 
        call[0].message && call[0].message.startsWith('Scanning')
      );
      expect(scanningCalls.length).toBe(50);

      // Verify completion message
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        '✅ No Baseline compatibility issues found!'
      );
    });

    it('should handle workspace with mixed baseline and non-baseline features', async () => {
      // Mock files with both baseline and non-baseline features
      const mockFiles = [
        { fsPath: '/project/modern.css' },
        { fsPath: '/project/legacy.css' }
      ];
      (vscode.workspace.findFiles as any).mockResolvedValue(mockFiles);

      const mockDocuments = {
        '/project/modern.css': {
          languageId: 'css',
          getText: () => 'body { color: red; margin: 10px; }' // Baseline features
        },
        '/project/legacy.css': {
          languageId: 'css',
          getText: () => '.grid { display: grid; gap: 10px; }' // Non-baseline gap
        }
      };

      (vscode.workspace.openTextDocument as any).mockImplementation((options: any) => {
        if (options && options.content) {
          // Report document
          return Promise.resolve({ uri: { fsPath: 'report.md' } });
        }
        const uri = options;
        return Promise.resolve(mockDocuments[uri.fsPath as keyof typeof mockDocuments]);
      });

      (vscode.workspace.asRelativePath as any).mockImplementation((uri: any) => 
        uri.fsPath.split('/').pop()
      );

      (vscode.window.withProgress as any).mockImplementation(async (options, callback) => {
        return await callback(mockProgress, mockToken);
      });

      const auditor = new WorkspaceAuditor();
      await auditor.auditWorkspace();

      // Should find issues only in legacy.css
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringMatching(/Found \d+ compatibility issue/)
      );
    });

    it('should handle cancellation during file scanning', async () => {
      const mockFiles = [
        { fsPath: '/project/file1.css' },
        { fsPath: '/project/file2.css' }
      ];
      (vscode.workspace.findFiles as any).mockResolvedValue(mockFiles);

      const mockDocument = {
        languageId: 'css',
        getText: () => 'body { color: red; }'
      };
      (vscode.workspace.openTextDocument as any).mockResolvedValue(mockDocument);

      // Mock cancellation after first file
      let callCount = 0;
      (vscode.window.withProgress as any).mockImplementation(async (options, callback) => {
        return await callback(mockProgress, {
          get isCancellationRequested() {
            return ++callCount > 3; // Cancel after a few calls
          }
        });
      });

      const auditor = new WorkspaceAuditor();
      await auditor.auditWorkspace();

      // Should not show completion message when cancelled
      expect(vscode.window.showInformationMessage).not.toHaveBeenCalledWith(
        expect.stringContaining('Audit complete')
      );
    });

    it('should handle file system errors gracefully', async () => {
      // Mock file discovery success but document reading failure
      const mockFiles = [{ fsPath: '/project/broken.css' }];
      (vscode.workspace.findFiles as any).mockResolvedValue(mockFiles);
      
      (vscode.workspace.openTextDocument as any).mockRejectedValue(
        new Error('Permission denied')
      );

      (vscode.window.withProgress as any).mockImplementation(async (options, callback) => {
        return await callback(mockProgress, mockToken);
      });

      const auditor = new WorkspaceAuditor();
      
      // Should not throw error
      await expect(auditor.auditWorkspace()).resolves.not.toThrow();

      // Should still generate report (even if empty)
      expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith({
        content: expect.stringContaining('# Baseline Compatibility Audit Report'),
        language: 'markdown'
      });
    });
  });

  describe('Report Quality', () => {
    it('should generate comprehensive report with all required sections', async () => {
      const mockFiles = [{ fsPath: '/project/test.css' }];
      (vscode.workspace.findFiles as any).mockResolvedValue(mockFiles);

      const mockDocument = {
        languageId: 'css',
        getText: () => '.container { gap: 10px; grid-template-areas: "header"; }'
      };

      let reportContent = '';
      (vscode.workspace.openTextDocument as any).mockImplementation((options: any) => {
        if (options && options.content) {
          reportContent = options.content;
          return Promise.resolve({ uri: { fsPath: 'report.md' } });
        }
        return Promise.resolve(mockDocument);
      });

      (vscode.workspace.asRelativePath as any).mockReturnValue('test.css');

      (vscode.window.withProgress as any).mockImplementation(async (options, callback) => {
        return await callback(mockProgress, mockToken);
      });

      const auditor = new WorkspaceAuditor();
      await auditor.auditWorkspace();

      // Verify report structure
      expect(reportContent).toContain('# Baseline Compatibility Audit Report');
      expect(reportContent).toContain('**Generated:**');
      expect(reportContent).toContain('**Files Scanned:**');
      expect(reportContent).toContain('**Issues Found:**');
      expect(reportContent).toContain('## 📊 Summary');
      expect(reportContent).toContain('## 📁 Issues by File');
      expect(reportContent).toContain('## 💡 Next Steps');
      expect(reportContent).toContain('*Generated by Baseline Sidekick extension*');
    });

    it('should group issues by language type in summary', async () => {
      const mockFiles = [
        { fsPath: '/project/styles.css' },
        { fsPath: '/project/script.js' }
      ];
      (vscode.workspace.findFiles as any).mockResolvedValue(mockFiles);

      const mockDocuments = {
        '/project/styles.css': {
          languageId: 'css',
          getText: () => '.container { gap: 10px; }'
        },
        '/project/script.js': {
          languageId: 'javascript',
          getText: () => 'navigator.clipboard.writeText("test");'
        }
      };

      let reportContent = '';
      (vscode.workspace.openTextDocument as any).mockImplementation((options: any) => {
        if (options && options.content) {
          reportContent = options.content;
          return Promise.resolve({ uri: { fsPath: 'report.md' } });
        }
        const uri = options;
        return Promise.resolve(mockDocuments[uri.fsPath as keyof typeof mockDocuments]);
      });

      (vscode.workspace.asRelativePath as any).mockImplementation((uri: any) => 
        uri.fsPath.split('/').pop()
      );

      (vscode.window.withProgress as any).mockImplementation(async (options, callback) => {
        return await callback(mockProgress, mockToken);
      });

      const auditor = new WorkspaceAuditor();
      await auditor.auditWorkspace();

      // Should group by language type in summary
      expect(reportContent).toContain('- **CSS:**');
      expect(reportContent).toContain('- **JavaScript:**');
    });
  });
});