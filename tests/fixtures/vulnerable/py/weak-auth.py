# Vulnerable Authentication Implementation (Python)
# Should trigger: weak-password-validation, missing-rate-limiting, insecure-session-config, missing-jwt-verification

from flask import Flask, request, jsonify, make_response
import jwt

app = Flask(__name__)

# Issue 1: Weak password validation
def is_valid_password(password):
    # Only checking length - too weak!
    if len(password) < 6:
        return False
    return True

def check_password_strength(pwd):
    # Even weaker - only 4 characters
    return len(pwd) >= 4

# Issue 2: Missing rate limiting on login endpoint
@app.route('/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')
    
    if not is_valid_password(password):
        return jsonify({'error': 'Invalid password'}), 400
    
    user = db.find_user(username, password)
    
    if user:
        response = make_response(jsonify({'success': True}))
        
        # Issue 3: Insecure session configuration
        response.set_cookie('sessionId', user.session_token)
        # Missing: httponly=True, secure=True, samesite='Strict'
        
        # Issue 4: JWT decoded without verification
        token_data = jwt.decode(user.token, verify=False)
        
        return response
    
    return jsonify({'error': 'Authentication failed'}), 401

# Issue 3: Insecure Flask session config
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = False
app.config['SESSION_COOKIE_SAMESITE'] = None

if __name__ == '__main__':
    app.run()
