from flask import request, g
from models import List, Card
from schemas.list_schema import ListSchema, CreateListSchema, UpdateListSchema
from marshmallow import ValidationError
import uuid
from utils.cache import cache
from utils import (
    logger, with_db_session,
    success_response, parse_uuid, not_found_response, bad_request_response,
    board_access_required, board_editor_required,
    get_lists_by_board
)


@with_db_session
@board_access_required('board', 'board_id')
def get_lists(session, board_id):
    """Get all lists for a board"""
    board_uuid, error = parse_uuid(board_id, "board ID")
    if error:
        return error
    
    lists = get_lists_by_board(session, board_uuid)
    
    list_schema = ListSchema(many=True)
    return success_response(
        "Lists retrieved successfully",
        {"data": list_schema.dump(lists)}
    )


@with_db_session
@board_editor_required('board', 'board_id')
def create_list(session, board_id):
    """Create a new list on a board"""
    schema = CreateListSchema()
    board = g.board  # Set by decorator
    
    board_uuid, error = parse_uuid(board_id, "board ID")
    if error:
        return error

    data = schema.load(request.json)

    # Get the next position
    max_position = session.query(List).filter_by(board_id=board_uuid).count()
    position = data.get('position', max_position)

    new_list = List(
        list_id=uuid.uuid4(),
        board_id=board_uuid,
        title=data['title'],
        position=position
    )

    session.add(new_list)
    session.flush()
    
    cache.delete(f"user_{g.current_user.user_id}_board_{board_id}_lists")
    logger.info(f"List created: {data['title']}")

    list_schema = ListSchema()
    return success_response(
        "List created successfully",
        {"data": list_schema.dump(new_list)},
        201
    )


@with_db_session
@board_editor_required('list', 'list_id')
def update_list(session, list_id):
    """Update a list"""
    schema = UpdateListSchema()
    board = g.board  # Set by decorator
    
    list_uuid, error = parse_uuid(list_id, "list ID")
    if error:
        return error

    data = schema.load(request.json)
    
    list_obj = session.query(List).filter_by(list_id=list_uuid).first()
    if not list_obj:
        return not_found_response("List")

    if 'title' in data:
        list_obj.title = data['title']
    if 'position' in data:
        list_obj.position = data['position']

    session.flush()
    
    cache.delete(f"user_{g.current_user.user_id}_board_{board.board_id}_lists")
    logger.info(f"List updated: {list_id}")

    list_schema = ListSchema()
    return success_response(
        "List updated successfully",
        {"data": list_schema.dump(list_obj)}
    )


@with_db_session
@board_editor_required('list', 'list_id')
def delete_list(session, list_id):
    """Delete a list"""
    board = g.board  # Set by decorator
    
    list_uuid, error = parse_uuid(list_id, "list ID")
    if error:
        return error
    
    list_obj = session.query(List).filter_by(list_id=list_uuid).first()
    if not list_obj:
        return not_found_response("List")

    session.delete(list_obj)
    session.flush()
    
    cache.delete(f"user_{g.current_user.user_id}_board_{board.board_id}_lists")
    logger.info(f"List deleted: {list_id}")

    return success_response("List deleted successfully")


@with_db_session
@board_editor_required('list', 'list_id')
def move_list(session, list_id):
    """Move a list to a new position"""
    board = g.board  # Set by decorator
    
    list_uuid, error = parse_uuid(list_id, "list ID")
    if error:
        return error

    data = request.json
    if not data or 'new_position' not in data:
        return bad_request_response("new_position is required")

    try:
        new_position = int(data['new_position'])
    except (ValueError, TypeError):
        return bad_request_response("Invalid new_position format")

    list_obj = session.query(List).filter_by(list_id=list_uuid).first()
    if not list_obj:
        return not_found_response("List")

    old_position = list_obj.position

    # No change
    if old_position == new_position:
        list_schema = ListSchema()
        return success_response(
            "List position unchanged",
            {"data": list_schema.dump(list_obj)}
        )

    # Shift positions
    if new_position > old_position:
        # Moving down - shift items up
        lists_to_shift = session.query(List).filter(
            List.board_id == board.board_id,
            List.position > old_position,
            List.position <= new_position
        ).all()
        for lst in lists_to_shift:
            lst.position -= 1
    else:
        # Moving up - shift items down
        lists_to_shift = session.query(List).filter(
            List.board_id == board.board_id,
            List.position >= new_position,
            List.position < old_position
        ).all()
        for lst in lists_to_shift:
            lst.position += 1

    list_obj.position = new_position
    session.flush()
    
    cache.delete(f"user_{g.current_user.user_id}_board_{board.board_id}_lists")
    logger.info(f"List moved: {list_id} to position {new_position}")

    list_schema = ListSchema()
    return success_response(
        "List moved successfully",
        {"data": list_schema.dump(list_obj)}
    )
