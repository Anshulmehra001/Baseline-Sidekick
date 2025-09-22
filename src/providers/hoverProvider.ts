import * as vscode from 'vscode';
import { BaselineDataManager, Feature } from '../core/baselineData';
import { EnhancedDiagnostic } from '../diagnostics';

/**
 * Hover provider for displaying rich compatibility information about non-Baseline features
 * Implements vscode.HoverProvider to show detailed feature information when hovering over code
 */
export class BaselineHoverProvider implements vscode.HoverProvider {
  private baselineDataManager: BaselineDataManager;

  /**
   * Creates a new BaselineHoverProvider instance
   */
  constructor() {
    this.baselineDataManager = BaselineDataManager.getInstance();
  }

  /**
   * Provides hover information for features under cursor position
   * Queries active diagnostics to find non-Baseline features at cursor location
   * @param document The document in which the hover was requested
   * @param position The position at which the hover was requested
   * @param token Cancellation token
   * @returns Hover object with rich compatibility information or undefined
   */
  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | undefined> {
    try {
      // Ensure baseline data is loaded
      if (!this.baselineDataManager.isInitialized()) {
        await this.baselineDataManager.initialize();
      }

      // Get diagnostics for the current document
      const diagnostics = vscode.languages.getDiagnostics(document.uri);
      
      // Find diagnostics that contain the cursor position and are from Baseline Sidekick
      const relevantDiagnostic = this.findDiagnosticAtPosition(diagnostics, position);
      
      if (!relevantDiagnostic) {
        return undefined;
      }

      // Extract feature ID from the diagnostic code
      const featureId = relevantDiagnostic.code?.value;
      if (!featureId) {
        return undefined;
      }

      // Get feature data for the hover content
      const featureData = this.baselineDataManager.getFeatureData(featureId);
      if (!featureData) {
        return undefined;
      }

      // Create rich hover content
      const hoverContent = this.createHoverContent(featureData, featureId);
      
      // Return hover with the diagnostic range for better UX
      return new vscode.Hover(hoverContent, relevantDiagnostic.range);
    } catch (error) {
      console.error('Error providing hover information:', error);
      return undefined;
    }
  }

  /**
   * Finds a Baseline Sidekick diagnostic that contains the given position
   * @param diagnostics Array of diagnostics for the document
   * @param position Position to check
   * @returns Enhanced diagnostic if found, undefined otherwise
   */
  private findDiagnosticAtPosition(
    diagnostics: readonly vscode.Diagnostic[],
    position: vscode.Position
  ): EnhancedDiagnostic | undefined {
    for (const diagnostic of diagnostics) {
      // Check if this is a Baseline Sidekick diagnostic
      if (diagnostic.source !== 'Baseline Sidekick') {
        continue;
      }

      // Check if the position is within the diagnostic range
      if (diagnostic.range.contains(position)) {
        return diagnostic as EnhancedDiagnostic;
      }
    }
    
    return undefined;
  }

  /**
   * Creates rich MarkdownString content with feature info and compatibility badge
   * Includes clickable MDN and CanIUse links in hover content
   * @param featureData Feature data from web-features dataset
   * @param featureId Feature ID for constructing links
   * @returns MarkdownString with rich hover content
   */
  private createHoverContent(featureData: Feature, featureId: string): vscode.MarkdownString {
    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true; // Allow command links
    markdown.supportHtml = true; // Allow HTML for better formatting

    // Feature name and compatibility badge
    const featureName = featureData.name || featureId;
    markdown.appendMarkdown(`## ${featureName}\n\n`);
    
    // Add "Not Baseline Supported" badge with appropriate styling
    const baseline = featureData.status.baseline;
    let badgeText = '';
    let reasonText = '';
    
    if (baseline === false) {
      badgeText = '🚫 **Not Baseline Supported**';
      reasonText = 'This feature is not supported by all browsers in the Baseline set.';
    } else if (baseline === 'low') {
      badgeText = '⚠️ **Limited Baseline Support**';
      reasonText = 'This feature has limited support and may not work in all browsers.';
      
      // Add date information if available
      if (featureData.status.baseline_low_date) {
        const date = new Date(featureData.status.baseline_low_date);
        reasonText += ` Available since ${date.toLocaleDateString()}.`;
      }
    } else {
      badgeText = '✅ **Baseline Supported**';
      reasonText = 'This feature is supported by all browsers in the Baseline set.';
    }
    
    markdown.appendMarkdown(`${badgeText}\n\n`);
    markdown.appendMarkdown(`${reasonText}\n\n`);

    // Add specification information if available
    if (featureData.spec) {
      markdown.appendMarkdown(`**Specification:** ${featureData.spec}\n\n`);
    }

    // Create clickable links section
    markdown.appendMarkdown(`### 📚 Learn More\n\n`);
    
    // MDN Documentation link
    const mdnUrl = this.baselineDataManager.getMdnUrl(featureData);
    if (mdnUrl) {
      markdown.appendMarkdown(`- [📖 MDN Documentation](${mdnUrl})\n`);
    }
    
    // CanIUse link - construct from feature ID
    const canIUseUrl = this.constructCanIUseUrl(featureId);
    if (canIUseUrl) {
      markdown.appendMarkdown(`- [🌐 Can I Use](${canIUseUrl})\n`);
    }
    
    // Web Features link
    const webFeaturesUrl = `https://web-platform-dx.github.io/web-features/${featureId}`;
    markdown.appendMarkdown(`- [🔍 Web Features](${webFeaturesUrl})\n`);

    // Add suggested alternatives if this is a known problematic feature
    const alternatives = this.getSuggestedAlternatives(featureId);
    if (alternatives.length > 0) {
      markdown.appendMarkdown(`\n### 💡 Suggested Alternatives\n\n`);
      for (const alternative of alternatives) {
        markdown.appendMarkdown(`- ${alternative}\n`);
      }
    }

    return markdown;
  }

  /**
   * Constructs CanIUse URL from feature ID
   * Maps web-features IDs to CanIUse feature names where possible
   * @param featureId Web-features ID
   * @returns CanIUse URL or undefined if mapping not available
   */
  private constructCanIUseUrl(featureId: string): string | undefined {
    // Basic mapping strategy - remove prefixes and convert to CanIUse format
    let canIUseFeature = featureId;
    
    // Remove common prefixes
    if (featureId.startsWith('css.properties.')) {
      canIUseFeature = featureId.replace('css.properties.', '');
    } else if (featureId.startsWith('api.')) {
      canIUseFeature = featureId.replace('api.', '').toLowerCase();
    } else if (featureId.startsWith('html.elements.')) {
      canIUseFeature = featureId.replace('html.elements.', '');
    }
    
    // Convert to kebab-case for CanIUse
    canIUseFeature = canIUseFeature.replace(/([A-Z])/g, '-$1').toLowerCase();
    
    return `https://caniuse.com/mdn-${canIUseFeature}`;
  }

  /**
   * Gets suggested alternatives for known problematic features
   * @param featureId Web-features ID
   * @returns Array of suggested alternatives
   */
  private getSuggestedAlternatives(featureId: string): string[] {
    const alternatives: { [key: string]: string[] } = {
      'css.properties.float': [
        'Use **Flexbox** (`display: flex`) for modern layout',
        'Use **CSS Grid** (`display: grid`) for complex layouts'
      ],
      'api.XMLHttpRequest': [
        'Use **fetch()** API for modern HTTP requests',
        'Provides better promise-based interface and more features'
      ],
      'javascript.builtins.Array.at': [
        'Use **bracket notation** with length check: `arr[arr.length - 1]`',
        'Use **slice()** method: `arr.slice(-1)[0]`'
      ],
      'html.elements.marquee': [
        'Use **CSS animations** with `@keyframes` for scrolling text',
        'Use **CSS transforms** with `translateX()` for movement effects'
      ]
    };

    return alternatives[featureId] || [];
  }
}