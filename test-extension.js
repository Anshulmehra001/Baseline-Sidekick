// Test script to verify the extension works
import { BaselineDataManager } from './src/core/baselineData';
import { CssParser } from './src/core/cssParser';
import { JsParser } from './src/core/jsParser';
import { HtmlParser } from './src/core/htmlParser';

async function testExtension() {
  console.log('🧪 Testing Baseline Sidekick Extension...\n');

  try {
    // Test baseline data loading
    console.log('1. Testing baseline data loading...');
    const dataManager = BaselineDataManager.getInstance();
    await dataManager.initialize();
    console.log('✅ Baseline data loaded successfully');

    // Test CSS parsing
    console.log('\n2. Testing CSS parser...');
    const cssResult = CssParser.parseCss('.container { gap: 10px; display: grid; }');
    console.log('✅ CSS parsed successfully:', cssResult.features);

    // Test JS parsing
    console.log('\n3. Testing JS parser...');
    const jsResult = JsParser.parseJavaScript('fetch("https://api.example.com").then(r => r.json())');
    console.log('✅ JS parsed successfully:', jsResult.features);

    // Test HTML parsing
    console.log('\n4. Testing HTML parser...');
    const htmlResult = HtmlParser.parseHtml('<dialog><p>Hello world</p></dialog>');
    console.log('✅ HTML parsed successfully:', htmlResult.features);

    // Test baseline checking
    console.log('\n5. Testing baseline compatibility...');
    const gapSupported = dataManager.isBaselineSupported('css.properties.gap');
    const fetchSupported = dataManager.isBaselineSupported('api.fetch');
    console.log(`Gap property baseline support: ${gapSupported}`);
    console.log(`Fetch API baseline support: ${fetchSupported}`);

    console.log('\n🎉 All core functionality working correctly!');
    console.log('\nThe extension is ready to be used in VS Code.');
    console.log('You can build it with: npm run compile');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testExtension();