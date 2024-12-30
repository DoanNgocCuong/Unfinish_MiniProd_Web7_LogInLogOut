import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://user_ai_tools:rDKAJKdfnwejk2344nNdskfsfsmdfbnj(32)@db:5432/ai_tools_db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '127053988731-76c2oeecao8h82116o7tav085jjf3l5d.apps.googleusercontent.com')
    ALLOWED_DOMAINS = os.getenv('ALLOWED_DOMAINS', 'stepup.com.vn,stepup.edu.vn').split(',')