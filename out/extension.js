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
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const baselineData_1 = require("./core/baselineData");
const diagnostics_1 = require("./diagnostics");
const hoverProvider_1 = require("./providers/hoverProvider");
const codeActionProvider_1 = require("./providers/codeActionProvider");
const audit_1 = require("./commands/audit");
const errorHandler_1 = require("./core/errorHandler");
// Global references for cleanup
let diagnosticController;
let baselineDataManager;
let errorHandler;
let logger;
/**
 * Extension activation function
 * Initializes all providers, commands, and event handlers
 */
async function activate(context) {
    try {
        // Initialize error handling and logging system first
        errorHandler = errorHandler_1.ErrorHandler.getInstance();
        logger = errorHandler_1.Logger.getInstance();
        logger.info('Baseline Sidekick extension is activating...');
        // Initialize BaselineDataManager on extension activation
        baselineDataManager = baselineData_1.BaselineDataManager.getInstance();
        await baselineDataManager.initialize();
        logger.info('Baseline data loaded successfully');
        // Create diagnostic controller with document change events
        diagnosticController = new diagnostics_1.DiagnosticController(context);
        // Register document change events for real-time diagnostics with error handling
        const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(async (event) => {
            try {
                if (diagnosticController && isSupportedDocument(event.document)) {
                    await diagnosticController.updateDiagnostics(event.document);
                }
            }
            catch (error) {
                errorHandler?.handleExtensionError(error instanceof Error ? error : new Error('Unknown error in onDidChangeTextDocument'), 'Document change event handler');
            }
        });
        const onDidOpenTextDocument = vscode.workspace.onDidOpenTextDocument(async (document) => {
            try {
                if (diagnosticController && isSupportedDocument(document)) {
                    await diagnosticController.updateDiagnostics(document);
                }
            }
            catch (error) {
                errorHandler?.handleExtensionError(error instanceof Error ? error : new Error('Unknown error in onDidOpenTextDocument'), 'Document open event handler');
            }
        });
        const onDidSaveTextDocument = vscode.workspace.onDidSaveTextDocument(async (document) => {
            try {
                if (diagnosticController && isSupportedDocument(document)) {
                    await diagnosticController.updateDiagnostics(document);
                }
            }
            catch (error) {
                errorHandler?.handleExtensionError(error instanceof Error ? error : new Error('Unknown error in onDidSaveTextDocument'), 'Document save event handler');
            }
        });
        // Register event handlers for cleanup
        context.subscriptions.push(onDidChangeTextDocument, onDidOpenTextDocument, onDidSaveTextDocument);
        // Analyze currently open documents with error handling
        for (const document of vscode.workspace.textDocuments) {
            try {
                if (isSupportedDocument(document)) {
                    await diagnosticController.updateDiagnostics(document);
                }
            }
            catch (error) {
                errorHandler?.handleExtensionError(error instanceof Error ? error : new Error('Unknown error analyzing open document'), `Analyzing open document: ${document.uri.fsPath}`);
            }
        }
        // Register hover provider for supported language IDs
        const supportedLanguages = [
            'css', 'scss', 'sass', 'less',
            'javascript', 'typescript', 'javascriptreact', 'typescriptreact',
            'html', 'xml'
        ];
        const hoverProvider = new hoverProvider_1.BaselineHoverProvider();
        const hoverProviderDisposable = vscode.languages.registerHoverProvider(supportedLanguages, hoverProvider);
        context.subscriptions.push(hoverProviderDisposable);
        // Register code action provider with appropriate document selectors
        const codeActionProvider = new codeActionProvider_1.BaselineCodeActionProvider();
        const codeActionProviderDisposable = vscode.languages.registerCodeActionsProvider(supportedLanguages, codeActionProvider, {
            providedCodeActionKinds: [
                vscode.CodeActionKind.RefactorRewrite,
                vscode.CodeActionKind.QuickFix
            ]
        });
        context.subscriptions.push(codeActionProviderDisposable);
        // Register workspace audit command with command palette
        (0, audit_1.registerAuditCommand)(context);
        logger.info('All Baseline Sidekick providers and commands registered successfully');
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error : new Error('Unknown activation error');
        errorHandler?.handleExtensionError(errorMessage, 'Extension activation');
        // Show user notification for critical activation failure
        await vscode.window.showErrorMessage(`Failed to activate Baseline Sidekick: ${errorMessage.message}`, 'View Logs').then(selection => {
            if (selection === 'View Logs') {
                logger?.show();
            }
        });
    }
}
exports.activate = activate;
/**
 * Extension deactivation function
 * Cleans up resources and disposes of providers
 */
function deactivate() {
    try {
        logger?.info('Deactivating Baseline Sidekick extension...');
        // Cleanup diagnostic controller
        if (diagnosticController) {
            diagnosticController.dispose();
            diagnosticController = undefined;
        }
        // Clear references
        baselineDataManager = undefined;
        // Dispose logger last
        if (logger) {
            logger.info('Baseline Sidekick extension deactivated');
            logger.dispose();
            logger = undefined;
        }
        errorHandler = undefined;
    }
    catch (error) {
        console.error('Error during extension deactivation:', error);
    }
}
exports.deactivate = deactivate;
/**
 * Helper function to check if a document should be analyzed
 * @param document VS Code text document
 * @returns true if the document is a supported file type
 */
function isSupportedDocument(document) {
    const supportedLanguages = [
        'css', 'scss', 'sass', 'less',
        'javascript', 'typescript', 'javascriptreact', 'typescriptreact',
        'html', 'xml'
    ];
    return supportedLanguages.includes(document.languageId);
}
//# sourceMappingURL=extension.js.map