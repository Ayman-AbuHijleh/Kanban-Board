from flask import Blueprint
from utils.auth import token_required
from controllers.list_controller import get_lists, create_list, update_list, delete_list, move_list

list_bp = Blueprint('list', __name__)


@list_bp.route('/boards/<board_id>/lists', methods=['GET'])
@token_required
def get_board_lists(board_id):
    return get_lists(board_id)


@list_bp.route('/boards/<board_id>/lists', methods=['POST'])
@token_required
def create_board_list(board_id):
    return create_list(board_id)


@list_bp.route('/lists/<list_id>', methods=['PUT'])
@token_required
def update_board_list(list_id):
    return update_list(list_id)


@list_bp.route('/lists/<list_id>', methods=['DELETE'])
@token_required
def delete_board_list(list_id):
    return delete_list(list_id)


@list_bp.route('/lists/<list_id>/move', methods=['PUT'])
@token_required
def move_board_list(list_id):
    return move_list(list_id)

