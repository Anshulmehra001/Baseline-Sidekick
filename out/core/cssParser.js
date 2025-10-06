"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CssParser = void 0;
const postcss = __importStar(require("postcss"));
const errorHandler_1 = require("./errorHandler");
// Make vscode import optional for testing
let vscode;
try {
    vscode = require('vscode');
}
catch {
    // Use mock for testing
    vscode = {
        Position: class Position {
            constructor(line, character) {
                this.line = line;
                this.character = character;
            }
        },
        Range: class Range {
            constructor(start, end) {
                this.start = start;
                this.end = end;
            }
        }
    };
}
class CssParser {
    /**
     * Parses CSS content and extracts web platform features
     * @param content CSS content to parse
     * @param document Optional VS Code document for position mapping
     * @returns Array of web-features IDs found in the CSS
     */
    static parseCss(content, document) {
        const features = [];
        const locations = new Map();
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
                        locations.get(featureId).push(range);
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
                        locations.get(featureId).push(range);
                    }
                }
            });
        }
        catch (error) {
            // Handle CSS parsing errors gracefully
            this.errorHandler.handleParserError(error instanceof Error ? error : new Error('Unknown CSS parsing error'), 'CSS', 'Parsing CSS content with PostCSS');
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
    static mapCssPropertyToFeatureId(property) {
        // Remove vendor prefixes for mapping
        const normalizedProperty = property.replace(/^-(?:webkit|moz|ms|o)-/, '');
        // Map CSS properties to web-features IDs
        // Format: css.properties.{property-name}
        if (!normalizedProperty || /\s/.test(normalizedProperty))
            return null;
        // Only flag properties that are actually problematic for baseline
        // Basic layout properties like display, padding, margin are universally baseline
        const nonBaselineProperties = new Set([
            'float',
            'clear',
            'container-type',
            'aspect-ratio',
            'scroll-behavior',
            'scroll-snap-type',
            'overscroll-behavior',
            'backdrop-filter',
            'view-transition-name',
            'touch-action',
            'will-change' // Performance hint, may not be baseline
        ]);
        // Only return feature IDs for properties we want to check
        // This prevents false positives on universally supported properties
        if (nonBaselineProperties.has(normalizedProperty)) {
            return `css.properties.${normalizedProperty}`;
        }
        // Also check vendor prefixed properties - these are definitely non-baseline
        if (property !== normalizedProperty) {
            return `css.properties.${property}`; // Return original with prefix
        }
        return null; // Skip checking baseline properties like display, padding, etc.
    }
    /**
     * Maps CSS at-rules to web-features IDs
     * @param atRuleName At-rule name (without @)
     * @returns web-features ID or null if not mappable
     */
    static mapAtRuleToFeatureId(atRuleName) {
        // Map common at-rules to web-features IDs
        const atRuleMap = {
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
    static getPropertyRange(decl, document) {
        if (!decl.source?.start || !decl.source?.end) {
            return null;
        }
        try {
            const startPos = new vscode.Position(decl.source.start.line - 1, // PostCSS uses 1-based line numbers
            decl.source.start.column - 1 // PostCSS uses 1-based column numbers
            );
            // For properties, we want to highlight just the property name
            const propertyEndColumn = decl.source.start.column - 1 + decl.prop.length;
            const endPos = new vscode.Position(decl.source.start.line - 1, propertyEndColumn);
            return new vscode.Range(startPos, endPos);
        }
        catch (error) {
            this.errorHandler.handleParserError(error instanceof Error ? error : new Error('Unknown error creating CSS property range'), 'CSS', 'Creating VS Code range for CSS property');
            return null;
        }
    }
    /**
     * Gets the VS Code range for a CSS at-rule
     * @param atRule PostCSS at-rule node
     * @param document VS Code document
     * @returns VS Code range or null if not determinable
     */
    static getAtRuleRange(atRule, document) {
        if (!atRule.source?.start || !atRule.source?.end) {
            return null;
        }
        try {
            const startPos = new vscode.Position(atRule.source.start.line - 1, atRule.source.start.column - 1);
            // Highlight the at-rule name (e.g., @supports)
            const atRuleEndColumn = atRule.source.start.column - 1 + atRule.name.length + 1; // +1 for @
            const endPos = new vscode.Position(atRule.source.start.line - 1, atRuleEndColumn);
            return new vscode.Range(startPos, endPos);
        }
        catch (error) {
            this.errorHandler.handleParserError(error instanceof Error ? error : new Error('Unknown error creating CSS at-rule range'), 'CSS', 'Creating VS Code range for CSS at-rule');
            return null;
        }
    }
    /**
     * Extracts just the feature IDs without location information
     * @param content CSS content to parse
     * @returns Array of web-features IDs
     */
    static extractFeatures(content) {
        const result = this.parseCss(content);
        return result.features;
    }
}
exports.CssParser = CssParser;
CssParser.errorHandler = errorHandler_1.ErrorHandler.getInstance();
//# sourceMappingURL=cssParser.js.map