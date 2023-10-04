// userRoles.js

// Define roles (this can be stored in a database)
const roles = ['user', 'admin'];

// Mock user database with roles
const users = [
  { id: 1, email: 'user@example.com', password: 'hashedPassword', role: 'user' },
  { id: 2, email: 'admin@example.com', password: 'hashedPassword', role: 'admin' },
];

module.exports = { roles, users };
