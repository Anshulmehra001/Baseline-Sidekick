"use strict";
// Mock VS Code API for testing
Object.defineProperty(exports, "__esModule", { value: true });
exports.Uri = exports.DiagnosticSeverity = exports.commands = exports.workspace = exports.window = exports.languages = exports.DiagnosticCollection = exports.Range = exports.Position = void 0;
class Position {
    constructor(line, character) {
        this.line = line;
        this.character = character;
    }
}
exports.Position = Position;
class Range {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
}
exports.Range = Range;
class DiagnosticCollection {
    set() { }
    clear() { }
    delete() { }
}
exports.DiagnosticCollection = DiagnosticCollection;
exports.languages = {
    createDiagnosticCollection: () => new DiagnosticCollection(),
};
exports.window = {
    showErrorMessage: () => { },
    showWarningMessage: () => { },
    showInformationMessage: () => { },
};
exports.workspace = {
    findFiles: () => Promise.resolve([]),
    openTextDocument: () => Promise.resolve({}),
};
exports.commands = {
    registerCommand: () => { },
};
exports.DiagnosticSeverity = {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3,
};
exports.Uri = {
    file: (path) => ({ fsPath: path }),
    parse: (uri) => ({ fsPath: uri }),
};
//# sourceMappingURL=vscode.js.map