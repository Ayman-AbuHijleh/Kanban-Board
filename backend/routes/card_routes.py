from flask import Blueprint
from utils.auth import token_required
from controllers.card_controller import (
    get_cards,
    create_card,
    update_card,
    delete_card,
    move_card,
    assign_user_to_card,
    unassign_user_from_card
)

card_bp = Blueprint('card', __name__)


@card_bp.route('/lists/<list_id>/cards', methods=['GET'])
@token_required
def get_list_cards(list_id):
    return get_cards(list_id=list_id)


@card_bp.route('/lists/<list_id>/cards', methods=['POST'])
@token_required
def create_list_card(list_id):
    return create_card(list_id=list_id)


@card_bp.route('/cards/<card_id>', methods=['PUT'])
@token_required
def update_list_card(card_id):
    return update_card(card_id=card_id)


@card_bp.route('/cards/<card_id>', methods=['DELETE'])
@token_required
def delete_list_card(card_id):
    return delete_card(card_id=card_id)


@card_bp.route('/cards/<card_id>/move', methods=['PUT'])
@token_required
def move_list_card(card_id):
    return move_card(card_id=card_id)


@card_bp.route('/cards/<card_id>/assign', methods=['POST'])
@token_required
def assign_card_user(card_id):
    return assign_user_to_card(card_id=card_id)


@card_bp.route('/cards/<card_id>/assign/<user_id>', methods=['DELETE'])
@token_required
def unassign_card_user(card_id, user_id):
    return unassign_user_from_card(card_id=card_id, user_id=user_id)
