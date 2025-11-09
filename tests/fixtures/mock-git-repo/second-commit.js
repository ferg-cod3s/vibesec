// Second commit file with vulnerability for incremental scanning tests
function vulnerableFunction(userInput) {
  // SQL injection vulnerability
  const query = "SELECT * FROM users WHERE id = '" + userInput + "'"; // Vulnerable
  return query;
}

module.exports = { vulnerableFunction };
