// Demo JavaScript for Screen Recording
// Baseline-compatible code examples

const products = [
  { id: 1, name: 'Laptop', price: 999, category: 'Electronics' },
  { id: 2, name: 'Phone', price: 599, category: 'Electronics' },
  { id: 3, name: 'Tablet', price: 399, category: 'Electronics' }
];

// Baseline JavaScript methods
const getExpensiveProducts = () => {
  return products.filter(product => product.price > 500);
};

const getProductNames = () => {
  return products.map(product => product.name.toUpperCase());
};

const getTotalValue = () => {
  return products.reduce((total, product) => total + product.price, 0);
};

// Example with Promise (baseline)
const fetchUserData = () => {
  return Promise.resolve({ userId: 123, name: 'John Doe' })
    .then(user => user.name)
    .catch(error => console.error('Error:', error));
};

// Area for Clip 4 demo - AI Polyfill Generation
const myArray = ['apple', 'banana', 'cherry', 'date'];

// Type this line for the demo: const last = myArray.at(-1);

// Area for more modern JavaScript features
// Optional chaining and nullish coalescing examples will go here