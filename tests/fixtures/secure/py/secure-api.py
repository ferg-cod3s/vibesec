"""
Secure API Implementation Examples
These should NOT trigger any security vulnerabilities
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import psycopg2
from psycopg2 import sql
import jwt
import os
import logging
from pathlib import Path
from functools import wraps

app = Flask(__name__)

# ===== SECURE CONFIGURATION =====
# Properly configured for production
app.config['DEBUG'] = False  # Never enable debug in production
app.config['ENV'] = os.getenv('FLASK_ENV', 'production')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')  # From environment
app.config['DATABASE_URL'] = os.getenv('DATABASE_URL')  # Not hardcoded

# ===== SECURE CORS CONFIGURATION =====
# Specific origins only, not wildcard
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://app.example.com", "https://www.example.com"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# ===== RATE LIMITING =====
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)

# ===== SECURE LOGGING =====
# Production logging - no sensitive data
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===== SECURE ERROR HANDLING =====
@app.errorhandler(Exception)
def handle_error(error):
    """Production error handler - no stack traces to client"""
    # Log full error internally
    logger.error(f"Internal error: {str(error)}", exc_info=True)
    
    # Return generic error to client
    return jsonify({
        'error': 'An error occurred processing your request',
        'request_id': request.headers.get('X-Request-ID')
    }), 500

# ===== SECURE DATABASE CONNECTION =====
def get_db_connection():
    """Secure database connection using environment variables"""
    return psycopg2.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD')
    )

# ===== SECURE AUTHENTICATION =====
def token_required(f):
    """Decorator for protected routes"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Authentication required'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            
            data = jwt.decode(
                token, 
                os.getenv('JWT_SECRET'), 
                algorithms=['HS256']
            )
            request.user = data
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    """Decorator for admin-only routes"""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if request.user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    
    return decorated

# ===== SECURE SQL QUERIES =====
@app.route('/api/users/<int:user_id>', methods=['GET'])
@limiter.limit("30 per minute")
def get_user(user_id):
    """Secure parameterized SQL query"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Parameterized query - safe from SQL injection
        cursor.execute(
            "SELECT id, username, email FROM users WHERE id = %s",
            (user_id,)
        )
        
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if user:
            return jsonify({
                'id': user[0],
                'username': user[1],
                'email': user[2]
            })
        else:
            return jsonify({'error': 'User not found'}), 404
            
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        return jsonify({'error': 'Database error'}), 500

@app.route('/api/users/search', methods=['GET'])
@limiter.limit("30 per minute")
def search_users():
    """Secure search with parameterized query"""
    search_term = request.args.get('q', '')
    
    # Input validation
    if len(search_term) < 2:
        return jsonify({'error': 'Search term too short'}), 400
    
    if len(search_term) > 100:
        return jsonify({'error': 'Search term too long'}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Secure parameterized LIKE query
        cursor.execute(
            "SELECT id, username, email FROM users WHERE username ILIKE %s LIMIT 50",
            (f'%{search_term}%',)
        )
        
        users = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify([
            {'id': u[0], 'username': u[1], 'email': u[2]} 
            for u in users
        ])
        
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return jsonify({'error': 'Search failed'}), 500

# ===== SECURE FILE OPERATIONS =====
@app.route('/api/files/<filename>', methods=['GET'])
@token_required
def get_file(filename):
    """Secure file access with path traversal prevention"""
    try:
        # Define allowed directory
        allowed_dir = Path('/var/app/uploads').resolve()
        
        # Sanitize filename and construct path
        safe_filename = Path(filename).name  # Remove any path components
        file_path = (allowed_dir / safe_filename).resolve()
        
        # Verify path is within allowed directory
        if not str(file_path).startswith(str(allowed_dir)):
            return jsonify({'error': 'Invalid file path'}), 400
        
        # Check if file exists
        if not file_path.exists():
            return jsonify({'error': 'File not found'}), 404
        
        with open(file_path, 'r') as f:
            content = f.read()
        
        return content
        
    except Exception as e:
        logger.error(f"File access error: {str(e)}")
        return jsonify({'error': 'File access failed'}), 500

# ===== SECURE ADMIN ENDPOINTS =====
@app.route('/admin/dashboard', methods=['GET'])
@admin_required
def admin_dashboard():
    """Protected admin endpoint"""
    return jsonify({
        'message': 'Admin dashboard',
        'user': request.user.get('username')
    })

@app.route('/admin/users', methods=['GET'])
@admin_required
def admin_users():
    """Admin endpoint with proper authentication"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT id, username, email, created_at FROM users ORDER BY created_at DESC LIMIT 100"
        )
        
        users = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify([
            {
                'id': u[0],
                'username': u[1],
                'email': u[2],
                'created_at': u[3].isoformat() if u[3] else None
            }
            for u in users
        ])
        
    except Exception as e:
        logger.error(f"Admin query error: {str(e)}")
        return jsonify({'error': 'Query failed'}), 500

# ===== SECURE COMMAND EXECUTION =====
@app.route('/api/admin/system', methods=['POST'])
@admin_required
def system_command():
    """Secure command execution with allowlist"""
    import subprocess
    
    command = request.json.get('command')
    
    # Allowlist of safe commands
    allowed_commands = {
        'backup': ['pg_dump', '-U', 'postgres', 'mydb'],
        'status': ['systemctl', 'status', 'myapp']
    }
    
    if command not in allowed_commands:
        return jsonify({'error': 'Invalid command'}), 400
    
    try:
        # Execute with predefined arguments only
        result = subprocess.run(
            allowed_commands[command],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        return jsonify({
            'status': 'completed',
            'exit_code': result.returncode
        })
        
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Command timeout'}), 500
    except Exception as e:
        logger.error(f"Command execution error: {str(e)}")
        return jsonify({'error': 'Command failed'}), 500

# ===== SECURE INPUT VALIDATION =====
@app.route('/api/users', methods=['POST'])
@limiter.limit("10 per minute")
def create_user():
    """Secure user creation with validation"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['username', 'email', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    username = data['username']
    email = data['email']
    password = data['password']
    
    # Input validation
    if not username.isalnum() or len(username) < 3 or len(username) > 20:
        return jsonify({'error': 'Invalid username format'}), 400
    
    if '@' not in email or len(email) > 100:
        return jsonify({'error': 'Invalid email format'}), 400
    
    if len(password) < 8:
        return jsonify({'error': 'Password too short'}), 400
    
    try:
        import bcrypt
        
        # Hash password securely
        hashed_password = bcrypt.hashpw(
            password.encode('utf-8'), 
            bcrypt.gensalt()
        )
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Parameterized insert
        cursor.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id",
            (username, email, hashed_password.decode('utf-8'))
        )
        
        user_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': 'User created',
            'id': user_id
        }), 201
        
    except psycopg2.IntegrityError:
        return jsonify({'error': 'Username or email already exists'}), 409
    except Exception as e:
        logger.error(f"User creation error: {str(e)}")
        return jsonify({'error': 'User creation failed'}), 500

if __name__ == '__main__':
    # Production server configuration
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=False  # Never enable in production
    )
