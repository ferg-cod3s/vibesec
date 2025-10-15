# Test fixture: Generic error handler
# Will need AI-specific rules (not yet created)

from flask import Flask

app = Flask(__name__)

@app.errorhandler(Exception)
def handle_error(e):
    # Exposes stack trace to users
    return str(e), 500

@app.route('/api/data')
def get_data():
    # Potential error without proper handling
    data = fetch_sensitive_data()
    return data
