import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

import jwt
import pytest
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import app as app_module
import database
from config import Config
from models import Board, BoardMember, Card, Comment, Label, List, User
from models.enums import BoardRole
from utils.cache import cache


@pytest.fixture
def database_engine(monkeypatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    database.Session.configure(bind=engine)
    monkeypatch.setattr(app_module, "engine", engine)

    def init_test_cache(app):
        app.config.update(CACHE_TYPE="SimpleCache", CACHE_DEFAULT_TIMEOUT=300)
        cache.init_app(app)

    monkeypatch.setattr(app_module, "init_cache", init_test_cache)
    monkeypatch.setattr(app_module.socketio, "init_app", lambda *args, **kwargs: None)
    database.Base.metadata.create_all(bind=engine)

    yield engine

    database.Base.metadata.drop_all(bind=engine)
    database.Session.configure(bind=database.engine)
    engine.dispose()


@pytest.fixture
def app(database_engine):
    flask_app = app_module.create_app()
    flask_app.config.update(TESTING=True)
    return flask_app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def user_factory():
    def create_user(name="Test User", email=None, password="password123"):
        session = database.Session()
        user = User(
            user_id=uuid4(),
            name=name,
            email=email or f"{uuid4().hex}@example.com",
        )
        user.set_password(password)
        session.add(user)
        session.commit()
        session.refresh(user)
        session.close()
        return user

    return create_user


@pytest.fixture
def token_factory():
    def create_token(user):
        return jwt.encode(
            {
                "user_id": str(user.user_id),
                "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            },
            Config.SECRET_KEY,
            algorithm="HS256",
        )

    return create_token


@pytest.fixture
def headers_factory(token_factory):
    def create_headers(user):
        return {"Authorization": f"Bearer {token_factory(user)}"}

    return create_headers


@pytest.fixture
def board_factory():
    def create_board(owner, name="Test Board"):
        session = database.Session()
        board = Board(board_id=uuid4(), name=name, owner_id=owner.user_id)
        session.add(board)
        session.commit()
        session.refresh(board)
        session.close()
        return board

    return create_board


@pytest.fixture
def list_factory():
    def create_list(board, title="To Do", position=0):
        session = database.Session()
        board_list = List(
            list_id=uuid4(),
            board_id=board.board_id,
            title=title,
            position=position,
        )
        session.add(board_list)
        session.commit()
        session.refresh(board_list)
        session.close()
        return board_list

    return create_list


@pytest.fixture
def card_factory():
    def create_card(board_list, title="Test Card", position=0, description=None):
        session = database.Session()
        card = Card(
            card_id=uuid4(),
            list_id=board_list.list_id,
            title=title,
            description=description,
            position=position,
        )
        session.add(card)
        session.commit()
        session.refresh(card)
        session.close()
        return card

    return create_card


@pytest.fixture
def member_factory():
    def create_member(board, user, role=BoardRole.VIEWER):
        session = database.Session()
        member = BoardMember(
            member_id=uuid4(),
            board_id=board.board_id,
            user_id=user.user_id,
            role=role,
        )
        session.add(member)
        session.commit()
        session.refresh(member)
        session.close()
        return member

    return create_member


@pytest.fixture
def label_factory():
    def create_label(board, name="Bug", color="#ff0000"):
        session = database.Session()
        label = Label(
            label_id=uuid4(),
            board_id=board.board_id,
            name=name,
            color=color,
        )
        session.add(label)
        session.commit()
        session.refresh(label)
        session.close()
        return label

    return create_label


@pytest.fixture
def comment_factory():
    def create_comment(card, author, content="Existing comment"):
        session = database.Session()
        comment = Comment(
            comment_id=uuid4(),
            card_id=card.card_id,
            user_id=author.user_id,
            content=content,
        )
        session.add(comment)
        session.commit()
        session.refresh(comment)
        session.close()
        return comment

    return create_comment