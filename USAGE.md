# 📖 Baseline Sidekick - Complete Usage Guide# Quick Start Guide



## 🚀 **Quick Start (2 Minutes)**## 🚀 Testing Your Extension



### **Step 1: Launch Extension**### Launch Extension

```bash1. **Press F5** in VS Code

# In your Baseline-Sidekick folder2. Select **"VS Code Extension Development"** if prompted

npm install && npm run compile3. New window opens: **"[Extension Development Host]"**

# Press F5 in VS Code - Extension Development Host opens

```### Create Test File

In the Extension Host window:

### **Step 2: Test Real-Time Analysis**1. **File → New File**

1. Open `demo/demo.css` in the Extension Host window2. **Save as**: `test.css`

2. Watch **red underlines** appear on non-baseline features3. **Paste this code**:

3. **Hover** over `float: left` to see compatibility tooltip```css

4. Check **status bar** (bottom-right) for live compatibility score.container {

  float: left;      /* Should be underlined in red */

### **Step 3: Try the Main Menu**  display: grid;    /* Should be clean */

- Press **`Ctrl+Shift+B`** (Windows) or **`Cmd+Shift+B`** (Mac)}

- Explore the GitHub Copilot-style interface:```

  - 🔍 Check Current File

  - 🤖 AI Assistant  ### Verify It Works

  - 📊 Compatibility Report- ✅ `float: left` has red underline

  - 🛠️ Fix All Issues- ✅ `display: grid` is clean  

- ✅ Hover over red text shows compatibility tooltip

---

### Test Commands

## 🎯 **Core Features**1. **Ctrl+Shift+P**

2. Type **"Baseline"**  

### **🔍 Real-Time Baseline Analysis**3. Try **"Baseline: Audit Workspace"**

- **Instant Detection**: Red underlines on non-baseline features as you type

- **Multi-Language**: CSS, JavaScript, TypeScript, HTML support## 🤖 AI Features (Optional)

- **Performance Optimized**: Sub-second analysis with intelligent caching

- **Visual Feedback**: Problems panel integration with detailed issues### Setup

1. Get API key: https://aistudio.google.com/app/apikey

### **💡 Intelligent Hover Tooltips**2. **Ctrl+,** → Search "Baseline Sidekick" 

Hover over any compatibility issue to see:3. Enter key in settings

- **Baseline Status**: ✅ Baseline or ❌ Non-baseline

- **Browser Support**: Detailed compatibility information  ### Test AI

- **Alternatives**: Suggested baseline-compatible replacements- Right-click on red underlined code

- **Documentation Links**: Learn more about features- Look for AI options in context menu

- Try **"Baseline AI: Generate Polyfill"**

### **⚡ Quick Fixes & Code Actions**

- **Right-click** on issues or press **`Ctrl+.`**## ✅ Success Checklist

- **Smart Suggestions**: Context-aware baseline alternatives

- **One-Click Fixes**: Instant replacements where possible- [ ] Extension Host window opens

- **Batch Operations**: Fix multiple issues at once- [ ] Red underlines appear on non-baseline features

- [ ] Hover tooltips show compatibility info

---- [ ] Commands work from Command Palette

- [ ] No errors in Developer Console

## 🤖 **AI-Powered Features**

**Extension working? You're ready to demo!** 🎯
### **🎯 Setup AI Assistant**
1. **Get API Key**: Visit https://aistudio.google.com/app/apikey
2. **Add to Settings**: 
   - Go to **File → Preferences → Settings**
   - Search "baseline sidekick"
   - Enter key in **"Gemini Api Key"** field
3. **Start Using**: AI features now available in main menu

### **💡 Polyfill Generation**
```css
/* Example: Non-baseline CSS */
.container {
  backdrop-filter: blur(10px);  /* AI generates polyfill */
}
```
- **AI creates**: Custom JavaScript polyfill
- **Includes**: Fallback strategies and documentation
- **Optimized**: Minimal, performance-focused code

### **🔄 Code Modernization**
```javascript
// Before: Legacy code
function oldFunction() {
  var elements = document.getElementsByClassName('item');
  for (var i = 0; i < elements.length; i++) {
    elements[i].style.display = 'block';
  }
}

// After: AI suggests baseline modern equivalent
function modernFunction() {
  const elements = document.querySelectorAll('.item');
  elements.forEach(el => el.style.display = 'block');
}
```

---

## 🎮 **User Interface Guide**

### **🚀 Main Menu (`Ctrl+Shift+B`)**
```
🚀 Baseline Sidekick - Main Menu
├── 🔍 Check Current File      # Instant analysis
├── 🤖 AI Assistant           # Smart suggestions
├── 📊 Compatibility Report   # Detailed insights
├── 🛠️ Fix All Issues        # Bulk operations
├── 🎓 Tutorial              # Learn features
└── ⚙️ Settings              # Customize experience
```

### **📊 Enhanced Status Bar**
Located in bottom-right corner:
- **🟢 "✓ 95% Baseline"** - Excellent compatibility
- **🟡 "⚠ 75% Baseline"** - Needs attention  
- **🔴 "✗ 45% Baseline"** - Requires fixes
- **Click** for detailed compatibility report

---

## 🎯 **Demo Files Walkthrough**

### **📁 `demo/demo.css`**
```css
/* ✅ Baseline Compatible */
.modern-layout {
  display: grid;           /* Perfect baseline support */
  gap: 1rem;              /* Widely supported */
}

/* ❌ Non-Baseline (Red Underlines) */
.legacy-layout {
  float: left;            /* Hover: Use flexbox/grid */
  -webkit-appearance: none; /* Hover: Use appearance */
}
```

### **📁 `demo/demo.js`** & **📁 `demo/demo.html`**
Interactive examples showing baseline vs non-baseline features across all supported languages.

---

## 🏆 **Best Practices for Hackathon Judges**

### **🎯 Quick Evaluation (5 Minutes)**
1. **Press `F5`** - Extension loads in development host
2. **Open `demo/demo.css`** - See instant red underlines
3. **Press `Ctrl+Shift+B`** - Experience Copilot-style menu
4. **Hover over red underlines** - See rich tooltips
5. **Check status bar** - Live compatibility scoring

### **🎮 Full Feature Demo (15 Minutes)**
1. **Real-time Analysis**: Edit demo files, watch live updates
2. **Multi-Language**: Test CSS, JavaScript, HTML files
3. **Command Palette**: `Ctrl+Shift+P` → Type "Baseline"
4. **AI Features**: Add API key, try modernization wizard
5. **Professional UX**: Note GitHub Copilot-level polish

---

## 🎉 **Ready to Experience Baseline Excellence!**

**Your Baseline Sidekick is now fully organized and ready for hackathon submission. Press `F5` to start your journey toward baseline web compatibility mastery!**