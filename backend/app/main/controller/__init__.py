from flask import Blueprint

api_bp = Blueprint('api', __name__)

from app.main.controller import user_controller
from app.main.controller import department_controller
from app.main.controller import auth_controller

__all__ = ['user_controller', 'department_controller', 'auth_controller']
