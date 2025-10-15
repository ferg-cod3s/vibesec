# Test fixture: SQL injection
# Should trigger: sql-injection

from flask import Flask, request
import sqlite3

app = Flask(__name__)

@app.route('/user/<user_id>')
def get_user(user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"
    return db.execute(query)

@app.route('/search')
def search():
    term = request.args.get('term')
    query = f"SELECT * FROM products WHERE name LIKE '%{term}%'"
    return db.execute(query)
