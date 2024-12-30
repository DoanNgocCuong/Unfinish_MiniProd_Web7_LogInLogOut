translations = {
    'en': {
        'roles': ["Developer", "Designer", "Manager", "QA Engineer", "Product Owner"],
        'first_names': ["John", "Jane", "Mike", "Sarah", "David"],
        'last_names': ["Smith", "Johnson", "Williams", "Brown", "Jones"]
    },
    'vi': {
        'roles': ["Lập Trình Viên", "Thiết Kế", "Quản Lý", "Kỹ Sư QA", "Quản Lý Sản Phẩm"],
        'first_names': ["Hùng", "Hương", "Minh", "Hà", "Đức"],
        'last_names': ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng"]
    }
}

initial_departments = {
    'engineering': {
        'name_en': 'Engineering',
        'name_vi': 'Kỹ Thuật',
        'tools': ['Jira', 'GitHub', 'Jenkins', 'AWS Console', 'Confluence']
    },
    'design': {
        'name_en': 'Design',
        'name_vi': 'Thiết Kế',
        'tools': ['Figma', 'Adobe CC', 'Miro', 'Zeplin', 'InVision']
    },
    'hr': {
        'name_en': 'Human Resources',
        'name_vi': 'Nhân Sự',
        'tools': ['Workday', 'BambooHR', 'Slack', 'Zoom', 'ATS System']
    }
}

def initialize_database():
    from app.main.model import Department
    from app import db
    
    if not Department.query.first():
        for code, data in initial_departments.items():
            dept = Department(
                code=code,
                name_en=data['name_en'],
                name_vi=data['name_vi'],
                tools=data['tools']
            )
            db.session.add(dept)
        db.session.commit() 