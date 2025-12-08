from flask import request, g
from models import Comment
from schemas.comment_schema import CommentSchema, CreateCommentSchema
from marshmallow import ValidationError
import uuid
from utils.cache import cache
from utils import (
    logger, with_db_session,
    success_response, parse_uuid, not_found_response,
    board_access_required,
    get_comments_by_card, get_comment_with_relations,
    emit_to_board
)


@with_db_session
@board_access_required('card', 'card_id')
def get_card_comments(session, card_id):
    """Get all comments for a specific card"""
    card_uuid, error = parse_uuid(card_id, "card ID")
    if error:
        return error
    
    comments = get_comments_by_card(session, card_uuid)
    
    comment_schema = CommentSchema(many=True)
    return success_response(
        "Comments retrieved successfully",
        {"data": comment_schema.dump(comments)}
    )


@with_db_session
@board_access_required('card', 'card_id')
def create_comment(session, card_id):
    """Create a new comment on a card"""
    current_user = g.current_user
    schema = CreateCommentSchema()
    
    card_uuid, error = parse_uuid(card_id, "card ID")
    if error:
        return error

    data = schema.load(request.json)

    # Create new comment
    new_comment = Comment(
        comment_id=uuid.uuid4(),
        content=data['content'],
        card_id=card_uuid,
        user_id=current_user.user_id
    )

    session.add(new_comment)
    session.flush()
    
    cache.delete(f"user_{g.current_user.user_id}_card_{card_id}_comments")
    logger.info(f"Comment created on card {card_id} by user {current_user.user_id}")

    # Reload with user data
    new_comment = get_comment_with_relations(session, new_comment.comment_id)

    comment_schema = CommentSchema()
    comment_data = comment_schema.dump(new_comment)
    
    board = g.board  # Set by decorator
    
    response = success_response(
        "Comment created successfully",
        {"data": comment_data},
        201
    )
    
    # Emit WebSocket event (safe)
    try:
        emit_to_board(board.board_id, 'comment:created', {
            'comment': comment_data,
            'card_id': card_id
        })
    except Exception as e:
        logger.error(f"Failed to emit WebSocket event: {e}")
    
    return response


@with_db_session
@board_access_required('card', 'card_id')
def delete_comment(session, card_id, comment_id):
    """Delete a comment from a card"""
    current_user = g.current_user
    board = g.board  # Set by decorator
    
    card_uuid, error = parse_uuid(card_id, "card ID")
    if error:
        return error
    
    comment_uuid, error = parse_uuid(comment_id, "comment ID")
    if error:
        return error

    comment = session.query(Comment).filter_by(comment_id=comment_uuid).first()
    
    if not comment:
        return not_found_response("Comment")
    
    # Check if comment belongs to the card
    if comment.card_id != card_uuid:
        return not_found_response("Comment on this card")
    
    # Only comment author or board owner can delete
    if comment.user_id != current_user.user_id and board.owner_id != current_user.user_id:
        from utils import forbidden_response
        return forbidden_response("Only comment author or board owner can delete comments")

    session.delete(comment)
    session.flush()
    
    cache.delete(f"user_{g.current_user.user_id}_card_{card_id}_comments")
    logger.info(f"Comment {comment_id} deleted from card {card_id}")

    response = success_response("Comment deleted successfully")
    
    # Emit WebSocket event (safe)
    try:
        emit_to_board(board.board_id, 'comment:deleted', {
            'comment_id': comment_id,
            'card_id': card_id
        })
    except Exception as e:
        logger.error(f"Failed to emit WebSocket event: {e}")

    return response
