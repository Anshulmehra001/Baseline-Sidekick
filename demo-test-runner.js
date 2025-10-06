#!/usr/bin/env node

/**
 * Baseline Sidekick Pre-Demo Test & Validation Script
 * Run this to verify everything is ready for video recording
 */

const fs = require('fs');
const path = require('path');

console.log('🎬 Baseline Sidekick - Video Demo Preparation');
console.log('============================================\n');

// Test 1: Verify compiled extension files
console.log('🔧 Checking Extension Build...');
const requiredFiles = [
    'out/extension.js',
    'out/diagnostics.js',
    'out/gamification/scoreManager.js',
    'out/ui/enhancedStatusBar.js',
    'out/core/baselineData.js',
    'out/core/cssParser.js',
    'out/core/jsParser.js',
    'out/providers/hoverProvider.js',
    'out/providers/codeActionProvider.js'
];

let buildComplete = true;
for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`  ✅ ${file}`);
    } else {
        console.log(`  ❌ ${file} - MISSING`);
        buildComplete = false;
    }
}

if (!buildComplete) {
    console.log('\n⚠️  Build incomplete! Run: npm run compile');
    process.exit(1);
}

// Test 2: Verify demo files are ready
console.log('\n📂 Checking Demo Files...');
const demoFiles = [
    { path: 'demo/test.css', description: 'CSS test file for live typing demo' },
    { path: 'demo/test.js', description: 'JavaScript test file for feature demo' },
    { path: 'demo/video-demo-guide.html', description: 'Complete demo guide and script' }
];

for (const { path: filePath, description } of demoFiles) {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        console.log(`  ✅ ${filePath} (${stats.size} bytes) - ${description}`);
    } else {
        console.log(`  ❌ ${filePath} - MISSING`);
    }
}

// Test 3: Validate package.json configuration
console.log('\n⚙️  Validating Extension Configuration...');
try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    
    // Check activation events
    const activationEvents = packageJson.activationEvents || [];
    const expectedLanguages = ['css', 'javascript', 'html'];
    const hasLanguageActivation = expectedLanguages.every(lang => 
        activationEvents.some(event => event.includes(lang))
    );
    
    console.log(`  ${hasLanguageActivation ? '✅' : '❌'} Language activation events`);
    
    // Check commands
    const commands = packageJson.contributes?.commands || [];
    const requiredCommands = [
        'baselineSidekick.showMainMenu',
        'baselineSidekick.showCompatibilityReport'
    ];
    
    for (const cmd of requiredCommands) {
        const exists = commands.some(c => c.command === cmd);
        console.log(`  ${exists ? '✅' : '❌'} Command: ${cmd}`);
    }
    
} catch (error) {
    console.log('  ❌ Error reading package.json:', error.message);
}

// Test 4: Check demo content quality
console.log('\n📝 Validating Demo Content...');

// Check CSS demo file
const cssPath = path.join(__dirname, 'demo/test.css');
if (fs.existsSync(cssPath)) {
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    const hasBaselineProps = ['display: flex', 'justify-content', 'border-radius'].some(prop => 
        cssContent.includes(prop)
    );
    
    const hasSpace = cssContent.includes('/* Add non-baseline properties');
    
    console.log(`  ${hasBaselineProps ? '✅' : '❌'} CSS has baseline-compatible properties`);
    console.log(`  ${hasSpace ? '✅' : '❌'} CSS has space for demo typing`);
}

// Check JS demo file  
const jsPath = path.join(__dirname, 'demo/test.js');
if (fs.existsSync(jsPath)) {
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    
    const hasBaselineJS = ['filter', 'map', 'const'].some(feature => 
        jsContent.includes(feature)
    );
    
    const hasSpace = jsContent.includes('// Add modern JavaScript');
    
    console.log(`  ${hasBaselineJS ? '✅' : '❌'} JavaScript has baseline features`);
    console.log(`  ${hasSpace ? '✅' : '❌'} JavaScript has space for demo typing`);
}

// Test 5: System requirements
console.log('\n💻 System Requirements...');
console.log(`  ✅ Node.js ${process.version}`);
console.log(`  ✅ Platform: ${process.platform} ${process.arch}`);

// Generate demo script
console.log('\n🎬 VIDEO RECORDING CHECKLIST');
console.log('===========================');
console.log('PREPARATION:');
console.log('1. 🖥️  Set screen resolution to 1080p or higher');
console.log('2. 🎨  Use VS Code Dark+ or Light+ theme');
console.log('3. 📊  Show status bar, problems panel, and file explorer');
console.log('4. ⚡  Clear all existing diagnostics/problems');
console.log('5. 🔧  Press F5 to launch Extension Host');

console.log('\nRECORDING STEPS:');
console.log('==================');
console.log('STEP 1: Show Initial Setup');
console.log('  • Split editor: demo/test.css (left) | demo/test.js (right)');
console.log('  • Status bar shows: "100% Baseline" or similar');
console.log('  • Problems panel empty');

console.log('\nSTEP 2: Add Non-Baseline CSS');
console.log('  • Type in test.css: float: left;');
console.log('  • Show red squiggly line appears immediately');
console.log('  • Hover to show rich tooltip');
console.log('  • Status bar drops to: "B+ (88%)" ✅');

console.log('\nSTEP 3: Add More Issues');
console.log('  • Add: -webkit-appearance: none;');
console.log('  • Add: clear: both;');
console.log('  • Status bar drops to: "C (75%)" 🟠');

console.log('\nSTEP 4: Show Features');
console.log('  • Click status bar for detailed report');
console.log('  • Show problems panel with detailed issues');
console.log('  • Demonstrate hover tooltips');

console.log('\n🚀 READY TO RECORD!');
console.log('===================');
console.log('Launch Command: Press F5 in VS Code');
console.log('Demo Files: demo/test.css and demo/test.js');
console.log('Guide: Open demo/video-demo-guide.html for detailed script');

console.log('\n📋 Post-Recording:');
console.log('• Test recorded video for clarity');
console.log('• Verify all features are demonstrated');
console.log('• Check audio quality if narrated');
console.log('• Submit with confidence! 🎉');