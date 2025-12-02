from flask import Blueprint
from utils.auth import token_required
from controllers.board_controller import get_boards, create_board, update_board, delete_board
from controllers.board_member_controller import invite_member, get_board_members, update_member_role

board_bp = Blueprint('board', __name__)


@board_bp.route('/boards', methods=['GET'])
@token_required
def get_all_boards():
    return get_boards()


@board_bp.route('/boards', methods=['POST'])
@token_required
def create_new_board():
    return create_board()


@board_bp.route('/boards/<board_id>', methods=['PUT'])
@token_required
def update_existing_board(board_id):
    return update_board(board_id)


@board_bp.route('/boards/<board_id>', methods=['DELETE'])
@token_required
def delete_existing_board(board_id):
    return delete_board(board_id)


@board_bp.route('/boards/<board_id>/invite', methods=['POST'])
@token_required
def invite_board_member(board_id):
    return invite_member(board_id)


@board_bp.route('/boards/<board_id>/members', methods=['GET'])
@token_required
def get_members(board_id):
    return get_board_members(board_id)


@board_bp.route('/boards/<board_id>/members/<user_id>/role', methods=['PUT'])
@token_required
def update_role(board_id, user_id):
    return update_member_role(board_id, user_id)

