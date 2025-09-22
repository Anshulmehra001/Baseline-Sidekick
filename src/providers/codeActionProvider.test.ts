import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as vscode from 'vscode';
import { BaselineCodeActionProvider } from './codeActionProvider';
import { BaselineDataManager } from '../core/baselineData';

// Mock VS Code API
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
        public replace = vi.fn();
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
            getFeatureData: vi.fn(),
            isBaselineSupported: vi.fn()
        }))
    }
}));

describe('BaselineCodeActionProvider', () => {
    let provider: BaselineCodeActionProvider;
    let mockDocument: vscode.TextDocument;
    let mockRange: vscode.Range;
    let mockContext: vscode.CodeActionContext;

    beforeEach(() => {
        provider = new BaselineCodeActionProvider();
        
        mockDocument = {
            getText: vi.fn(),
            positionAt: vi.fn(),
            offsetAt: vi.fn(),
            uri: { toString: () => 'test.css' }
        } as any;

        mockRange = new vscode.Range(
            new vscode.Position(0, 0),
            new vscode.Position(0, 10)
        );

        mockContext = {
            diagnostics: []
        } as any;
    });

    describe('provideCodeActions', () => {
        it('should return empty array when no baseline diagnostics present', () => {
            mockContext.diagnostics = [
                {
                    source: 'other-extension',
                    code: 'some-code'
                }
            ] as any;

            const result = provider.provideCodeActions(mockDocument, mockRange, mockContext, {} as any);
            expect(result).toEqual([]);
        });

        it('should process baseline diagnostics and return code actions', () => {
            mockContext.diagnostics = [
                {
                    source: 'baseline-sidekick',
                    code: { value: 'css.properties.float' },
                    range: mockRange
                }
            ] as any;

            mockDocument.getText = vi.fn()
                .mockReturnValueOnce('float: left;') // For the diagnostic range
                .mockReturnValueOnce('.container { float: left; width: 50%; }'); // For the full rule

            mockDocument.positionAt = vi.fn()
                .mockReturnValueOnce(new vscode.Position(0, 0))
                .mockReturnValueOnce(new vscode.Position(2, 1));

            mockDocument.offsetAt = vi.fn()
                .mockReturnValueOnce(12) // Start of float property
                .mockReturnValueOnce(12)
                .mockReturnValueOnce(12);

            const result = provider.provideCodeActions(mockDocument, mockRange, mockContext, {} as any);
            
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            expect(result[0].title).toBe('Convert float to Flexbox layout');
            expect(result[0].isPreferred).toBe(true);
        });
    });

    describe('CSS refactoring actions', () => {
        it('should create float to flexbox conversion action', () => {
            const diagnostic = {
                source: 'baseline-sidekick',
                code: { value: 'css.properties.float' },
                range: mockRange
            } as any;

            mockContext.diagnostics = [diagnostic];
            mockDocument.getText = vi.fn()
                .mockReturnValueOnce('float: left;')
                .mockReturnValueOnce('.container { float: left; width: 50%; }');

            mockDocument.positionAt = vi.fn()
                .mockReturnValue(new vscode.Position(0, 0));

            mockDocument.offsetAt = vi.fn()
                .mockReturnValue(12);

            const result = provider.provideCodeActions(mockDocument, mockRange, mockContext, {} as any);
            
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Convert float to Flexbox layout');
            expect(result[0].kind).toBe('refactor.rewrite');
            expect(result[0].isPreferred).toBe(true);
            expect(result[0].edit).toBeDefined();
        });

        it('should convert float CSS rule to flexbox correctly', () => {
            const provider = new BaselineCodeActionProvider();
            const ruleText = '.container {\n  float: left;\n  width: 50%;\n  margin: 10px;\n}';
            
            // Access private method for testing
            const convertMethod = (provider as any).convertFloatToFlexbox;
            const result = convertMethod.call(provider, ruleText);
            
            expect(result).toContain('display: flex');
            expect(result).toContain('flex-wrap: wrap');
            expect(result).not.toContain('float: left');
            expect(result).toContain('width: 50%');
            expect(result).toContain('margin: 10px');
        });
    });

    describe('JavaScript refactoring actions', () => {
        it('should create XMLHttpRequest to fetch conversion action', () => {
            const diagnostic = {
                source: 'baseline-sidekick',
                code: { value: 'api.XMLHttpRequest' },
                range: mockRange
            } as any;

            mockContext.diagnostics = [diagnostic];
            mockDocument.getText = vi.fn()
                .mockReturnValueOnce('new XMLHttpRequest()')
                .mockReturnValueOnce('const xhr = new XMLHttpRequest(); xhr.open("GET", "/api/data");');

            mockDocument.positionAt = vi.fn()
                .mockReturnValue(new vscode.Position(0, 0));

            mockDocument.offsetAt = vi.fn()
                .mockReturnValue(0);

            const result = provider.provideCodeActions(mockDocument, mockRange, mockContext, {} as any);
            
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Convert XMLHttpRequest to fetch API');
            expect(result[0].isPreferred).toBe(true);
        });

        it('should create Array.at() to bracket notation conversion action', () => {
            const diagnostic = {
                source: 'baseline-sidekick',
                code: { value: 'api.Array.at' },
                range: mockRange
            } as any;

            mockContext.diagnostics = [diagnostic];
            mockDocument.getText = vi.fn()
                .mockReturnValueOnce('arr.at(-1)');

            const result = provider.provideCodeActions(mockDocument, mockRange, mockContext, {} as any);
            
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Convert Array.at() to bracket notation');
            expect(result[0].isPreferred).toBe(true);
        });

        it('should convert Array.at() to bracket notation correctly', () => {
            const provider = new BaselineCodeActionProvider();
            const text = 'arr.at(-1)';
            
            // Access private method for testing
            const convertMethod = (provider as any).convertAtToBracketNotation;
            const result = convertMethod.call(provider, text, mockRange);
            
            expect(result).toBe('arr[-1 >= 0 ? -1 : arr.length + -1]');
        });

        it('should convert positive index Array.at() correctly', () => {
            const provider = new BaselineCodeActionProvider();
            const text = 'items.at(2)';
            
            const convertMethod = (provider as any).convertAtToBracketNotation;
            const result = convertMethod.call(provider, text, mockRange);
            
            expect(result).toBe('items[2 >= 0 ? 2 : items.length + 2]');
        });
    });

    describe('XMLHttpRequest to fetch conversion', () => {
        it('should convert GET request correctly', () => {
            const provider = new BaselineCodeActionProvider();
            const xhrCode = 'const xhr = new XMLHttpRequest();\nxhr.open("GET", "/api/users");';
            
            const convertMethod = (provider as any).convertXhrToFetch;
            const result = convertMethod.call(provider, xhrCode);
            
            expect(result).toContain("fetch('/api/users')");
            expect(result).toContain('.then(response => response.json())');
            expect(result).toContain('.catch(error =>');
        });

        it('should convert POST request correctly', () => {
            const provider = new BaselineCodeActionProvider();
            const xhrCode = 'const xhr = new XMLHttpRequest();\nxhr.open("POST", "/api/users");';
            
            const convertMethod = (provider as any).convertXhrToFetch;
            const result = convertMethod.call(provider, xhrCode);
            
            expect(result).toContain("fetch('/api/users', {");
            expect(result).toContain("method: 'POST'");
            expect(result).toContain("'Content-Type': 'application/json'");
            expect(result).toContain('body: JSON.stringify(data)');
        });

        it('should provide fallback conversion for unrecognized patterns', () => {
            const provider = new BaselineCodeActionProvider();
            const xhrCode = 'someOtherXhrUsage()';
            
            const convertMethod = (provider as any).convertXhrToFetch;
            const result = convertMethod.call(provider, xhrCode);
            
            expect(result).toContain('fetch(url)');
            expect(result).toContain('.then(response => response.json())');
        });
    });
});