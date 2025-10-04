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
exports.AICommandHandlers = void 0;
const vscode = __importStar(require("vscode"));
const modernizationAssistant_1 = require("../ai/modernizationAssistant");
const scoreManager_1 = require("../gamification/scoreManager");
/**
 * Command handlers for AI-powered modernization features
 */
class AICommandHandlers {
    constructor() {
        this.aiAssistant = modernizationAssistant_1.AIModernizationAssistant.getInstance();
        this.scoreManager = scoreManager_1.BaselineScoreManager.getInstance();
    }
    /**
     * Register all AI command handlers
     */
    registerCommands(context) {
        // AI Polyfill Generation
        const polyfillCommand = vscode.commands.registerCommand('baseline.ai.generatePolyfill', this.handleGeneratePolyfill.bind(this));
        context.subscriptions.push(polyfillCommand);
        // AI Build Configuration
        const configCommand = vscode.commands.registerCommand('baseline.ai.generateConfig', this.handleGenerateBuildConfig.bind(this));
        context.subscriptions.push(configCommand);
        // AI Code Refactoring
        const refactorCommand = vscode.commands.registerCommand('baseline.ai.refactorCode', this.handleRefactorCode.bind(this));
        context.subscriptions.push(refactorCommand);
        // AI Alternative Suggestions
        const alternativesCommand = vscode.commands.registerCommand('baseline.ai.showAlternatives', this.handleShowAlternatives.bind(this));
        context.subscriptions.push(alternativesCommand);
        // AI File Modernization
        const modernizeFileCommand = vscode.commands.registerCommand('baseline.ai.modernizeFile', this.handleModernizeFile.bind(this));
        context.subscriptions.push(modernizeFileCommand);
        // AI Strategy Generation
        const strategyCommand = vscode.commands.registerCommand('baseline.ai.generateStrategy', this.handleGenerateStrategy.bind(this));
        context.subscriptions.push(strategyCommand);
        // AI Performance Analysis
        const performanceCommand = vscode.commands.registerCommand('baseline.ai.analyzePerformance', this.handleAnalyzePerformance.bind(this));
        context.subscriptions.push(performanceCommand);
        // Score Dashboard
        const scoreCommand = vscode.commands.registerCommand('baseline.showScoreDetails', this.handleShowScoreDetails.bind(this));
        context.subscriptions.push(scoreCommand);
        // Workspace Modernization Wizard
        const wizardCommand = vscode.commands.registerCommand('baseline.ai.modernizationWizard', this.handleModernizationWizard.bind(this));
        context.subscriptions.push(wizardCommand);
    }
    /**
     * Generate AI-powered polyfill
     */
    async handleGeneratePolyfill(codeSnippet, feature, fileType, range, documentUri) {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Generating polyfill for ${this.getFeatureName(feature)}...`,
                cancellable: false
            }, async () => {
                const solution = await this.aiAssistant.generateSolution(codeSnippet, feature, fileType, 'polyfill');
                await this.showSolutionInWebview(solution, 'Polyfill Generation', feature);
            });
        }
        catch (error) {
            this.handleError('Failed to generate polyfill', error);
        }
    }
    /**
     * Generate build configuration
     */
    async handleGenerateBuildConfig(codeSnippet, feature, fileType, documentUri) {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Generating build configuration for ${this.getFeatureName(feature)}...`,
                cancellable: false
            }, async () => {
                const solution = await this.aiAssistant.generateSolution(codeSnippet, feature, fileType, 'config');
                await this.showSolutionInWebview(solution, 'Build Configuration', feature);
            });
        }
        catch (error) {
            this.handleError('Failed to generate build configuration', error);
        }
    }
    /**
     * Refactor code with AI
     */
    async handleRefactorCode(codeSnippet, feature, fileType, range, documentUri) {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Refactoring code for baseline compatibility...`,
                cancellable: false
            }, async () => {
                const solution = await this.aiAssistant.generateSolution(codeSnippet, feature, fileType, 'refactor');
                // Show solution and offer to apply
                const choice = await this.showRefactoringSolution(solution, feature);
                if (choice === 'Apply') {
                    await this.applyCodeRefactoring(solution, range, documentUri);
                }
            });
        }
        catch (error) {
            this.handleError('Failed to refactor code', error);
        }
    }
    /**
     * Show baseline alternatives
     */
    async handleShowAlternatives(codeSnippet, feature, fileType, documentUri) {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Finding baseline alternatives for ${this.getFeatureName(feature)}...`,
                cancellable: false
            }, async () => {
                const solution = await this.aiAssistant.generateSolution(codeSnippet, feature, fileType, 'alternative');
                await this.showSolutionInWebview(solution, 'Baseline Alternatives', feature);
            });
        }
        catch (error) {
            this.handleError('Failed to find alternatives', error);
        }
    }
    /**
     * Modernize entire file
     */
    async handleModernizeFile(documentUri) {
        try {
            const document = await vscode.workspace.openTextDocument(documentUri);
            const fileContent = document.getText();
            const fileName = document.fileName;
            // Analyze file for issues (mock data for now)
            const issues = this.analyzeFileForIssues(fileContent);
            if (issues.length === 0) {
                vscode.window.showInformationMessage(`🎉 ${fileName} is already baseline-compatible!`);
                return;
            }
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `AI is modernizing ${fileName}...`,
                cancellable: false
            }, async () => {
                const strategy = await this.aiAssistant.generateModernizationStrategy(fileContent, fileName, issues);
                await this.showModernizationStrategy(strategy, documentUri);
            });
        }
        catch (error) {
            this.handleError('Failed to modernize file', error);
        }
    }
    /**
     * Generate modernization strategy
     */
    async handleGenerateStrategy(documentUri) {
        await this.handleModernizeFile(documentUri); // Same implementation for now
    }
    /**
     * Analyze performance impact
     */
    async handleAnalyzePerformance(documentUri) {
        try {
            const document = await vscode.workspace.openTextDocument(documentUri);
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Analyzing performance impact...`,
                cancellable: false
            }, async () => {
                // Generate performance analysis (simplified for now)
                const performanceData = await this.generatePerformanceAnalysis(document);
                await this.showPerformanceAnalysis(performanceData, documentUri);
            });
        }
        catch (error) {
            this.handleError('Failed to analyze performance', error);
        }
    }
    /**
     * Show score details dashboard
     */
    async handleShowScoreDetails() {
        await this.scoreManager.showScoreDetails();
    }
    /**
     * Launch modernization wizard
     */
    async handleModernizationWizard() {
        const panel = vscode.window.createWebviewPanel('modernizationWizard', '🧙‍♂️ Baseline Modernization Wizard', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        panel.webview.html = this.generateWizardHTML();
        // Handle messages from wizard
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'analyzeWorkspace':
                    await this.runWorkspaceAnalysis();
                    break;
                case 'generateReport':
                    await this.generateModernizationReport();
                    break;
            }
        });
    }
    /**
     * Helper methods
     */
    async showSolutionInWebview(solution, title, feature) {
        const panel = vscode.window.createWebviewPanel('aiSolution', `${title} - ${this.getFeatureName(feature)}`, vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        panel.webview.html = this.generateSolutionHTML(solution, title);
    }
    async showRefactoringSolution(solution, feature) {
        const panel = vscode.window.createWebviewPanel('refactoringSolution', `Refactoring Solution - ${this.getFeatureName(feature)}`, vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        panel.webview.html = this.generateRefactoringHTML(solution);
        return new Promise((resolve) => {
            panel.webview.onDidReceiveMessage((message) => {
                if (message.command === 'apply' || message.command === 'cancel') {
                    resolve(message.command === 'apply' ? 'Apply' : 'Cancel');
                    panel.dispose();
                }
            });
            panel.onDidDispose(() => {
                resolve(undefined);
            });
        });
    }
    async applyCodeRefactoring(solution, range, documentUri) {
        const document = await vscode.workspace.openTextDocument(documentUri);
        const edit = new vscode.WorkspaceEdit();
        edit.replace(documentUri, range, solution.code);
        const success = await vscode.workspace.applyEdit(edit);
        if (success) {
            vscode.window.showInformationMessage('✅ Code refactoring applied successfully!');
        }
        else {
            vscode.window.showErrorMessage('❌ Failed to apply code refactoring');
        }
    }
    async showModernizationStrategy(strategy, documentUri) {
        const panel = vscode.window.createWebviewPanel('modernizationStrategy', '🚀 Modernization Strategy', vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        panel.webview.html = this.generateStrategyHTML(strategy);
    }
    analyzeFileForIssues(fileContent) {
        // Simplified issue detection - in real implementation, this would use the parsers
        const issues = [];
        // Look for common non-baseline patterns
        if (fileContent.includes('float:')) {
            issues.push({
                feature: 'css.properties.float',
                message: 'Float layout is not baseline',
                line: 0,
                column: 0,
                severity: 'warning'
            });
        }
        return issues;
    }
    async generatePerformanceAnalysis(document) {
        // Mock performance analysis
        return {
            bundleSize: '45.2KB',
            loadTime: '120ms',
            compatibilityScore: 87,
            recommendations: [
                'Consider using CSS Grid instead of float',
                'Add polyfills for better browser support'
            ]
        };
    }
    generateSolutionHTML(solution, title) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { 
            font-family: var(--vscode-font-family); 
            padding: 20px; 
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
          }
          .code-block { 
            background: var(--vscode-textBlockQuote-background); 
            padding: 15px; 
            border-radius: 5px; 
            font-family: monospace;
            margin: 10px 0;
            overflow-x: auto;
          }
          .section { margin: 20px 0; }
          h1 { color: var(--vscode-charts-blue); }
          h2 { color: var(--vscode-charts-green); }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        
        <div class="section">
          <h2>🔧 Generated Solution</h2>
          <div class="code-block">${this.escapeHtml(solution.code)}</div>
        </div>
        
        <div class="section">
          <h2>📝 Explanation</h2>
          <p>${this.escapeHtml(solution.explanation)}</p>
        </div>
        
        <div class="section">
          <h2>📋 Instructions</h2>
          <ul>
            ${solution.instructions.map(instruction => `<li>${this.escapeHtml(instruction)}</li>`).join('')}
          </ul>
        </div>
      </body>
      </html>
    `;
    }
    generateRefactoringHTML(solution) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Code Refactoring</title>
        <style>
          body { 
            font-family: var(--vscode-font-family); 
            padding: 20px; 
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
          }
          .code-block { 
            background: var(--vscode-textBlockQuote-background); 
            padding: 15px; 
            border-radius: 5px; 
            font-family: monospace;
            margin: 10px 0;
            overflow-x: auto;
          }
          .buttons { margin: 20px 0; }
          button { 
            padding: 10px 20px; 
            margin: 0 10px; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer;
          }
          .apply-btn { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
          .cancel-btn { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
        </style>
      </head>
      <body>
        <h1>🔄 AI Code Refactoring</h1>
        
        <div class="section">
          <h2>Refactored Code</h2>
          <div class="code-block">${this.escapeHtml(solution.code)}</div>
        </div>
        
        <div class="section">
          <h2>Changes Made</h2>
          <p>${this.escapeHtml(solution.explanation)}</p>
        </div>
        
        <div class="buttons">
          <button class="apply-btn" onclick="applyRefactoring()">✅ Apply Changes</button>
          <button class="cancel-btn" onclick="cancelRefactoring()">❌ Cancel</button>
        </div>
        
        <script>
          const vscode = acquireVsCodeApi();
          
          function applyRefactoring() {
            vscode.postMessage({ command: 'apply' });
          }
          
          function cancelRefactoring() {
            vscode.postMessage({ command: 'cancel' });
          }
        </script>
      </body>
      </html>
    `;
    }
    generateStrategyHTML(strategy) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Modernization Strategy</title>
        <style>
          body { 
            font-family: var(--vscode-font-family); 
            padding: 20px; 
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
          }
          .section { margin: 20px 0; padding: 15px; border-left: 3px solid var(--vscode-charts-blue); }
          .code-block { 
            background: var(--vscode-textBlockQuote-background); 
            padding: 15px; 
            border-radius: 5px; 
            font-family: monospace;
            margin: 10px 0;
            overflow-x: auto;
          }
          h1 { color: var(--vscode-charts-blue); }
          h2 { color: var(--vscode-charts-green); }
        </style>
      </head>
      <body>
        <h1>🚀 AI Modernization Strategy</h1>
        
        <div class="section">
          <h2>📊 Priority Assessment</h2>
          <p>${this.escapeHtml(strategy.priorityAssessment)}</p>
        </div>
        
        <div class="section">
          <h2>🗺️ Modernization Roadmap</h2>
          <p>${this.escapeHtml(strategy.roadmap)}</p>
        </div>
        
        <div class="section">
          <h2>🔧 Refactored Code</h2>
          <div class="code-block">${this.escapeHtml(strategy.refactoredCode)}</div>
        </div>
        
        <div class="section">
          <h2>📋 Migration Guide</h2>
          <p>${this.escapeHtml(strategy.migrationGuide)}</p>
        </div>
        
        <div class="section">
          <h2>⚡ Performance Impact</h2>
          <p>${this.escapeHtml(strategy.performanceImpact)}</p>
        </div>
      </body>
      </html>
    `;
    }
    generateWizardHTML() {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Modernization Wizard</title>
        <style>
          body { 
            font-family: var(--vscode-font-family); 
            padding: 20px; 
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
          }
          .wizard-step { margin: 20px 0; padding: 15px; border: 1px solid var(--vscode-panel-border); border-radius: 5px; }
          button { 
            padding: 10px 20px; 
            margin: 10px; 
            border: none; 
            border-radius: 5px; 
            background: var(--vscode-button-background); 
            color: var(--vscode-button-foreground);
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <h1>🧙‍♂️ Baseline Modernization Wizard</h1>
        
        <div class="wizard-step">
          <h2>Step 1: Analyze Your Workspace</h2>
          <p>Scan your entire workspace for baseline compatibility issues.</p>
          <button onclick="analyzeWorkspace()">🔍 Start Analysis</button>
        </div>
        
        <div class="wizard-step">
          <h2>Step 2: Generate Modernization Report</h2>
          <p>Create a comprehensive modernization plan.</p>
          <button onclick="generateReport()">📊 Generate Report</button>
        </div>
        
        <script>
          const vscode = acquireVsCodeApi();
          
          function analyzeWorkspace() {
            vscode.postMessage({ command: 'analyzeWorkspace' });
          }
          
          function generateReport() {
            vscode.postMessage({ command: 'generateReport' });
          }
        </script>
      </body>
      </html>
    `;
    }
    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    getFeatureName(feature) {
        return feature.replace(/^(css\.properties\.|html\.elements\.|javascript\.api\.)/, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }
    handleError(message, error) {
        console.error(`${message}:`, error);
        vscode.window.showErrorMessage(`${message}: ${error.message || error}`);
    }
    async runWorkspaceAnalysis() {
        vscode.window.showInformationMessage('🔍 Starting workspace analysis...');
        // Implementation would go here
    }
    async generateModernizationReport() {
        vscode.window.showInformationMessage('📊 Generating modernization report...');
        // Implementation would go here
    }
    async showPerformanceAnalysis(performanceData, documentUri) {
        const panel = vscode.window.createWebviewPanel('performanceAnalysis', 'Performance Analysis', vscode.ViewColumn.Beside, { enableScripts: true });
        panel.webview.html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Performance Analysis</title>
        <style>
          body { font-family: var(--vscode-font-family); padding: 20px; }
          .metric { margin: 15px 0; padding: 10px; background: var(--vscode-textBlockQuote-background); border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>⚡ Performance Analysis</h1>
        
        <div class="metric">
          <h3>Bundle Size: ${performanceData.bundleSize}</h3>
        </div>
        
        <div class="metric">
          <h3>Load Time: ${performanceData.loadTime}</h3>
        </div>
        
        <div class="metric">
          <h3>Compatibility Score: ${performanceData.compatibilityScore}%</h3>
        </div>
        
        <h2>Recommendations:</h2>
        <ul>
          ${performanceData.recommendations.map((rec) => `<li>${rec}</li>`).join('')}
        </ul>
      </body>
      </html>
    `;
    }
}
exports.AICommandHandlers = AICommandHandlers;
//# sourceMappingURL=aiCommandHandlers.js.map