"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testCoreComponents = void 0;
// Simple test runner to verify core functionality
const baselineData_1 = require("./core/baselineData");
const cssParser_1 = require("./core/cssParser");
const jsParser_1 = require("./core/jsParser");
const htmlParser_1 = require("./core/htmlParser");
async function testCoreComponents() {
    console.log('🧪 Testing Core Components...\n');
    // Test BaselineDataManager
    try {
        const dataManager = baselineData_1.BaselineDataManager.getInstance();
        await dataManager.initialize();
        console.log('✅ BaselineDataManager: Initialized successfully');
        const isSupported = dataManager.isBaselineSupported('css.properties.color');
        console.log(`✅ BaselineDataManager: isBaselineSupported works (color: ${isSupported})`);
    }
    catch (error) {
        console.log('❌ BaselineDataManager:', error instanceof Error ? error.message : String(error));
    }
    // Test CSS Parser
    try {
        const cssResult = cssParser_1.CssParser.parseCss('body { color: red; gap: 10px; }');
        console.log('✅ CssParser: Parsed CSS successfully');
        console.log(`   Features found: ${cssResult.features.length}`);
    }
    catch (error) {
        console.log('❌ CssParser:', error instanceof Error ? error.message : String(error));
    }
    // Test JS Parser
    try {
        const jsResult = jsParser_1.JsParser.parseJavaScript('navigator.clipboard.writeText("test");');
        console.log('✅ JsParser: Parsed JavaScript successfully');
        console.log(`   Features found: ${jsResult.features.length}`);
    }
    catch (error) {
        console.log('❌ JsParser:', error instanceof Error ? error.message : String(error));
    }
    // Test HTML Parser
    try {
        const htmlResult = htmlParser_1.HtmlParser.parseHtml('<dialog><p>Hello</p></dialog>');
        console.log('✅ HtmlParser: Parsed HTML successfully');
        console.log(`   Features found: ${htmlResult.features.length}`);
    }
    catch (error) {
        console.log('❌ HtmlParser:', error instanceof Error ? error.message : String(error));
    }
    console.log('\n🎉 Core component testing complete!');
}
exports.testCoreComponents = testCoreComponents;
// Only run if this file is executed directly
if (require.main === module) {
    testCoreComponents().catch(console.error);
}
//# sourceMappingURL=test-runner.js.map