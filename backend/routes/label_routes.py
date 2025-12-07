from flask import Blueprint
from utils.auth import token_required
from controllers.label_controller import (
    get_board_labels,
    create_label,
    update_label,
    delete_label,
    add_label_to_card,
    remove_label_from_card
)

label_bp = Blueprint('label', __name__)


@label_bp.route('/boards/<board_id>/labels', methods=['GET'])
@token_required
def get_labels(board_id):
    return get_board_labels(board_id=board_id)


@label_bp.route('/boards/<board_id>/labels', methods=['POST'])
@token_required
def create_board_label(board_id):
    return create_label(board_id=board_id)


@label_bp.route('/labels/<label_id>', methods=['PUT'])
@token_required
def update_board_label(label_id):
    return update_label(label_id=label_id)


@label_bp.route('/labels/<label_id>', methods=['DELETE'])
@token_required
def delete_board_label(label_id):
    return delete_label(label_id=label_id)


@label_bp.route('/cards/<card_id>/labels/<label_id>', methods=['POST'])
@token_required
def add_card_label(card_id, label_id):
    return add_label_to_card(card_id=card_id, label_id=label_id)


@label_bp.route('/cards/<card_id>/labels/<label_id>', methods=['DELETE'])
@token_required
def remove_card_label(card_id, label_id):
    return remove_label_from_card(card_id=card_id, label_id=label_id)
