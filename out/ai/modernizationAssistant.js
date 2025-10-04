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
exports.AIModernizationAssistant = void 0;
const vscode = __importStar(require("vscode"));
/**
 * AI-Powered Modernization Assistant
 * Generates intelligent solutions for non-baseline code
 */
class AIModernizationAssistant {
    static getInstance() {
        if (!AIModernizationAssistant.instance) {
            AIModernizationAssistant.instance = new AIModernizationAssistant();
        }
        return AIModernizationAssistant.instance;
    }
    constructor() {
        try {
            this.apiKey = this.getApiKey();
        }
        catch (error) {
            console.warn('Failed to load Gemini API key:', error);
            this.apiKey = '';
        }
    }
    getApiKey() {
        try {
            const config = vscode.workspace.getConfiguration('baselineSidekick');
            return config.get('ai.geminiApiKey') || process.env.GEMINI_API_KEY;
        }
        catch (error) {
            // Gracefully handle test environment where vscode mock might be incomplete
            return process.env.GEMINI_API_KEY || '';
        }
    }
    /**
     * Generate AI-powered solution for non-baseline feature
     */
    async generateSolution(codeSnippet, featureName, fileType, solutionType) {
        if (!this.apiKey) {
            throw new Error('AI API key not configured. Please set baselineSidekick.ai.geminiApiKey in settings.');
        }
        const prompt = this.buildPrompt(codeSnippet, featureName, fileType, solutionType);
        try {
            const response = await this.callGeminiAPI(prompt);
            return this.parseResponse(response, solutionType);
        }
        catch (error) {
            throw new Error(`AI generation failed: ${error}`);
        }
    }
    /**
     * Generate modernization strategies for entire file
     */
    async generateModernizationStrategy(fileContent, fileName, issues) {
        const prompt = this.buildModernizationPrompt(fileContent, fileName, issues);
        try {
            const response = await this.callGeminiAPI(prompt);
            return this.parseModernizationStrategy(response);
        }
        catch (error) {
            throw new Error(`Strategy generation failed: ${error}`);
        }
    }
    buildPrompt(codeSnippet, featureName, fileType, solutionType) {
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
    buildModernizationPrompt(fileContent, fileName, issues) {
        const issuesList = issues.map(issue => `- ${issue.feature}: ${issue.message}`).join('\n');
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
    async callGeminiAPI(prompt) {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': this.apiKey
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
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    parseResponse(response, solutionType) {
        // Extract code blocks and explanations
        const codeBlocks = this.extractCodeBlocks(response);
        const explanation = this.extractExplanation(response);
        return {
            type: solutionType,
            code: codeBlocks[0] || '',
            explanation,
            additionalFiles: codeBlocks.slice(1),
            instructions: this.extractInstructions(response)
        };
    }
    parseModernizationStrategy(response) {
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
    extractCodeBlocks(text) {
        const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/g;
        const matches = [];
        let match;
        while ((match = codeBlockRegex.exec(text)) !== null) {
            matches.push(match[1].trim());
        }
        return matches;
    }
    extractExplanation(text) {
        // Remove code blocks and extract explanatory text
        const withoutCodeBlocks = text.replace(/```[\s\S]*?```/g, '');
        return withoutCodeBlocks.trim();
    }
    extractInstructions(text) {
        // Extract numbered lists or bullet points as instructions
        const instructions = text.match(/^\d+\.\s+.*$/gm) || text.match(/^[-*]\s+.*$/gm) || [];
        return instructions.map(instruction => instruction.replace(/^[\d\-*\.\s]+/, ''));
    }
    extractSection(text, sectionName) {
        const regex = new RegExp(`\\*\\*${sectionName}\\*\\*:?([\\s\\S]*?)(?=\\*\\*[^*]+\\*\\*|$)`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : '';
    }
}
exports.AIModernizationAssistant = AIModernizationAssistant;
//# sourceMappingURL=modernizationAssistant.js.map