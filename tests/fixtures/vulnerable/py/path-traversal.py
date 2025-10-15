# Test fixture: Path traversal
# Should trigger: path-traversal

from flask import Flask, request, send_file

app = Flask(__name__)

@app.route('/download')
def download_file():
    filename = request.args.get('file')
    return send_file(f"/var/www/uploads/{filename}")

@app.route('/read')
def read_file():
    path = request.args.get('path')
    with open(f"{path}", 'r') as f:
        return f.read()
