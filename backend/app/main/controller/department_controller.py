from flask import jsonify, request
from app.main.controller import api_bp
from app.main.model import Department

@api_bp.route('/departments')
def get_departments():
    lang = request.args.get('lang', 'vi')
    
    if lang not in ['en', 'vi']:
        lang = 'en'
    
    departments = {}
    try:
        db_departments = Department.query.all()
        
        for dept in db_departments:
            departments[dept.code] = {
                'name': getattr(dept, f'name_{lang}'),
                'tools': dept.tools
            }
        
        return jsonify(departments)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/test')
def test():
    return "Server is running!"