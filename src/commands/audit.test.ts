import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import { WorkspaceAuditor, CompatibilityIssue } from './audit';
import { BaselineDataManager } from '../core/baselineData';

// Mock VS Code API
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
  ProgressLocation: {
    Notification: 15
  },
  ViewColumn: {
    One: 1
  },
  Range: class MockRange {
    constructor(public start: any, public end: any) {}
  },
  Position: class MockPosition {
    constructor(public line: number, public character: number) {}
  },
  Uri: {
    parse: vi.fn()
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

describe('WorkspaceAuditor', () => {
  let auditor: WorkspaceAuditor;
  let mockBaselineDataManager: any;
  let mockProgress: any;
  let mockToken: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup BaselineDataManager mock
    mockBaselineDataManager = {
      getInstance: vi.fn(),
      isInitialized: vi.fn().mockReturnValue(true),
      initialize: vi.fn(),
      isBaselineSupported: vi.fn(),
      getFeatureData: vi.fn(),
      getMdnUrl: vi.fn()
    };
    
    (BaselineDataManager.getInstance as any).mockReturnValue(mockBaselineDataManager);

    // Setup progress and cancellation token mocks
    mockProgress = {
      report: vi.fn()
    };
    
    mockToken = {
      isCancellationRequested: false
    };

    auditor = new WorkspaceAuditor();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('auditWorkspace', () => {
    it('should show information message when no files are found', async () => {
      // Mock empty file discovery
      (vscode.workspace.findFiles as any).mockResolvedValue([]);
      
      // Mock withProgress to call the callback immediately
      (vscode.window.withProgress as any).mockImplementation(async (options, callback) => {
        return await callback(mockProgress, mockToken);
      });

      await auditor.auditWorkspace();

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'No CSS, JavaScript, or HTML files found in workspace.'
      );
    });

    it('should handle cancellation gracefully', async () => {
      // Mock file discovery
      const mockFiles = [
        { fsPath: '/test/file1.css' },
        { fsPath: '/test/file2.js' }
      ];
      (vscode.workspace.findFiles as any).mockResolvedValue(mockFiles);
      
      // Mock cancellation
      mockToken.isCancellationRequested = true;

      // Mock withProgress to call the callback immediately
      (vscode.window.withProgress as any).mockImplementation(async (options, callback) => {
        return await callback(mockProgress, mockToken);
      });

      await auditor.auditWorkspace();

      // Should not show completion message when cancelled
      expect(vscode.window.showInformationMessage).not.toHaveBeenCalledWith(
        expect.stringContaining('Audit complete')
      );
    });

    it('should show success message when no issues are found', async () => {
      // Mock file discovery
      const mockFiles = [{ fsPath: '/test/file1.css' }];
      (vscode.workspace.findFiles as any).mockResolvedValue(mockFiles);
      
      // Mock document reading
      const mockDocument = {
        languageId: 'css',
        getText: vi.fn().mockReturnValue('body { color: red; }')
      };
      (vscode.workspace.openTextDocument as any).mockResolvedValue(mockDocument);
      (vscode.workspace.asRelativePath as any).mockReturnValue('file1.css');

      // Mock parser to return no features
      const { CssParser } = await import('../core/cssParser');
      (CssParser.parseCss as any).mockReturnValue({
        features: [],
        locations: new Map()
      });

      // Mock withProgress to call the callback immediately
      (vscode.window.withProgress as any).mockImplementation(async (options, callback) => {
        return await callback(mockProgress, mockToken);
      });

      await auditor.auditWorkspace();

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        '✅ No Baseline compatibility issues found!'
      );
    });

    it('should show issue count when problems are found', async () => {
      // Mock file discovery
      const mockFiles = [{ fsPath: '/test/file1.css' }];
      (vscode.workspace.findFiles as any).mockResolvedValue(mockFiles);
      
      // Mock document reading - need to handle both file reading and report creation
      const mockDocument = {
        languageId: 'css',
        getText: vi.fn().mockReturnValue('body { gap: 10px; }')
      };
      
      (vscode.workspace.openTextDocument as any).mockImplementation((options: any) => {
        if (options && options.content) {
          // This is the report document creation
          return Promise.resolve({ uri: { fsPath: 'report.md' } });
        }
        // This is file reading
        return Promise.resolve(mockDocument);
      });
      
      (vscode.workspace.asRelativePath as any).mockReturnValue('file1.css');

      // Mock parser to return non-baseline feature
      const { CssParser } = await import('../core/cssParser');
      const mockRange = new vscode.Range(new vscode.Position(0, 7), new vscode.Position(0, 10));
      (CssParser.parseCss as any).mockReturnValue({
        features: ['css.properties.gap'],
        locations: new Map([
          ['css.properties.gap', [mockRange]]
        ])
      });

      // Mock baseline data manager
      mockBaselineDataManager.isBaselineSupported.mockReturnValue(false);
      mockBaselineDataManager.getFeatureData.mockReturnValue({
        name: 'gap',
        status: { baseline: false }
      });

      // Mock withProgress to call the callback immediately
      (vscode.window.withProgress as any).mockImplementation(async (options, callback) => {
        return await callback(mockProgress, mockToken);
      });

      await auditor.auditWorkspace();

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        '📊 Audit complete: Found 1 compatibility issue across 1 files.'
      );
    });

    it('should handle errors gracefully', async () => {
      // Mock withProgress to throw error directly
      (vscode.window.withProgress as any).mockRejectedValue(new Error('File system error'));

      await auditor.auditWorkspace();

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        'Failed to audit workspace: File system error'
      );
    });
  });

  describe('file discovery', () => {
    it('should discover files with correct patterns and exclusions', async () => {
      const mockFiles = [
        { fsPath: '/test/file1.css' },
        { fsPath: '/test/file2.js' },
        { fsPath: '/test/file3.html' }
      ];
      
      (vscode.workspace.findFiles as any).mockResolvedValue(mockFiles);
      (vscode.window.withProgress as any).mockImplementation(async (options, callback) => {
        return await callback(mockProgress, mockToken);
      });

      await auditor.auditWorkspace();

      // Verify that findFiles was called with correct patterns
      expect(vscode.workspace.findFiles).toHaveBeenCalledWith(
        expect.stringMatching(/\*\*\/\*\.(css|js|html)/),
        expect.stringContaining('node_modules')
      );
    });

    it('should remove duplicate files', async () => {
      // Mock duplicate files (same fsPath)
      const mockFiles = [
        { fsPath: '/test/file1.js' },
        { fsPath: '/test/file1.js' }, // Duplicate
        { fsPath: '/test/file2.css' }
      ];
      
      (vscode.workspace.findFiles as any).mockResolvedValue(mockFiles);
      
      // Mock document reading
      const mockDocument = {
        languageId: 'javascript',
        getText: vi.fn().mockReturnValue('console.log("test");')
      };
      (vscode.workspace.openTextDocument as any).mockResolvedValue(mockDocument);
      (vscode.workspace.asRelativePath as any).mockReturnValue('file1.js');

      // Mock parser
      const { JsParser } = await import('../core/jsParser');
      (JsParser.parseJavaScript as any).mockReturnValue({
        features: [],
        locations: new Map()
      });

      (vscode.window.withProgress as any).mockImplementation(async (options, callback) => {
        return await callback(mockProgress, mockToken);
      });

      await auditor.auditWorkspace();

      // Should only process unique files (2 unique files + 1 report document)
      expect(vscode.workspace.openTextDocument).toHaveBeenCalledTimes(3);
    });
  });

  describe('file scanning', () => {
    it('should scan CSS files correctly', async () => {
      const mockFiles = [{ fsPath: '/test/styles.css' }];
      (vscode.workspace.findFiles as any).mockResolvedValue(mockFiles);
      
      const mockDocument = {
        languageId: 'css',
        getText: vi.fn().mockReturnValue('.container { display: grid; gap: 10px; }')
      };
      (vscode.workspace.openTextDocument as any).mockResolvedValue(mockDocument);
      (vscode.workspace.asRelativePath as any).mockReturnValue('styles.css');

      const { CssParser } = await import('../core/cssParser');
      const mockRange = new vscode.Range(new vscode.Position(0, 25), new vscode.Position(0, 28));
      (CssParser.parseCss as any).mockReturnValue({
        features: ['css.properties.gap'],
        locations: new Map([
          ['css.properties.gap', [mockRange]]
        ])
      });

      mockBaselineDataManager.isBaselineSupported.mockReturnValue(false);
      mockBaselineDataManager.getFeatureData.mockReturnValue({
        name: 'gap',
        status: { baseline: false }
      });

      (vscode.window.withProgress as any).mockImplementation(async (options, callback) => {
        return await callback(mockProgress, mockToken);
      });

      await auditor.auditWorkspace();

      expect(CssParser.parseCss).toHaveBeenCalledWith('.container { display: grid; gap: 10px; }', mockDocument);
    });

    it('should scan JavaScript files correctly', async () => {
      const mockFiles = [{ fsPath: '/test/script.js' }];
      (vscode.workspace.findFiles as any).mockResolvedValue(mockFiles);
      
      const mockDocument = {
        languageId: 'javascript',
        getText: vi.fn().mockReturnValue('navigator.clipboard.writeText("test");')
      };
      (vscode.workspace.openTextDocument as any).mockResolvedValue(mockDocument);
      (vscode.workspace.asRelativePath as any).mockReturnValue('script.js');

      const { JsParser } = await import('../core/jsParser');
      const mockRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 19));
      (JsParser.parseJavaScript as any).mockReturnValue({
        features: ['api.Clipboard'],
        locations: new Map([
          ['api.Clipboard', [mockRange]]
        ])
      });

      mockBaselineDataManager.isBaselineSupported.mockReturnValue(false);
      mockBaselineDataManager.getFeatureData.mockReturnValue({
        name: 'Clipboard API',
        status: { baseline: 'low' }
      });

      (vscode.window.withProgress as any).mockImplementation(async (options, callback) => {
        return await callback(mockProgress, mockToken);
      });

      await auditor.auditWorkspace();

      expect(JsParser.parseJavaScript).toHaveBeenCalledWith('navigator.clipboard.writeText("test");', mockDocument);
    });

    it('should scan HTML files correctly', async () => {
      const mockFiles = [{ fsPath: '/test/index.html' }];
      (vscode.workspace.findFiles as any).mockResolvedValue(mockFiles);
      
      const mockDocument = {
        languageId: 'html',
        getText: vi.fn().mockReturnValue('<dialog><p>Hello</p></dialog>')
      };
      (vscode.workspace.openTextDocument as any).mockResolvedValue(mockDocument);
      (vscode.workspace.asRelativePath as any).mockReturnValue('index.html');

      const { HtmlParser } = await import('../core/htmlParser');
      const mockRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 8));
      (HtmlParser.parseHtml as any).mockReturnValue({
        features: ['html.elements.dialog'],
        locations: new Map([
          ['html.elements.dialog', [mockRange]]
        ])
      });

      mockBaselineDataManager.isBaselineSupported.mockReturnValue(false);
      mockBaselineDataManager.getFeatureData.mockReturnValue({
        name: 'dialog element',
        status: { baseline: false }
      });

      (vscode.window.withProgress as any).mockImplementation(async (options, callback) => {
        return await callback(mockProgress, mockToken);
      });

      await auditor.auditWorkspace();

      expect(HtmlParser.parseHtml).toHaveBeenCalledWith('<dialog><p>Hello</p></dialog>', mockDocument);
    });

    it('should handle file parsing errors gracefully', async () => {
      const mockFiles = [{ fsPath: '/test/broken.css' }];
      (vscode.workspace.findFiles as any).mockResolvedValue(mockFiles);
      
      const mockDocument = {
        languageId: 'css',
        getText: vi.fn().mockReturnValue('invalid css {')
      };
      (vscode.workspace.openTextDocument as any).mockResolvedValue(mockDocument);
      (vscode.workspace.asRelativePath as any).mockReturnValue('broken.css');

      const { CssParser } = await import('../core/cssParser');
      (CssParser.parseCss as any).mockImplementation(() => {
        throw new Error('Parse error');
      });

      (vscode.window.withProgress as any).mockImplementation(async (options, callback) => {
        return await callback(mockProgress, mockToken);
      });

      // Should not throw, should handle error gracefully
      await expect(auditor.auditWorkspace()).resolves.not.toThrow();
    });
  });

  describe('report generation', () => {
    it('should generate correct report for no issues', async () => {
      const mockFiles = [{ fsPath: '/test/file1.css' }];
      (vscode.workspace.findFiles as any).mockResolvedValue(mockFiles);
      
      const mockDocument = {
        languageId: 'css',
        getText: vi.fn().mockReturnValue('body { color: red; }')
      };
      (vscode.workspace.openTextDocument as any).mockResolvedValue(mockDocument);
      (vscode.workspace.asRelativePath as any).mockReturnValue('file1.css');

      const { CssParser } = await import('../core/cssParser');
      (CssParser.parseCss as any).mockReturnValue({
        features: [],
        locations: new Map()
      });

      let reportContent = '';
      (vscode.workspace.openTextDocument as any).mockImplementation((options: any) => {
        if (options.content) {
          reportContent = options.content;
          return Promise.resolve({});
        }
        return Promise.resolve(mockDocument);
      });

      (vscode.window.withProgress as any).mockImplementation(async (options, callback) => {
        return await callback(mockProgress, mockToken);
      });

      await auditor.auditWorkspace();

      expect(reportContent).toContain('# Baseline Compatibility Audit Report');
      expect(reportContent).toContain('**Issues Found:** 0');
      expect(reportContent).toContain('## ✅ No Issues Found');
    });

    it('should generate correct report with issues grouped by file', async () => {
      const mockFiles = [{ fsPath: '/test/styles.css' }];
      (vscode.workspace.findFiles as any).mockResolvedValue(mockFiles);
      
      const mockDocument = {
        languageId: 'css',
        getText: vi.fn().mockReturnValue('.container { gap: 10px; }')
      };
      (vscode.workspace.openTextDocument as any).mockResolvedValue(mockDocument);
      (vscode.workspace.asRelativePath as any).mockReturnValue('styles.css');

      const { CssParser } = await import('../core/cssParser');
      const mockRange = new vscode.Range(new vscode.Position(0, 13), new vscode.Position(0, 16));
      (CssParser.parseCss as any).mockReturnValue({
        features: ['css.properties.gap'],
        locations: new Map([
          ['css.properties.gap', [mockRange]]
        ])
      });

      mockBaselineDataManager.isBaselineSupported.mockReturnValue(false);
      mockBaselineDataManager.getFeatureData.mockReturnValue({
        name: 'gap',
        status: { baseline: false }
      });
      mockBaselineDataManager.getMdnUrl.mockReturnValue('https://developer.mozilla.org/en-US/docs/Web/CSS/gap');

      let reportContent = '';
      (vscode.workspace.openTextDocument as any).mockImplementation((options: any) => {
        if (options.content) {
          reportContent = options.content;
          return Promise.resolve({});
        }
        return Promise.resolve(mockDocument);
      });

      (vscode.window.withProgress as any).mockImplementation(async (options, callback) => {
        return await callback(mockProgress, mockToken);
      });

      await auditor.auditWorkspace();

      expect(reportContent).toContain('# Baseline Compatibility Audit Report');
      expect(reportContent).toContain('**Issues Found:** 1');
      expect(reportContent).toContain('### `styles.css` (1 issue)');
      expect(reportContent).toContain('**Line 1:14** - `gap`');
      expect(reportContent).toContain('([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/gap))');
      expect(reportContent).toContain('Not supported by all browsers');
    });

    it('should open report in new editor tab', async () => {
      const mockFiles = [{ fsPath: '/test/file1.css' }];
      (vscode.workspace.findFiles as any).mockResolvedValue(mockFiles);
      
      const mockDocument = {
        languageId: 'css',
        getText: vi.fn().mockReturnValue('body { color: red; }')
      };
      (vscode.workspace.openTextDocument as any).mockResolvedValue(mockDocument);
      (vscode.workspace.asRelativePath as any).mockReturnValue('file1.css');

      const { CssParser } = await import('../core/cssParser');
      (CssParser.parseCss as any).mockReturnValue({
        features: [],
        locations: new Map()
      });

      (vscode.window.withProgress as any).mockImplementation(async (options, callback) => {
        return await callback(mockProgress, mockToken);
      });

      await auditor.auditWorkspace();

      expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith({
        content: expect.stringContaining('# Baseline Compatibility Audit Report'),
        language: 'markdown'
      });
      expect(vscode.window.showTextDocument).toHaveBeenCalledWith(
        expect.anything(),
        {
          preview: false,
          viewColumn: vscode.ViewColumn.One
        }
      );
    });
  });
});