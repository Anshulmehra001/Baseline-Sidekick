import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import * as vscode from 'vscode';
import { BaselineHoverProvider } from './hoverProvider';
import { BaselineDataManager, Feature } from '../core/baselineData';
import { EnhancedDiagnostic } from '../diagnostics';

// Mock VS Code API
vi.mock('vscode', () => ({
  languages: {
    getDiagnostics: vi.fn()
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
      // Simple contains logic for testing
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
  Uri: {
    parse: vi.fn((uri: string) => ({ toString: () => uri }))
  }
}));

// Mock BaselineDataManager
vi.mock('../core/baselineData', () => ({
  BaselineDataManager: {
    getInstance: vi.fn()
  }
}));

describe('BaselineHoverProvider', () => {
  let hoverProvider: BaselineHoverProvider;
  let mockBaselineDataManager: {
    isInitialized: Mock;
    initialize: Mock;
    getFeatureData: Mock;
    getMdnUrl: Mock;
  };
  let mockDocument: vscode.TextDocument;
  let mockPosition: vscode.Position;
  let mockRange: vscode.Range;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock BaselineDataManager
    mockBaselineDataManager = {
      isInitialized: vi.fn().mockReturnValue(true),
      initialize: vi.fn().mockResolvedValue(undefined),
      getFeatureData: vi.fn(),
      getMdnUrl: vi.fn()
    };

    (BaselineDataManager.getInstance as Mock).mockReturnValue(mockBaselineDataManager);

    // Create mock VS Code objects
    mockDocument = {
      uri: { toString: () => 'file:///test.css' }
    } as any;

    mockPosition = new vscode.Position(5, 10);
    mockRange = new vscode.Range(new vscode.Position(5, 8), new vscode.Position(5, 15));

    // Create hover provider instance
    hoverProvider = new BaselineHoverProvider();
  });

  describe('provideHover', () => {
    it('should return undefined when no diagnostics are found at position', async () => {
      // Mock getDiagnostics to return empty array
      (vscode.languages.getDiagnostics as Mock).mockReturnValue([]);

      const result = await hoverProvider.provideHover(mockDocument, mockPosition, {} as any);

      expect(result).toBeUndefined();
    });

    it('should return undefined when no Baseline Sidekick diagnostics are found', async () => {
      // Mock diagnostics from other sources
      const otherDiagnostic = {
        range: mockRange,
        message: 'Some other error',
        source: 'Other Extension'
      };

      (vscode.languages.getDiagnostics as Mock).mockReturnValue([otherDiagnostic]);

      const result = await hoverProvider.provideHover(mockDocument, mockPosition, {} as any);

      expect(result).toBeUndefined();
    });

    it('should return undefined when diagnostic does not contain position', async () => {
      // Create diagnostic with range that doesn't contain the position
      const diagnostic: EnhancedDiagnostic = {
        range: new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 5)),
        message: 'Not baseline supported',
        severity: vscode.DiagnosticSeverity.Warning,
        source: 'Baseline Sidekick',
        code: {
          value: 'css.properties.gap',
          target: vscode.Uri.parse('https://example.com')
        }
      };

      // Mock contains to return false
      (diagnostic.range.contains as Mock).mockReturnValue(false);

      (vscode.languages.getDiagnostics as Mock).mockReturnValue([diagnostic]);

      const result = await hoverProvider.provideHover(mockDocument, mockPosition, {} as any);

      expect(result).toBeUndefined();
    });

    it('should return undefined when feature data is not found', async () => {
      const diagnostic: EnhancedDiagnostic = {
        range: mockRange,
        message: 'Not baseline supported',
        severity: vscode.DiagnosticSeverity.Warning,
        source: 'Baseline Sidekick',
        code: {
          value: 'css.properties.gap',
          target: vscode.Uri.parse('https://example.com')
        }
      };

      (vscode.languages.getDiagnostics as Mock).mockReturnValue([diagnostic]);
      mockBaselineDataManager.getFeatureData.mockReturnValue(undefined);

      const result = await hoverProvider.provideHover(mockDocument, mockPosition, {} as any);

      expect(result).toBeUndefined();
    });

    it('should create hover with rich content for non-baseline feature', async () => {
      const featureData: Feature = {
        name: 'CSS Gap Property',
        status: {
          baseline: false
        },
        spec: 'CSS Box Alignment Module Level 3',
        mdn_url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/gap'
      };

      const diagnostic: EnhancedDiagnostic = {
        range: mockRange,
        message: 'Not baseline supported',
        severity: vscode.DiagnosticSeverity.Warning,
        source: 'Baseline Sidekick',
        code: {
          value: 'css.properties.gap',
          target: vscode.Uri.parse('https://example.com')
        }
      };

      (vscode.languages.getDiagnostics as Mock).mockReturnValue([diagnostic]);
      mockBaselineDataManager.getFeatureData.mockReturnValue(featureData);
      mockBaselineDataManager.getMdnUrl.mockReturnValue(featureData.mdn_url);

      const result = await hoverProvider.provideHover(mockDocument, mockPosition, {} as any);

      expect(result).toBeDefined();
      expect(result!.range).toBe(mockRange);
      
      // Check that MarkdownString was created with expected content
      const markdownString = result!.contents as vscode.MarkdownString;
      expect(markdownString.value).toContain('CSS Gap Property');
      expect(markdownString.value).toContain('🚫 **Not Baseline Supported**');
      expect(markdownString.value).toContain('MDN Documentation');
      expect(markdownString.value).toContain('Can I Use');
      expect(markdownString.value).toContain('Web Features');
      expect(markdownString.isTrusted).toBe(true);
      expect(markdownString.supportHtml).toBe(true);
    });

    it('should handle limited baseline support with date information', async () => {
      const featureData: Feature = {
        name: 'CSS Container Queries',
        status: {
          baseline: 'low',
          baseline_low_date: '2023-02-14'
        },
        spec: 'CSS Containment Module Level 3',
        mdn_url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@container'
      };

      const diagnostic: EnhancedDiagnostic = {
        range: mockRange,
        message: 'Limited baseline support',
        severity: vscode.DiagnosticSeverity.Warning,
        source: 'Baseline Sidekick',
        code: {
          value: 'css.at-rules.container',
          target: vscode.Uri.parse('https://example.com')
        }
      };

      (vscode.languages.getDiagnostics as Mock).mockReturnValue([diagnostic]);
      mockBaselineDataManager.getFeatureData.mockReturnValue(featureData);
      mockBaselineDataManager.getMdnUrl.mockReturnValue(featureData.mdn_url);

      const result = await hoverProvider.provideHover(mockDocument, mockPosition, {} as any);

      expect(result).toBeDefined();
      
      const markdownString = result!.contents as vscode.MarkdownString;
      expect(markdownString.value).toContain('CSS Container Queries');
      expect(markdownString.value).toContain('⚠️ **Limited Baseline Support**');
      expect(markdownString.value).toContain('Available since');
      expect(markdownString.value).toContain('14/2/2023');
    });

    it('should include suggested alternatives for known problematic features', async () => {
      const featureData: Feature = {
        name: 'CSS Float Property',
        status: {
          baseline: false
        },
        spec: 'CSS 2.1',
        mdn_url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/float'
      };

      const diagnostic: EnhancedDiagnostic = {
        range: mockRange,
        message: 'Not baseline supported',
        severity: vscode.DiagnosticSeverity.Warning,
        source: 'Baseline Sidekick',
        code: {
          value: 'css.properties.float',
          target: vscode.Uri.parse('https://example.com')
        }
      };

      (vscode.languages.getDiagnostics as Mock).mockReturnValue([diagnostic]);
      mockBaselineDataManager.getFeatureData.mockReturnValue(featureData);
      mockBaselineDataManager.getMdnUrl.mockReturnValue(featureData.mdn_url);

      const result = await hoverProvider.provideHover(mockDocument, mockPosition, {} as any);

      expect(result).toBeDefined();
      
      const markdownString = result!.contents as vscode.MarkdownString;
      expect(markdownString.value).toContain('💡 Suggested Alternatives');
      expect(markdownString.value).toContain('Flexbox');
      expect(markdownString.value).toContain('CSS Grid');
    });

    it('should initialize baseline data manager if not initialized', async () => {
      mockBaselineDataManager.isInitialized.mockReturnValue(false);

      const featureData: Feature = {
        name: 'Test Feature',
        status: { baseline: false },
        spec: 'Test Spec'
      };

      const diagnostic: EnhancedDiagnostic = {
        range: mockRange,
        message: 'Not baseline supported',
        severity: vscode.DiagnosticSeverity.Warning,
        source: 'Baseline Sidekick',
        code: {
          value: 'test.feature',
          target: vscode.Uri.parse('https://example.com')
        }
      };

      (vscode.languages.getDiagnostics as Mock).mockReturnValue([diagnostic]);
      mockBaselineDataManager.getFeatureData.mockReturnValue(featureData);

      await hoverProvider.provideHover(mockDocument, mockPosition, {} as any);

      expect(mockBaselineDataManager.initialize).toHaveBeenCalled();
    });

    it('should handle errors gracefully and return undefined', async () => {
      // Mock getDiagnostics to throw an error
      (vscode.languages.getDiagnostics as Mock).mockImplementation(() => {
        throw new Error('Test error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await hoverProvider.provideHover(mockDocument, mockPosition, {} as any);

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('Error providing hover information:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('CanIUse URL construction', () => {
    it('should construct correct CanIUse URLs for CSS properties', async () => {
      const featureData: Feature = {
        name: 'CSS Gap Property',
        status: { baseline: false },
        spec: 'CSS Box Alignment Module Level 3'
      };

      const diagnostic: EnhancedDiagnostic = {
        range: mockRange,
        message: 'Not baseline supported',
        severity: vscode.DiagnosticSeverity.Warning,
        source: 'Baseline Sidekick',
        code: {
          value: 'css.properties.gap',
          target: vscode.Uri.parse('https://example.com')
        }
      };

      (vscode.languages.getDiagnostics as Mock).mockReturnValue([diagnostic]);
      mockBaselineDataManager.getFeatureData.mockReturnValue(featureData);

      const result = await hoverProvider.provideHover(mockDocument, mockPosition, {} as any);

      const markdownString = result!.contents as vscode.MarkdownString;
      expect(markdownString.value).toContain('https://caniuse.com/mdn-gap');
    });

    it('should construct correct CanIUse URLs for API features', async () => {
      const featureData: Feature = {
        name: 'XMLHttpRequest',
        status: { baseline: false },
        spec: 'XMLHttpRequest Standard'
      };

      const diagnostic: EnhancedDiagnostic = {
        range: mockRange,
        message: 'Not baseline supported',
        severity: vscode.DiagnosticSeverity.Warning,
        source: 'Baseline Sidekick',
        code: {
          value: 'api.XMLHttpRequest',
          target: vscode.Uri.parse('https://example.com')
        }
      };

      (vscode.languages.getDiagnostics as Mock).mockReturnValue([diagnostic]);
      mockBaselineDataManager.getFeatureData.mockReturnValue(featureData);

      const result = await hoverProvider.provideHover(mockDocument, mockPosition, {} as any);

      const markdownString = result!.contents as vscode.MarkdownString;
      expect(markdownString.value).toContain('https://caniuse.com/mdn-xmlhttprequest');
    });
  });
});