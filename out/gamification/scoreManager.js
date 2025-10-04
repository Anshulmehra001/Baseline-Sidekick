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
exports.BaselineScoreManager = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Baseline Modernization Score Calculator & Gamification System
 * Provides measurable metrics and motivational elements
 */
class BaselineScoreManager {
    static getInstance() {
        if (!BaselineScoreManager.instance) {
            BaselineScoreManager.instance = new BaselineScoreManager();
        }
        return BaselineScoreManager.instance;
    }
    constructor() {
        this.scoreHistory = [];
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'baseline.showScoreDetails';
        this.statusBarItem.tooltip = 'Click to view detailed Baseline score breakdown';
    }
    /**
     * Calculate comprehensive baseline score for a file
     */
    calculateFileScore(fileUri, features) {
        const totalFeatures = features.baseline.length + features.nonBaseline.length;
        if (totalFeatures === 0) {
            return {
                uri: fileUri,
                score: 100,
                grade: 'A+',
                totalFeatures: 0,
                baselineFeatures: 0,
                nonBaselineFeatures: 0,
                criticalIssues: 0,
                suggestions: [],
                lastUpdated: new Date()
            };
        }
        const baselineRatio = features.baseline.length / totalFeatures;
        const score = Math.round(baselineRatio * 100);
        // Apply penalties for critical issues
        const criticalPenalty = features.nonBaseline.filter(f => f.severity === 'high').length * 5;
        const finalScore = Math.max(0, score - criticalPenalty);
        return {
            uri: fileUri,
            score: finalScore,
            grade: this.calculateGrade(finalScore),
            totalFeatures,
            baselineFeatures: features.baseline.length,
            nonBaselineFeatures: features.nonBaseline.length,
            criticalIssues: features.nonBaseline.filter(f => f.severity === 'high').length,
            suggestions: this.generateScoreImprovementSuggestions(features),
            lastUpdated: new Date()
        };
    }
    /**
     * Calculate workspace-wide baseline score
     */
    async calculateWorkspaceScore(fileScores) {
        if (fileScores.length === 0) {
            return this.createEmptyWorkspaceScore();
        }
        const totalScore = fileScores.reduce((sum, file) => sum + file.score, 0);
        const averageScore = Math.round(totalScore / fileScores.length);
        const totalFeatures = fileScores.reduce((sum, file) => sum + file.totalFeatures, 0);
        const totalBaselineFeatures = fileScores.reduce((sum, file) => sum + file.baselineFeatures, 0);
        const totalNonBaselineFeatures = fileScores.reduce((sum, file) => sum + file.nonBaselineFeatures, 0);
        const totalCriticalIssues = fileScores.reduce((sum, file) => sum + file.criticalIssues, 0);
        const modernizationTrend = this.calculateModernizationTrend();
        const achievement = this.calculateAchievement(averageScore, fileScores.length);
        const workspaceScore = {
            overallScore: averageScore,
            grade: this.calculateGrade(averageScore),
            totalFiles: fileScores.length,
            totalFeatures,
            baselineFeatures: totalBaselineFeatures,
            nonBaselineFeatures: totalNonBaselineFeatures,
            criticalIssues: totalCriticalIssues,
            fileScores,
            modernizationTrend,
            achievement,
            recommendations: this.generateWorkspaceRecommendations(fileScores),
            lastUpdated: new Date()
        };
        // Update score history
        this.updateScoreHistory(workspaceScore);
        // Update status bar
        this.updateStatusBar(workspaceScore);
        return workspaceScore;
    }
    /**
     * Update the VS Code status bar with current score
     */
    updateStatusBar(workspaceScore) {
        const { overallScore, grade, criticalIssues } = workspaceScore;
        let icon = '✅';
        let color = undefined;
        if (overallScore >= 90) {
            icon = '🏆';
        }
        else if (overallScore >= 80) {
            icon = '⭐';
        }
        else if (overallScore >= 70) {
            icon = '🎯';
            color = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
        else {
            icon = '⚠️';
            color = new vscode.ThemeColor('statusBarItem.errorBackground');
        }
        this.statusBarItem.text = `${icon} Baseline: ${overallScore}% (${grade})`;
        this.statusBarItem.backgroundColor = color;
        if (criticalIssues > 0) {
            this.statusBarItem.text += ` • ${criticalIssues} critical`;
        }
        this.statusBarItem.show();
    }
    /**
     * Show detailed score breakdown in webview
     */
    async showScoreDetails() {
        const panel = vscode.window.createWebviewPanel('baselineScore', 'Baseline Modernization Score', vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        panel.webview.html = await this.generateScoreWebviewContent();
    }
    calculateGrade(score) {
        if (score >= 95)
            return 'A+';
        if (score >= 90)
            return 'A';
        if (score >= 85)
            return 'A-';
        if (score >= 80)
            return 'B+';
        if (score >= 75)
            return 'B';
        if (score >= 70)
            return 'B-';
        if (score >= 65)
            return 'C+';
        if (score >= 60)
            return 'C';
        if (score >= 55)
            return 'C-';
        if (score >= 50)
            return 'D';
        return 'F';
    }
    generateScoreImprovementSuggestions(features) {
        const suggestions = [];
        // Analyze non-baseline features and provide specific suggestions
        const highSeverityFeatures = features.nonBaseline.filter(f => f.severity === 'high');
        if (highSeverityFeatures.length > 0) {
            suggestions.push(`🎯 Fix ${highSeverityFeatures.length} critical compatibility issues first`);
        }
        const cssFeatures = features.nonBaseline.filter(f => f.type === 'css');
        if (cssFeatures.length > 0) {
            suggestions.push(`🎨 Modernize ${cssFeatures.length} CSS properties using PostCSS`);
        }
        const jsFeatures = features.nonBaseline.filter(f => f.type === 'javascript');
        if (jsFeatures.length > 0) {
            suggestions.push(`⚡ Add polyfills for ${jsFeatures.length} JavaScript features`);
        }
        if (suggestions.length === 0) {
            suggestions.push('🎉 Excellent! All features are Baseline-compatible');
        }
        return suggestions;
    }
    calculateModernizationTrend() {
        if (this.scoreHistory.length < 2) {
            return 'stable';
        }
        const recent = this.scoreHistory.slice(-3);
        const avgRecent = recent.reduce((sum, h) => sum + h.score, 0) / recent.length;
        const older = this.scoreHistory.slice(-6, -3);
        if (older.length === 0) {
            return 'stable';
        }
        const avgOlder = older.reduce((sum, h) => sum + h.score, 0) / older.length;
        if (avgRecent > avgOlder + 2) {
            return 'improving';
        }
        else if (avgRecent < avgOlder - 2) {
            return 'declining';
        }
        return 'stable';
    }
    calculateAchievement(score, fileCount) {
        // Define achievements based on score and file count
        const achievements = [
            {
                id: 'baseline_master',
                title: '🏆 Baseline Master',
                description: 'Achieved 95%+ score across entire workspace',
                unlocked: score >= 95,
                rarity: 'legendary'
            },
            {
                id: 'modernization_expert',
                title: '⭐ Modernization Expert',
                description: 'Achieved 90%+ score with 10+ files',
                unlocked: score >= 90 && fileCount >= 10,
                rarity: 'epic'
            },
            {
                id: 'compatibility_champion',
                title: '🎯 Compatibility Champion',
                description: 'Achieved 80%+ score consistently',
                unlocked: score >= 80,
                rarity: 'rare'
            },
            {
                id: 'baseline_beginner',
                title: '🌟 Baseline Beginner',
                description: 'Started your baseline journey',
                unlocked: true,
                rarity: 'common'
            }
        ];
        return achievements.find(a => a.unlocked && a.rarity !== 'common') || achievements[achievements.length - 1];
    }
    generateWorkspaceRecommendations(fileScores) {
        const recommendations = [];
        // Find files with lowest scores
        const lowScoreFiles = fileScores.filter(f => f.score < 70).sort((a, b) => a.score - b.score);
        if (lowScoreFiles.length > 0) {
            recommendations.push(`📍 Focus on improving ${lowScoreFiles[0].uri.fsPath} (${lowScoreFiles[0].score}% score)`);
        }
        // Find most common issues
        const allIssues = fileScores.flatMap(f => f.suggestions);
        const issueCount = allIssues.reduce((acc, issue) => {
            acc[issue] = (acc[issue] || 0) + 1;
            return acc;
        }, {});
        const topIssue = Object.entries(issueCount).sort(([, a], [, b]) => b - a)[0];
        if (topIssue) {
            recommendations.push(`🔧 ${topIssue[0]} (affects ${topIssue[1]} files)`);
        }
        return recommendations;
    }
    updateScoreHistory(workspaceScore) {
        this.scoreHistory.push({
            score: workspaceScore.overallScore,
            timestamp: new Date(),
            fileCount: workspaceScore.totalFiles,
            criticalIssues: workspaceScore.criticalIssues
        });
        // Keep only last 50 entries
        if (this.scoreHistory.length > 50) {
            this.scoreHistory = this.scoreHistory.slice(-50);
        }
    }
    createEmptyWorkspaceScore() {
        return {
            overallScore: 100,
            grade: 'A+',
            totalFiles: 0,
            totalFeatures: 0,
            baselineFeatures: 0,
            nonBaselineFeatures: 0,
            criticalIssues: 0,
            fileScores: [],
            modernizationTrend: 'stable',
            achievement: {
                id: 'getting_started',
                title: '🚀 Getting Started',
                description: 'Ready to analyze your codebase',
                unlocked: true,
                rarity: 'common'
            },
            recommendations: ['📂 Add some files to start analyzing'],
            lastUpdated: new Date()
        };
    }
    async generateScoreWebviewContent() {
        // This would generate a beautiful HTML dashboard
        // For now, returning a placeholder
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Baseline Score Dashboard</title>
        <style>
          body { font-family: var(--vscode-font-family); padding: 20px; }
          .score-card { background: var(--vscode-editor-background); padding: 20px; margin: 10px 0; border-radius: 8px; }
          .score-large { font-size: 48px; font-weight: bold; color: var(--vscode-charts-green); }
        </style>
      </head>
      <body>
        <h1>🏆 Baseline Modernization Dashboard</h1>
        <div class="score-card">
          <div class="score-large">Loading...</div>
          <p>Detailed analytics coming soon!</p>
        </div>
      </body>
      </html>
    `;
    }
    dispose() {
        this.statusBarItem.dispose();
    }
}
exports.BaselineScoreManager = BaselineScoreManager;
//# sourceMappingURL=scoreManager.js.map