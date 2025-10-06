// Global test setup for Vitest
import { vi } from 'vitest';

// Global mock for VS Code API to ensure consistency across all tests
vi.mock('vscode', () => ({
  languages: {
    createDiagnosticCollection: vi.fn(() => ({
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      dispose: vi.fn()
    })),
    registerHoverProvider: vi.fn(() => ({ dispose: vi.fn() })),
    registerCodeActionsProvider: vi.fn(() => ({ dispose: vi.fn() }))
  },
  StatusBarAlignment: {
    Left: 1,
    Right: 2
  },
  DiagnosticSeverity: {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3
  },
  DiagnosticTag: {
    Deprecated: 1
  },
  CodeActionKind: {
    RefactorRewrite: 'refactor.rewrite',
    QuickFix: 'quickfix'
  },
  ProgressLocation: {
    Notification: 15,
    Window: 10
  },
  Position: class Position {
    constructor(public line: number, public character: number) {}
  },
  Range: class Range {
    constructor(public start: any, public end: any) {}
  },
  Uri: {
    parse: vi.fn((url: string) => ({ toString: () => url })),
    file: vi.fn((path: string) => ({ fsPath: path, toString: () => path }))
  },
  window: {
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
      append: vi.fn(),
      clear: vi.fn(),
      show: vi.fn(),
      hide: vi.fn(),
      dispose: vi.fn()
    })),
    createStatusBarItem: vi.fn(() => ({
      text: '',
      tooltip: '',
      command: '',
      backgroundColor: undefined,
      show: vi.fn(),
      hide: vi.fn(),
      dispose: vi.fn()
    })),
    showErrorMessage: vi.fn().mockResolvedValue(undefined),
    showWarningMessage: vi.fn().mockResolvedValue(undefined),
    showInformationMessage: vi.fn().mockResolvedValue(undefined),
    withProgress: vi.fn((options: any, task: any) => task({ report: vi.fn() })),
    showTextDocument: vi.fn().mockResolvedValue(undefined)
  },
  workspace: {
    findFiles: vi.fn().mockResolvedValue([]),
    openTextDocument: vi.fn().mockResolvedValue({}),
    textDocuments: [],
    onDidChangeTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
    onDidOpenTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
    onDidSaveTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
    getConfiguration: vi.fn(() => ({
      get: vi.fn((_key: string, defaultValue: any) => defaultValue)
    })),
    asRelativePath: vi.fn((pathOrUri: any) => pathOrUri)
  },
  commands: {
    registerCommand: vi.fn(() => ({ dispose: vi.fn() }))
  },
  Diagnostic: class Diagnostic {
    constructor(
      public range: any,
      public message: string,
      public severity?: number
    ) {}
  },
  CodeAction: class CodeAction {
    constructor(public title: string, public kind?: string) {}
  },
  WorkspaceEdit: class WorkspaceEdit {
    replace() {}
  },
  Hover: class Hover {
    constructor(public contents: any, public range?: any) {}
  },
  MarkdownString: class MarkdownString {
    constructor(public value?: string) {}
    appendMarkdown(value: string) {
      this.value = (this.value || '') + value;
    }
  }
}));