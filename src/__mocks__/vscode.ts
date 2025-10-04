// Mock VS Code API for testing

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
  createDiagnosticCollection: () => new DiagnosticCollection(),
  registerHoverProvider: () => ({ dispose: () => {} }),
  registerCodeActionsProvider: () => ({ dispose: () => {} }),
};

export const StatusBarAlignment = {
  Left: 1,
  Right: 2
};

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
  createStatusBarItem: () => new StatusBarItem(),
  withProgress: (options: any, task: any) => task({ report: () => {} }),
  showTextDocument: () => Promise.resolve(),
};

export const workspace = {
  findFiles: () => Promise.resolve([]),
  openTextDocument: () => Promise.resolve({}),
  textDocuments: [],
  onDidChangeTextDocument: () => ({ dispose: () => {} }),
  onDidOpenTextDocument: () => ({ dispose: () => {} }),
  onDidSaveTextDocument: () => ({ dispose: () => {} }),
  getConfiguration: () => ({
    get: (key: string, defaultValue: any) => defaultValue
  }),
  asRelativePath: (uri: any) => uri,
};

export const commands = {
  registerCommand: () => ({ dispose: () => {} }),
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