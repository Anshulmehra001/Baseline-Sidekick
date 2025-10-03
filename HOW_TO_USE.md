# 🚀 HOW TO LAUNCH AND USE BASELINE SIDEKICK EXTENSION

## 🎯 STEP 1: LAUNCH THE EXTENSION

### Method 1: Using VS Code (Recommended)
1. **Open this project in VS Code** (you should already be here)
2. **Press `F5`** - This launches the Extension Development Host
3. **A new VS Code window will open** with the extension loaded
4. Look for "Extension Host" in the title bar of the new window

### Method 2: Using Command Palette
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Debug: Start Debugging"
3. Select it to launch the extension

## 🎯 STEP 2: TEST THE EXTENSION WITH SAMPLE FILES

### Create Test Files in the Extension Host Window

**Create these test files to see the extension in action:**

#### 1. Create `test.css` with non-baseline features:
```css
/* This will show red squiggly lines under non-baseline features */
.container {
  display: grid;                    /* ✅ Baseline - no warnings */
  grid-template-columns: 1fr 1fr;   /* ✅ Baseline - no warnings */
  container-type: inline-size;      /* ⚠️  May show warning if not baseline */
  view-transition-name: slide;      /* ⚠️  Likely shows warning - newer feature */
}

.modern-features {
  backdrop-filter: blur(10px);      /* ⚠️  May show warning */
  aspect-ratio: 16/9;              /* ⚠️  May show warning */
  scroll-snap-type: x mandatory;   /* ✅ Should be baseline now */
}
```

#### 2. Create `test.html` with modern elements:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Baseline Test</title>
</head>
<body>
    <!-- These should show tooltips on hover -->
    <dialog open>                 <!-- ⚠️ May show as non-baseline -->
        <p>This is a dialog element</p>
    </dialog>
    
    <details>                     <!-- ✅ Should be baseline -->
        <summary>Click to expand</summary>
        <p>Hidden content</p>
    </details>
    
    <progress value="32" max="100">32%</progress>  <!-- ✅ Baseline -->
</body>
</html>
```

#### 3. Create `test.js` with modern JavaScript:
```javascript
// Modern JavaScript features
const data = await fetch('/api/data');  // ⚠️ May show async/await warnings
const result = data?.json();            // ⚠️ Optional chaining warning

// Modern APIs
if ('serviceWorker' in navigator) {     // ⚠️ Service Worker API warning
    navigator.serviceWorker.register('/sw.js');
}
```

## 🎯 STEP 3: SEE THE EXTENSION IN ACTION

### 1. **Real-time Diagnostics** 🔴
- Open any CSS/HTML/JS file
- **Look for red squiggly lines** under non-baseline features
- These indicate compatibility issues

### 2. **Hover Information** 💡
- **Hover your mouse** over any CSS property, HTML element, or JS feature
- **See detailed tooltips** showing:
  - Browser support information
  - Baseline status
  - Alternative suggestions

### 3. **Code Actions** ⚡
- **Right-click** on any flagged feature
- Look for **"Baseline Sidekick"** options in the context menu
- Get suggestions for baseline alternatives

### 4. **Workspace Audit** 📊
- **Press `Ctrl+Shift+P`** (Command Palette)
- **Type**: `Baseline: Audit Workspace`
- **Run the command** to scan your entire project
- **Get a comprehensive report** of all compatibility issues

## 🎯 STEP 4: CUSTOMIZE THE EXTENSION

### Access Settings
1. **Press `Ctrl+,`** (Settings)
2. **Search for**: `baseline sidekick`
3. **Adjust settings** like:
   - Diagnostic severity levels
   - File size limits
   - Performance optimizations

## 🎯 WHAT YOU SHOULD SEE

### ✅ **Working Features:**
- 🔴 **Red squiggly lines** under non-baseline CSS properties
- 💡 **Hover tooltips** with browser support data
- ⚡ **Quick fixes** in right-click context menu  
- 📊 **Workspace audit command** in Command Palette
- 🚀 **Real-time analysis** as you type

### 📊 **Sample Output:**
```
Problems Panel will show:
❌ CSS property 'view-transition-name' is not baseline-supported
❌ HTML element 'dialog' may have limited browser support
❌ JavaScript feature 'optional chaining' requires newer browsers
```

## 🎯 TROUBLESHOOTING

### If Extension Doesn't Load:
1. **Check the Debug Console** (View → Debug Console)
2. **Look for activation messages**: "Baseline Sidekick extension is activating..."
3. **Verify file types**: Extension only works on `.css`, `.html`, `.js`, `.ts` files

### If No Diagnostics Appear:
1. **Make sure you're in the Extension Host window** (look for "Extension Host" in title)
2. **Open a supported file type** (.css, .html, .js)
3. **Add some CSS properties** that might not be baseline
4. **Wait a few seconds** for analysis to complete

### If Hover Doesn't Work:
1. **Hover directly over CSS properties** or HTML elements
2. **Try different properties** (some may not be mapped yet)
3. **Check that diagnostics are working first**

## 🎯 DEVELOPMENT WORKFLOW

### Making Changes:
1. **Edit source code** in the main VS Code window
2. **Press `Ctrl+Shift+F5`** to reload the extension
3. **Or close and press `F5` again** to restart

### Viewing Logs:
1. **View → Output Panel**
2. **Select "Baseline Sidekick"** from dropdown
3. **See detailed logging** of extension activity

---

## 🎉 SUCCESS INDICATORS

**You'll know it's working when you see:**
- ✅ Red squiggly lines under non-baseline CSS
- ✅ Informative hover tooltips
- ✅ "Baseline: Audit Workspace" in Command Palette
- ✅ Problems panel showing compatibility issues
- ✅ No errors in Debug Console

**🚀 Your VS Code extension for baseline web compatibility checking is now live and ready to help developers write more compatible code!**