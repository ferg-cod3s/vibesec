// Vulnerable code sample
const apiKey = "FAKE-API-KEY-1234567890abcdefghijk";
const db = require('database');

function getUser(id) {
  // SQL injection vulnerability
  return db.query("SELECT * FROM users WHERE id = " + id);
}

function renderTemplate(data) {
  // XSS vulnerability
  return "<div>" + data.userInput + "</div>";
}
