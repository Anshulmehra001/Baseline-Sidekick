// Baseline Sidekick Demo - JavaScript Compatibility Testing

/* ✅ BASELINE COMPATIBLE FEATURES */
// Modern JavaScript that's widely supported
const users = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
  { name: 'Charlie', age: 35 }
];

// Array methods (baseline)
const adultUsers = users.filter(user => user.age >= 21);
const userNames = users.map(user => user.name);
const totalAge = users.reduce((sum, user) => sum + user.age, 0);

// Object methods (baseline)
const userObject = Object.assign({}, users[0]);
const keys = Object.keys(userObject);
const values = Object.values(userObject);

// Promise (baseline)
const fetchData = () => {
  return Promise.resolve({ data: 'example' })
    .then(response => response.data)
    .catch(error => console.error('Error:', error));
};

/* ❌ NON-BASELINE FEATURES (should show red underlines) */
// Check these features for baseline compatibility
const modernFeatures = () => {
  // Optional chaining - check baseline status
  const result = users[0]?.name?.toUpperCase();
  
  // Nullish coalescing - check baseline status  
  const defaultValue = result ?? 'Unknown';
  
  // Dynamic imports - check baseline status
  import('./module.js').then(module => {
    module.doSomething();
  });
  
  // Private class fields - check baseline status
  class User {
    #privateField = 'secret';
    
    getPrivate() {
      return this.#privateField;
    }
  }
  
  return { result, defaultValue };
};

// Web APIs to check
if (typeof navigator !== 'undefined') {
  // Geolocation API - check baseline status
  navigator.geolocation?.getCurrentPosition(position => {
    console.log('Location:', position.coords);
  });
  
  // Service Worker - check baseline status
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
  
  // Intersection Observer - check baseline status
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => console.log(entry.isIntersecting));
  });
}