# Secure Python code - no vulnerabilities
# This file should NOT trigger any security warnings

from flask import Flask, request
import os
import sqlite3
import subprocess

app = Flask(__name__)

# Secure database query with parameterization
@app.route('/user/<int:user_id>')
def get_user(user_id):
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    # Using parameterized query
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    result = cursor.fetchall()
    return {'users': result}

# Secure environment variable usage
api_key = os.environ.get('API_KEY')
db_password = os.environ.get('DB_PASSWORD')

# Proper input validation
def validate_username(username):
    import re
    allowed_pattern = re.compile(r'^[a-zA-Z0-9_]{3,20}$')
    return allowed_pattern.match(username) is not None

# Secure command execution with validation
def process_file(filename):
    # Validate input first
    if not validate_filename(filename):
        raise ValueError('Invalid filename')
    
    # Use subprocess with list arguments (no shell injection)
    result = subprocess.run(['cat', filename], 
                          capture_output=True, 
                          text=True,
                          check=True)
    return result.stdout

# Proper error handling
@app.errorhandler(Exception)
def handle_error(error):
    app.logger.error(f"Error: {error}")  # Log internally
    return {'message': 'Internal server error'}, 500  # Generic message

if __name__ == '__main__':
    app.run()
