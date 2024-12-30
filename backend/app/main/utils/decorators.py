from functools import wraps
from flask import request, jsonify
from google.oauth2 import id_token
from google.auth.transport import requests
from app.config import Config

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No authorization header'}), 401
        
        try:
            token = auth_header.split(' ')[1]
            idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                Config.GOOGLE_CLIENT_ID
            )
            
            # Add domain validation
            email = idinfo['email']
            domain = email.split('@')[-1]
            if domain not in Config.ALLOWED_DOMAINS:
                return jsonify({
                    'success': False,
                    'error': 'Invalid email domain. Only stepup.com.vn and stepup.vn emails are allowed.'
                }), 403
                
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Invalid token'}), 401
    return decorated_function 