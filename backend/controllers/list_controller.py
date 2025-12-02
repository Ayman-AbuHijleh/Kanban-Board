from flask import jsonify, request, g
from models import Board, List
from database import Session
from schemas.list_schema import ListSchema, CreateListSchema, UpdateListSchema
from marshmallow import ValidationError
from sqlalchemy.orm import joinedload
import uuid
from utils import cache, logger


def get_lists(board_id):
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

        is_owner = board.owner_id == current_user.user_id
        is_member = any(member.user_id == current_user.user_id for member in board.members)

        if not (is_owner or is_member):
            return jsonify({"message": "You do not have access to this board"}), 403

        lists = session.query(List).filter_by(board_id=board_uuid).order_by(List.position).all()

        list_schema = ListSchema(many=True)
        return jsonify({
            "message": "Lists retrieved successfully",
            "data": list_schema.dump(lists)
        }), 200

    except Exception as e:
        logger.error(f"Error fetching lists: {str(e)}")
        return jsonify({"message": "Server Error", "error": str(e)}), 500
    finally:
        session.close()


def create_list(board_id):
    session = Session()
    current_user = g.current_user
    schema = CreateListSchema()
    try:
        try:
            board_uuid = uuid.UUID(board_id)
        except ValueError:
            return jsonify({"message": "Invalid board ID format"}), 400

        data = schema.load(request.json)
        board = session.query(Board).filter_by(board_id=board_uuid).first()

        if not board:
            return jsonify({"message": "Board not found"}), 404

        is_owner = board.owner_id == current_user.user_id
        is_member = any(member.user_id == current_user.user_id and member.role.value in ['EDITOR', 'ADMIN'] for member in board.members)

        if not (is_owner or is_member):
            return jsonify({"message": "Only board owners or editors can create lists"}), 403

        max_position = session.query(List).filter_by(board_id=board_uuid).count()
        position = data.get('position', max_position)

        new_list = List(
            list_id=uuid.uuid4(),
            board_id=board_uuid,
            title=data['title'],
            position=position
        )

        session.add(new_list)
        session.commit()
        cache.clear()
        logger.info(f"List created: {data['title']}")

        list_schema = ListSchema()
        return jsonify({
            "message": "List created successfully",
            "data": list_schema.dump(new_list)
        }), 201

    except ValidationError as err:
        session.rollback()
        return jsonify(err.messages), 400
    except Exception as e:
        session.rollback()
        logger.error(f"Error creating list: {str(e)}")
        return jsonify({"message": "Server Error", "error": str(e)}), 500
    finally:
        session.close()


def update_list(list_id):
    session = Session()
    current_user = g.current_user
    schema = UpdateListSchema()
    try:
        try:
            list_uuid = uuid.UUID(list_id)
        except ValueError:
            return jsonify({"message": "Invalid list ID format"}), 400

        data = schema.load(request.json)
        list_obj = session.query(List).options(joinedload(List.board)).filter_by(list_id=list_uuid).first()

        if not list_obj:
            return jsonify({"message": "List not found"}), 404

        board = list_obj.board
        is_owner = board.owner_id == current_user.user_id
        is_member = any(member.user_id == current_user.user_id and member.role.value in ['EDITOR', 'ADMIN'] for member in board.members)

        if not (is_owner or is_member):
            return jsonify({"message": "Only board owners or editors can update lists"}), 403

        if 'title' in data:
            list_obj.title = data['title']
        if 'position' in data:
            list_obj.position = data['position']

        session.commit()
        cache.clear()
        logger.info(f"List updated: {list_id}")

        list_schema = ListSchema()
        return jsonify({
            "message": "List updated successfully",
            "data": list_schema.dump(list_obj)
        }), 200

    except ValidationError as err:
        session.rollback()
        return jsonify(err.messages), 400
    except Exception as e:
        session.rollback()
        logger.error(f"Error updating list: {str(e)}")
        return jsonify({"message": "Server Error", "error": str(e)}), 500
    finally:
        session.close()


def delete_list(list_id):
    session = Session()
    current_user = g.current_user
    try:
        try:
            list_uuid = uuid.UUID(list_id)
        except ValueError:
            return jsonify({"message": "Invalid list ID format"}), 400

        list_obj = session.query(List).options(joinedload(List.board)).filter_by(list_id=list_uuid).first()

        if not list_obj:
            return jsonify({"message": "List not found"}), 404

        board = list_obj.board
        is_owner = board.owner_id == current_user.user_id
        is_member = any(member.user_id == current_user.user_id and member.role.value in ['EDITOR', 'ADMIN'] for member in board.members)

        if not (is_owner or is_member):
            return jsonify({"message": "Only board owners or editors can delete lists"}), 403

        session.delete(list_obj)
        session.commit()
        cache.clear()
        logger.info(f"List deleted: {list_id}")

        return jsonify({"message": "List deleted successfully"}), 200

    except Exception as e:
        session.rollback()
        logger.error(f"Error deleting list: {str(e)}")
        return jsonify({"message": "Server Error", "error": str(e)}), 500
    finally:
        session.close()
