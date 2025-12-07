from flask import Blueprint
from utils.auth import token_required
from controllers.comment_controller import (
    get_card_comments,
    create_comment
)

comment_bp = Blueprint('comment', __name__)


@comment_bp.route('/cards/<card_id>/comments', methods=['GET'])
@token_required
def get_comments(card_id):
    return get_card_comments(card_id=card_id)


@comment_bp.route('/cards/<card_id>/comments', methods=['POST'])
@token_required
def add_comment(card_id):
    return create_comment(card_id=card_id)
