from flask import request, g
from models import Card, CardLabel, CardAssignee, List, Board, BoardMember
from schemas.card_schema import CardSchema, CreateCardSchema, UpdateCardSchema, CardAssigneeSchema
from marshmallow import ValidationError
import uuid
from utils.cache import cache
from utils import (
    logger, with_db_session,
    success_response, parse_uuid, not_found_response, bad_request_response,
    board_access_required, board_editor_required,
    get_cards_by_list, get_card_with_relations,
    emit_to_board
)


@with_db_session
@board_access_required('list', 'list_id')
def get_cards(session, list_id):
    """Get all cards for a list"""
    list_uuid, error = parse_uuid(list_id, "list ID")
    if error:
        return error
    
    cards = get_cards_by_list(session, list_uuid)
    
    card_schema = CardSchema(many=True)
    return success_response(
        "Cards retrieved successfully",
        {"data": card_schema.dump(cards)}
    )


@with_db_session
@board_editor_required('list', 'list_id')
def create_card(session, list_id):
    """Create a new card"""
    schema = CreateCardSchema()
    board = g.board  # Set by decorator
    
    list_uuid, error = parse_uuid(list_id, "list ID")
    if error:
        return error

    data = schema.load(request.json)

    # Get the next position
    max_position = session.query(Card).filter_by(list_id=list_uuid).count()

    new_card = Card(
        card_id=uuid.uuid4(),
        list_id=list_uuid,
        title=data['title'],
        description=data.get('description'),
        due_date=data.get('due_date'),
        position=max_position
    )

    session.add(new_card)
    session.flush()
    
    cache.delete(f"user_{g.current_user.user_id}_list_{list_id}_cards")
    logger.info(f"Card created: {data['title']}")

    # Reload with labels and assignees
    new_card = get_card_with_relations(session, new_card.card_id)

    card_schema = CardSchema()
    card_data = card_schema.dump(new_card)
    
    response = success_response(
        "Card created successfully",
        {"data": card_data},
        201
    )
    
    # Emit WebSocket event (safe - won't break operation if it fails)
    try:
        emit_to_board(board.board_id, 'card:created', {
            'card': card_data,
            'list_id': str(list_uuid)
        })
    except Exception as e:
        logger.error(f"Failed to emit WebSocket event: {e}")
    
    return response


@with_db_session
@board_editor_required('card', 'card_id')
def update_card(session, card_id):
    """Update a card"""
    schema = UpdateCardSchema()
    board = g.board  # Set by decorator
    
    card_uuid, error = parse_uuid(card_id, "card ID")
    if error:
        return error

    data = schema.load(request.json)
    
    card = session.query(Card).filter_by(card_id=card_uuid).first()
    if not card:
        return not_found_response("Card")

    old_list_id = card.list_id

    # Handle list change
    if 'list_id' in data and data['list_id'] != old_list_id:
        new_list_uuid = data['list_id']
        
        new_list = session.query(List).filter_by(list_id=new_list_uuid).first()
        if not new_list:
            return not_found_response("Target list")
        
        if new_list.board_id != board.board_id:
            return bad_request_response("Cannot move card to a different board")

        # Shift positions in old list
        old_list_cards = session.query(Card).filter(
            Card.list_id == old_list_id,
            Card.position > card.position
        ).all()
        for c in old_list_cards:
            c.position -= 1

        # Add to end of new list
        max_position_new = session.query(Card).filter_by(list_id=new_list_uuid).count()
        card.list_id = new_list_uuid
        card.position = max_position_new

    # Handle position change within same list
    elif 'position' in data and 'list_id' not in data:
        new_position = data['position']
        old_position = card.position
        
        if new_position != old_position:
            if new_position > old_position:
                # Moving down
                cards_to_shift = session.query(Card).filter(
                    Card.list_id == card.list_id,
                    Card.position > old_position,
                    Card.position <= new_position
                ).all()
                for c in cards_to_shift:
                    c.position -= 1
            else:
                # Moving up
                cards_to_shift = session.query(Card).filter(
                    Card.list_id == card.list_id,
                    Card.position >= new_position,
                    Card.position < old_position
                ).all()
                for c in cards_to_shift:
                    c.position += 1
            
            card.position = new_position

    # Update card fields
    if 'title' in data:
        card.title = data['title']
    if 'description' in data:
        card.description = data['description']
    if 'due_date' in data:
        card.due_date = data['due_date']

    session.flush()
    
    cache.delete(f"user_{g.current_user.user_id}_list_{old_list_id}_cards")
    if 'list_id' in data and data['list_id'] != old_list_id:
        cache.delete(f"user_{g.current_user.user_id}_list_{data['list_id']}_cards")
    cache.delete(f"user_{g.current_user.user_id}_card_{card_id}_comments")
    logger.info(f"Card updated: {card_id}")

    # Reload with labels and assignees
    card = get_card_with_relations(session, card.card_id)

    card_schema = CardSchema()
    card_data = card_schema.dump(card)
    
    response = success_response(
        "Card updated successfully",
        {"data": card_data}
    )
    
    # Emit WebSocket event (safe - won't break operation if it fails)
    try:
        emit_to_board(board.board_id, 'card:updated', {
            'card': card_data,
            'old_list_id': str(old_list_id)
        })
    except Exception as e:
        logger.error(f"Failed to emit WebSocket event: {e}")
    
    return response


@with_db_session
@board_editor_required('card', 'card_id')
def delete_card(session, card_id):
    """Delete a card"""
    board = g.board  # Set by decorator
    
    card_uuid, error = parse_uuid(card_id, "card ID")
    if error:
        return error
    
    card = session.query(Card).filter_by(card_id=card_uuid).first()
    if not card:
        return not_found_response("Card")

    # Reorder remaining cards
    cards_to_reorder = session.query(Card).filter(
        Card.list_id == card.list_id,
        Card.position > card.position
    ).all()
    for c in cards_to_reorder:
        c.position -= 1

    list_id = str(card.list_id)
    session.delete(card)
    session.flush()
    
    cache.delete(f"user_{g.current_user.user_id}_list_{card.list_id}_cards")
    logger.info(f"Card deleted: {card_id}")

    response = success_response("Card deleted successfully")
    
    # Emit WebSocket event (safe - won't break operation if it fails)
    try:
        emit_to_board(board.board_id, 'card:deleted', {
            'card_id': card_id,
            'list_id': list_id
        })
    except Exception as e:
        logger.error(f"Failed to emit WebSocket event: {e}")

    return response


@with_db_session
@board_editor_required('card', 'card_id')
def move_card(session, card_id):
    """Move a card to a new list and/or position"""
    board = g.board  # Set by decorator
    
    card_uuid, error = parse_uuid(card_id, "card ID")
    if error:
        return error

    data = request.json
    if not data or 'new_list_id' not in data or 'new_position' not in data:
        return bad_request_response("new_list_id and new_position are required")

    try:
        new_list_uuid = uuid.UUID(data['new_list_id'])
        new_position = int(data['new_position'])
    except (ValueError, TypeError):
        return bad_request_response("Invalid new_list_id or new_position format")

    card = session.query(Card).filter_by(card_id=card_uuid).first()
    if not card:
        return not_found_response("Card")

    new_list = session.query(List).filter_by(list_id=new_list_uuid).first()
    if not new_list:
        return not_found_response("Target list")

    if new_list.board_id != board.board_id:
        return bad_request_response("Cannot move card to a different board")

    old_list_id = card.list_id
    old_position = card.position

    if old_list_id == new_list_uuid:
        # Moving within same list
        if old_position == new_position:
            card_schema = CardSchema()
            return success_response(
                "Card position unchanged",
                {"data": card_schema.dump(card)}
            )

        if new_position > old_position:
            # Moving down
            cards_to_shift = session.query(Card).filter(
                Card.list_id == card.list_id,
                Card.position > old_position,
                Card.position <= new_position
            ).all()
            for c in cards_to_shift:
                c.position -= 1
        else:
            # Moving up
            cards_to_shift = session.query(Card).filter(
                Card.list_id == card.list_id,
                Card.position >= new_position,
                Card.position < old_position
            ).all()
            for c in cards_to_shift:
                c.position += 1

        card.position = new_position
    else:
        # Moving to different list
        # Shift positions in old list
        old_list_cards = session.query(Card).filter(
            Card.list_id == old_list_id,
            Card.position > old_position
        ).all()
        for c in old_list_cards:
            c.position -= 1

        # Make space in new list
        new_list_cards = session.query(Card).filter(
            Card.list_id == new_list_uuid,
            Card.position >= new_position
        ).all()
        for c in new_list_cards:
            c.position += 1

        card.list_id = new_list_uuid
        card.position = new_position

    session.flush()
    
    cache.delete(f"user_{g.current_user.user_id}_list_{old_list_id}_cards")
    if old_list_id != new_list_uuid:
        cache.delete(f"user_{g.current_user.user_id}_list_{new_list_uuid}_cards")
    logger.info(f"Card moved: {card_id} to list {new_list_uuid} at position {new_position}")

    # Reload with labels and assignees
    card = get_card_with_relations(session, card.card_id)

    card_schema = CardSchema()
    card_data = card_schema.dump(card)
    
    # Prepare response before WebSocket emit
    response = success_response(
        "Card moved successfully",
        {"data": card_data}
    )
    
    # Emit WebSocket event (in try-except to prevent it from breaking the operation)
    try:
        emit_to_board(board.board_id, 'card:moved', {
            'card': card_data,
            'old_list_id': str(old_list_id),
            'new_list_id': str(new_list_uuid),
            'new_position': new_position
        })
    except Exception as e:
        logger.error(f"Failed to emit WebSocket event: {e}")
    
    return response


@with_db_session
@board_access_required('card', 'card_id')
def assign_user_to_card(session, card_id):
    """Assign a user to a card"""
    board = g.board  # Set by decorator
    
    card_uuid, error = parse_uuid(card_id, "card ID")
    if error:
        return error

    data = request.json
    if not data or 'user_id' not in data:
        return bad_request_response("user_id is required")

    user_uuid, error = parse_uuid(data['user_id'], "user ID")
    if error:
        return error

    # Check if the user to be assigned is a board member or owner
    user_is_owner = board.owner_id == user_uuid
    user_is_member = any(member.user_id == user_uuid for member in board.members)

    if not (user_is_owner or user_is_member):
        return bad_request_response("User is not a member of this board")

    # Check if user is already assigned
    existing_assignment = session.query(CardAssignee).filter_by(
        card_id=card_uuid,
        user_id=user_uuid
    ).first()

    if existing_assignment:
        return bad_request_response("User is already assigned to this card")

    # Create assignment
    new_assignment = CardAssignee(
        id=uuid.uuid4(),
        card_id=card_uuid,
        user_id=user_uuid
    )

    session.add(new_assignment)
    session.flush()
    
    # Invalidate card comments cache since card details changed
    cache.delete(f"user_{g.current_user.user_id}_card_{card_id}_comments")
    logger.info(f"User {user_uuid} assigned to card {card_id}")

    # Reload with user data
    from sqlalchemy.orm import joinedload
    assignment_with_user = session.query(CardAssignee).options(
        joinedload(CardAssignee.user)
    ).filter_by(id=new_assignment.id).first()

    assignee_schema = CardAssigneeSchema()
    assignee_data = assignee_schema.dump(assignment_with_user)
    
    response = success_response(
        "User assigned to card successfully",
        {"data": assignee_data},
        201
    )
    
    # Emit WebSocket event (safe - won't break operation if it fails)
    try:
        emit_to_board(board.board_id, 'card:assignee_added', {
            'card_id': card_id,
            'assignee': assignee_data
        })
    except Exception as e:
        logger.error(f"Failed to emit WebSocket event: {e}")
    
    return response


@with_db_session
@board_access_required('card', 'card_id')
def unassign_user_from_card(session, card_id, user_id):
    """Remove a user assignment from a card"""
    board = g.board  # Set by decorator
    
    card_uuid, error = parse_uuid(card_id, "card ID")
    if error:
        return error
    
    user_uuid, error = parse_uuid(user_id, "user ID")
    if error:
        return error

    # Find the assignment
    assignment = session.query(CardAssignee).filter_by(
        card_id=card_uuid,
        user_id=user_uuid
    ).first()

    if not assignment:
        return not_found_response("User assignment")

    session.delete(assignment)
    session.flush()
    
    # Invalidate card comments cache since card details changed
    cache.delete(f"user_{g.current_user.user_id}_card_{card_id}_comments")
    logger.info(f"User {user_id} unassigned from card {card_id}")

    response = success_response("User unassigned from card successfully")
    
    # Emit WebSocket event (safe - won't break operation if it fails)
    try:
        emit_to_board(board.board_id, 'card:assignee_removed', {
            'card_id': card_id,
            'user_id': user_id
        })
    except Exception as e:
        logger.error(f"Failed to emit WebSocket event: {e}")

    return response
