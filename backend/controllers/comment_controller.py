from flask import request, g
from models import Comment
from schemas.comment_schema import CommentSchema, CreateCommentSchema
from marshmallow import ValidationError
import uuid
from utils.cache import cache
from utils import (
    logger, with_db_session,
    success_response, parse_uuid,
    board_access_required,
    get_comments_by_card, get_comment_with_relations
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
    return success_response(
        "Comment created successfully",
        {"data": comment_schema.dump(new_comment)},
        201
    )
