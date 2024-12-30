from flask import jsonify, request
from app.main.controller import api_bp
from app.main.model import User
from app import db
from google.oauth2 import id_token
from google.auth.transport import requests
from app.config import Config


@api_bp.route('/auth/google', methods=['POST'])
def google_auth():
    try:
        token = request.json.get('token')
        
        # Verify token
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            Config.GOOGLE_CLIENT_ID
        )

        # Get user info
        google_id = idinfo['sub']
        email = idinfo['email']
        
        # Validate email domain
        domain = email.split('@')[-1]
        if domain not in Config.ALLOWED_DOMAINS:
            return jsonify({
                'success': False,
                'error': 'Invalid email domain. Only stepup.com.vn and stepup.vn emails are allowed.'
            }), 403

        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')
        picture = idinfo.get('picture', '')

        # Find or create user
        user = User.query.filter_by(google_id=google_id).first()
        if not user:
            user = User(
                google_id=google_id,
                email=email,
                first_name=first_name,
                last_name=last_name,
                picture=picture,
                role='User'  # Default role
            )
            db.session.add(user)
            db.session.commit()

        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}",
                'picture': user.picture
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400 