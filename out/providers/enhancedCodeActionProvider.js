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
exports.EnhancedCodeActionProvider = void 0;
const vscode = __importStar(require("vscode"));
const baselineData_1 = require("../core/baselineData");
const modernizationAssistant_1 = require("../ai/modernizationAssistant");
/**
 * Enhanced Code Action Provider with AI-powered modernization
 */
class EnhancedCodeActionProvider {
    constructor() {
        this.baselineData = baselineData_1.BaselineDataManager.getInstance();
        this.aiAssistant = modernizationAssistant_1.AIModernizationAssistant.getInstance();
    }
    async provideCodeActions(document, range, context, token) {
        const actions = [];
        // Process baseline diagnostics
        const baselineDiagnostics = context.diagnostics.filter(diagnostic => diagnostic.source === 'baseline-sidekick');
        for (const diagnostic of baselineDiagnostics) {
            // Traditional quick fixes
            const quickFixes = this.createTraditionalQuickFixes(diagnostic, range, document);
            actions.push(...quickFixes);
            // AI-powered solutions
            const aiActions = this.createAIPoweredActions(diagnostic, range, document);
            actions.push(...aiActions);
        }
        // Add file-level AI actions
        const fileActions = this.createFileLevelActions(document);
        actions.push(...fileActions);
        return actions;
    }
    /**
     * Create traditional quick fix actions
     */
    createTraditionalQuickFixes(diagnostic, range, document) {
        const actions = [];
        const featureMatch = diagnostic.message.match(/'([^']+)'/);
        if (!featureMatch) {
            return actions;
        }
        const feature = featureMatch[1];
        const text = document.getText(range);
        // CSS quick fixes
        if (feature.includes('css.properties')) {
            actions.push(...this.createCssQuickFixes(feature, text, range, document));
        }
        // JavaScript quick fixes  
        if (feature.includes('javascript') || feature.includes('api')) {
            actions.push(...this.createJavaScriptQuickFixes(feature, text, range, document));
        }
        return actions;
    }
    /**
     * Create AI-powered modernization actions
     */
    createAIPoweredActions(diagnostic, range, document) {
        const actions = [];
        const featureMatch = diagnostic.message.match(/'([^']+)'/);
        if (!featureMatch) {
            return actions;
        }
        const feature = featureMatch[1];
        const codeSnippet = this.extractCodeSnippet(document, range);
        const fileType = this.getFileType(document);
        // AI Polyfill Generation
        const polyfillAction = new vscode.CodeAction(`✨ AI: Generate polyfill for ${this.getFeatureName(feature)}`, vscode.CodeActionKind.QuickFix);
        polyfillAction.command = {
            command: 'baseline.ai.generatePolyfill',
            title: 'Generate AI Polyfill',
            arguments: [codeSnippet, feature, fileType, range, document.uri]
        };
        polyfillAction.isPreferred = false;
        actions.push(polyfillAction);
        // AI Build Config Generation
        const configAction = new vscode.CodeAction(`🛠️ AI: Generate build config for ${this.getFeatureName(feature)}`, vscode.CodeActionKind.QuickFix);
        configAction.command = {
            command: 'baseline.ai.generateConfig',
            title: 'Generate Build Configuration',
            arguments: [codeSnippet, feature, fileType, document.uri]
        };
        actions.push(configAction);
        // AI Code Refactoring
        const refactorAction = new vscode.CodeAction(`🔄 AI: Refactor to baseline-compatible code`, vscode.CodeActionKind.Refactor);
        refactorAction.command = {
            command: 'baseline.ai.refactorCode',
            title: 'AI Refactor Code',
            arguments: [codeSnippet, feature, fileType, range, document.uri]
        };
        refactorAction.isPreferred = true;
        actions.push(refactorAction);
        // AI Alternative Suggestions
        const alternativeAction = new vscode.CodeAction(`💡 AI: Show baseline alternatives`, vscode.CodeActionKind.QuickFix);
        alternativeAction.command = {
            command: 'baseline.ai.showAlternatives',
            title: 'Show Baseline Alternatives',
            arguments: [codeSnippet, feature, fileType, document.uri]
        };
        actions.push(alternativeAction);
        return actions;
    }
    /**
     * Create file-level AI actions
     */
    createFileLevelActions(document) {
        const actions = [];
        // AI Full File Modernization
        const modernizeAction = new vscode.CodeAction(`🚀 AI: Modernize entire file to baseline standards`, vscode.CodeActionKind.RefactorRewrite);
        modernizeAction.command = {
            command: 'baseline.ai.modernizeFile',
            title: 'Modernize Entire File',
            arguments: [document.uri]
        };
        actions.push(modernizeAction);
        // AI Modernization Strategy
        const strategyAction = new vscode.CodeAction(`📋 AI: Create modernization roadmap`, vscode.CodeActionKind.Source);
        strategyAction.command = {
            command: 'baseline.ai.generateStrategy',
            title: 'Generate Modernization Strategy',
            arguments: [document.uri]
        };
        actions.push(strategyAction);
        // AI Performance Analysis
        const performanceAction = new vscode.CodeAction(`⚡ AI: Analyze performance impact`, vscode.CodeActionKind.Source);
        performanceAction.command = {
            command: 'baseline.ai.analyzePerformance',
            title: 'Analyze Performance Impact',
            arguments: [document.uri]
        };
        actions.push(performanceAction);
        return actions;
    }
    /**
     * Create CSS-specific quick fixes
     */
    createCssQuickFixes(feature, text, range, document) {
        const actions = [];
        // Float to Flexbox conversion
        if (feature.includes('float')) {
            const flexboxAction = new vscode.CodeAction('🔄 Convert to Flexbox layout', vscode.CodeActionKind.QuickFix);
            flexboxAction.edit = this.createFloatToFlexboxEdit(text, range, document);
            flexboxAction.isPreferred = true;
            actions.push(flexboxAction);
        }
        // Position absolute alternatives
        if (feature.includes('position') && text.includes('absolute')) {
            const gridAction = new vscode.CodeAction('🎯 Use CSS Grid instead', vscode.CodeActionKind.QuickFix);
            gridAction.command = {
                command: 'baseline.showPositionAlternatives',
                title: 'Show Position Alternatives',
                arguments: [text, range, document.uri]
            };
            actions.push(gridAction);
        }
        return actions;
    }
    /**
     * Create JavaScript-specific quick fixes
     */
    createJavaScriptQuickFixes(feature, text, range, document) {
        const actions = [];
        // Array.at() to bracket notation
        if (text.includes('.at(')) {
            const bracketAction = new vscode.CodeAction('🔧 Convert to bracket notation', vscode.CodeActionKind.QuickFix);
            bracketAction.edit = this.createArrayAtToBracketEdit(text, range, document);
            bracketAction.isPreferred = true;
            actions.push(bracketAction);
        }
        // Optional chaining alternatives
        if (text.includes('?.')) {
            const safeAction = new vscode.CodeAction('🛡️ Convert to safe property access', vscode.CodeActionKind.QuickFix);
            safeAction.edit = this.createOptionalChainingEdit(text, range, document);
            actions.push(safeAction);
        }
        return actions;
    }
    /**
     * Helper methods
     */
    extractCodeSnippet(document, range) {
        const startLine = Math.max(0, range.start.line - 3);
        const endLine = Math.min(document.lineCount - 1, range.end.line + 3);
        let snippet = '';
        for (let i = startLine; i <= endLine; i++) {
            snippet += document.lineAt(i).text + '\n';
        }
        return snippet.trim();
    }
    getFileType(document) {
        const extension = document.fileName.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'css':
            case 'scss':
            case 'sass':
            case 'less':
                return 'css';
            case 'js':
            case 'jsx':
            case 'ts':
            case 'tsx':
                return 'javascript';
            case 'html':
            case 'htm':
                return 'html';
            default:
                return 'text';
        }
    }
    getFeatureName(feature) {
        // Extract readable feature name from feature ID
        return feature.replace(/^(css\.properties\.|html\.elements\.|javascript\.api\.)/, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }
    createFloatToFlexboxEdit(text, range, document) {
        const edit = new vscode.WorkspaceEdit();
        const newText = text.replace(/float:\s*(left|right)/g, 'display: flex; justify-content: $1 === "left" ? "flex-start" : "flex-end"');
        edit.replace(document.uri, range, newText);
        return edit;
    }
    createArrayAtToBracketEdit(text, range, document) {
        const edit = new vscode.WorkspaceEdit();
        const newText = text.replace(/(\w+)\.at\((-?\d+)\)/g, (match, array, index) => {
            if (index === '-1') {
                return `${array}[${array}.length - 1]`;
            }
            return `${array}[${index}]`;
        });
        edit.replace(document.uri, range, newText);
        return edit;
    }
    createOptionalChainingEdit(text, range, document) {
        const edit = new vscode.WorkspaceEdit();
        const newText = text.replace(/(\w+)\?\./g, '$1 && $1.');
        edit.replace(document.uri, range, newText);
        return edit;
    }
}
exports.EnhancedCodeActionProvider = EnhancedCodeActionProvider;
//# sourceMappingURL=enhancedCodeActionProvider.js.map