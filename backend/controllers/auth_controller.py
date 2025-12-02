from flask import jsonify, request, g
from models import User
from database import Session
from schemas import SignupSchema, LoginSchema, UserSchema
from marshmallow import ValidationError
import jwt
from datetime import datetime, timedelta
from config import Config
import uuid
from utils import cache, logger


def check_existing_user(email):
    session = Session()
    try:
        user = session.query(User).filter_by(email=email).first()
        return user is not None
    finally:
        session.close()


def signup():
    session = Session()
    schema = SignupSchema()
    try:
        data = schema.load(request.json)

        if check_existing_user(data['email']):
            return jsonify({"message": "Email already registered"}), 400

        new_user = User(
            user_id=uuid.uuid4(),
            name=data['name'],
            email=data['email'],
            phone=data.get('phone'),
        )
        new_user.set_password(data['password'])

        session.add(new_user)
        session.commit()
        cache.clear()
        logger.info(f"User registered: {new_user.email}")

        token = jwt.encode({
            "user_id": str(new_user.user_id),
            "exp": datetime.utcnow() + timedelta(days=7)
        }, Config.SECRET_KEY, algorithm="HS256")

        user_schema = UserSchema()
        return jsonify({
            "message": "User registered successfully",
            "token": token,
            "user": user_schema.dump(new_user)
        }), 201

    except ValidationError as err:
        session.rollback()
        return jsonify(err.messages), 400
    except Exception as e:
        session.rollback()
        logger.error(f"Error in user registration: {str(e)}")
        return jsonify({"message": "Server Error", "error": str(e)}), 500
    finally:
        session.close()


def login():
    session = Session()
    schema = LoginSchema()
    try:
        data = schema.load(request.json)
        user = session.query(User).filter_by(email=data['email']).first()

        if user and user.check_password(data['password']):
            token = jwt.encode({
                "user_id": str(user.user_id),
                "exp": datetime.utcnow() + timedelta(days=7)
            }, Config.SECRET_KEY, algorithm="HS256")

            logger.info(f"User logged in: {user.email}")
            user_schema = UserSchema()
            return jsonify({
                "message": "Login successful",
                "token": token,
                "user": user_schema.dump(user)
            }), 200
        else:
            return jsonify({"message": "Invalid email or password"}), 401

    except ValidationError as err:
        return jsonify(err.messages), 400
    except Exception as e:
        logger.error(f"Error in user login: {str(e)}")
        return jsonify({"message": "Server Error", "error": str(e)}), 500
    finally:
        session.close()
