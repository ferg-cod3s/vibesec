// Test file with intentional vulnerabilities
const API_KEY = 'sk-test-1234567890abcdef';
const PASSWORD = 'admin123';

function query(userInput: string) {
  const sql = "SELECT * FROM users WHERE name = '" + userInput + "'";
  // TODO: Implement actual database query
}
