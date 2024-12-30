from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # Initialize CORS
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:3009", "https://ai-tools.hacknao.edu.vn"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "expose_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })

    # Load config
    from app.config import Config
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)

    # Register blueprints
    from app.main.controller import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    # Initialize database
    with app.app_context():
        from app.main.model import Department
        from app.main.utils.initial_data import initialize_database
        db.create_all()
        initialize_database()

    return app
