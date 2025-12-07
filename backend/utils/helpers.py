"""
Helper utilities for the backend.
Includes decorators, response helpers, cache utilities, and query helpers.
"""
from functools import wraps
from flask import jsonify, g
from database import Session
from models import Board, List, Card, Label, Comment, BoardMember
from models.enums import BoardRole
from marshmallow import ValidationError
from sqlalchemy.orm import joinedload
import uuid


# ============================================================================
# DATABASE SESSION DECORATOR
# ============================================================================

def with_db_session(func):
    """
    Decorator that handles database session management.
    Automatically creates session, commits on success, rolls back on error, and closes session.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        session = Session()
        try:
            # Pass session to the function
            result = func(session, *args, **kwargs)
            session.commit()
            return result
        except ValidationError as err:
            session.rollback()
            return jsonify(err.messages), 400
        except Exception as e:
            session.rollback()
            from utils.logger import logger
            logger.error(f"Error in {func.__name__}: {str(e)}")
            return jsonify({"message": "Server Error", "error": str(e)}), 500
        finally:
            session.close()
    return wrapper


# ============================================================================
# BOARD ACCESS DECORATORS
# ============================================================================

def board_access_required(resource_type, param_name):
    """
    Decorator that checks if user has access to a board (as owner or member).
    
    Args:
        resource_type: Type of resource ('board', 'list', 'card', 'label')
        param_name: Name of the parameter containing the resource ID
    
    Sets g.board with the board object for use in the controller.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(session, *args, **kwargs):
            current_user = g.current_user
            resource_id = kwargs.get(param_name)
            
            if not resource_id:
                return jsonify({"message": f"{param_name} is required"}), 400
            
            # Get board based on resource type
            board = _get_board_from_resource(session, resource_type, resource_id)
            
            if not board:
                return jsonify({"message": f"{resource_type.capitalize()} not found"}), 404
            
            # Check access
            is_owner = board.owner_id == current_user.user_id
            is_member = any(member.user_id == current_user.user_id for member in board.members)
            
            if not (is_owner or is_member):
                return jsonify({"message": "You do not have access to this board"}), 403
            
            # Store board in g for use in controller
            g.board = board
            
            return func(session, *args, **kwargs)
        return wrapper
    return decorator


def board_editor_required(resource_type, param_name):
    """
    Decorator that checks if user has editor access to a board.
    Viewers cannot perform editing operations.
    
    Args:
        resource_type: Type of resource ('board', 'list', 'card', 'label')
        param_name: Name of the parameter containing the resource ID
    
    Sets g.board with the board object for use in the controller.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(session, *args, **kwargs):
            current_user = g.current_user
            resource_id = kwargs.get(param_name)
            
            if not resource_id:
                return jsonify({"message": f"{param_name} is required"}), 400
            
            # Get board based on resource type
            board = _get_board_from_resource(session, resource_type, resource_id)
            
            if not board:
                return jsonify({"message": f"{resource_type.capitalize()} not found"}), 404
            
            # Check if owner
            is_owner = board.owner_id == current_user.user_id
            
            if is_owner:
                g.board = board
                return func(session, *args, **kwargs)
            
            # Check if member with edit permissions
            member = next((m for m in board.members if m.user_id == current_user.user_id), None)
            
            if not member:
                return jsonify({"message": "You do not have access to this board"}), 403
            
            if member.role == BoardRole.VIEWER:
                return jsonify({"message": "You do not have permission to edit this board"}), 403
            
            g.board = board
            return func(session, *args, **kwargs)
        return wrapper
    return decorator


def board_owner_required(param_name):
    """
    Decorator that checks if user is the board owner.
    
    Args:
        param_name: Name of the parameter containing the board ID
    
    Sets g.board with the board object for use in the controller.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(session, *args, **kwargs):
            current_user = g.current_user
            board_id = kwargs.get(param_name)
            
            if not board_id:
                return jsonify({"message": f"{param_name} is required"}), 400
            
            board_uuid, error = parse_uuid(board_id, "board ID")
            if error:
                return error
            
            board = get_board_with_relations(session, board_uuid)
            
            if not board:
                return jsonify({"message": "Board not found"}), 404
            
            if board.owner_id != current_user.user_id:
                return jsonify({"message": "Only the board owner can perform this action"}), 403
            
            g.board = board
            return func(session, *args, **kwargs)
        return wrapper
    return decorator


def board_admin_required(param_name):
    """
    Decorator that checks if user has admin access to a board.
    Only ADMIN role and board owner can perform admin operations (e.g., managing members).
    
    Args:
        param_name: Name of the parameter containing the board ID
    
    Sets g.board with the board object for use in the controller.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(session, *args, **kwargs):
            current_user = g.current_user
            board_id = kwargs.get(param_name)
            
            if not board_id:
                return jsonify({"message": f"{param_name} is required"}), 400
            
            board_uuid, error = parse_uuid(board_id, "board ID")
            if error:
                return error
            
            board = get_board_with_relations(session, board_uuid)
            
            if not board:
                return jsonify({"message": "Board not found"}), 404
            
            # Check if owner
            is_owner = board.owner_id == current_user.user_id
            
            if is_owner:
                g.board = board
                return func(session, *args, **kwargs)
            
            # Check if member with admin role
            member = next((m for m in board.members if m.user_id == current_user.user_id), None)
            
            if not member:
                return jsonify({"message": "You do not have access to this board"}), 403
            
            if member.role != BoardRole.ADMIN:
                return jsonify({"message": "Only board admins can perform this action"}), 403
            
            g.board = board
            return func(session, *args, **kwargs)
        return wrapper
    return decorator


# ============================================================================
# HELPER FUNCTIONS FOR DECORATORS
# ============================================================================

def _get_board_from_resource(session, resource_type, resource_id):
    """Get board from different resource types."""
    resource_uuid, error = parse_uuid(resource_id, f"{resource_type} ID")
    if error:
        return None
    
    if resource_type == 'board':
        return get_board_with_relations(session, resource_uuid)
    elif resource_type == 'list':
        list_obj = session.query(List).filter_by(list_id=resource_uuid).first()
        if list_obj:
            return get_board_with_relations(session, list_obj.board_id)
    elif resource_type == 'card':
        card = session.query(Card).filter_by(card_id=resource_uuid).first()
        if card:
            list_obj = session.query(List).filter_by(list_id=card.list_id).first()
            if list_obj:
                return get_board_with_relations(session, list_obj.board_id)
    elif resource_type == 'label':
        label = session.query(Label).filter_by(label_id=resource_uuid).first()
        if label:
            return get_board_with_relations(session, label.board_id)
    
    return None


# ============================================================================
# RESPONSE HELPERS
# ============================================================================

def success_response(message, data=None, status_code=200):
    """Standard success response."""
    response = {"message": message}
    if data is not None:
        # If data is a dict and doesn't have nested structure, merge it
        if isinstance(data, dict) and len(data) > 0:
            # Check if it's already wrapped (has keys like 'boards', 'cards', etc.)
            response.update(data)
        else:
            response["data"] = data
    return jsonify(response), status_code


def error_response(message, status_code=400):
    """Standard error response."""
    return jsonify({"message": message}), status_code


def not_found_response(resource_name):
    """Standard not found response."""
    return jsonify({"message": f"{resource_name} not found"}), 404


def bad_request_response(message):
    """Standard bad request response."""
    return jsonify({"message": message}), 400


def unauthorized_response(message="Unauthorized"):
    """Standard unauthorized response."""
    return jsonify({"message": message}), 401


def forbidden_response(message="Forbidden"):
    """Standard forbidden response."""
    return jsonify({"message": message}), 403


# ============================================================================
# UUID PARSING
# ============================================================================

def parse_uuid(uuid_string, field_name="ID"):
    """
    Parse UUID string and return UUID object or error response.
    
    Returns:
        tuple: (uuid_object, error_response) - error_response is None on success
    """
    try:
        return uuid.UUID(uuid_string), None
    except (ValueError, AttributeError):
        return None, bad_request_response(f"Invalid {field_name} format")


# ============================================================================
# QUERY HELPERS - Centralized database queries
# ============================================================================

def get_board_with_relations(session, board_id):
    """Get board with owner and members loaded."""
    if isinstance(board_id, str):
        board_id = uuid.UUID(board_id)
    
    return session.query(Board).options(
        joinedload(Board.owner),
        joinedload(Board.members).joinedload(BoardMember.user)
    ).filter_by(board_id=board_id).first()


def get_lists_by_board(session, board_id):
    """Get all lists for a board, ordered by position."""
    if isinstance(board_id, str):
        board_id = uuid.UUID(board_id)
    
    return session.query(List).filter_by(board_id=board_id).order_by(List.position).all()


def get_cards_by_list(session, list_id):
    """Get all cards for a list, ordered by position, with labels and assignees."""
    if isinstance(list_id, str):
        list_id = uuid.UUID(list_id)
    
    from models import CardAssignee, CardLabel
    return session.query(Card).options(
        joinedload(Card.labels).joinedload(CardLabel.label),
        joinedload(Card.assignees).joinedload(CardAssignee.user)
    ).filter_by(list_id=list_id).order_by(Card.position).all()


def get_card_with_relations(session, card_id):
    """Get card with labels and assignees loaded."""
    if isinstance(card_id, str):
        card_id = uuid.UUID(card_id)
    
    from models import CardAssignee, CardLabel
    return session.query(Card).options(
        joinedload(Card.labels).joinedload(CardLabel.label),
        joinedload(Card.assignees).joinedload(CardAssignee.user)
    ).filter_by(card_id=card_id).first()


def get_labels_by_board(session, board_id):
    """Get all labels for a board."""
    if isinstance(board_id, str):
        board_id = uuid.UUID(board_id)
    
    return session.query(Label).filter_by(board_id=board_id).all()


def get_label_with_board(session, label_id):
    """Get label with board loaded."""
    if isinstance(label_id, str):
        label_id = uuid.UUID(label_id)
    
    return session.query(Label).options(
        joinedload(Label.board)
    ).filter_by(label_id=label_id).first()


def get_comments_by_card(session, card_id):
    """Get all comments for a card with user data, ordered by creation time."""
    if isinstance(card_id, str):
        card_id = uuid.UUID(card_id)
    
    return session.query(Comment).options(
        joinedload(Comment.user)
    ).filter_by(card_id=card_id).order_by(Comment.created_at).all()


def get_comment_with_relations(session, comment_id):
    """Get comment with user loaded."""
    if isinstance(comment_id, str):
        comment_id = uuid.UUID(comment_id)
    
    return session.query(Comment).options(
        joinedload(Comment.user)
    ).filter_by(comment_id=comment_id).first()


def get_board_member_with_user(session, member_id):
    """Get board member with user data loaded."""
    if isinstance(member_id, str):
        member_id = uuid.UUID(member_id)
    
    return session.query(BoardMember).options(
        joinedload(BoardMember.user)
    ).filter_by(member_id=member_id).first()
