"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsParser = void 0;
const parser_1 = require("@babel/parser");
const traverse_1 = __importDefault(require("@babel/traverse"));
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
class JsParser {
    /**
     * Parses JavaScript content and extracts web platform features
     * @param content JavaScript content to parse
     * @param document Optional VS Code document for position mapping
     * @returns Parse result with features and their locations
     */
    static parseJavaScript(content, document) {
        const features = [];
        const locations = new Map();
        try {
            // Validate input
            if (!content || typeof content !== 'string') {
                this.errorHandler.handleValidationError('Invalid JavaScript content provided', 'JavaScript parsing validation');
                return { features: [], locations: new Map() };
            }
            // Parse JavaScript/TypeScript with Babel
            const ast = (0, parser_1.parse)(content, {
                sourceType: 'module',
                allowImportExportEverywhere: true,
                allowReturnOutsideFunction: true,
                plugins: [
                    'jsx',
                    'typescript',
                    'decorators-legacy',
                    'classProperties',
                    'objectRestSpread',
                    'asyncGenerators',
                    'functionBind',
                    'exportDefaultFrom',
                    'exportNamespaceFrom',
                    'dynamicImport',
                    'nullishCoalescingOperator',
                    'optionalChaining',
                    'optionalCatchBinding',
                    'throwExpressions',
                    'topLevelAwait'
                ]
            });
            // Traverse the AST to find web platform API usage
            (0, traverse_1.default)(ast, {
                // Detect MemberExpression patterns (e.g., navigator.clipboard, document.querySelector)
                MemberExpression: (path) => {
                    const featureId = this.analyzeMemberExpression(path.node);
                    if (featureId && !features.includes(featureId)) {
                        features.push(featureId);
                        // Track location if document is provided
                        if (document) {
                            const range = this.getNodeRange(path.node, document);
                            if (range) {
                                if (!locations.has(featureId)) {
                                    locations.set(featureId, []);
                                }
                                locations.get(featureId).push(range);
                            }
                        }
                    }
                },
                // Detect CallExpression patterns on global objects
                CallExpression: (path) => {
                    const featureId = this.analyzeCallExpression(path.node);
                    if (featureId && !features.includes(featureId)) {
                        features.push(featureId);
                        // Track location if document is provided
                        if (document) {
                            const range = this.getNodeRange(path.node, document);
                            if (range) {
                                if (!locations.has(featureId)) {
                                    locations.set(featureId, []);
                                }
                                locations.get(featureId).push(range);
                            }
                        }
                    }
                }
            });
        }
        catch (error) {
            // Handle JavaScript parsing errors gracefully
            this.errorHandler.handleParserError(error instanceof Error ? error : new Error('Unknown JavaScript parsing error'), 'JavaScript', 'Parsing JavaScript content with Babel');
            // Return empty result on parse failure
            return { features: [], locations: new Map() };
        }
        return { features, locations };
    }
    /**
     * Analyzes MemberExpression nodes to detect web platform API usage
     * @param node MemberExpression AST node
     * @returns web-features ID or null if not mappable
     */
    static analyzeMemberExpression(node) {
        // Build the full member expression path (e.g., navigator.clipboard.writeText)
        const memberPath = this.buildMemberPath(node);
        if (!memberPath) {
            return null;
        }
        // Map common web platform APIs to web-features IDs
        return this.mapApiToFeatureId(memberPath);
    }
    /**
     * Analyzes CallExpression nodes to detect web platform API usage
     * @param node CallExpression AST node
     * @returns web-features ID or null if not mappable
     */
    static analyzeCallExpression(node) {
        // Handle direct function calls on global objects
        if (node.callee.type === 'MemberExpression') {
            const memberPath = this.buildMemberPath(node.callee);
            if (memberPath) {
                return this.mapApiToFeatureId(memberPath);
            }
        }
        // Handle global function calls (e.g., fetch(), requestAnimationFrame())
        if (node.callee.type === 'Identifier') {
            const functionName = node.callee.name;
            return this.mapGlobalFunctionToFeatureId(functionName);
        }
        return null;
    }
    /**
     * Builds a dot-separated path from a MemberExpression node
     * @param node MemberExpression node
     * @returns Dot-separated path string or null
     */
    static buildMemberPath(node) {
        const parts = [];
        let current = node;
        // Traverse the member expression chain
        while (current.type === 'MemberExpression') {
            const memberExpr = current;
            // Get the property name
            if (memberExpr.property.type === 'Identifier' && !memberExpr.computed) {
                parts.unshift(memberExpr.property.name);
            }
            else if (memberExpr.property.type === 'StringLiteral' && memberExpr.computed) {
                parts.unshift(memberExpr.property.value);
            }
            else {
                // Can't determine property name for computed properties with variables
                return null;
            }
            current = memberExpr.object;
        }
        // Get the root object name
        if (current.type === 'Identifier') {
            parts.unshift(current.name);
        }
        else {
            // Complex object expressions not supported
            return null;
        }
        return parts.join('.');
    }
    /**
     * Maps API paths to web-features IDs
     * @param apiPath Dot-separated API path
     * @returns web-features ID or null
     */
    static mapApiToFeatureId(apiPath) {
        // Only flag APIs that are likely non-baseline or problematic
        // Removed universally supported APIs to prevent false positives
        const apiMappings = {
            // Newer Navigator APIs that may not be baseline
            'navigator.clipboard': 'api.Clipboard',
            'navigator.clipboard.writeText': 'api.Clipboard.writeText',
            'navigator.clipboard.readText': 'api.Clipboard.readText',
            'navigator.share': 'api.Navigator.share',
            'navigator.vibrate': 'api.Navigator.vibrate',
            'navigator.mediaDevices.getDisplayMedia': 'api.MediaDevices.getDisplayMedia',
            // IndexedDB - may not be baseline in all contexts
            'indexedDB.open': 'api.IDBFactory',
            // Newer JavaScript features that might not be baseline
            'Array.prototype.at': 'api.Array.at',
            'String.prototype.padStart': 'api.String.padStart',
            'String.prototype.padEnd': 'api.String.padEnd',
            'Promise.allSettled': 'api.Promise.allSettled',
            'Promise.any': 'api.Promise.any'
        };
        // Direct mapping
        if (apiMappings[apiPath]) {
            return apiMappings[apiPath];
        }
        // Handle global function without prefix
        if (apiPath === 'fetch') {
            return 'api.fetch';
        }
        // Handle method calls on variables (e.g., arr.at(), str.includes())
        // These need special handling since we can't know the variable type
        const parts = apiPath.split('.');
        if (parts.length === 2) {
            const [object, method] = parts;
            // Check for storage methods first (more specific)
            if (object === 'localStorage' || object === 'sessionStorage') {
                return 'api.Storage';
            }
            // Check for indexedDB
            if (object === 'indexedDB') {
                return 'api.IDBFactory';
            }
            // Check for array-specific methods (methods that only exist on arrays)
            if (['at', 'find', 'findIndex', 'forEach', 'map', 'filter', 'reduce', 'some', 'every'].includes(method)) {
                return `api.Array.${method}`;
            }
            // Check for string-specific methods (methods that only exist on strings)
            if (['startsWith', 'endsWith', 'padStart', 'padEnd', 'repeat', 'trim', 'trimStart', 'trimEnd'].includes(method)) {
                return `api.String.${method}`;
            }
            // For ambiguous methods like 'includes', we need to make a decision
            // In practice, we might need more context, but for now, let's prioritize based on common usage
            if (method === 'includes') {
                // Check variable name patterns to guess type
                if (object.toLowerCase().includes('str') || object.toLowerCase().includes('text')) {
                    return 'api.String.includes';
                }
                else if (object.toLowerCase().includes('arr') || object.toLowerCase().includes('list')) {
                    return 'api.Array.includes';
                }
                // Default to string for includes since it's more commonly used
                return 'api.String.includes';
            }
        }
        // Pattern-based mapping for common cases
        if (apiPath.startsWith('navigator.')) {
            const apiName = apiPath.split('.')[1];
            return `api.Navigator.${apiName}`;
        }
        if (apiPath.startsWith('document.')) {
            const apiName = apiPath.split('.')[1];
            return `api.Document.${apiName}`;
        }
        if (apiPath.startsWith('window.')) {
            const apiName = apiPath.split('.')[1];
            return `api.Window.${apiName}`;
        }
        return null;
    }
    /**
     * Maps global function names to web-features IDs
     * @param functionName Global function name
     * @returns web-features ID or null
     */
    static mapGlobalFunctionToFeatureId(functionName) {
        const globalFunctionMappings = {
            'fetch': 'api.fetch',
            'requestAnimationFrame': 'api.Window.requestAnimationFrame',
            'cancelAnimationFrame': 'api.Window.cancelAnimationFrame',
            'requestIdleCallback': 'api.Window.requestIdleCallback',
            'cancelIdleCallback': 'api.Window.cancelIdleCallback',
            'queueMicrotask': 'api.queueMicrotask',
            'structuredClone': 'api.structuredClone',
            'setTimeout': 'api.Window.setTimeout',
            'setInterval': 'api.Window.setInterval',
            'clearTimeout': 'api.Window.clearTimeout',
            'clearInterval': 'api.Window.clearInterval'
        };
        return globalFunctionMappings[functionName] || null;
    }
    /**
     * Gets the VS Code range for an AST node
     * @param node AST node
     * @param document VS Code document
     * @returns VS Code range or null if not determinable
     */
    static getNodeRange(node, document) {
        if (!node.loc) {
            return null;
        }
        try {
            const startPos = new vscode.Position(node.loc.start.line - 1, // Babel uses 1-based line numbers
            node.loc.start.column // Babel uses 0-based column numbers
            );
            const endPos = new vscode.Position(node.loc.end.line - 1, node.loc.end.column);
            return new vscode.Range(startPos, endPos);
        }
        catch (error) {
            this.errorHandler.handleParserError(error instanceof Error ? error : new Error('Unknown error creating JavaScript node range'), 'JavaScript', 'Creating VS Code range for JavaScript AST node');
            return null;
        }
    }
    /**
     * Extracts just the feature IDs without location information
     * @param content JavaScript content to parse
     * @returns Array of web-features IDs
     */
    static extractFeatures(content) {
        const result = this.parseJavaScript(content);
        return result.features;
    }
}
exports.JsParser = JsParser;
JsParser.errorHandler = errorHandler_1.ErrorHandler.getInstance();
//# sourceMappingURL=jsParser.js.map