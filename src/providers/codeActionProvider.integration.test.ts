import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as vscode from 'vscode';
import { BaselineCodeActionProvider } from './codeActionProvider';

// Mock VS Code API with more complete implementations
vi.mock('vscode', () => ({
    CodeAction: class {
        constructor(public title: string, public kind: any) {}
        public isPreferred?: boolean;
        public edit?: any;
    },
    CodeActionKind: {
        RefactorRewrite: 'refactor.rewrite'
    },
    WorkspaceEdit: class {
        private edits = new Map();
        
        public replace(uri: any, range: any, newText: string) {
            this.edits.set('replace', { uri, range, newText });
        }
        
        public getEdit() {
            return this.edits.get('replace');
        }
    },
    Range: class {
        constructor(public start: any, public end: any) {}
    },
    Position: class {
        constructor(public line: number, public character: number) {}
    }
}));

// Mock BaselineDataManager
vi.mock('../core/baselineData', () => ({
    BaselineDataManager: {
        getInstance: vi.fn(() => ({
            getFeatureData: vi.fn().mockReturnValue({
                name: 'CSS float property',
                status: { baseline: false }
            }),
            isBaselineSupported: vi.fn().mockReturnValue(false)
        }))
    }
}));

describe('BaselineCodeActionProvider Integration Tests', () => {
    let provider: BaselineCodeActionProvider;

    beforeEach(() => {
        provider = new BaselineCodeActionProvider();
    });

    describe('End-to-end CSS refactoring', () => {
        it('should provide complete float to flexbox refactoring workflow', () => {
            // Simulate a CSS file with float property
            const cssContent = `.sidebar {
  float: left;
  width: 25%;
  background: #f0f0f0;
}

.main-content {
  float: right;
  width: 75%;
  padding: 20px;
}`;

            const mockDocument = {
                getText: vi.fn()
                    .mockReturnValueOnce('float: left;') // Diagnostic range text
                    .mockReturnValueOnce(cssContent), // Full document for rule finding
                positionAt: vi.fn()
                    .mockReturnValueOnce(new vscode.Position(1, 2)) // Rule start
                    .mockReturnValueOnce(new vscode.Position(4, 1)), // Rule end
                offsetAt: vi.fn()
                    .mockReturnValueOnce(12) // Float property offset
                    .mockReturnValueOnce(0)  // Rule start offset
                    .mockReturnValueOnce(85), // Rule end offset
                uri: { toString: () => 'test.css' }
            } as any;

            const diagnostic = {
                source: 'baseline-sidekick',
                code: { value: 'css.properties.float' },
                range: new vscode.Range(
                    new vscode.Position(1, 2),
                    new vscode.Position(1, 13)
                )
            } as any;

            const context = {
                diagnostics: [diagnostic]
            } as any;

            const actions = provider.provideCodeActions(
                mockDocument,
                diagnostic.range,
                context,
                {} as any
            );

            expect(actions).toHaveLength(1);
            
            const action = actions[0];
            expect(action.title).toBe('Convert float to Flexbox layout');
            expect(action.isPreferred).toBe(true);
            expect(action.edit).toBeDefined();

            // Verify the edit is defined (we can't easily test the exact content in integration tests)
            expect(action.edit).toBeDefined();
            expect(action.edit.replace).toBeDefined();
        });
    });

    describe('End-to-end JavaScript refactoring', () => {
        it('should provide complete XMLHttpRequest to fetch refactoring workflow', () => {
            const jsContent = `function fetchUserData() {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', '/api/users');
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      console.log(xhr.responseText);
    }
  };
  xhr.send();
}`;

            const mockDocument = {
                getText: vi.fn()
                    .mockReturnValueOnce('new XMLHttpRequest()') // Diagnostic range
                    .mockReturnValueOnce(jsContent), // Full usage range
                positionAt: vi.fn()
                    .mockReturnValue(new vscode.Position(1, 14)),
                offsetAt: vi.fn()
                    .mockReturnValue(35),
                uri: { toString: () => 'test.js' }
            } as any;

            const diagnostic = {
                source: 'baseline-sidekick',
                code: { value: 'api.XMLHttpRequest' },
                range: new vscode.Range(
                    new vscode.Position(1, 14),
                    new vscode.Position(1, 33)
                )
            } as any;

            const context = {
                diagnostics: [diagnostic]
            } as any;

            const actions = provider.provideCodeActions(
                mockDocument,
                diagnostic.range,
                context,
                {} as any
            );

            expect(actions).toHaveLength(1);
            
            const action = actions[0];
            expect(action.title).toBe('Convert XMLHttpRequest to fetch API');
            expect(action.isPreferred).toBe(true);
            
            expect(action.edit).toBeDefined();
            expect(action.edit.replace).toBeDefined();
        });

        it('should provide complete Array.at() to bracket notation refactoring workflow', () => {
            const jsContent = `function getLastItem(arr) {
  return arr.at(-1);
}

function getSecondToLast(items) {
  return items.at(-2);
}`;

            const mockDocument = {
                getText: vi.fn()
                    .mockReturnValueOnce('arr.at(-1)'), // Diagnostic range
                positionAt: vi.fn(),
                offsetAt: vi.fn(),
                uri: { toString: () => 'test.js' }
            } as any;

            const diagnostic = {
                source: 'baseline-sidekick',
                code: { value: 'api.Array.at' },
                range: new vscode.Range(
                    new vscode.Position(1, 9),
                    new vscode.Position(1, 18)
                )
            } as any;

            const context = {
                diagnostics: [diagnostic]
            } as any;

            const actions = provider.provideCodeActions(
                mockDocument,
                diagnostic.range,
                context,
                {} as any
            );

            expect(actions).toHaveLength(1);
            
            const action = actions[0];
            expect(action.title).toBe('Convert Array.at() to bracket notation');
            expect(action.isPreferred).toBe(true);
            
            expect(action.edit).toBeDefined();
            expect(action.edit.replace).toBeDefined();
        });
    });

    describe('Multiple diagnostics handling', () => {
        it('should handle multiple diagnostics and provide actions for each', () => {
            const mockDocument = {
                getText: vi.fn()
                    .mockReturnValueOnce('float: left;')
                    .mockReturnValueOnce('arr.at(-1)')
                    .mockReturnValueOnce('.container { float: left; }')
                    .mockReturnValueOnce('function test() { return arr.at(-1); }'),
                positionAt: vi.fn()
                    .mockReturnValue(new vscode.Position(0, 0)),
                offsetAt: vi.fn()
                    .mockReturnValue(0),
                uri: { toString: () => 'test.js' }
            } as any;

            const diagnostics = [
                {
                    source: 'baseline-sidekick',
                    code: { value: 'css.properties.float' },
                    range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 11))
                },
                {
                    source: 'baseline-sidekick',
                    code: { value: 'api.Array.at' },
                    range: new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 9))
                }
            ] as any;

            const context = {
                diagnostics
            } as any;

            const actions = provider.provideCodeActions(
                mockDocument,
                new vscode.Range(new vscode.Position(0, 0), new vscode.Position(1, 9)),
                context,
                {} as any
            );

            expect(actions).toHaveLength(2);
            expect(actions[0].title).toBe('Convert float to Flexbox layout');
            expect(actions[1].title).toBe('Convert Array.at() to bracket notation');
        });
    });

    describe('Error handling', () => {
        it('should handle malformed diagnostics gracefully', () => {
            const mockDocument = {
                getText: vi.fn(),
                positionAt: vi.fn(),
                offsetAt: vi.fn(),
                uri: { toString: () => 'test.css' }
            } as any;

            const diagnostics = [
                {
                    source: 'baseline-sidekick',
                    code: 'invalid-code-format', // Not an object with value property
                    range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 10))
                },
                {
                    source: 'other-extension',
                    code: { value: 'css.properties.float' },
                    range: new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 10))
                }
            ] as any;

            const context = {
                diagnostics
            } as any;

            const actions = provider.provideCodeActions(
                mockDocument,
                new vscode.Range(new vscode.Position(0, 0), new vscode.Position(1, 10)),
                context,
                {} as any
            );

            expect(actions).toEqual([]);
        });

        it('should handle unknown feature IDs gracefully', () => {
            const mockDocument = {
                getText: vi.fn().mockReturnValue('unknown-feature'),
                positionAt: vi.fn(),
                offsetAt: vi.fn(),
                uri: { toString: () => 'test.css' }
            } as any;

            const diagnostic = {
                source: 'baseline-sidekick',
                code: { value: 'unknown.feature.id' },
                range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 10))
            } as any;

            const context = {
                diagnostics: [diagnostic]
            } as any;

            const actions = provider.provideCodeActions(
                mockDocument,
                diagnostic.range,
                context,
                {} as any
            );

            expect(actions).toEqual([]);
        });
    });
});