import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as vscode from 'vscode';
import { BaselineHoverProvider } from './hoverProvider';
import { DiagnosticController } from '../diagnostics';
import { BaselineDataManager } from '../core/baselineData';

// Mock VS Code API
vi.mock('vscode', () => ({
  languages: {
    getDiagnostics: vi.fn(),
    createDiagnosticCollection: vi.fn(() => ({
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      dispose: vi.fn()
    }))
  },
  Position: vi.fn().mockImplementation((line: number, character: number) => ({
    line,
    character,
    isAfter: vi.fn(),
    isBefore: vi.fn(),
    isAfterOrEqual: vi.fn(),
    isBeforeOrEqual: vi.fn(),
    isEqual: vi.fn(),
    compareTo: vi.fn(),
    translate: vi.fn(),
    with: vi.fn()
  })),
  Range: vi.fn().mockImplementation((start: any, end: any) => ({
    start,
    end,
    isEmpty: false,
    isSingleLine: true,
    contains: vi.fn((position: any) => {
      return position.line >= start.line && position.line <= end.line &&
             position.character >= start.character && position.character <= end.character;
    }),
    isEqual: vi.fn(),
    intersection: vi.fn(),
    union: vi.fn(),
    with: vi.fn()
  })),
  Hover: vi.fn().mockImplementation((contents: any, range?: any) => ({
    contents,
    range
  })),
  MarkdownString: vi.fn().mockImplementation(() => ({
    value: '',
    isTrusted: false,
    supportHtml: false,
    appendMarkdown: vi.fn(function(this: any, text: string) {
      this.value += text;
      return this;
    }),
    appendText: vi.fn(function(this: any, text: string) {
      this.value += text;
      return this;
    }),
    appendCodeblock: vi.fn(function(this: any, code: string, language?: string) {
      this.value += `\`\`\`${language || ''}\n${code}\n\`\`\``;
      return this;
    })
  })),
  DiagnosticSeverity: {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3
  },
  DiagnosticTag: {
    Unnecessary: 1,
    Deprecated: 2
  },
  Uri: {
    parse: vi.fn((uri: string) => ({ toString: () => uri }))
  }
}));

// Mock web-features data
vi.mock('web-features', () => ({
  features: {
    'css.properties.gap': {
      name: 'CSS Gap Property',
      status: {
        baseline: false
      },
      spec: 'CSS Box Alignment Module Level 3',
      mdn_url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/gap'
    },
    'api.XMLHttpRequest': {
      name: 'XMLHttpRequest',
      status: {
        baseline: 'low',
        baseline_low_date: '2020-01-15'
      },
      spec: 'XMLHttpRequest Standard',
      mdn_url: 'https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest'
    }
  }
}));

describe('BaselineHoverProvider Integration', () => {
  let hoverProvider: BaselineHoverProvider;
  let diagnosticController: DiagnosticController;
  let mockContext: vscode.ExtensionContext;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create mock extension context
    mockContext = {
      subscriptions: []
    } as any;

    // Initialize components
    diagnosticController = new DiagnosticController(mockContext);
    hoverProvider = new BaselineHoverProvider();

    // Initialize baseline data manager
    const baselineDataManager = BaselineDataManager.getInstance();
    await baselineDataManager.initialize();
  });

  it('should provide hover information for CSS features detected by diagnostics', async () => {
    // Create a mock CSS document with gap property
    const cssContent = `
.container {
  display: flex;
  gap: 1rem;
  padding: 10px;
}`;

    const mockDocument = {
      uri: vscode.Uri.parse('file:///test.css'),
      languageId: 'css',
      getText: () => cssContent,
      lineAt: vi.fn((line: number) => ({
        text: cssContent.split('\n')[line] || '',
        range: new vscode.Range(new vscode.Position(line, 0), new vscode.Position(line, 20))
      })),
      positionAt: vi.fn((offset: number) => new vscode.Position(0, offset)),
      offsetAt: vi.fn((position: vscode.Position) => position.character)
    } as any;

    // Update diagnostics for the document
    await diagnosticController.updateDiagnostics(mockDocument);

    // Get the diagnostics that were created
    const diagnostics = vscode.languages.getDiagnostics(mockDocument.uri);

    // Mock getDiagnostics to return the diagnostics we expect
    (vscode.languages.getDiagnostics as any).mockReturnValue([
      {
        range: new vscode.Range(new vscode.Position(3, 2), new vscode.Position(3, 5)),
        message: 'CSS feature "CSS Gap Property" is not supported by Baseline',
        severity: vscode.DiagnosticSeverity.Warning,
        source: 'Baseline Sidekick',
        code: {
          value: 'css.properties.gap',
          target: vscode.Uri.parse('https://web-platform-dx.github.io/web-features/css.properties.gap')
        }
      }
    ]);

    // Test hover at the gap property position
    const hoverPosition = new vscode.Position(3, 3); // Inside "gap"
    const hover = await hoverProvider.provideHover(mockDocument, hoverPosition, {} as any);

    expect(hover).toBeDefined();
    expect(hover!.range).toBeDefined();

    const markdownString = hover!.contents as vscode.MarkdownString;
    expect(markdownString.value).toContain('CSS Gap Property');
    expect(markdownString.value).toContain('🚫 **Not Baseline Supported**');
    expect(markdownString.value).toContain('MDN Documentation');
    expect(markdownString.value).toContain('https://developer.mozilla.org/en-US/docs/Web/CSS/gap');
    expect(markdownString.value).toContain('Can I Use');
    expect(markdownString.value).toContain('Web Features');
  });

  it('should provide hover information for JavaScript API features', async () => {
    // Create a mock JavaScript document with XMLHttpRequest
    const jsContent = `
function fetchData() {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', '/api/data');
  xhr.send();
}`;

    const mockDocument = {
      uri: vscode.Uri.parse('file:///test.js'),
      languageId: 'javascript',
      getText: () => jsContent,
      lineAt: vi.fn((line: number) => ({
        text: jsContent.split('\n')[line] || '',
        range: new vscode.Range(new vscode.Position(line, 0), new vscode.Position(line, 50))
      })),
      positionAt: vi.fn((offset: number) => new vscode.Position(0, offset)),
      offsetAt: vi.fn((position: vscode.Position) => position.character)
    } as any;

    // Mock getDiagnostics to return XMLHttpRequest diagnostic
    (vscode.languages.getDiagnostics as any).mockReturnValue([
      {
        range: new vscode.Range(new vscode.Position(2, 18), new vscode.Position(2, 32)),
        message: 'JavaScript feature "XMLHttpRequest" has limited baseline support',
        severity: vscode.DiagnosticSeverity.Warning,
        source: 'Baseline Sidekick',
        code: {
          value: 'api.XMLHttpRequest',
          target: vscode.Uri.parse('https://web-platform-dx.github.io/web-features/api.XMLHttpRequest')
        }
      }
    ]);

    // Test hover at the XMLHttpRequest position
    const hoverPosition = new vscode.Position(2, 25); // Inside "XMLHttpRequest"
    const hover = await hoverProvider.provideHover(mockDocument, hoverPosition, {} as any);

    expect(hover).toBeDefined();

    const markdownString = hover!.contents as vscode.MarkdownString;
    expect(markdownString.value).toContain('XMLHttpRequest');
    expect(markdownString.value).toContain('⚠️ **Limited Baseline Support**');
    expect(markdownString.value).toContain('Available since');
    expect(markdownString.value).toContain('MDN Documentation');
    expect(markdownString.value).toContain('https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest');
    expect(markdownString.value).toContain('💡 Suggested Alternatives');
    expect(markdownString.value).toContain('fetch()');
  });

  it('should not provide hover for positions without diagnostics', async () => {
    const mockDocument = {
      uri: vscode.Uri.parse('file:///test.css'),
      languageId: 'css',
      getText: () => '.container { color: red; }',
    } as any;

    // Mock no diagnostics
    (vscode.languages.getDiagnostics as any).mockReturnValue([]);

    const hoverPosition = new vscode.Position(0, 5);
    const hover = await hoverProvider.provideHover(mockDocument, hoverPosition, {} as any);

    expect(hover).toBeUndefined();
  });

  it('should handle multiple diagnostics and find the correct one', async () => {
    const mockDocument = {
      uri: vscode.Uri.parse('file:///test.css'),
      languageId: 'css'
    } as any;

    // Mock multiple diagnostics
    (vscode.languages.getDiagnostics as any).mockReturnValue([
      {
        range: new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 10)),
        message: 'Other diagnostic',
        severity: vscode.DiagnosticSeverity.Error,
        source: 'Other Extension'
      },
      {
        range: new vscode.Range(new vscode.Position(2, 5), new vscode.Position(2, 8)),
        message: 'CSS feature not supported',
        severity: vscode.DiagnosticSeverity.Warning,
        source: 'Baseline Sidekick',
        code: {
          value: 'css.properties.gap',
          target: vscode.Uri.parse('https://example.com')
        }
      },
      {
        range: new vscode.Range(new vscode.Position(3, 0), new vscode.Position(3, 15)),
        message: 'Another baseline issue',
        severity: vscode.DiagnosticSeverity.Warning,
        source: 'Baseline Sidekick',
        code: {
          value: 'api.XMLHttpRequest',
          target: vscode.Uri.parse('https://example.com')
        }
      }
    ]);

    // Test hover at position that matches the gap diagnostic
    const hoverPosition = new vscode.Position(2, 6);
    const hover = await hoverProvider.provideHover(mockDocument, hoverPosition, {} as any);

    expect(hover).toBeDefined();
    const markdownString = hover!.contents as vscode.MarkdownString;
    expect(markdownString.value).toContain('CSS Gap Property');
  });
});