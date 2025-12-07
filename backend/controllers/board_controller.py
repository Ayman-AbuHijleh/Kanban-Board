from flask import request, g
from models import Board, BoardMember
from schemas.board_schema import BoardSchema, CreateBoardSchema, UpdateBoardSchema
import uuid
from utils.cache import cache
from utils import (
    logger, with_db_session,
    success_response, parse_uuid,
    board_owner_required,
    get_board_with_relations
)
from sqlalchemy.orm import joinedload


@with_db_session
def get_boards(session):
    """Get all boards for the current user (owned and member)"""
    current_user = g.current_user
    
    owned_boards = session.query(Board).filter_by(owner_id=current_user.user_id).all()
    member_boards = session.query(Board).join(BoardMember).filter(
        BoardMember.user_id == current_user.user_id
    ).all()

    all_boards = list({board.board_id: board for board in owned_boards + member_boards}.values())

    boards_with_relations = []
    for board in all_boards:
        board_with_relations = session.query(Board).options(
            joinedload(Board.owner),
            joinedload(Board.members).joinedload(BoardMember.user)
        ).filter_by(board_id=board.board_id).first()
        boards_with_relations.append(board_with_relations)

    board_schema = BoardSchema(many=True)
    return success_response(
        "Boards retrieved successfully",
        {"boards": board_schema.dump(boards_with_relations)}
    )


@with_db_session
def create_board(session):
    """Create a new board"""
    current_user = g.current_user
    schema = CreateBoardSchema()
    
    data = schema.load(request.json)

    new_board = Board(
        board_id=uuid.uuid4(),
        name=data['name'],
        owner_id=current_user.user_id
    )

    session.add(new_board)
    session.flush()
    
    cache.delete(f"user_{current_user.user_id}_boards")
    logger.info(f"Board created: {new_board.name} by {current_user.email}")

    board_with_relations = session.query(Board).options(
        joinedload(Board.owner),
        joinedload(Board.members).joinedload(BoardMember.user)
    ).filter_by(board_id=new_board.board_id).first()

    board_schema = BoardSchema()
    return success_response(
        "Board created successfully",
        {"board": board_schema.dump(board_with_relations)},
        201
    )


@with_db_session
@board_owner_required('board_id')
def update_board(session, board_id):
    """Update a board (owner only)"""
    schema = UpdateBoardSchema()
    board = g.board  # Set by decorator
    
    data = schema.load(request.json)

    board.name = data['name']
    session.flush()
    
    cache.delete(f"user_{g.current_user.user_id}_boards")
    cache.delete(f"user_{g.current_user.user_id}_board_{board_id}_lists")
    cache.delete(f"user_{g.current_user.user_id}_board_{board_id}_labels")
    cache.delete(f"user_{g.current_user.user_id}_board_{board_id}_members")
    logger.info(f"Board updated: {board.name}")

    board_with_relations = session.query(Board).options(
        joinedload(Board.owner),
        joinedload(Board.members).joinedload(BoardMember.user)
    ).filter_by(board_id=board.board_id).first()

    board_schema = BoardSchema()
    return success_response(
        "Board updated successfully",
        {"board": board_schema.dump(board_with_relations)}
    )


@with_db_session
@board_owner_required('board_id')
def delete_board(session, board_id):
    """Delete a board (owner only)"""
    board = g.board  # Set by decorator

    session.delete(board)
    session.flush()
    
    cache.delete(f"user_{g.current_user.user_id}_boards")
    logger.info(f"Board deleted: {board.name}")

    return success_response("Board deleted successfully")
