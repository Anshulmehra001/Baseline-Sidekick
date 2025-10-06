"use strict";
// Mock VS Code API for testing
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownString = exports.Hover = exports.WorkspaceEdit = exports.CodeAction = exports.Diagnostic = exports.Uri = exports.ProgressLocation = exports.CodeActionKind = exports.DiagnosticSeverity = exports.commands = exports.workspace = exports.window = exports.StatusBarItem = exports.StatusBarAlignment = exports.languages = exports.OutputChannel = exports.DiagnosticCollection = exports.Range = exports.Position = void 0;
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
class OutputChannel {
    appendLine() { }
    append() { }
    clear() { }
    show() { }
    hide() { }
    dispose() { }
}
exports.OutputChannel = OutputChannel;
exports.languages = {
    createDiagnosticCollection: (name) => new DiagnosticCollection(),
    registerHoverProvider: (selector, provider) => ({ dispose: () => { } }),
    registerCodeActionsProvider: (selector, provider, metadata) => ({ dispose: () => { } }),
};
var StatusBarAlignment;
(function (StatusBarAlignment) {
    StatusBarAlignment[StatusBarAlignment["Left"] = 1] = "Left";
    StatusBarAlignment[StatusBarAlignment["Right"] = 2] = "Right";
})(StatusBarAlignment = exports.StatusBarAlignment || (exports.StatusBarAlignment = {}));
class StatusBarItem {
    constructor() {
        this.text = '';
        this.tooltip = '';
        this.command = '';
    }
    show() { }
    hide() { }
    dispose() { }
}
exports.StatusBarItem = StatusBarItem;
exports.window = {
    showErrorMessage: () => Promise.resolve(),
    showWarningMessage: () => Promise.resolve(),
    showInformationMessage: () => Promise.resolve(),
    createOutputChannel: () => new OutputChannel(),
    createStatusBarItem: (alignment, priority) => new StatusBarItem(),
    withProgress: (options, task) => task({ report: () => { } }),
    showTextDocument: () => Promise.resolve(),
};
exports.workspace = {
    findFiles: () => Promise.resolve([]),
    openTextDocument: () => Promise.resolve({}),
    textDocuments: [],
    onDidChangeTextDocument: (listener) => ({ dispose: () => { } }),
    onDidOpenTextDocument: (listener) => ({ dispose: () => { } }),
    onDidSaveTextDocument: (listener) => ({ dispose: () => { } }),
    getConfiguration: (section) => ({
        get: (key, defaultValue) => defaultValue
    }),
    asRelativePath: (pathOrUri) => pathOrUri,
};
exports.commands = {
    registerCommand: (command, callback) => ({ dispose: () => { } }),
};
exports.DiagnosticSeverity = {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3,
};
exports.CodeActionKind = {
    RefactorRewrite: 'refactor.rewrite',
    QuickFix: 'quickfix',
};
exports.ProgressLocation = {
    Notification: 15,
    Window: 10,
};
exports.Uri = {
    file: (path) => ({ fsPath: path, toString: () => path }),
    parse: (uri) => ({ fsPath: uri, toString: () => uri }),
};
class Diagnostic {
    constructor(range, message, severity) {
        this.range = range;
        this.message = message;
        this.severity = severity;
    }
}
exports.Diagnostic = Diagnostic;
class CodeAction {
    constructor(title, kind) {
        this.title = title;
        this.kind = kind;
    }
}
exports.CodeAction = CodeAction;
class WorkspaceEdit {
    replace() { }
}
exports.WorkspaceEdit = WorkspaceEdit;
class Hover {
    constructor(contents, range) {
        this.contents = contents;
        this.range = range;
    }
}
exports.Hover = Hover;
class MarkdownString {
    constructor(value) {
        this.value = value;
    }
    appendMarkdown(value) {
        this.value = (this.value || '') + value;
    }
}
exports.MarkdownString = MarkdownString;
//# sourceMappingURL=vscode.js.map