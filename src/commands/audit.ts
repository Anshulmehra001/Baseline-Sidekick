import * as vscode from 'vscode';
import { BaselineDataManager } from '../core/baselineData';
import { CssParser } from '../core/cssParser';
import { JsParser } from '../core/jsParser';
import { HtmlParser } from '../core/htmlParser';
import { PerformanceOptimizer } from '../core/performanceOptimizer';

/**
 * Interface representing a compatibility issue found during workspace audit
 */
export interface CompatibilityIssue {
  featureId: string;
  featureName: string;
  filePath: string;
  lineNumber: number;
  columnNumber: number;
  languageType: 'CSS' | 'JavaScript' | 'HTML';
  severity: 'error' | 'warning' | 'info';
}

/**
 * WorkspaceAuditor class for project-wide Baseline compatibility analysis
 * Scans all supported files in the workspace and generates a comprehensive report
 */
export class WorkspaceAuditor {
  private baselineDataManager: BaselineDataManager;
  private performanceOptimizer: PerformanceOptimizer;

  constructor() {
    this.baselineDataManager = BaselineDataManager.getInstance();
    this.performanceOptimizer = PerformanceOptimizer.getInstance();
  }

  /**
   * Main method to audit the entire workspace for Baseline compatibility issues
   * Implements progress notification and generates a Markdown report
   */
  public async auditWorkspace(): Promise<void> {
    try {
      // Ensure baseline data is loaded
      if (!this.baselineDataManager.isInitialized()) {
        await this.baselineDataManager.initialize();
      }

      // Use VS Code's progress API to show progress to user
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Auditing workspace for Baseline compatibility',
          cancellable: true
        },
        async (progress, token) => {
          // Discover all supported files in the workspace
          progress.report({ increment: 0, message: 'Discovering files...' });
          
          const files = await this.discoverFiles();
          
          if (files.length === 0) {
            vscode.window.showInformationMessage('No CSS, JavaScript, or HTML files found in workspace.');
            return;
          }

          // Check for cancellation
          if (token.isCancellationRequested) {
            return;
          }

          progress.report({ increment: 20, message: `Found ${files.length} files. Scanning...` });

          // Scan each file and collect issues
          const allIssues: CompatibilityIssue[] = [];
          const progressIncrement = 70 / files.length; // Reserve 70% for scanning

          // Process files in batches to prevent memory issues
          const batchSize = 10;
          for (let i = 0; i < files.length; i += batchSize) {
            if (token.isCancellationRequested) {
              return;
            }

            const batch = files.slice(i, i + batchSize);
            const batchPromises = batch.map(async (file) => {
              try {
                progress.report({ 
                  increment: progressIncrement, 
                  message: `Scanning ${file.fsPath.split(/[/\\]/).pop()}...` 
                });

                // Use timeout for each file to prevent hanging
                return await this.performanceOptimizer.withTimeout(
                  () => this.scanFile(file),
                  10000 // 10 second timeout per file
                );
              } catch (error) {
                console.error(`Error scanning file ${file.fsPath}:`, error);
                return []; // Return empty array on error
              }
            });

            const batchResults = await Promise.all(batchPromises);
            for (const issues of batchResults) {
              allIssues.push(...issues);
            }

            // Yield control between batches
            await new Promise(resolve => setImmediate(resolve));
          }

          if (token.isCancellationRequested) {
            return;
          }

          progress.report({ increment: 10, message: 'Generating report...' });

          // Generate and display the report
          const report = this.generateReport(allIssues, files.length);
          await this.openReport(report);

          // Show completion message
          const issueCount = allIssues.length;
          if (issueCount === 0) {
            vscode.window.showInformationMessage('✅ No Baseline compatibility issues found!');
          } else {
            vscode.window.showInformationMessage(
              `📊 Audit complete: Found ${issueCount} compatibility issue${issueCount === 1 ? '' : 's'} across ${files.length} files.`
            );
          }
        }
      );
    } catch (error) {
      console.error('Error during workspace audit:', error);
      vscode.window.showErrorMessage(`Failed to audit workspace: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Discovers all CSS, JavaScript, and HTML files in the workspace
   * Excludes node_modules and other common ignore patterns
   * @returns Array of file URIs to scan
   */
  private async discoverFiles(): Promise<vscode.Uri[]> {
    const files: vscode.Uri[] = [];

    // Define file patterns to include
    const includePatterns = [
      '**/*.css',
      '**/*.scss',
      '**/*.sass',
      '**/*.less',
      '**/*.js',
      '**/*.jsx',
      '**/*.ts',
      '**/*.tsx',
      '**/*.html',
      '**/*.htm',
      '**/*.xml'
    ];

    // Define patterns to exclude (common ignore patterns)
    const excludePattern = '{**/node_modules/**,**/dist/**,**/build/**,**/out/**,**/.git/**,**/coverage/**,**/*.min.js,**/*.min.css}';

    // Use VS Code's workspace.findFiles to discover files
    for (const pattern of includePatterns) {
      try {
        const foundFiles = await vscode.workspace.findFiles(pattern, excludePattern);
        files.push(...foundFiles);
      } catch (error) {
        console.error(`Error finding files with pattern ${pattern}:`, error);
        // Continue with other patterns
      }
    }

    // Remove duplicates (in case a file matches multiple patterns)
    const uniqueFiles = files.filter((file, index, array) => 
      array.findIndex(f => f.fsPath === file.fsPath) === index
    );

    return uniqueFiles;
  }

  /**
   * Scans a single file for Baseline compatibility issues
   * @param uri File URI to scan
   * @returns Array of compatibility issues found in the file
   */
  private async scanFile(uri: vscode.Uri): Promise<CompatibilityIssue[]> {
    const issues: CompatibilityIssue[] = [];

    try {
      // Read file content
      const document = await vscode.workspace.openTextDocument(uri);
      
      // Check if file should be processed based on size limits
      if (!this.performanceOptimizer.shouldProcessFile(document)) {
        console.warn(`Skipping ${uri.fsPath} due to size limits`);
        return issues;
      }

      const content = document.getText();
      const filePath = vscode.workspace.asRelativePath(uri);

      // Track memory usage for this operation
      const fileSize = Buffer.byteLength(content, 'utf8');
      const operationId = `audit-${uri.fsPath}`;
      this.performanceOptimizer.trackMemoryUsage(operationId, fileSize);

      try {
        // Determine file type and parse accordingly
        const languageId = document.languageId;
        
        if (this.isCssFile(languageId)) {
          await this.scanCssFile(content, document, filePath, issues);
        } else if (this.isJavaScriptFile(languageId)) {
          await this.scanJavaScriptFile(content, document, filePath, issues);
        } else if (this.isHtmlFile(languageId)) {
          await this.scanHtmlFile(content, document, filePath, issues);
        }
      } finally {
        // Release memory tracking
        this.performanceOptimizer.releaseMemoryTracking(operationId);
      }
    } catch (error) {
      console.error(`Error scanning file ${uri.fsPath}:`, error);
      // Don't throw, just log and continue
    }

    return issues;
  }

  /**
   * Scans CSS content for non-Baseline features
   */
  private async scanCssFile(
    content: string,
    document: vscode.TextDocument,
    filePath: string,
    issues: CompatibilityIssue[]
  ): Promise<void> {
    try {
      // Use memoized parser for better performance
      const memoizedParser = this.performanceOptimizer.memoize(
        (content: string, document: vscode.TextDocument) => CssParser.parseCss(content, document),
        (content: string, document: vscode.TextDocument) => `audit-css-${document.uri.fsPath}-${this.hashContent(content)}`
      );
      
      const parseResult = memoizedParser(content, document);
      
      for (const featureId of parseResult.features) {
        if (!this.baselineDataManager.isBaselineSupported(featureId)) {
          const featureData = this.baselineDataManager.getFeatureData(featureId);
          const locations = parseResult.locations.get(featureId) || [];
          
          for (const range of locations) {
            issues.push({
              featureId,
              featureName: featureData?.name || featureId,
              filePath,
              lineNumber: range.start.line + 1, // Convert to 1-based
              columnNumber: range.start.character + 1, // Convert to 1-based
              languageType: 'CSS',
              severity: 'warning'
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error parsing CSS file ${filePath}:`, error);
    }
  }

  /**
   * Scans JavaScript content for non-Baseline features
   */
  private async scanJavaScriptFile(
    content: string,
    document: vscode.TextDocument,
    filePath: string,
    issues: CompatibilityIssue[]
  ): Promise<void> {
    try {
      // Use memoized parser for better performance
      const memoizedParser = this.performanceOptimizer.memoize(
        (content: string, document: vscode.TextDocument) => JsParser.parseJavaScript(content, document),
        (content: string, document: vscode.TextDocument) => `audit-js-${document.uri.fsPath}-${this.hashContent(content)}`
      );
      
      const parseResult = memoizedParser(content, document);
      
      for (const featureId of parseResult.features) {
        if (!this.baselineDataManager.isBaselineSupported(featureId)) {
          const featureData = this.baselineDataManager.getFeatureData(featureId);
          const locations = parseResult.locations.get(featureId) || [];
          
          for (const range of locations) {
            issues.push({
              featureId,
              featureName: featureData?.name || featureId,
              filePath,
              lineNumber: range.start.line + 1, // Convert to 1-based
              columnNumber: range.start.character + 1, // Convert to 1-based
              languageType: 'JavaScript',
              severity: 'warning'
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error parsing JavaScript file ${filePath}:`, error);
    }
  }

  /**
   * Scans HTML content for non-Baseline features
   */
  private async scanHtmlFile(
    content: string,
    document: vscode.TextDocument,
    filePath: string,
    issues: CompatibilityIssue[]
  ): Promise<void> {
    try {
      // Use memoized parser for better performance
      const memoizedParser = this.performanceOptimizer.memoize(
        (content: string, document: vscode.TextDocument) => HtmlParser.parseHtml(content, document),
        (content: string, document: vscode.TextDocument) => `audit-html-${document.uri.fsPath}-${this.hashContent(content)}`
      );
      
      const parseResult = memoizedParser(content, document);
      
      for (const featureId of parseResult.features) {
        if (!this.baselineDataManager.isBaselineSupported(featureId)) {
          const featureData = this.baselineDataManager.getFeatureData(featureId);
          const locations = parseResult.locations.get(featureId) || [];
          
          for (const range of locations) {
            issues.push({
              featureId,
              featureName: featureData?.name || featureId,
              filePath,
              lineNumber: range.start.line + 1, // Convert to 1-based
              columnNumber: range.start.character + 1, // Convert to 1-based
              languageType: 'HTML',
              severity: 'warning'
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error parsing HTML file ${filePath}:`, error);
    }
  }

  /**
   * Generates a Markdown report from the collected compatibility issues
   * Groups issues by file for better organization
   * @param issues Array of all compatibility issues found
   * @param totalFiles Total number of files scanned
   * @returns Markdown formatted report string
   */
  private generateReport(issues: CompatibilityIssue[], totalFiles: number): string {
    const now = new Date().toLocaleString();
    
    let report = `# Baseline Compatibility Audit Report\n\n`;
    report += `**Generated:** ${now}  \n`;
    report += `**Files Scanned:** ${totalFiles}  \n`;
    report += `**Issues Found:** ${issues.length}\n\n`;

    if (issues.length === 0) {
      report += `## ✅ No Issues Found\n\n`;
      report += `Congratulations! All scanned files use only Baseline-supported web platform features.\n\n`;
      return report;
    }

    // Group issues by file
    const issuesByFile = new Map<string, CompatibilityIssue[]>();
    for (const issue of issues) {
      if (!issuesByFile.has(issue.filePath)) {
        issuesByFile.set(issue.filePath, []);
      }
      issuesByFile.get(issue.filePath)!.push(issue);
    }

    // Sort files by number of issues (descending)
    const sortedFiles = Array.from(issuesByFile.entries())
      .sort(([, a], [, b]) => b.length - a.length);

    report += `## 📊 Summary\n\n`;
    
    // Count issues by language type
    const issuesByLanguage = new Map<string, number>();
    for (const issue of issues) {
      const count = issuesByLanguage.get(issue.languageType) || 0;
      issuesByLanguage.set(issue.languageType, count + 1);
    }

    for (const [language, count] of issuesByLanguage) {
      report += `- **${language}:** ${count} issue${count === 1 ? '' : 's'}  \n`;
    }

    report += `\n## 📁 Issues by File\n\n`;

    for (const [filePath, fileIssues] of sortedFiles) {
      report += `### \`${filePath}\` (${fileIssues.length} issue${fileIssues.length === 1 ? '' : 's'})\n\n`;
      
      // Group issues by language type within the file
      const issuesByLang = new Map<string, CompatibilityIssue[]>();
      for (const issue of fileIssues) {
        if (!issuesByLang.has(issue.languageType)) {
          issuesByLang.set(issue.languageType, []);
        }
        issuesByLang.get(issue.languageType)!.push(issue);
      }

      for (const [langType, langIssues] of issuesByLang) {
        if (issuesByLang.size > 1) {
          report += `#### ${langType}\n\n`;
        }

        for (const issue of langIssues) {
          const featureData = this.baselineDataManager.getFeatureData(issue.featureId);
          const mdnUrl = featureData ? this.baselineDataManager.getMdnUrl(featureData) : null;
          
          report += `- **Line ${issue.lineNumber}:${issue.columnNumber}** - \`${issue.featureName}\``;
          
          if (mdnUrl) {
            report += ` ([MDN](${mdnUrl}))`;
          }
          
          // Add baseline status information
          if (featureData) {
            const baseline = featureData.status.baseline;
            if (baseline === false) {
              report += ` - Not supported by all browsers`;
            } else if (baseline === 'low') {
              report += ` - Limited browser support`;
            }
          }
          
          report += `  \n`;
        }
        report += `\n`;
      }
    }

    report += `## 💡 Next Steps\n\n`;
    report += `1. Review the issues listed above\n`;
    report += `2. Use the hover information in your editor to see detailed compatibility information\n`;
    report += `3. Consider using the code actions (💡) to apply automated fixes where available\n`;
    report += `4. Check the MDN documentation links for alternative approaches\n`;
    report += `5. Test your changes across different browsers to ensure compatibility\n\n`;

    report += `---\n`;
    report += `*Generated by Baseline Sidekick extension*\n`;

    return report;
  }

  /**
   * Opens the generated report in a new VS Code editor tab
   * @param reportContent Markdown content of the report
   */
  private async openReport(reportContent: string): Promise<void> {
    try {
      // Create a new untitled document with the report content
      const document = await vscode.workspace.openTextDocument({
        content: reportContent,
        language: 'markdown'
      });

      // Show the document in a new editor tab
      await vscode.window.showTextDocument(document, {
        preview: false, // Open in a regular tab, not preview
        viewColumn: vscode.ViewColumn.One
      });
    } catch (error) {
      console.error('Error opening report:', error);
      vscode.window.showErrorMessage('Failed to open audit report');
    }
  }

  /**
   * Helper method to check if a language ID represents a CSS file
   */
  private isCssFile(languageId: string): boolean {
    return ['css', 'scss', 'sass', 'less'].includes(languageId);
  }

  /**
   * Helper method to check if a language ID represents a JavaScript file
   */
  private isJavaScriptFile(languageId: string): boolean {
    return ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(languageId);
  }

  /**
   * Helper method to check if a language ID represents an HTML file
   */
  private isHtmlFile(languageId: string): boolean {
    return ['html', 'xml'].includes(languageId);
  }

  /**
   * Creates a simple hash of content for caching purposes
   */
  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}

/**
 * Registers the workspace audit command with VS Code
 * @param context VS Code extension context
 */
export function registerAuditCommand(context: vscode.ExtensionContext): void {
  const auditor = new WorkspaceAuditor();
  
  const command = vscode.commands.registerCommand('baseline.auditWorkspace', async () => {
    await auditor.auditWorkspace();
  });

  context.subscriptions.push(command);
}