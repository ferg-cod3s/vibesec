// Clean secure code
const config = require('./config');

function getUser(id) {
  // Parameterized query - secure
  return db.query("SELECT * FROM users WHERE id = ?", [id]);
}

function processData(data) {
  // Input validation
  if (!isValid(data)) {
    throw new Error('Invalid data');
  }
  return transform(data);
}
