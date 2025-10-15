# Test fixture: AI-Specific Security Issues in Python
# This file contains common vulnerabilities in AI-generated Flask/FastAPI code

from flask import Flask, jsonify, request, Response
from flask_cors import CORS, cross_origin
import traceback

app = Flask(__name__)

# VULNERABILITY 1: Overly permissive CORS (permissive-cors)
CORS(app, allow_origins=['*'], supports_credentials=True)

# VULNERABILITY 2: Debug mode enabled (debug-mode-enabled)
DEBUG = True

# Alternative debug mode
app.config['DEBUG'] = True

# VULNERABILITY 3: Verbose error responses (verbose-error-response)
@app.errorhandler(Exception)
def handle_exception(e):
    # Exposing full traceback to client
    return jsonify({
        'error': str(e),
        'traceback': traceback.format_exc(),
        'type': type(e).__name__
    }), 500

# VULNERABILITY 4: Exposed admin endpoints (exposed-admin-endpoint)
@app.route('/admin/users')
def admin_users():
    users = get_all_users()
    return jsonify(users)

@app.route('/admin/config', methods=['POST'])
def update_admin_config():
    config = request.json
    update_system_config(config)
    return jsonify({'success': True})

# Another unprotected admin route
@app.route('/api/admin/logs')
def get_admin_logs():
    return jsonify(read_system_logs())

# Route with verbose error handling
@app.route('/api/data')
def get_data():
    try:
        data = fetch_sensitive_data()
        return jsonify(data)
    except Exception as e:
        # Exposing error details
        return Response(str(e.__traceback__), status=500)

# Another CORS vulnerability pattern
@app.route('/api/public')
@cross_origin(origins='*')
def public_api():
    return jsonify({'data': 'public'})

# Running with debug mode
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
