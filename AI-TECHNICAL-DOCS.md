# 🤖 **AI Integration Technical Documentation**

## **🧠 Architecture Overview**

Baseline Sidekick implements a **dual-AI architecture** that combines:
1. **Google Gemini AI** - Advanced natural language processing
2. **Built-in AI Engine** - Proprietary pattern recognition and analysis

---

## **🔌 Google Gemini Integration**

### **API Configuration**

#### **Authentication Setup**
```typescript
// src/ai/modernizationAssistant.ts
export class AIModernizationAssistant {
  private apiKey: string | undefined;
  private readonly apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  
  constructor() {
    this.apiKey = this.getApiKey();
  }
  
  private getApiKey(): string | undefined {
    const config = vscode.workspace.getConfiguration('baselineSidekick');
    return config.get<string>('ai.geminiApiKey') || process.env.GEMINI_API_KEY;
  }
}
```

#### **API Request Structure**
```typescript
interface GeminiRequest {
  contents: [{
    parts: [{
      text: string;
    }]
  }];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

// Example API call
async function callGeminiAPI(prompt: string): Promise<string> {
  const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    })
  });
  
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
```

### **Prompt Engineering**

#### **Polyfill Generation Prompt**
```typescript
private buildPolyfillPrompt(codeSnippet: string, featureName: string): string {
  return `You are an expert JavaScript developer specializing in cross-browser compatibility.

CONTEXT:
- Feature: ${featureName}
- Code: ${codeSnippet}
- Target: Production-ready polyfill for modern browsers

TASK: Generate a comprehensive polyfill with the following requirements:
1. Cross-browser compatibility (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
2. Feature detection to avoid conflicts
3. TypeScript-safe implementation
4. Performance optimized
5. Include usage instructions

FORMAT: Provide code in markdown blocks with explanations.

POLYFILL:`;
}
```

#### **Code Refactoring Prompt**
```typescript
private buildRefactorPrompt(code: string, issues: BaselineIssue[]): string {
  const issueList = issues.map(issue => `- ${issue.feature}: ${issue.description}`).join('\n');
  
  return `You are a senior web developer expert in modern web standards and baseline compatibility.

CURRENT CODE:
\`\`\`${this.getLanguage(code)}
${code}
\`\`\`

ISSUES TO RESOLVE:
${issueList}

TASK: Refactor this code to use only Baseline-supported web features while:
1. Maintaining exact same functionality
2. Improving performance where possible
3. Following modern best practices
4. Adding explanatory comments for major changes

REFACTORED CODE:`;
}
```

### **Response Processing**

#### **AI Solution Parser**
```typescript
interface AIModernizationSolution {
  type: 'polyfill' | 'refactor' | 'config' | 'alternative';
  code: string;
  explanation: string;
  installation?: string[];
  browserSupport?: string;
  performance?: string;
  confidence: number;
}

private parseResponse(response: string, solutionType: string): AIModernizationSolution {
  // Extract code blocks from markdown
  const codeBlocks = this.extractCodeBlocks(response);
  const explanation = this.extractExplanation(response);
  
  return {
    type: solutionType as any,
    code: codeBlocks[0] || '',
    explanation,
    installation: this.extractInstallationSteps(response),
    browserSupport: this.extractBrowserSupport(response),
    performance: this.extractPerformanceNotes(response),
    confidence: this.calculateConfidence(response)
  };
}
```

---

## **🧠 Built-in AI Engine**

### **Pattern Recognition System**

#### **CSS Pattern Detection**
```typescript
class CSSPatternRecognizer {
  private patterns = new Map<RegExp, BaselineCompatibility>();
  
  constructor() {
    this.initializePatterns();
  }
  
  private initializePatterns(): void {
    // Non-baseline CSS properties
    this.patterns.set(
      /float\s*:\s*(?:left|right|none)/g,
      { 
        baseline: false, 
        alternatives: ['display: flex', 'display: grid'],
        severity: 'warning'
      }
    );
    
    // Vendor prefixes
    this.patterns.set(
      /-webkit-|-moz-|-ms-|-o-/g,
      {
        baseline: false,
        alternatives: ['Use standard property'],
        severity: 'info'
      }
    );
  }
  
  public analyzeCSS(cssContent: string): PatternMatch[] {
    const matches: PatternMatch[] = [];
    
    for (const [pattern, compatibility] of this.patterns) {
      let match;
      while ((match = pattern.exec(cssContent)) !== null) {
        matches.push({
          range: this.getRange(cssContent, match.index, match[0].length),
          feature: match[0],
          compatibility,
          suggestions: this.generateSuggestions(match[0], compatibility)
        });
      }
    }
    
    return matches;
  }
}
```

#### **JavaScript API Detection**
```typescript
class JavaScriptAPIAnalyzer {
  private baselineAPIs: Set<string>;
  private nonBaselineAPIs: Map<string, APICompatibility>;
  
  constructor() {
    this.loadBaselineData();
  }
  
  private loadBaselineData(): void {
    // Load from web-features package
    this.baselineAPIs = new Set([
      'Array.prototype.map',
      'Object.keys',
      'Promise',
      'fetch' // Recently became baseline
    ]);
    
    this.nonBaselineAPIs = new Map([
      ['Array.prototype.at', {
        baseline: false,
        browserSupport: 'Chrome 92+, Firefox 90+',
        polyfillAvailable: true
      }],
      ['structuredClone', {
        baseline: false,
        browserSupport: 'Chrome 98+, Firefox 94+',
        polyfillAvailable: true
      }]
    ]);
  }
  
  public analyzeJavaScript(code: string): APIUsage[] {
    const ast = this.parseToAST(code);
    const apiUsages: APIUsage[] = [];
    
    this.traverseAST(ast, (node) => {
      if (this.isAPICall(node)) {
        const apiName = this.extractAPIName(node);
        const compatibility = this.checkCompatibility(apiName);
        
        if (!compatibility.baseline) {
          apiUsages.push({
            apiName,
            location: this.getLocation(node),
            compatibility,
            severity: this.calculateSeverity(compatibility)
          });
        }
      }
    });
    
    return apiUsages;
  }
}
```

### **Intelligent Suggestion Ranking**

#### **Multi-Factor Scoring Algorithm**
```typescript
interface SuggestionScore {
  baselineCompatibility: number;  // 0-1 score
  performanceImpact: number;      // 0-1 score (higher = better performance)
  implementationComplexity: number; // 0-1 score (higher = simpler)
  communityAdoption: number;      // 0-1 score
  maintainability: number;        // 0-1 score
}

class IntelligentSuggestionRanker {
  public rankSuggestions(suggestions: Suggestion[]): RankedSuggestion[] {
    return suggestions
      .map(suggestion => ({
        ...suggestion,
        score: this.calculateCompositeScore(suggestion)
      }))
      .sort((a, b) => b.score - a.score);
  }
  
  private calculateCompositeScore(suggestion: Suggestion): number {
    const weights = {
      baselineCompatibility: 0.35,
      performanceImpact: 0.25,
      implementationComplexity: 0.20,
      communityAdoption: 0.15,
      maintainability: 0.05
    };
    
    const scores = this.analyzeFeatures(suggestion);
    
    return Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (scores[key as keyof SuggestionScore] * weight);
    }, 0);
  }
}
```

---

## **⚡ Performance Optimization**

### **Intelligent Caching System**

#### **Multi-Level Cache Architecture**
```typescript
interface CacheLevel {
  memory: Map<string, CachedResult>;
  persistent: LocalStorage;
  distributed: SharedCache;
}

class AIResponseCache {
  private cache: CacheLevel;
  private readonly TTL = 3600000; // 1 hour
  
  async get(prompt: string): Promise<AIResponse | null> {
    // Level 1: Memory cache (fastest)
    const memoryResult = this.cache.memory.get(this.hashPrompt(prompt));
    if (memoryResult && !this.isExpired(memoryResult)) {
      return memoryResult.data;
    }
    
    // Level 2: Persistent cache (medium speed)
    const persistentResult = await this.cache.persistent.get(prompt);
    if (persistentResult && !this.isExpired(persistentResult)) {
      this.cache.memory.set(this.hashPrompt(prompt), persistentResult);
      return persistentResult.data;
    }
    
    // Level 3: Distributed cache (slowest, but shared across instances)
    const distributedResult = await this.cache.distributed.get(prompt);
    if (distributedResult && !this.isExpired(distributedResult)) {
      this.cache.memory.set(this.hashPrompt(prompt), distributedResult);
      await this.cache.persistent.set(prompt, distributedResult);
      return distributedResult.data;
    }
    
    return null;
  }
  
  async set(prompt: string, response: AIResponse): Promise<void> {
    const cachedResult: CachedResult = {
      data: response,
      timestamp: Date.now(),
      hash: this.hashPrompt(prompt)
    };
    
    // Store in all cache levels
    this.cache.memory.set(this.hashPrompt(prompt), cachedResult);
    await this.cache.persistent.set(prompt, cachedResult);
    await this.cache.distributed.set(prompt, cachedResult);
  }
}
```

#### **Debounced Analysis Engine**
```typescript
class DebouncedAnalysisEngine {
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private readonly DEBOUNCE_DELAY = 1000; // 1 second
  
  public scheduleAnalysis(
    documentUri: string, 
    content: string, 
    language: string
  ): void {
    // Cancel previous timer for this document
    const existingTimer = this.debounceTimers.get(documentUri);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Schedule new analysis
    const timer = setTimeout(async () => {
      try {
        await this.performAnalysis(documentUri, content, language);
      } catch (error) {
        console.error('Analysis failed:', error);
      } finally {
        this.debounceTimers.delete(documentUri);
      }
    }, this.DEBOUNCE_DELAY);
    
    this.debounceTimers.set(documentUri, timer);
  }
  
  private async performAnalysis(
    documentUri: string, 
    content: string, 
    language: string
  ): Promise<void> {
    // Batch multiple changes together
    const analysis = await Promise.all([
      this.analyzePatterns(content, language),
      this.checkBaseline(content, language),
      this.generateSuggestions(content, language)
    ]);
    
    // Update VS Code diagnostics
    this.updateDiagnostics(documentUri, analysis);
  }
}
```

### **Memory Management**

#### **Automatic Cleanup System**
```typescript
class MemoryManager {
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly CLEANUP_INTERVAL = 300000; // 5 minutes
  
  constructor() {
    setInterval(() => this.performCleanup(), this.CLEANUP_INTERVAL);
  }
  
  private performCleanup(): void {
    // Clean expired cache entries
    this.cleanExpiredEntries();
    
    // If still over limit, perform LRU cleanup
    if (this.getCurrentMemoryUsage() > this.MAX_CACHE_SIZE) {
      this.performLRUCleanup();
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
  
  private cleanExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }
}
```

---

## **🔍 Error Handling & Resilience**

### **Graceful Degradation**
```typescript
class ResilientAIService {
  private fallbackStrategies = new Map<string, FallbackFunction>();
  
  async generateSolution(
    codeSnippet: string, 
    featureName: string
  ): Promise<AIModernizationSolution> {
    try {
      // Primary: Try Gemini AI
      return await this.callGeminiAPI(codeSnippet, featureName);
    } catch (geminiError) {
      console.warn('Gemini AI failed, trying fallback:', geminiError);
      
      try {
        // Fallback 1: Use built-in AI patterns
        return await this.useBuiltInPatterns(codeSnippet, featureName);
      } catch (patternError) {
        console.warn('Pattern matching failed, using static suggestions:', patternError);
        
        // Fallback 2: Static predefined solutions
        return this.getStaticSolution(featureName);
      }
    }
  }
  
  private useBuiltInPatterns(code: string, feature: string): AIModernizationSolution {
    const patterns = this.getKnownPatterns(feature);
    const bestMatch = this.findBestPattern(code, patterns);
    
    return {
      type: 'alternative',
      code: bestMatch.solution,
      explanation: bestMatch.explanation,
      confidence: 0.7 // Lower confidence for fallback
    };
  }
}
```

### **Rate Limiting & Retry Logic**
```typescript
class RateLimitedAPIClient {
  private requestQueue: RequestQueue = [];
  private readonly MAX_REQUESTS_PER_MINUTE = 60;
  private readonly RETRY_ATTEMPTS = 3;
  private readonly EXPONENTIAL_BACKOFF_BASE = 1000; // 1 second
  
  async makeRequest(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ prompt, resolve, reject, attempts: 0 });
      this.processQueue();
    });
  }
  
  private async processQueue(): Promise<void> {
    if (this.requestQueue.length === 0) return;
    
    const request = this.requestQueue.shift()!;
    
    try {
      const response = await this.executeRequest(request.prompt);
      request.resolve(response);
    } catch (error) {
      if (request.attempts < this.RETRY_ATTEMPTS) {
        request.attempts++;
        const delay = this.EXPONENTIAL_BACKOFF_BASE * Math.pow(2, request.attempts - 1);
        
        setTimeout(() => {
          this.requestQueue.unshift(request); // Add back to front of queue
          this.processQueue();
        }, delay);
      } else {
        request.reject(error);
      }
    }
    
    // Continue processing queue
    setTimeout(() => this.processQueue(), this.getDelayForRateLimit());
  }
}
```

---

## **📊 Analytics & Monitoring**

### **Usage Tracking**
```typescript
interface UsageMetrics {
  analysisCount: number;
  aiSuggestionsGenerated: number;
  featuresFixed: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
}

class AnalyticsCollector {
  private metrics: UsageMetrics = {
    analysisCount: 0,
    aiSuggestionsGenerated: 0,
    featuresFixed: 0,
    averageResponseTime: 0,
    errorRate: 0,
    cacheHitRate: 0
  };
  
  public trackAnalysis(duration: number): void {
    this.metrics.analysisCount++;
    this.updateAverageResponseTime(duration);
  }
  
  public trackAISuggestion(success: boolean): void {
    if (success) {
      this.metrics.aiSuggestionsGenerated++;
    } else {
      this.updateErrorRate();
    }
  }
  
  public generateReport(): AnalyticsReport {
    return {
      ...this.metrics,
      efficiency: this.calculateEfficiency(),
      recommendations: this.generateRecommendations()
    };
  }
}
```

This documentation provides developers with everything needed to understand, configure, and extend the AI capabilities of Baseline Sidekick. The dual-AI architecture ensures both intelligence and reliability while maintaining excellent performance.