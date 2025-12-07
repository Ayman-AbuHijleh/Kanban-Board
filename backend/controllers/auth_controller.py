from flask import request
from models import User
from schemas import SignupSchema, LoginSchema, UserSchema
import jwt
from datetime import datetime, timedelta
from config import Config
import uuid
from utils import logger, with_db_session, success_response, bad_request_response, unauthorized_response


def check_existing_user(session, email):
    """Check if a user with the given email exists"""
    user = session.query(User).filter_by(email=email).first()
    return user is not None


@with_db_session
def signup(session):
    """Register a new user"""
    schema = SignupSchema()
    data = schema.load(request.json)

    if check_existing_user(session, data['email']):
        return bad_request_response("Email already registered")

    new_user = User(
        user_id=uuid.uuid4(),
        name=data['name'],
        email=data['email'],
        phone=data.get('phone'),
    )
    new_user.set_password(data['password'])

    session.add(new_user)
    session.flush()
    
    logger.info(f"User registered: {new_user.email}")

    token = jwt.encode({
        "user_id": str(new_user.user_id),
        "exp": datetime.utcnow() + timedelta(days=7)
    }, Config.SECRET_KEY, algorithm="HS256")

    user_schema = UserSchema()
    return success_response(
        "User registered successfully",
        {
            "token": token,
            "user": user_schema.dump(new_user)
        },
        201
    )


@with_db_session
def login(session):
    """Login a user"""
    schema = LoginSchema()
    data = schema.load(request.json)
    
    user = session.query(User).filter_by(email=data['email']).first()

    if user and user.check_password(data['password']):
        token = jwt.encode({
            "user_id": str(user.user_id),
            "exp": datetime.utcnow() + timedelta(days=7)
        }, Config.SECRET_KEY, algorithm="HS256")

        logger.info(f"User logged in: {user.email}")
        user_schema = UserSchema()
        return success_response(
            "Login successful",
            {
                "token": token,
                "user": user_schema.dump(user)
            }
        )
    else:
        return unauthorized_response("Invalid email or password")
