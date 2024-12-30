from app import db

class Department(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    name_en = db.Column(db.String(100), nullable=False)
    name_vi = db.Column(db.String(100), nullable=False)
    tools = db.Column(db.JSON)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    role = db.Column(db.String(50), nullable=False)
    google_id = db.Column(db.String(100), unique=True)
    picture = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=db.func.now()) 