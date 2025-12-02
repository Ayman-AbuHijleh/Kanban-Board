from flask import jsonify, request, g
from models import Board, BoardMember, User
from database import Session
from schemas.board_schema import BoardSchema, CreateBoardSchema, UpdateBoardSchema
from marshmallow import ValidationError
from sqlalchemy.orm import joinedload
import uuid
from utils import cache, logger


def get_boards():
    session = Session()
    current_user = g.current_user
    try:
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
        return jsonify({
            "message": "Boards retrieved successfully",
            "boards": board_schema.dump(boards_with_relations)
        }), 200

    except Exception as e:
        logger.error(f"Error fetching boards: {str(e)}")
        return jsonify({"message": "Server Error", "error": str(e)}), 500
    finally:
        session.close()


def create_board():
    session = Session()
    current_user = g.current_user
    schema = CreateBoardSchema()
    try:
        data = schema.load(request.json)

        new_board = Board(
            board_id=uuid.uuid4(),
            name=data['name'],
            owner_id=current_user.user_id
        )

        session.add(new_board)
        session.commit()
        cache.clear()
        logger.info(f"Board created: {new_board.name} by {current_user.email}")

        board_with_relations = session.query(Board).options(
            joinedload(Board.owner),
            joinedload(Board.members).joinedload(BoardMember.user)
        ).filter_by(board_id=new_board.board_id).first()

        board_schema = BoardSchema()
        return jsonify({
            "message": "Board created successfully",
            "board": board_schema.dump(board_with_relations)
        }), 201

    except ValidationError as err:
        session.rollback()
        return jsonify(err.messages), 400
    except Exception as e:
        session.rollback()
        logger.error(f"Error creating board: {str(e)}")
        return jsonify({"message": "Server Error", "error": str(e)}), 500
    finally:
        session.close()


def update_board(board_id):
    session = Session()
    current_user = g.current_user
    schema = UpdateBoardSchema()
    try:
        try:
            board_uuid = uuid.UUID(board_id)
        except ValueError:
            return jsonify({"message": "Invalid board ID format"}), 400

        data = schema.load(request.json)
        board = session.query(Board).filter_by(board_id=board_uuid).first()

        if not board:
            return jsonify({"message": "Board not found"}), 404

        if board.owner_id != current_user.user_id:
            return jsonify({"message": "Only the board owner can update the board"}), 403

        board.name = data['name']
        session.commit()
        cache.clear()
        logger.info(f"Board updated: {board.name}")

        board_with_relations = session.query(Board).options(
            joinedload(Board.owner),
            joinedload(Board.members).joinedload(BoardMember.user)
        ).filter_by(board_id=board.board_id).first()

        board_schema = BoardSchema()
        return jsonify({
            "message": "Board updated successfully",
            "board": board_schema.dump(board_with_relations)
        }), 200

    except ValidationError as err:
        session.rollback()
        return jsonify(err.messages), 400
    except Exception as e:
        session.rollback()
        logger.error(f"Error updating board: {str(e)}")
        return jsonify({"message": "Server Error", "error": str(e)}), 500
    finally:
        session.close()


def delete_board(board_id):
    session = Session()
    current_user = g.current_user
    try:
        try:
            board_uuid = uuid.UUID(board_id)
        except ValueError:
            return jsonify({"message": "Invalid board ID format"}), 400

        board = session.query(Board).filter_by(board_id=board_uuid).first()

        if not board:
            return jsonify({"message": "Board not found"}), 404

        if board.owner_id != current_user.user_id:
            return jsonify({"message": "Only the board owner can delete the board"}), 403

        session.delete(board)
        session.commit()
        cache.clear()
        logger.info(f"Board deleted: {board.name}")

        return jsonify({"message": "Board deleted successfully"}), 200

    except Exception as e:
        session.rollback()
        logger.error(f"Error deleting board: {str(e)}")
        return jsonify({"message": "Server Error", "error": str(e)}), 500
    finally:
        session.close()
