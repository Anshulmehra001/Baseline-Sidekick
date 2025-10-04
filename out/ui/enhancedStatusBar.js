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
exports.EnhancedStatusBar = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Enhanced status bar with user-friendly feedback
 */
class EnhancedStatusBar {
    constructor() {
        this.compatibilityScore = 100;
        this.totalFeatures = 0;
        this.baselineFeatures = 0;
        this.isProcessing = false;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
        this.statusBarItem.command = 'baselineSidekick.showCompatibilityReport';
        this.updateStatusBar();
        this.statusBarItem.show();
    }
    updateScore(total, baseline) {
        this.totalFeatures = total;
        this.baselineFeatures = baseline;
        this.compatibilityScore = total > 0 ? Math.round((baseline / total) * 100) : 100;
        this.updateStatusBar();
    }
    setProcessing(isProcessing) {
        this.isProcessing = isProcessing;
        this.updateStatusBar();
    }
    updateStatusBar() {
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
    getScoreIndicator() {
        if (this.compatibilityScore >= 95) {
            return {
                icon: '$(check-all)',
                color: undefined,
                message: 'Excellent!'
            };
        }
        else if (this.compatibilityScore >= 80) {
            return {
                icon: '$(check)',
                color: undefined,
                message: 'Good job!'
            };
        }
        else if (this.compatibilityScore >= 60) {
            return {
                icon: '$(warning)',
                color: new vscode.ThemeColor('statusBarItem.warningBackground'),
                message: 'Needs attention'
            };
        }
        else {
            return {
                icon: '$(error)',
                color: new vscode.ThemeColor('statusBarItem.errorBackground'),
                message: 'Requires fixes'
            };
        }
    }
    getTooltip() {
        const nonBaselineCount = this.totalFeatures - this.baselineFeatures;
        const { message } = this.getScoreIndicator();
        let tooltip = `🎯 Baseline Compatibility: ${this.compatibilityScore}% (${message})\n\n`;
        if (this.totalFeatures === 0) {
            tooltip += "📝 Start coding to see your compatibility score!";
        }
        else {
            tooltip += `✅ Baseline features: ${this.baselineFeatures}\n`;
            tooltip += `⚠️  Non-baseline features: ${nonBaselineCount}\n`;
            tooltip += `📊 Total features analyzed: ${this.totalFeatures}\n\n`;
            if (nonBaselineCount > 0) {
                tooltip += "💡 Click to see detailed compatibility report";
            }
            else {
                tooltip += "🎉 Perfect! All features are baseline compatible!";
            }
        }
        tooltip += "\n\n🔄 Updates automatically as you code";
        return tooltip;
    }
    /**
     * Show celebration animation for achievements
     */
    showAchievement(achievement) {
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
    showContextualTip() {
        if (this.compatibilityScore < 80 && this.totalFeatures > 5) {
            vscode.window.showInformationMessage("💡 Tip: Try using modern alternatives like CSS Grid instead of floats for better baseline compatibility!", 'Show Me How', 'Dismiss').then(choice => {
                if (choice === 'Show Me How') {
                    vscode.commands.executeCommand('baselineSidekick.showModernizationWizard');
                }
            });
        }
    }
    dispose() {
        this.statusBarItem.dispose();
    }
}
exports.EnhancedStatusBar = EnhancedStatusBar;
//# sourceMappingURL=enhancedStatusBar.js.map