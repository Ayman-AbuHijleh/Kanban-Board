from flask import request, g
from models import Label, Card, CardLabel
from schemas.label_schema import LabelSchema, CreateLabelSchema, UpdateLabelSchema, CardLabelSchema
from marshmallow import ValidationError
import uuid
from utils.cache import cache
from utils import (
    logger, with_db_session,
    success_response, parse_uuid, not_found_response, bad_request_response,
    board_access_required, board_editor_required,
    get_labels_by_board, get_label_with_board
)
from sqlalchemy.orm import joinedload


@with_db_session
@board_access_required('board', 'board_id')
def get_board_labels(session, board_id):
    """Get all labels for a board"""
    board_uuid, error = parse_uuid(board_id, "board ID")
    if error:
        return error
    
    labels = get_labels_by_board(session, board_uuid)
    
    label_schema = LabelSchema(many=True)
    return success_response(
        "Labels retrieved successfully",
        {"data": label_schema.dump(labels)}
    )


@with_db_session
@board_access_required('board', 'board_id')
def create_label(session, board_id):
    """Create a new label for a board"""
    schema = CreateLabelSchema()
    board = g.board  # Set by decorator
    
    board_uuid, error = parse_uuid(board_id, "board ID")
    if error:
        return error

    data = schema.load(request.json)

    new_label = Label(
        label_id=uuid.uuid4(),
        name=data['name'],
        color=data['color'],
        board_id=board_uuid
    )

    session.add(new_label)
    session.flush()
    
    cache.delete(f"user_{g.current_user.user_id}_board_{board_id}_labels")
    logger.info(f"Label created: {new_label.name} for board {board.name}")

    label_schema = LabelSchema()
    return success_response(
        "Label created successfully",
        {"data": label_schema.dump(new_label)},
        201
    )


@with_db_session
@board_access_required('label', 'label_id')
def update_label(session, label_id):
    """Update a label"""
    schema = UpdateLabelSchema()
    board = g.board  # Set by decorator
    
    label_uuid, error = parse_uuid(label_id, "label ID")
    if error:
        return error

    data = schema.load(request.json)
    
    label = session.query(Label).filter_by(label_id=label_uuid).first()
    if not label:
        return not_found_response("Label")

    if 'name' in data:
        label.name = data['name']
    if 'color' in data:
        label.color = data['color']

    session.flush()
    
    cache.delete(f"user_{g.current_user.user_id}_board_{board.board_id}_labels")
    logger.info(f"Label updated: {label.name}")

    label_schema = LabelSchema()
    return success_response(
        "Label updated successfully",
        {"data": label_schema.dump(label)}
    )


@with_db_session
@board_access_required('label', 'label_id')
def delete_label(session, label_id):
    """Delete a label"""
    board = g.board  # Set by decorator
    
    label_uuid, error = parse_uuid(label_id, "label ID")
    if error:
        return error
    
    label = session.query(Label).filter_by(label_id=label_uuid).first()
    if not label:
        return not_found_response("Label")

    label_name = label.name
    session.delete(label)
    session.flush()
    
    cache.delete(f"user_{g.current_user.user_id}_board_{board.board_id}_labels")
    logger.info(f"Label deleted: {label_name}")

    return success_response("Label deleted successfully")


@with_db_session
@board_access_required('card', 'card_id')
def add_label_to_card(session, card_id, label_id):
    """Add a label to a card"""
    board = g.board  # Set by decorator
    
    card_uuid, error = parse_uuid(card_id, "card ID")
    if error:
        return error
    
    label_uuid, error = parse_uuid(label_id, "label ID")
    if error:
        return error

    card = session.query(Card).filter_by(card_id=card_uuid).first()
    if not card:
        return not_found_response("Card")

    label = session.query(Label).filter_by(label_id=label_uuid).first()
    if not label:
        return not_found_response("Label")

    # Check if label belongs to the same board
    if label.board_id != board.board_id:
        return bad_request_response("Label does not belong to this board")

    # Check if label is already added to the card
    existing = session.query(CardLabel).filter_by(
        card_id=card_uuid,
        label_id=label_uuid
    ).first()

    if existing:
        return bad_request_response("Label already added to this card")

    card_label = CardLabel(
        id=uuid.uuid4(),
        card_id=card_uuid,
        label_id=label_uuid
    )

    session.add(card_label)
    session.flush()
    
    cache.delete(f"user_{g.current_user.user_id}_card_{card_id}_comments")
    logger.info(f"Label {label.name} added to card {card.title}")

    card_label_with_label = session.query(CardLabel).options(
        joinedload(CardLabel.label)
    ).filter_by(id=card_label.id).first()

    card_label_schema = CardLabelSchema()
    return success_response(
        "Label added to card successfully",
        {"data": card_label_schema.dump(card_label_with_label)},
        201
    )


@with_db_session
@board_access_required('card', 'card_id')
def remove_label_from_card(session, card_id, label_id):
    """Remove a label from a card"""
    board = g.board  # Set by decorator
    
    card_uuid, error = parse_uuid(card_id, "card ID")
    if error:
        return error
    
    label_uuid, error = parse_uuid(label_id, "label ID")
    if error:
        return error

    card = session.query(Card).filter_by(card_id=card_uuid).first()
    if not card:
        return not_found_response("Card")

    card_label = session.query(CardLabel).filter_by(
        card_id=card_uuid,
        label_id=label_uuid
    ).first()

    if not card_label:
        return not_found_response("Label on this card")

    session.delete(card_label)
    session.flush()
    
    cache.delete(f"user_{g.current_user.user_id}_card_{card_id}_comments")
    logger.info(f"Label removed from card {card.title}")

    return success_response("Label removed from card successfully")
