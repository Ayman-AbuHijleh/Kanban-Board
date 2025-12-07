from routes.auth_routes import auth_bp
from routes.board_routes import board_bp
from routes.list_routes import list_bp
from routes.card_routes import card_bp
from routes.label_routes import label_bp
from routes.comment_routes import comment_bp

__all__ = ['auth_bp', 'board_bp', 'list_bp', 'card_bp', 'label_bp', 'comment_bp']
