from flask import request, g
from models import Board, BoardMember, User
from models.enums import BoardRole
from schemas.board_schema import InviteMemberSchema, UpdateMemberRoleSchema, BoardMemberSchema, BoardMembersResponseSchema
from marshmallow import ValidationError
import uuid
from utils.cache import cache
from utils import (
    logger, with_db_session,
    success_response, parse_uuid, not_found_response, bad_request_response,
    board_access_required, board_admin_required,
    get_board_with_relations, get_board_member_with_user,
    emit_to_board
)


@with_db_session
@board_admin_required('board_id')
def invite_member(session, board_id):
    """Invite a member to a board (admins and owner only)"""
    schema = InviteMemberSchema()
    board = g.board  # Set by decorator
    
    board_uuid, error = parse_uuid(board_id, "board ID")
    if error:
        return error

    data = schema.load(request.json)

    user_to_invite = session.query(User).filter_by(email=data['email']).first()

    if not user_to_invite:
        return not_found_response("User with this email")

    if user_to_invite.user_id == board.owner_id:
        return bad_request_response("Board owner is already part of the board")

    existing_member = session.query(BoardMember).filter_by(
        board_id=board_uuid,
        user_id=user_to_invite.user_id
    ).first()

    if existing_member:
        return bad_request_response("User is already a member of this board")

    new_member = BoardMember(
        member_id=uuid.uuid4(),
        board_id=board_uuid,
        user_id=user_to_invite.user_id,
        role=BoardRole.VIEWER
    )

    session.add(new_member)
    session.flush()
    
    cache.delete(f"user_{g.current_user.user_id}_board_{board_id}_members")
    logger.info(f"Member invited to board: {data['email']}")

    member_with_user = get_board_member_with_user(session, new_member.member_id)

    member_schema = BoardMemberSchema()
    member_data = member_schema.dump(member_with_user)
    
    response = success_response(
        "Member invited successfully",
        {"member": member_data},
        201
    )
    
    # Emit WebSocket event (safe)
    try:
        emit_to_board(board.board_id, 'board:member_added', {
            'member': member_data
        })
    except Exception as e:
        logger.error(f"Failed to emit WebSocket event: {e}")
    
    return response


@with_db_session
@board_access_required('board', 'board_id')
def get_board_members(session, board_id):
    """Get all members of a board"""
    board = g.board  # Set by decorator (already has owner and members loaded)
    
    response_schema = BoardMembersResponseSchema()
    response_data = response_schema.dump({
        'owner': board.owner,
        'members': board.members
    })

    return success_response(
        "Board members retrieved successfully",
        response_data
    )


@with_db_session
@board_admin_required('board_id')
def update_member_role(session, board_id, user_id):
    """Update a member's role (admins and owner only)"""
    schema = UpdateMemberRoleSchema()
    board = g.board  # Set by decorator
    
    board_uuid, error = parse_uuid(board_id, "board ID")
    if error:
        return error
    
    user_uuid, error = parse_uuid(user_id, "user ID")
    if error:
        return error

    data = schema.load(request.json)

    if user_uuid == board.owner_id:
        return bad_request_response("Cannot change the board owner's role")

    member = session.query(BoardMember).filter_by(
        board_id=board_uuid,
        user_id=user_uuid
    ).first()

    if not member:
        return not_found_response("Member in this board")

    member.role = BoardRole[data['role'].upper()]
    session.flush()
    
    cache.delete(f"user_{g.current_user.user_id}_board_{board_id}_members")
    logger.info(f"Member role updated: {data['role']}")

    member_with_user = get_board_member_with_user(session, member.member_id)

    member_schema = BoardMemberSchema()
    member_data = member_schema.dump(member_with_user)
    
    response = success_response(
        "Member role updated successfully",
        {"member": member_data}
    )
    
    # Emit WebSocket event (safe)
    try:
        emit_to_board(board.board_id, 'board:member_role_updated', {
            'member': member_data
        })
    except Exception as e:
        logger.error(f"Failed to emit WebSocket event: {e}")
    
    return response


@with_db_session
@board_admin_required('board_id')
def remove_member(session, board_id, user_id):
    """Remove a member from a board (admins and owner only)"""
    board = g.board  # Set by decorator
    
    board_uuid, error = parse_uuid(board_id, "board ID")
    if error:
        return error
    
    user_uuid, error = parse_uuid(user_id, "user ID")
    if error:
        return error

    if user_uuid == board.owner_id:
        return bad_request_response("Cannot remove the board owner")

    member = session.query(BoardMember).filter_by(
        board_id=board_uuid,
        user_id=user_uuid
    ).first()

    if not member:
        return not_found_response("Member in this board")

    session.delete(member)
    session.flush()
    
    cache.delete(f"user_{g.current_user.user_id}_board_{board_id}_members")
    logger.info(f"Member removed from board: {user_uuid}")

    response = success_response("Member removed successfully")
    
    # Emit WebSocket event (safe)
    try:
        emit_to_board(board.board_id, 'board:member_removed', {
            'user_id': user_id
        })
    except Exception as e:
        logger.error(f"Failed to emit WebSocket event: {e}")

    return response
