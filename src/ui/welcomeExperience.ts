import * as vscode from 'vscode';

/**
 * Welcome experience and user onboarding for new users
 */
export class WelcomeExperience {
  private static instance: WelcomeExperience;
  private context: vscode.ExtensionContext;

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  public static getInstance(context?: vscode.ExtensionContext): WelcomeExperience {
    if (!WelcomeExperience.instance && context) {
      WelcomeExperience.instance = new WelcomeExperience(context);
    }
    return WelcomeExperience.instance;
  }

  /**
   * Show welcome message for first-time users
   */
  public async showWelcomeIfNeeded(): Promise<void> {
    const hasShownWelcome = this.context.globalState.get('hasShownWelcome', false);
    
    if (!hasShownWelcome) {
      await this.showWelcomeMessage();
      this.context.globalState.update('hasShownWelcome', true);
    }
  }

  private async showWelcomeMessage(): Promise<void> {
    const choice = await vscode.window.showInformationMessage(
      '🎉 Welcome to Baseline Sidekick! Get instant baseline compatibility checking as you code.',
      'Show Tutorial',
      'Quick Start',
      'Later'
    );

    switch (choice) {
      case 'Show Tutorial':
        await this.showTutorial();
        break;
      case 'Quick Start':
        await this.showQuickStart();
        break;
    }
  }

  private async showTutorial(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'baselineTutorial',
      '🎓 Baseline Sidekick Tutorial',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    panel.webview.html = this.getTutorialHTML();
  }

  private async showQuickStart(): Promise<void> {
    // Create a test file to demonstrate functionality
    const uri = vscode.Uri.parse('untitled:demo.css');
    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc);

    const demoCode = `.demo {
  float: left;        /* ❌ Non-baseline - will be underlined */
  display: grid;      /* ✅ Baseline - no issues */
  gap: 1rem;         /* ✅ Baseline compatible */
}`;

    await editor.edit(editBuilder => {
      editBuilder.insert(new vscode.Position(0, 0), demoCode);
    });

    vscode.window.showInformationMessage(
      '✨ Try it! Hover over the red underlined code to see compatibility info.',
      'Open Command Palette',
      'Got it!'
    ).then(choice => {
      if (choice === 'Open Command Palette') {
        vscode.commands.executeCommand('workbench.action.showCommands');
      }
    });
  }

  private getTutorialHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Baseline Sidekick Tutorial</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            line-height: 1.6;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
          }
          .step {
            margin: 20px 0;
            padding: 15px;
            border-left: 3px solid var(--vscode-charts-blue);
            background: var(--vscode-textBlockQuote-background);
            border-radius: 5px;
          }
          .code-sample {
            background: var(--vscode-textPreformat-background);
            padding: 10px;
            border-radius: 3px;
            font-family: monospace;
            margin: 10px 0;
          }
          h1 { color: var(--vscode-charts-blue); }
          h2 { color: var(--vscode-charts-green); }
          .highlight { color: var(--vscode-charts-orange); font-weight: bold; }
          .success { color: var(--vscode-charts-green); }
          .warning { color: var(--vscode-charts-red); }
        </style>
      </head>
      <body>
        <h1>🎓 Welcome to Baseline Sidekick!</h1>
        <p>Let's get you started with baseline compatibility checking in 3 easy steps:</p>
        
        <div class="step">
          <h2>📝 Step 1: Create a Test File</h2>
          <p>Create any CSS, JavaScript, or HTML file and start typing:</p>
          <div class="code-sample">
.container {
  float: left;     <span class="warning">← Non-baseline (red underline)</span>
  display: grid;   <span class="success">← Baseline compatible ✓</span>
}
          </div>
        </div>

        <div class="step">
          <h2>🖱️ Step 2: Hover for Details</h2>
          <p>Hover your mouse over any <span class="highlight">red underlined code</span> to see:</p>
          <ul>
            <li>✨ Browser compatibility information</li>
            <li>🔧 Suggested alternatives</li>
            <li>📚 Links to documentation</li>
          </ul>
        </div>

        <div class="step">
          <h2>⚡ Step 3: Use Quick Fixes</h2>
          <p>Right-click on issues or press <kbd>Ctrl+.</kbd> for:</p>
          <ul>
            <li>💡 <span class="highlight">Smart suggestions</span></li>
            <li>🤖 <span class="highlight">AI-powered solutions</span> (with API key)</li>
            <li>🔄 <span class="highlight">One-click fixes</span></li>
          </ul>
        </div>

        <div class="step">
          <h2>🎮 Bonus: Track Your Progress</h2>
          <p>Watch your <span class="highlight">compatibility score</span> in the status bar and unlock achievements as you write better code!</p>
        </div>

        <div style="margin-top: 30px; text-align: center; padding: 20px; background: var(--vscode-button-background); border-radius: 5px;">
          <h2>🚀 Ready to Start?</h2>
          <p>Press <kbd>Ctrl+Shift+P</kbd> and type "Baseline" to see all available commands!</p>
        </div>
      </body>
      </html>
    `;
  }
}