// Test JavaScript file for Baseline Sidekick
// ✅ Baseline features
const data = [1, 2, 3];
const doubled = data.map(x => x * 2);
const result = [...doubled];

// ❌ Potentially non-baseline features
document.querySelector('.test');
fetch('/api/data');  // Check baseline status