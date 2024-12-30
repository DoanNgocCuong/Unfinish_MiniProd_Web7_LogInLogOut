from flask import jsonify, request
from app.main.controller import api_bp
from app.main.utils.decorators import login_required
from app.main.utils.initial_data import translations
import random

@api_bp.route('/users')
@login_required
def get_users():
    lang = request.args.get('lang', 'en')
    if lang not in translations:
        lang = 'en'
    
    users = []
    for i in range(1, 5):
        first_name = random.choice(translations[lang]['first_names'])
        last_name = random.choice(translations[lang]['last_names'])
        users.append({
            "id": i,
            "name": f"{first_name} {last_name}",
            "email": f"{first_name.lower()}.{last_name.lower()}@stepup.edu.vn",
            "role": random.choice(translations[lang]['roles'])
        })
    return jsonify(users) 