import * as vscode from 'vscode';

/**
 * Enhanced status bar with user-friendly feedback
 */
export class EnhancedStatusBar {
  private statusBarItem: vscode.StatusBarItem;
  private compatibilityScore: number = 100;
  private totalFeatures: number = 0;
  private baselineFeatures: number = 0;
  private isProcessing: boolean = false;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      1000
    );
    this.statusBarItem.command = 'baselineSidekick.showCompatibilityReport';
    this.updateStatusBar();
    this.statusBarItem.show();
  }

  public updateScore(total: number, baseline: number): void {
    this.totalFeatures = total;
    this.baselineFeatures = baseline;
    this.compatibilityScore = total > 0 ? Math.round((baseline / total) * 100) : 100;
    this.updateStatusBar();
  }

  public setProcessing(isProcessing: boolean): void {
    this.isProcessing = isProcessing;
    this.updateStatusBar();
  }

  private updateStatusBar(): void {
    if (this.isProcessing) {
      this.statusBarItem.text = "$(loading~spin) Checking baseline compatibility...";
      this.statusBarItem.tooltip = "Analyzing your code for baseline compatibility";
      this.statusBarItem.backgroundColor = undefined;
      return;
    }

    const { icon, color, message } = this.getScoreIndicator();
    
    this.statusBarItem.text = `${icon} ${this.compatibilityScore}% Baseline`;
    this.statusBarItem.tooltip = this.getTooltip();
    this.statusBarItem.backgroundColor = color;
  }

  private getScoreIndicator(): { icon: string, color?: vscode.ThemeColor, message: string } {
    if (this.compatibilityScore >= 95) {
      return {
        icon: '$(check-all)',
        color: undefined, // Green by default
        message: 'Excellent!'
      };
    } else if (this.compatibilityScore >= 80) {
      return {
        icon: '$(check)',
        color: undefined,
        message: 'Good job!'
      };
    } else if (this.compatibilityScore >= 60) {
      return {
        icon: '$(warning)',
        color: new vscode.ThemeColor('statusBarItem.warningBackground'),
        message: 'Needs attention'
      };
    } else {
      return {
        icon: '$(error)',
        color: new vscode.ThemeColor('statusBarItem.errorBackground'),
        message: 'Requires fixes'
      };
    }
  }

  private getTooltip(): string {
    const nonBaselineCount = this.totalFeatures - this.baselineFeatures;
    const { message } = this.getScoreIndicator();
    
    let tooltip = `🎯 Baseline Compatibility: ${this.compatibilityScore}% (${message})\n\n`;
    
    if (this.totalFeatures === 0) {
      tooltip += "📝 Start coding to see your compatibility score!";
    } else {
      tooltip += `✅ Baseline features: ${this.baselineFeatures}\n`;
      tooltip += `⚠️  Non-baseline features: ${nonBaselineCount}\n`;
      tooltip += `📊 Total features analyzed: ${this.totalFeatures}\n\n`;
      
      if (nonBaselineCount > 0) {
        tooltip += "💡 Click to see detailed compatibility report";
      } else {
        tooltip += "🎉 Perfect! All features are baseline compatible!";
      }
    }
    
    tooltip += "\n\n🔄 Updates automatically as you code";
    return tooltip;
  }

  /**
   * Show celebration animation for achievements
   */
  public showAchievement(achievement: string): void {
    const originalText = this.statusBarItem.text;
    this.statusBarItem.text = `🎉 ${achievement}`;
    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
    
    // Reset after 3 seconds
    setTimeout(() => {
      this.updateStatusBar();
    }, 3000);
  }

  /**
   * Show quick tips based on current score
   */
  public showContextualTip(): void {
    if (this.compatibilityScore < 80 && this.totalFeatures > 5) {
      vscode.window.showInformationMessage(
        "💡 Tip: Try using modern alternatives like CSS Grid instead of floats for better baseline compatibility!",
        'Show Me How',
        'Dismiss'
      ).then(choice => {
        if (choice === 'Show Me How') {
          vscode.commands.executeCommand('baselineSidekick.showModernizationWizard');
        }
      });
    }
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}