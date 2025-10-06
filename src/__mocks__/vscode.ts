// Mock VS Code API for testing
import { vi } from 'vitest';

export class Position {
  constructor(public line: number, public character: number) {}
}

export class Range {
  constructor(public start: Position, public end: Position) {}
}

export class DiagnosticCollection {
  set() {}
  clear() {}
  delete() {}
}

export class OutputChannel {
  appendLine() {}
  append() {}
  clear() {}
  show() {}
  hide() {}
  dispose() {}
}

export const languages = {
  createDiagnosticCollection: (name?: string) => new DiagnosticCollection(),
  registerHoverProvider: (selector: any, provider: any) => ({ dispose: () => {} }),
  registerCodeActionsProvider: (selector: any, provider: any, metadata?: any) => ({ dispose: () => {} }),
};

export enum StatusBarAlignment {
  Left = 1,
  Right = 2
}

export class StatusBarItem {
  text: string = '';
  tooltip: string = '';
  command: string = '';
  backgroundColor: any;
  show() {}
  hide() {}
  dispose() {}
}

export const window = {
  showErrorMessage: () => Promise.resolve(),
  showWarningMessage: () => Promise.resolve(),
  showInformationMessage: () => Promise.resolve(),
  createOutputChannel: () => new OutputChannel(),
  createStatusBarItem: (alignment?: StatusBarAlignment, priority?: number) => new StatusBarItem(),
  withProgress: (options: any, task: any) => task({ report: () => {} }),
  showTextDocument: () => Promise.resolve(),
};

export const workspace = {
  findFiles: () => Promise.resolve([]),
  openTextDocument: () => Promise.resolve({}),
  textDocuments: [],
  onDidChangeTextDocument: (listener: (e: any) => any) => ({ dispose: () => {} }),
  onDidOpenTextDocument: (listener: (document: any) => any) => ({ dispose: () => {} }),
  onDidSaveTextDocument: (listener: (document: any) => any) => ({ dispose: () => {} }),
  getConfiguration: (section?: string) => ({
    get: (key: string, defaultValue?: any) => defaultValue
  }),
  asRelativePath: (pathOrUri: any) => pathOrUri,
};

export const commands = {
  registerCommand: (command: string, callback: (...args: any[]) => any) => ({ dispose: () => {} }),
};

export const DiagnosticSeverity = {
  Error: 0,
  Warning: 1,
  Information: 2,
  Hint: 3,
};

export const CodeActionKind = {
  RefactorRewrite: 'refactor.rewrite',
  QuickFix: 'quickfix',
};

export const ProgressLocation = {
  Notification: 15,
  Window: 10,
};

export const Uri = {
  file: (path: string) => ({ fsPath: path, toString: () => path }),
  parse: (uri: string) => ({ fsPath: uri, toString: () => uri }),
};

export class Diagnostic {
  constructor(
    public range: Range,
    public message: string,
    public severity?: number
  ) {}
}

export class CodeAction {
  constructor(public title: string, public kind?: string) {}
}

export class WorkspaceEdit {
  replace() {}
}

export class Hover {
  constructor(public contents: any, public range?: Range) {}
}

export class MarkdownString {
  constructor(public value?: string) {}
  appendMarkdown(value: string) {
    this.value = (this.value || '') + value;
  }
}

// Export everything as a module default for compatibility
const vscode = {
  Position,
  Range,
  DiagnosticCollection,
  OutputChannel,
  languages,
  StatusBarAlignment,
  StatusBarItem,
  window,
  workspace,
  commands,
  DiagnosticSeverity,
  CodeActionKind,
  ProgressLocation,
  Uri,
  Diagnostic,
  CodeAction,
  WorkspaceEdit,
  Hover,
  MarkdownString,
};

export default vscode;