// Simple test runner to verify core functionality
import { BaselineDataManager } from './core/baselineData';
import { CssParser } from './core/cssParser';
import { JsParser } from './core/jsParser';
import { HtmlParser } from './core/htmlParser';

async function testCoreComponents() {
    console.log('🧪 Testing Core Components...\n');

    // Test BaselineDataManager
    try {
        const dataManager = BaselineDataManager.getInstance();
        await dataManager.initialize();
        console.log('✅ BaselineDataManager: Initialized successfully');
        
        const isSupported = dataManager.isBaselineSupported('css.properties.color');
        console.log(`✅ BaselineDataManager: isBaselineSupported works (color: ${isSupported})`);
    } catch (error) {
        console.log('❌ BaselineDataManager:', error instanceof Error ? error.message : String(error));
    }

    // Test CSS Parser
    try {
        const cssResult = CssParser.parseCss('body { color: red; gap: 10px; }');
        console.log('✅ CssParser: Parsed CSS successfully');
        console.log(`   Features found: ${cssResult.features.length}`);
    } catch (error) {
        console.log('❌ CssParser:', error instanceof Error ? error.message : String(error));
    }

    // Test JS Parser
    try {
        const jsResult = JsParser.parseJavaScript('navigator.clipboard.writeText("test");');
        console.log('✅ JsParser: Parsed JavaScript successfully');
        console.log(`   Features found: ${jsResult.features.length}`);
    } catch (error) {
        console.log('❌ JsParser:', error instanceof Error ? error.message : String(error));
    }

    // Test HTML Parser
    try {
        const htmlResult = HtmlParser.parseHtml('<dialog><p>Hello</p></dialog>');
        console.log('✅ HtmlParser: Parsed HTML successfully');
        console.log(`   Features found: ${htmlResult.features.length}`);
    } catch (error) {
        console.log('❌ HtmlParser:', error instanceof Error ? error.message : String(error));
    }

    console.log('\n🎉 Core component testing complete!');
}

// Only run if this file is executed directly
if (require.main === module) {
    testCoreComponents().catch(console.error);
}

export { testCoreComponents };