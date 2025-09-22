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

export const languages = {
  createDiagnosticCollection: () => new DiagnosticCollection(),
};

export const window = {
  showErrorMessage: () => {},
  showWarningMessage: () => {},
  showInformationMessage: () => {},
};

export const workspace = {
  findFiles: () => Promise.resolve([]),
  openTextDocument: () => Promise.resolve({}),
};

export const commands = {
  registerCommand: () => {},
};

export const DiagnosticSeverity = {
  Error: 0,
  Warning: 1,
  Information: 2,
  Hint: 3,
};

export const Uri = {
  file: (path: string) => ({ fsPath: path }),
  parse: (uri: string) => ({ fsPath: uri }),
};