import * as vscode from 'vscode';
import { BaselineDataManager } from './core/baselineData';
import { DiagnosticController } from './diagnostics';
import { BaselineHoverProvider } from './providers/hoverProvider';
import { BaselineCodeActionProvider } from './providers/codeActionProvider';
import { EnhancedCodeActionProvider } from './providers/enhancedCodeActionProvider';
import { registerAuditCommand } from './commands/audit';
import { AICommandHandlers } from './commands/aiCommandHandlers';
import { BaselineScoreManager } from './gamification/scoreManager';
import { ErrorHandler, Logger } from './core/errorHandler';
import { WelcomeExperience } from './ui/welcomeExperience';
import { EnhancedStatusBar } from './ui/enhancedStatusBar';
import { QuickAccessInterface } from './ui/quickAccessInterface';

// Global references for cleanup
let diagnosticController: DiagnosticController | undefined;
let baselineDataManager: BaselineDataManager | undefined;
let scoreManager: BaselineScoreManager | undefined;
let aiCommandHandlers: AICommandHandlers | undefined;
let errorHandler: ErrorHandler | undefined;
let logger: Logger | undefined;
let welcomeExperience: WelcomeExperience | undefined;
let enhancedStatusBar: EnhancedStatusBar | undefined;

/**
 * Extension activation function
 * Initializes all providers, commands, and event handlers
 */
export async function activate(context: vscode.ExtensionContext) {
    try {
        // Initialize error handling and logging system first
        errorHandler = ErrorHandler.getInstance();
        logger = Logger.getInstance();
        logger.info('Baseline Sidekick extension is activating...');
        
        // Initialize BaselineDataManager on extension activation
        baselineDataManager = BaselineDataManager.getInstance();
        await baselineDataManager.initialize();
        logger.info('Baseline data loaded successfully');

        // Create diagnostic controller with document change events
        diagnosticController = new DiagnosticController(context);
        
        // Register document change events for real-time diagnostics with error handling
        const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(async (event) => {
            try {
                if (diagnosticController && isSupportedDocument(event.document)) {
                    await diagnosticController.updateDiagnostics(event.document);
                }
            } catch (error) {
                errorHandler?.handleExtensionError(
                    error instanceof Error ? error : new Error('Unknown error in onDidChangeTextDocument'),
                    'Document change event handler'
                );
            }
        });

        const onDidOpenTextDocument = vscode.workspace.onDidOpenTextDocument(async (document) => {
            try {
                if (diagnosticController && isSupportedDocument(document)) {
                    await diagnosticController.updateDiagnostics(document);
                }
            } catch (error) {
                errorHandler?.handleExtensionError(
                    error instanceof Error ? error : new Error('Unknown error in onDidOpenTextDocument'),
                    'Document open event handler'
                );
            }
        });

        const onDidSaveTextDocument = vscode.workspace.onDidSaveTextDocument(async (document) => {
            try {
                if (diagnosticController && isSupportedDocument(document)) {
                    await diagnosticController.updateDiagnostics(document);
                }
            } catch (error) {
                errorHandler?.handleExtensionError(
                    error instanceof Error ? error : new Error('Unknown error in onDidSaveTextDocument'),
                    'Document save event handler'
                );
            }
        });

        // Register event handlers for cleanup
        context.subscriptions.push(
            onDidChangeTextDocument,
            onDidOpenTextDocument,
            onDidSaveTextDocument
        );

        // Analyze currently open documents with error handling
        for (const document of vscode.workspace.textDocuments) {
            try {
                if (isSupportedDocument(document)) {
                    await diagnosticController.updateDiagnostics(document);
                }
            } catch (error) {
                errorHandler?.handleExtensionError(
                    error instanceof Error ? error : new Error('Unknown error analyzing open document'),
                    `Analyzing open document: ${document.uri.fsPath}`
                );
            }
        }

        // Register hover provider for supported language IDs
        const supportedLanguages = [
            'css', 'scss', 'sass', 'less',
            'javascript', 'typescript', 'javascriptreact', 'typescriptreact',
            'html', 'xml'
        ];

        const hoverProvider = new BaselineHoverProvider();
        const hoverProviderDisposable = vscode.languages.registerHoverProvider(
            supportedLanguages,
            hoverProvider
        );
        context.subscriptions.push(hoverProviderDisposable);

        // Register enhanced code action provider with AI capabilities
        const enhancedCodeActionProvider = new EnhancedCodeActionProvider();
        const enhancedCodeActionDisposable = vscode.languages.registerCodeActionsProvider(
            supportedLanguages,
            enhancedCodeActionProvider,
            {
                providedCodeActionKinds: [
                    vscode.CodeActionKind.RefactorRewrite,
                    vscode.CodeActionKind.QuickFix,
                    vscode.CodeActionKind.Refactor
                ]
            }
        );
        context.subscriptions.push(enhancedCodeActionDisposable);

        // Also register traditional code action provider for fallback
        const codeActionProvider = new BaselineCodeActionProvider();
        const codeActionProviderDisposable = vscode.languages.registerCodeActionsProvider(
            supportedLanguages,
            codeActionProvider,
            {
                providedCodeActionKinds: [
                    vscode.CodeActionKind.RefactorRewrite,
                    vscode.CodeActionKind.QuickFix
                ]
            }
        );
        context.subscriptions.push(codeActionProviderDisposable);

        // Initialize scoring system
        scoreManager = BaselineScoreManager.getInstance();
        logger.info('Baseline scoring system initialized');

        // Initialize enhanced UI/UX components
        welcomeExperience = WelcomeExperience.getInstance(context);
        enhancedStatusBar = new EnhancedStatusBar();
        
        // Show welcome experience for new users
        await welcomeExperience.showWelcomeIfNeeded();
        logger.info('Enhanced UI components initialized');

        // Initialize and register AI command handlers
        aiCommandHandlers = new AICommandHandlers();
        aiCommandHandlers.registerCommands(context);
        logger.info('AI command handlers registered');

        // Register workspace audit command with command palette
        registerAuditCommand(context);

        // Register quick access interface commands
        context.subscriptions.push(
            vscode.commands.registerCommand('baselineSidekick.showMainMenu', () => {
                QuickAccessInterface.showMainMenu();
            }),
            vscode.commands.registerCommand('baselineSidekick.showTutorial', () => {
                welcomeExperience?.showWelcomeIfNeeded();
            }),
            vscode.commands.registerCommand('baselineSidekick.showCompatibilityReport', () => {
                // Show compatibility report in a webview
                vscode.window.showInformationMessage(
                    '📊 Compatibility Report: Check the Problems panel for detailed issues.',
                    'Open Problems Panel'
                ).then(choice => {
                    if (choice === 'Open Problems Panel') {
                        vscode.commands.executeCommand('workbench.panel.markers.view.focus');
                    }
                });
            })
        );

        logger.info('All Baseline Sidekick providers and commands registered successfully');

    } catch (error) {
        const errorMessage = error instanceof Error ? error : new Error('Unknown activation error');
        errorHandler?.handleExtensionError(errorMessage, 'Extension activation');
        
        // Show user notification for critical activation failure
        await (vscode.window.showErrorMessage(
            `Failed to activate Baseline Sidekick: ${errorMessage.message}`,
            'View Logs'
        ) as any)?.then?.((selection: any) => {
            if (selection === 'View Logs') {
                logger?.show();
            }
        });
    }
}

/**
 * Extension deactivation function
 * Cleans up resources and disposes of providers
 */
export function deactivate() {
    try {
        logger?.info('Deactivating Baseline Sidekick extension...');
        
        // Cleanup diagnostic controller
        if (diagnosticController) {
            diagnosticController.dispose();
            diagnosticController = undefined;
        }

        // Clear references
        baselineDataManager = undefined;
        
        // Cleanup scoring system
        if (scoreManager) {
            scoreManager.dispose();
            scoreManager = undefined;
        }
        
        // Cleanup UI components
        if (enhancedStatusBar) {
            enhancedStatusBar.dispose();
            enhancedStatusBar = undefined;
        }
        
        welcomeExperience = undefined;
        aiCommandHandlers = undefined;
        
        // Dispose logger last
        if (logger) {
            logger.info('Baseline Sidekick extension deactivated');
            logger.dispose();
            logger = undefined;
        }
        
        errorHandler = undefined;
    } catch (error) {
        console.error('Error during extension deactivation:', error);
    }
}

/**
 * Helper function to check if a document should be analyzed
 * @param document VS Code text document
 * @returns true if the document is a supported file type
 */
function isSupportedDocument(document: vscode.TextDocument): boolean {
    const supportedLanguages = [
        'css', 'scss', 'sass', 'less',
        'javascript', 'typescript', 'javascriptreact', 'typescriptreact',
        'html', 'xml'
    ];
    
    return supportedLanguages.includes(document.languageId);
}