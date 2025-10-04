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
exports.QuickAccessInterface = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Copilot-style quick access interface
 */
class QuickAccessInterface {
    /**
     * Show main command palette with user-friendly options
     */
    static async showMainMenu() {
        const items = [
            {
                label: '🔍 Check Current File',
                description: 'Analyze baseline compatibility in active file',
                detail: 'Get instant feedback on your code'
            },
            {
                label: '🤖 AI Assistant',
                description: 'Get AI-powered suggestions for your code',
                detail: 'Smart solutions for compatibility issues'
            },
            {
                label: '📊 Compatibility Report',
                description: 'View detailed compatibility analysis',
                detail: 'See all issues and suggestions'
            },
            {
                label: '🛠️ Fix All Issues',
                description: 'Apply automatic fixes where possible',
                detail: 'One-click improvements'
            },
            {
                label: '🎓 Tutorial',
                description: 'Learn how to use Baseline Sidekick',
                detail: 'Perfect for beginners'
            },
            {
                label: '⚙️ Settings',
                description: 'Configure extension preferences',
                detail: 'Customize your experience'
            }
        ];
        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: '🚀 What would you like to do with Baseline Sidekick?',
            matchOnDescription: true,
            matchOnDetail: true
        });
        if (!selection)
            return;
        await this.handleSelection(selection.label);
    }
    static async handleSelection(label) {
        switch (label) {
            case '🔍 Check Current File':
                await vscode.commands.executeCommand('baselineSidekick.audit');
                break;
            case '🤖 AI Assistant':
                await this.showAIAssistantMenu();
                break;
            case '📊 Compatibility Report':
                await vscode.commands.executeCommand('baselineSidekick.showCompatibilityReport');
                break;
            case '🛠️ Fix All Issues':
                await this.showFixAllMenu();
                break;
            case '🎓 Tutorial':
                await vscode.commands.executeCommand('baselineSidekick.showTutorial');
                break;
            case '⚙️ Settings':
                await vscode.commands.executeCommand('workbench.action.openSettings', 'baseline-sidekick');
                break;
        }
    }
    static async showAIAssistantMenu() {
        const items = [
            {
                label: '💡 Generate Polyfill',
                description: 'Create compatibility code for unsupported features',
                detail: 'AI creates the missing functionality'
            },
            {
                label: '🔄 Modernize Code',
                description: 'Update legacy code to modern alternatives',
                detail: 'Smart refactoring suggestions'
            },
            {
                label: '📦 Build Configuration',
                description: 'Generate build config for better compatibility',
                detail: 'Webpack, Babel, and other tools'
            },
            {
                label: '🎯 Smart Suggestions',
                description: 'Get context-aware recommendations',
                detail: 'Tailored advice for your code'
            }
        ];
        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: '🤖 Choose an AI assistant feature:',
            matchOnDescription: true
        });
        if (!selection)
            return;
        switch (selection.label) {
            case '💡 Generate Polyfill':
                await vscode.commands.executeCommand('baselineSidekick.generatePolyfill');
                break;
            case '🔄 Modernize Code':
                await vscode.commands.executeCommand('baselineSidekick.showModernizationWizard');
                break;
            case '📦 Build Configuration':
                await vscode.commands.executeCommand('baselineSidekick.generateBuildConfig');
                break;
            case '🎯 Smart Suggestions':
                await vscode.commands.executeCommand('baselineSidekick.generateSuggestions');
                break;
        }
    }
    static async showFixAllMenu() {
        // First, let's see what issues exist
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('📝 Please open a file first to check for issues.');
            return;
        }
        const items = [
            {
                label: '🔧 Quick Fixes Only',
                description: 'Apply safe, automatic fixes',
                detail: 'Simple replacements and updates'
            },
            {
                label: '🤖 AI-Powered Fixes',
                description: 'Use AI for complex modernization',
                detail: 'Smart refactoring and improvements'
            },
            {
                label: '👀 Preview Changes',
                description: 'See what would be changed first',
                detail: 'Review before applying'
            },
            {
                label: '📋 Show Issues List',
                description: 'See all compatibility issues',
                detail: 'Detailed breakdown of problems'
            }
        ];
        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: '🛠️ How would you like to fix compatibility issues?',
            matchOnDescription: true
        });
        if (!selection)
            return;
        switch (selection.label) {
            case '🔧 Quick Fixes Only':
                await this.applyQuickFixes(editor);
                break;
            case '🤖 AI-Powered Fixes':
                await vscode.commands.executeCommand('baselineSidekick.showModernizationWizard');
                break;
            case '👀 Preview Changes':
                await this.previewChanges(editor);
                break;
            case '📋 Show Issues List':
                await vscode.commands.executeCommand('baselineSidekick.showCompatibilityReport');
                break;
        }
    }
    static async applyQuickFixes(editor) {
        // Get all code actions for the file
        const document = editor.document;
        const diagnostics = vscode.languages.getDiagnostics(document.uri);
        const baselineDiagnostics = diagnostics.filter(d => d.source === 'baseline-sidekick');
        if (baselineDiagnostics.length === 0) {
            vscode.window.showInformationMessage('✅ No compatibility issues found! Your code looks great.');
            return;
        }
        const progress = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Applying quick fixes...',
            cancellable: false
        }, async (progress) => {
            let fixed = 0;
            const total = baselineDiagnostics.length;
            for (const diagnostic of baselineDiagnostics) {
                progress.report({
                    message: `Fixing issue ${fixed + 1} of ${total}`,
                    increment: (100 / total)
                });
                // Apply code action if available
                const codeActions = await vscode.commands.executeCommand('vscode.executeCodeActionProvider', document.uri, diagnostic.range);
                const quickFix = codeActions?.find(action => action.kind?.value.startsWith('quickfix') &&
                    action.title.includes('Replace with'));
                if (quickFix?.edit) {
                    await vscode.workspace.applyEdit(quickFix.edit);
                    fixed++;
                }
            }
            return fixed;
        });
        const message = progress > 0
            ? `🎉 Fixed ${progress} compatibility issues!`
            : '💡 No automatic fixes available. Try AI-powered solutions for complex cases.';
        vscode.window.showInformationMessage(message);
    }
    static async previewChanges(editor) {
        // Show diff preview of potential changes
        vscode.window.showInformationMessage('👀 Preview feature coming soon! For now, use "Show Issues List" to see what needs fixing.', 'Show Issues').then(choice => {
            if (choice === 'Show Issues') {
                vscode.commands.executeCommand('baselineSidekick.showCompatibilityReport');
            }
        });
    }
}
exports.QuickAccessInterface = QuickAccessInterface;
//# sourceMappingURL=quickAccessInterface.js.map