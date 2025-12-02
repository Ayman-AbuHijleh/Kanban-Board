from flask import Blueprint, request, jsonify, g
from controllers import signup, login
from utils import token_required, limiter, cache
from flask_limiter.util import get_remote_address

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/auth/signup', methods=['POST'])
def signup_route():
    return signup()


@auth_bp.route('/auth/login', methods=['POST'])
@limiter.exempt
def login_route():
    return login()
