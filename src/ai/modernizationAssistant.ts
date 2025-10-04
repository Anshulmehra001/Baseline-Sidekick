import * as vscode from 'vscode';

/**
 * AI-Powered Modernization Assistant
 * Generates intelligent solutions for non-baseline code
 */
export class AIModernizationAssistant {
  private static instance: AIModernizationAssistant;
  private apiKey: string | undefined;
  
  public static getInstance(): AIModernizationAssistant {
    if (!AIModernizationAssistant.instance) {
      AIModernizationAssistant.instance = new AIModernizationAssistant();
    }
    return AIModernizationAssistant.instance;
  }

  constructor() {
    try {
      this.apiKey = this.getApiKey();
    } catch (error) {
      console.warn('Failed to load Gemini API key:', error);
      this.apiKey = '';
    }
  }

  private getApiKey(): string | undefined {
    try {
      const config = vscode.workspace.getConfiguration('baselineSidekick');
      return config.get<string>('ai.geminiApiKey') || process.env.GEMINI_API_KEY;
    } catch (error) {
      // Gracefully handle test environment where vscode mock might be incomplete
      return process.env.GEMINI_API_KEY || '';
    }
  }

  /**
   * Generate AI-powered solution for non-baseline feature
   */
  async generateSolution(
    codeSnippet: string,
    featureName: string,
    fileType: string,
    solutionType: 'polyfill' | 'config' | 'refactor' | 'alternative'
  ): Promise<AIModernizationSolution> {
    if (!this.apiKey) {
      throw new Error('AI API key not configured. Please set baselineSidekick.ai.geminiApiKey in settings.');
    }

    const prompt = this.buildPrompt(codeSnippet, featureName, fileType, solutionType);
    
    try {
      const response = await this.callGeminiAPI(prompt);
      return this.parseResponse(response, solutionType);
    } catch (error) {
      throw new Error(`AI generation failed: ${error}`);
    }
  }

  /**
   * Generate modernization strategies for entire file
   */
  async generateModernizationStrategy(
    fileContent: string,
    fileName: string,
    issues: BaselineIssue[]
  ): Promise<ModernizationStrategy> {
    const prompt = this.buildModernizationPrompt(fileContent, fileName, issues);
    
    try {
      const response = await this.callGeminiAPI(prompt);
      return this.parseModernizationStrategy(response);
    } catch (error) {
      throw new Error(`Strategy generation failed: ${error}`);
    }
  }

  private buildPrompt(
    codeSnippet: string,
    featureName: string,
    fileType: string,
    solutionType: string
  ): string {
    const basePrompt = `You are an expert web development assistant specializing in modern web standards and cross-browser compatibility.

CONTEXT:
- File Type: ${fileType}
- Non-Baseline Feature: ${featureName}
- Code Snippet:
\`\`\`${fileType}
${codeSnippet}
\`\`\`

`;

    switch (solutionType) {
      case 'polyfill':
        return basePrompt + `TASK: Generate a complete, production-ready polyfill for ${featureName}.
Requirements:
- Cross-browser compatible (IE11+, Chrome, Firefox, Safari)
- TypeScript-safe if applicable
- Include feature detection
- Provide installation instructions
- Include performance notes

Format: Provide the polyfill code in a markdown code block, followed by usage instructions.`;

      case 'config':
        return basePrompt + `TASK: Generate build tool configuration to transpile/process ${featureName}.
Requirements:
- Include exact npm install commands
- Provide complete configuration files
- Support popular build tools (Webpack, Vite, PostCSS, Babel)
- Include explanation of what the config does

Format: Provide configuration files and commands in markdown code blocks.`;

      case 'refactor':
        return basePrompt + `TASK: Refactor this code to use only Baseline-supported web features.
Requirements:
- Maintain exact same functionality
- Use only Baseline-supported APIs
- Optimize for performance
- Include comments explaining changes
- Preserve coding style

Format: Provide the refactored code in a markdown code block with change explanations.`;

      case 'alternative':
        return basePrompt + `TASK: Suggest Baseline-compatible alternatives for ${featureName}.
Requirements:
- List 3 different approaches
- Explain pros/cons of each
- Provide code examples
- Include performance implications
- Suggest progressive enhancement strategies

Format: Provide alternatives with code examples and explanations.`;

      default:
        throw new Error(`Unknown solution type: ${solutionType}`);
    }
  }

  private buildModernizationPrompt(
    fileContent: string,
    fileName: string,
    issues: BaselineIssue[]
  ): string {
    const issuesList = issues.map(issue => 
      `- ${issue.feature}: ${issue.message}`
    ).join('\n');

    return `You are an expert web development consultant specializing in code modernization.

FILE: ${fileName}
DETECTED ISSUES:
${issuesList}

FULL FILE CONTENT:
\`\`\`
${fileContent}
\`\`\`

TASK: Create a comprehensive modernization strategy for this file.
Provide:
1. **Priority Assessment**: Rank issues by impact (High/Medium/Low)
2. **Modernization Roadmap**: Step-by-step approach
3. **Complete Refactored Code**: Modern, Baseline-compatible version
4. **Migration Guide**: How to implement changes safely
5. **Performance Impact**: Before/after analysis
6. **Testing Strategy**: How to verify changes work correctly

Format your response in clear sections with code examples.`;
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey!
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json() as any;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private parseResponse(response: string, solutionType: string): AIModernizationSolution {
    // Extract code blocks and explanations
    const codeBlocks = this.extractCodeBlocks(response);
    const explanation = this.extractExplanation(response);

    return {
      type: solutionType as any,
      code: codeBlocks[0] || '',
      explanation,
      additionalFiles: codeBlocks.slice(1),
      instructions: this.extractInstructions(response)
    };
  }

  private parseModernizationStrategy(response: string): ModernizationStrategy {
    return {
      priorityAssessment: this.extractSection(response, 'Priority Assessment'),
      roadmap: this.extractSection(response, 'Modernization Roadmap'),
      refactoredCode: this.extractCodeBlocks(response)[0] || '',
      migrationGuide: this.extractSection(response, 'Migration Guide'),
      performanceImpact: this.extractSection(response, 'Performance Impact'),
      testingStrategy: this.extractSection(response, 'Testing Strategy'),
      fullResponse: response
    };
  }

  private extractCodeBlocks(text: string): string[] {
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/g;
    const matches = [];
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      matches.push(match[1].trim());
    }
    
    return matches;
  }

  private extractExplanation(text: string): string {
    // Remove code blocks and extract explanatory text
    const withoutCodeBlocks = text.replace(/```[\s\S]*?```/g, '');
    return withoutCodeBlocks.trim();
  }

  private extractInstructions(text: string): string[] {
    // Extract numbered lists or bullet points as instructions
    const instructions = text.match(/^\d+\.\s+.*$/gm) || text.match(/^[-*]\s+.*$/gm) || [];
    return instructions.map(instruction => instruction.replace(/^[\d\-*\.\s]+/, ''));
  }

  private extractSection(text: string, sectionName: string): string {
    const regex = new RegExp(`\\*\\*${sectionName}\\*\\*:?([\\s\\S]*?)(?=\\*\\*[^*]+\\*\\*|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }
}

// Type definitions
export interface BaselineIssue {
  feature: string;
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
}

export interface AIModernizationSolution {
  type: 'polyfill' | 'config' | 'refactor' | 'alternative';
  code: string;
  explanation: string;
  additionalFiles: string[];
  instructions: string[];
}

export interface ModernizationStrategy {
  priorityAssessment: string;
  roadmap: string;
  refactoredCode: string;
  migrationGuide: string;
  performanceImpact: string;
  testingStrategy: string;
  fullResponse: string;
}