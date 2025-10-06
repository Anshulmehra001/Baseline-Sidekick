# 🎯 Baseline Sidekick - Complete Usage Guide

**AI-Powered Baseline Compatibility Assistant for VS Code**

*Baseline Tooling Hackathon 2025 - Team: Anshul Mehra & Apoorv Bhargava*

---

## 🚀 Quick Start (2 Minutes)

### Step 1: Installation & Launch
```bash
# Clone the repository
git clone https://github.com/Anshulmehra001/Baseline-Sidekick.git
cd Baseline-Sidekick

# Install dependencies
npm install
npm run compile

# Launch extension
# Press F5 in VS Code → Extension Development Host opens
```

### Step 2: Create Test File
1. **In Extension Host**, create new file: `test.css`
2. **Type this code:**
```css
.container {
    display: flex;        /* ✅ Baseline compatible */
    float: left;         /* ❌ Non-baseline - red squiggly appears */
}
```
3. **Observe:** Red underline appears under `float: left`
4. **Hover:** Rich tooltip shows compatibility details
5. **Check Status Bar:** Shows baseline score percentage

**🎉 You're ready! The extension is working.**

---

## 🔍 Core Features

### 1. Real-Time Baseline Analysis

**Instant Detection:**
- Red squiggly lines appear on non-baseline features as you type
- Supports CSS, JavaScript, TypeScript, HTML, SCSS, Sass, Less
- Zero configuration required

**Example - CSS:**
```css
.modern-layout {
    display: grid;              /* ✅ Baseline - no warning */
    gap: 1rem;                 /* ✅ Baseline - no warning */
    container-type: size;      /* ❌ Non-baseline - red squiggly */
    -webkit-appearance: none;  /* ❌ Non-baseline - red squiggly */
}
```

**Example - JavaScript:**
```javascript
const items = ['a', 'b', 'c'];
const first = items[0];        // ✅ Baseline - no warning
const last = items.at(-1);     // ❌ Non-baseline - red squiggly
```

### 2. Rich Hover Tooltips

**Hover over any red-underlined feature to see:**
- Detailed compatibility explanation
- Browser support information  
- Baseline status and timeline
- Alternative suggestions
- Links to MDN documentation

### 3. Problems Panel Integration

**View detailed reports:**
1. **View → Problems** (Ctrl+Shift+M)
2. **Filter by:** "Baseline Sidekick"
3. **See all issues** across your workspace
4. **Click any issue** to jump to code location

---

## 🤖 AI-Powered Features

### 1. Intelligent Polyfill Generation

**For JavaScript features like `Array.at()`:**

1. **Type non-baseline JavaScript:**
```javascript
const last = myArray.at(-1);  // Red squiggly appears
```

2. **Trigger AI Assistant:**
   - Click on the red-underlined code
   - Press `Ctrl+.` (or `Cmd+.` on Mac)
   - Or right-click → Quick Fix

3. **Select AI Option:**
   - Choose: "✨ Baseline AI: Generate intelligent polyfill"

4. **Generated Result:**
```javascript
// AI-generated polyfill
if (!Array.prototype.at) {
    Array.prototype.at = function(index) {
        if (index < 0) index = this.length + index;
        return this[index];
    };
}

const last = myArray.at(-1);  // Now baseline-compatible!
```

### 2. CSS Modernization

**Convert legacy layouts to modern baseline CSS:**

1. **Select legacy CSS block:**
```css
.legacy-layout {
    float: left;
    width: 25%;
    clear: both;
}
```

2. **Trigger modernization:**
   - Select the entire CSS block
   - Press `Ctrl+.`
   - Choose: "✨ Baseline AI: Modernize CSS to Flexbox/Grid"

3. **AI transforms to:**
```css
.modern-layout {
    display: flex;
    flex: 0 0 25%;
}
```

### 3. Build Configuration Generation

**Create optimized build setups:**

1. **Command Palette:** `Ctrl+Shift+P`
2. **Type:** "Baseline AI: Generate Build Configuration"
3. **AI creates:**
   - `webpack.config.js` with baseline-compatible settings
   - `.browserslistrc` with baseline browser targets
   - `babel.config.js` with appropriate polyfills

---

## 📊 Gamification System

### Real-Time Scoring

**Status Bar Display:**
- **A+ (95-100%):** 🏆 Baseline: 98% (A+)
- **A (90-94%):** ⭐ Baseline: 92% (A)  
- **B (80-89%):** 🎯 Baseline: 85% (B)
- **C (70-79%):** ⚠️ Baseline: 75% (C)
- **D-F (<70%):** ❌ Baseline: 60% (D)

**How Scoring Works:**
```
Score = (Baseline Features / Total Features) × 100
```

**Example Calculation:**
- 8 baseline features (flex, grid, etc.)
- 2 non-baseline features (float, -webkit-*)
- Score: (8/10) × 100 = 80% (B)

### Achievement System

**Click status bar for detailed breakdown:**
- Total features analyzed
- Baseline vs non-baseline count
- Critical issues that need attention
- Improvement suggestions
- Historical progress tracking

---

## ⚙️ Configuration

### Extension Settings

**Access via:** File → Preferences → Settings → Search "Baseline Sidekick"

**Key Settings:**
```json
{
    "baselineSidekick.performance.debounceDelay": 300,
    "baselineSidekick.performance.maxFileSize": 5242880,
    "baselineSidekick.ai.geminiApiKey": "your-api-key-here"
}
```

**Performance Tuning:**
- `debounceDelay`: Analysis delay in milliseconds (default: 300ms)
- `maxFileSize`: Maximum file size to analyze (default: 5MB)
- `maxCacheSize`: Memory cache limit (default: 10,000 items)

**AI Configuration:**
- Set your Google Gemini API key for enhanced AI features
- AI works offline with fallback suggestions if no key provided

### Workspace Configuration

**Create `.baseline-config.json` in project root:**
```json
{
    "baseline": {
        "strict": true,
        "target": "2024",
        "exclude": ["*.min.css", "vendor/**"],
        "customRules": {
            "css.float": "error",
            "js.array.at": "warning"
        }
    }
}
```

---

## 💡 Advanced Usage

### Command Palette Commands

**Access all features via `Ctrl+Shift+P`:**

1. **Baseline Sidekick: Show Main Menu** - Quick access hub
2. **Baseline Sidekick: Compatibility Report** - Detailed analysis
3. **Baseline: Audit Workspace** - Full project scan
4. **Baseline AI: Generate Polyfill** - AI polyfill creation
5. **Baseline AI: Modernize File** - AI-powered refactoring
6. **Baseline AI: Show Alternatives** - Baseline alternatives

### Keyboard Shortcuts

**Default Shortcuts:**
- `Ctrl+Shift+B`: Show Main Menu
- `Ctrl+Alt+B`: Audit Current File
- `Ctrl+.`: Quick Fix (context-aware)
- `F1 → Baseline`: All commands

### Integration with Other Tools

**ESLint Integration:**
```javascript
// Works alongside ESLint
module.exports = {
    extends: ['baseline-sidekick/recommended'],
    rules: {
        'baseline/no-non-baseline-features': 'error'
    }
};
```

**Webpack Integration:**
```javascript
// Future: Webpack plugin
const BaselinePlugin = require('baseline-sidekick/webpack');
module.exports = {
    plugins: [new BaselinePlugin({ strict: true })]
};
```

---

## 🔧 Troubleshooting

### Common Issues

**❌ Extension not working:**
1. Check VS Code version (1.74.0+ required)
2. Reload window: `Ctrl+Shift+P` → "Developer: Reload Window"
3. Check Extension Host console for errors

**❌ No red squiggly lines:**
1. Ensure file type is supported (CSS/JS/HTML)
2. Save the file (`Ctrl+S`) to trigger analysis
3. Check if file size exceeds limits (5MB default)

**❌ AI features not working:**
1. Verify Gemini API key in settings
2. Check internet connection for AI features
3. Fallback suggestions work offline

**❌ Status bar not updating:**
1. Click elsewhere and back to trigger update
2. Check if extension is active in status bar
3. Restart extension: `F1` → "Developer: Reload Window"

### Performance Issues

**For large files:**
```json
{
    "baselineSidekick.performance.debounceDelay": 500,
    "baselineSidekick.performance.enableAsyncProcessing": true,
    "baselineSidekick.performance.largeFileThreshold": 10000
}
```

**Memory optimization:**
- Clear cache: `F1` → "Baseline: Clear Cache"
- Reduce max cache size in settings
- Exclude large files from analysis

### Debug Mode

**Enable debug logging:**
```json
{
    "baselineSidekick.debug": true,
    "baselineSidekick.logLevel": "debug"
}
```

**View logs:** Output panel → "Baseline Sidekick"

---

## 📚 Examples & Tutorials

### Tutorial 1: CSS Analysis Workflow

1. **Create new file:** `styles.css`
2. **Start with baseline code:**
```css
.container {
    display: flex;
    justify-content: center;
    align-items: center;
}
```
3. **Add problematic code:**
```css
.sidebar {
    float: left;              /* Red squiggly appears */
    -webkit-transform: scale(1.1);  /* Red squiggly appears */
}
```
4. **Hover for details:** See compatibility explanations
5. **Use AI fix:** `Ctrl+.` → Choose modernization option
6. **Watch score change:** Status bar updates dynamically

### Tutorial 2: JavaScript Polyfill Generation

1. **Create:** `app.js`
2. **Type modern JS:**
```javascript
const users = [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 }
];

// Modern features that need polyfills
const lastUser = users.at(-1);        // Array.at()
const userName = users.at(0)?.name;   // Optional chaining
const displayName = userName ?? 'Anonymous';  // Nullish coalescing
```
3. **See red squiggles** on non-baseline features
4. **Generate polyfills:** Use AI assistant for each feature
5. **Get production-ready code** with baseline compatibility

---

## 🎯 Best Practices

### Development Workflow

1. **Baseline-First Development:**
   - Check status bar score regularly
   - Aim for 90%+ baseline compatibility
   - Use AI suggestions for modernization

2. **Team Collaboration:**
   - Share `.baseline-config.json` in repository
   - Set project-wide baseline targets
   - Use compatibility reports in code reviews

3. **CI/CD Integration:**
   - Add baseline checking to build pipeline
   - Fail builds on critical compatibility issues
   - Track baseline adoption metrics

### Performance Tips

1. **Large Projects:**
   - Exclude `node_modules` from analysis
   - Use file size limits appropriately
   - Enable async processing for big files

2. **Memory Management:**
   - Clear cache periodically
   - Monitor extension memory usage
   - Adjust cache size based on project needs

---

## 🤝 Team & Support

**Developers:**
- **Anshul Mehra** - [@Anshulmehra001](https://github.com/Anshulmehra001)
- **Apoorv Bhargava** - UI/UX & Documentation

**Support:**
- **Issues:** [GitHub Issues](https://github.com/Anshulmehra001/Baseline-Sidekick/issues)
- **Documentation:** [Project Wiki](https://github.com/Anshulmehra001/Baseline-Sidekick/wiki)
- **Hackathon:** Baseline Tooling Hackathon 2025

---

**🚀 Ready to accelerate baseline web development? Start coding with confidence!**

*Built with ❤️ for the Baseline Tooling Hackathon 2025*