"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const baselineData_1 = require("./baselineData");
// Mock web-features module
vitest_1.vi.mock('web-features', () => ({
    'css.properties.gap': {
        name: 'CSS gap property',
        status: {
            baseline: true,
            baseline_low_date: '2021-09-14',
            baseline_high_date: '2023-03-14'
        },
        spec: 'https://drafts.csswg.org/css-align-3/#gap-shorthand',
        mdn_url: 'https://developer.mozilla.org/docs/Web/CSS/gap'
    },
    'api.Clipboard': {
        name: 'Clipboard API',
        status: {
            baseline: false
        },
        spec: 'https://w3c.github.io/clipboard-apis/',
        mdn_url: 'https://developer.mozilla.org/docs/Web/API/Clipboard'
    },
    'css.properties.container-type': {
        name: 'CSS container-type property',
        status: {
            baseline: 'low',
            baseline_low_date: '2023-02-14'
        },
        spec: 'https://drafts.csswg.org/css-contain-3/#container-type',
        mdn_url: 'https://developer.mozilla.org/docs/Web/CSS/container-type'
    },
    'html.elements.dialog': {
        name: 'HTML dialog element',
        status: {
            baseline: 'high',
            baseline_low_date: '2022-03-14',
            baseline_high_date: '2024-09-14'
        },
        spec: 'https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element',
        mdn_url: 'https://developer.mozilla.org/docs/Web/HTML/Element/dialog'
    },
    'feature.without.mdn': {
        name: 'Feature without MDN URL',
        status: {
            baseline: true
        },
        spec: 'https://example.com/spec'
    }
}));
(0, vitest_1.describe)('BaselineDataManager', () => {
    let manager;
    (0, vitest_1.beforeEach)(async () => {
        // Reset singleton instance for each test
        baselineData_1.BaselineDataManager.instance = undefined;
        manager = baselineData_1.BaselineDataManager.getInstance();
        await manager.initialize();
    });
    (0, vitest_1.describe)('Singleton Pattern', () => {
        (0, vitest_1.it)('should return the same instance when called multiple times', () => {
            const instance1 = baselineData_1.BaselineDataManager.getInstance();
            const instance2 = baselineData_1.BaselineDataManager.getInstance();
            (0, vitest_1.expect)(instance1).toBe(instance2);
        });
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should initialize successfully', async () => {
            const newManager = baselineData_1.BaselineDataManager.getInstance();
            await newManager.initialize();
            (0, vitest_1.expect)(newManager.isInitialized()).toBe(true);
        });
        (0, vitest_1.it)('should handle multiple initialization calls gracefully', async () => {
            await manager.initialize();
            await manager.initialize(); // Should not throw or cause issues
            (0, vitest_1.expect)(manager.isInitialized()).toBe(true);
        });
        (0, vitest_1.it)('should throw error when accessing data before initialization', () => {
            const uninitializedManager = baselineData_1.BaselineDataManager.getInstance();
            uninitializedManager.isLoaded = false;
            (0, vitest_1.expect)(() => {
                uninitializedManager.getFeatureData('css.properties.gap');
            }).toThrow('BaselineDataManager not initialized. Call initialize() first.');
        });
    });
    (0, vitest_1.describe)('getFeatureData', () => {
        (0, vitest_1.it)('should return feature data for existing feature', () => {
            const featureData = manager.getFeatureData('css.properties.gap');
            (0, vitest_1.expect)(featureData).toBeDefined();
            (0, vitest_1.expect)(featureData?.name).toBe('CSS gap property');
            (0, vitest_1.expect)(featureData?.status.baseline).toBe(true);
            (0, vitest_1.expect)(featureData?.mdn_url).toBe('https://developer.mozilla.org/docs/Web/CSS/gap');
        });
        (0, vitest_1.it)('should return undefined for non-existing feature', () => {
            const featureData = manager.getFeatureData('non.existing.feature');
            (0, vitest_1.expect)(featureData).toBeUndefined();
        });
        (0, vitest_1.it)('should handle empty string feature ID', () => {
            const featureData = manager.getFeatureData('');
            (0, vitest_1.expect)(featureData).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('isBaselineSupported', () => {
        (0, vitest_1.it)('should return true for baseline: true features', () => {
            const isSupported = manager.isBaselineSupported('css.properties.gap');
            (0, vitest_1.expect)(isSupported).toBe(true);
        });
        (0, vitest_1.it)('should return false for baseline: false features', () => {
            const isSupported = manager.isBaselineSupported('api.Clipboard');
            (0, vitest_1.expect)(isSupported).toBe(false);
        });
        (0, vitest_1.it)('should return true for baseline: "low" features', () => {
            const isSupported = manager.isBaselineSupported('css.properties.container-type');
            (0, vitest_1.expect)(isSupported).toBe(true);
        });
        (0, vitest_1.it)('should return true for baseline: "high" features', () => {
            const isSupported = manager.isBaselineSupported('html.elements.dialog');
            (0, vitest_1.expect)(isSupported).toBe(true);
        });
        (0, vitest_1.it)('should return false for non-existing features', () => {
            const isSupported = manager.isBaselineSupported('non.existing.feature');
            (0, vitest_1.expect)(isSupported).toBe(false);
        });
    });
    (0, vitest_1.describe)('getMdnUrl', () => {
        (0, vitest_1.it)('should return MDN URL when available', () => {
            const featureData = manager.getFeatureData('css.properties.gap');
            const mdnUrl = manager.getMdnUrl(featureData);
            (0, vitest_1.expect)(mdnUrl).toBe('https://developer.mozilla.org/docs/Web/CSS/gap');
        });
        (0, vitest_1.it)('should return empty string when MDN URL is not available', () => {
            const featureData = manager.getFeatureData('feature.without.mdn');
            const mdnUrl = manager.getMdnUrl(featureData);
            (0, vitest_1.expect)(mdnUrl).toBe('');
        });
    });
    (0, vitest_1.describe)('getAllFeatureIds', () => {
        (0, vitest_1.it)('should return array of all feature IDs', () => {
            const featureIds = manager.getAllFeatureIds();
            (0, vitest_1.expect)(Array.isArray(featureIds)).toBe(true);
            (0, vitest_1.expect)(featureIds).toContain('css.properties.gap');
            (0, vitest_1.expect)(featureIds).toContain('api.Clipboard');
            (0, vitest_1.expect)(featureIds).toContain('css.properties.container-type');
            (0, vitest_1.expect)(featureIds).toContain('html.elements.dialog');
            (0, vitest_1.expect)(featureIds).toContain('feature.without.mdn');
        });
        (0, vitest_1.it)('should throw error when not initialized', () => {
            const uninitializedManager = baselineData_1.BaselineDataManager.getInstance();
            uninitializedManager.isLoaded = false;
            (0, vitest_1.expect)(() => {
                uninitializedManager.getAllFeatureIds();
            }).toThrow('BaselineDataManager not initialized. Call initialize() first.');
        });
    });
    (0, vitest_1.describe)('Error Handling', () => {
        (0, vitest_1.it)('should handle malformed feature data gracefully', () => {
            // Test with a feature that might have incomplete data
            const featureData = manager.getFeatureData('feature.without.mdn');
            (0, vitest_1.expect)(featureData).toBeDefined();
            (0, vitest_1.expect)(manager.getMdnUrl(featureData)).toBe('');
        });
    });
    (0, vitest_1.describe)('Performance Requirements', () => {
        (0, vitest_1.it)('should return feature data within 10ms (Requirement 6.2)', () => {
            const startTime = performance.now();
            manager.getFeatureData('css.properties.gap');
            const endTime = performance.now();
            (0, vitest_1.expect)(endTime - startTime).toBeLessThan(10);
        });
        (0, vitest_1.it)('should return baseline support status within 10ms (Requirement 6.2)', () => {
            const startTime = performance.now();
            manager.isBaselineSupported('css.properties.gap');
            const endTime = performance.now();
            (0, vitest_1.expect)(endTime - startTime).toBeLessThan(10);
        });
    });
});
//# sourceMappingURL=baselineData.test.js.map