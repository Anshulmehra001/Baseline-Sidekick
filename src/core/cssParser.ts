import * as postcss from 'postcss';
import { ErrorHandler } from './errorHandler';

// Make vscode import optional for testing
let vscode: any;
try {
  vscode = require('vscode');
} catch {
  // Use mock for testing
  vscode = {
    Position: class Position {
      constructor(public line: number, public character: number) {}
    },
    Range: class Range {
      constructor(public start: any, public end: any) {}
    }
  };
}

export interface CssParseResult {
  features: string[];
  locations: Map<string, any[]>; // Use any for VS Code Range to avoid import issues in tests
}

export class CssParser {
  private static errorHandler = ErrorHandler.getInstance();

  /**
   * Parses CSS content and extracts web platform features
   * @param content CSS content to parse
   * @param document Optional VS Code document for position mapping
   * @returns Array of web-features IDs found in the CSS
   */
  public static parseCss(content: string, document?: any): CssParseResult {
    const features: string[] = [];
    const locations = new Map<string, any[]>();

    try {
      // Validate input
      if (!content || typeof content !== 'string') {
        this.errorHandler.handleValidationError('Invalid CSS content provided', 'CSS parsing validation');
        return { features: [], locations: new Map() };
      }

      const root = postcss.parse(content);
      
      root.walkDecls((decl) => {
        const property = decl.prop;
        const featureId = this.mapCssPropertyToFeatureId(property);
        
        if (featureId && !features.includes(featureId)) {
          features.push(featureId);
        }

        // Track locations if document is provided
        if (document && featureId) {
          const range = this.getPropertyRange(decl, document);
          if (range) {
            if (!locations.has(featureId)) {
              locations.set(featureId, []);
            }
            locations.get(featureId)!.push(range);
          }
        }
      });

      // Also check at-rules for features like @supports, @container, etc.
      root.walkAtRules((atRule) => {
        const featureId = this.mapAtRuleToFeatureId(atRule.name);
        
        if (featureId && !features.includes(featureId)) {
          features.push(featureId);
        }

        // Track locations for at-rules
        if (document && featureId) {
          const range = this.getAtRuleRange(atRule, document);
          if (range) {
            if (!locations.has(featureId)) {
              locations.set(featureId, []);
            }
            locations.get(featureId)!.push(range);
          }
        }
      });

    } catch (error) {
      // Handle CSS parsing errors gracefully
      this.errorHandler.handleParserError(
        error instanceof Error ? error : new Error('Unknown CSS parsing error'),
        'CSS',
        'Parsing CSS content with PostCSS'
      );
      // Return empty result on parse failure
      return { features: [], locations: new Map() };
    }

    return { features, locations };
  }

  /**
   * Maps CSS property names to web-features IDs
   * @param property CSS property name
   * @returns web-features ID or null if not mappable
   */
  private static mapCssPropertyToFeatureId(property: string): string | null {
    // Remove vendor prefixes for mapping
    const normalizedProperty = property.replace(/^-(?:webkit|moz|ms|o)-/, '');
    
    // Map CSS properties to web-features IDs
    // Format: css.properties.{property-name}
    return `css.properties.${normalizedProperty}`;
  }

  /**
   * Maps CSS at-rules to web-features IDs
   * @param atRuleName At-rule name (without @)
   * @returns web-features ID or null if not mappable
   */
  private static mapAtRuleToFeatureId(atRuleName: string): string | null {
    // Map common at-rules to web-features IDs
    const atRuleMap: Record<string, string> = {
      'supports': 'css.at-rules.supports',
      'container': 'css.at-rules.container',
      'layer': 'css.at-rules.layer',
      'media': 'css.at-rules.media',
      'keyframes': 'css.at-rules.keyframes',
      'import': 'css.at-rules.import',
      'namespace': 'css.at-rules.namespace'
    };

    return atRuleMap[atRuleName] || `css.at-rules.${atRuleName}`;
  }

  /**
   * Gets the VS Code range for a CSS declaration
   * @param decl PostCSS declaration node
   * @param document VS Code document
   * @returns VS Code range or null if not determinable
   */
  private static getPropertyRange(decl: postcss.Declaration, document: any): any | null {
    if (!decl.source?.start || !decl.source?.end) {
      return null;
    }

    try {
      const startPos = new vscode.Position(
        decl.source.start.line - 1, // PostCSS uses 1-based line numbers
        decl.source.start.column - 1 // PostCSS uses 1-based column numbers
      );
      
      // For properties, we want to highlight just the property name
      const propertyEndColumn = decl.source.start.column - 1 + decl.prop.length;
      const endPos = new vscode.Position(
        decl.source.start.line - 1,
        propertyEndColumn
      );

      return new vscode.Range(startPos, endPos);
    } catch (error) {
      this.errorHandler.handleParserError(
        error instanceof Error ? error : new Error('Unknown error creating CSS property range'),
        'CSS',
        'Creating VS Code range for CSS property'
      );
      return null;
    }
  }

  /**
   * Gets the VS Code range for a CSS at-rule
   * @param atRule PostCSS at-rule node
   * @param document VS Code document
   * @returns VS Code range or null if not determinable
   */
  private static getAtRuleRange(atRule: postcss.AtRule, document: any): any | null {
    if (!atRule.source?.start || !atRule.source?.end) {
      return null;
    }

    try {
      const startPos = new vscode.Position(
        atRule.source.start.line - 1,
        atRule.source.start.column - 1
      );
      
      // Highlight the at-rule name (e.g., @supports)
      const atRuleEndColumn = atRule.source.start.column - 1 + atRule.name.length + 1; // +1 for @
      const endPos = new vscode.Position(
        atRule.source.start.line - 1,
        atRuleEndColumn
      );

      return new vscode.Range(startPos, endPos);
    } catch (error) {
      this.errorHandler.handleParserError(
        error instanceof Error ? error : new Error('Unknown error creating CSS at-rule range'),
        'CSS',
        'Creating VS Code range for CSS at-rule'
      );
      return null;
    }
  }

  /**
   * Extracts just the feature IDs without location information
   * @param content CSS content to parse
   * @returns Array of web-features IDs
   */
  public static extractFeatures(content: string): string[] {
    const result = this.parseCss(content);
    return result.features;
  }
}