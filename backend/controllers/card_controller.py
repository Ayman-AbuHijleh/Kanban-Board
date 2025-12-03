from flask import jsonify, request, g
from models import Board, List, Card
from database import Session
from schemas.card_schema import CardSchema, CreateCardSchema, UpdateCardSchema
from marshmallow import ValidationError
from sqlalchemy.orm import joinedload
import uuid
from utils import cache, logger


def get_cards(list_id):

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
        is_member = any(member.user_id == current_user.user_id for member in board.members)

        if not (is_owner or is_member):
            return jsonify({"message": "You do not have access to this board"}), 403

        cards = session.query(Card).filter_by(list_id=list_uuid).order_by(Card.position).all()

        card_schema = CardSchema(many=True)
        return jsonify({
            "message": "Cards retrieved successfully",
            "data": card_schema.dump(cards)
        }), 200

    except Exception as e:
        logger.error(f"Error fetching cards: {str(e)}")
        return jsonify({"message": "Server Error", "error": str(e)}), 500
    finally:
        session.close()


def create_card(list_id):
 
    session = Session()
    current_user = g.current_user
    schema = CreateCardSchema()
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
            return jsonify({"message": "Only board owners or editors can create cards"}), 403

    
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
        session.commit()
        cache.clear()
        logger.info(f"Card created: {data['title']}")

        card_schema = CardSchema()
        return jsonify({
            "message": "Card created successfully",
            "data": card_schema.dump(new_card)
        }), 201

    except ValidationError as err:
        session.rollback()
        return jsonify(err.messages), 400
    except Exception as e:
        session.rollback()
        logger.error(f"Error creating card: {str(e)}")
        return jsonify({"message": "Server Error", "error": str(e)}), 500
    finally:
        session.close()


def update_card(card_id):
    session = Session()
    current_user = g.current_user
    schema = UpdateCardSchema()
    try:
        try:
            card_uuid = uuid.UUID(card_id)
        except ValueError:
            return jsonify({"message": "Invalid card ID format"}), 400

        data = schema.load(request.json)
        card = session.query(Card).options(
            joinedload(Card.list).joinedload(List.board)
        ).filter_by(card_id=card_uuid).first()

        if not card:
            return jsonify({"message": "Card not found"}), 404

        board = card.list.board
        is_owner = board.owner_id == current_user.user_id
        is_member = any(member.user_id == current_user.user_id and member.role.value in ['EDITOR', 'ADMIN'] for member in board.members)

        if not (is_owner or is_member):
            return jsonify({"message": "Only board owners or editors can update cards"}), 403

        old_list_id = card.list_id

        if 'list_id' in data and data['list_id'] != old_list_id:
            new_list_uuid = data['list_id']
            
            new_list = session.query(List).filter_by(list_id=new_list_uuid).first()
            if not new_list:
                return jsonify({"message": "Target list not found"}), 404
            
            if new_list.board_id != board.board_id:
                return jsonify({"message": "Cannot move card to a different board"}), 400

            old_list_cards = session.query(Card).filter(
                Card.list_id == old_list_id,
                Card.position > card.position
            ).all()
            for c in old_list_cards:
                c.position -= 1

            max_position_new = session.query(Card).filter_by(list_id=new_list_uuid).count()
            card.list_id = new_list_uuid
            card.position = max_position_new

        elif 'position' in data and 'list_id' not in data:
            new_position = data['position']
            old_position = card.position
            
            if new_position != old_position:
                if new_position > old_position:
                    cards_to_shift = session.query(Card).filter(
                        Card.list_id == card.list_id,
                        Card.position > old_position,
                        Card.position <= new_position
                    ).all()
                    for c in cards_to_shift:
                        c.position -= 1
                else:
     
                    cards_to_shift = session.query(Card).filter(
                        Card.list_id == card.list_id,
                        Card.position >= new_position,
                        Card.position < old_position
                    ).all()
                    for c in cards_to_shift:
                        c.position += 1
                
                card.position = new_position

        if 'title' in data:
            card.title = data['title']
        if 'description' in data:
            card.description = data['description']
        if 'due_date' in data:
            card.due_date = data['due_date']

        session.commit()
        cache.clear()
        logger.info(f"Card updated: {card_id}")

        card_schema = CardSchema()
        return jsonify({
            "message": "Card updated successfully",
            "data": card_schema.dump(card)
        }), 200

    except ValidationError as err:
        session.rollback()
        return jsonify(err.messages), 400
    except Exception as e:
        session.rollback()
        logger.error(f"Error updating card: {str(e)}")
        return jsonify({"message": "Server Error", "error": str(e)}), 500
    finally:
        session.close()


def delete_card(card_id):
    session = Session()
    current_user = g.current_user
    try:
        try:
            card_uuid = uuid.UUID(card_id)
        except ValueError:
            return jsonify({"message": "Invalid card ID format"}), 400

        card = session.query(Card).options(
            joinedload(Card.list).joinedload(List.board)
        ).filter_by(card_id=card_uuid).first()

        if not card:
            return jsonify({"message": "Card not found"}), 404

        board = card.list.board
        is_owner = board.owner_id == current_user.user_id
        is_member = any(member.user_id == current_user.user_id and member.role.value in ['EDITOR', 'ADMIN'] for member in board.members)

        if not (is_owner or is_member):
            return jsonify({"message": "Only board owners or editors can delete cards"}), 403

        cards_to_reorder = session.query(Card).filter(
            Card.list_id == card.list_id,
            Card.position > card.position
        ).all()
        for c in cards_to_reorder:
            c.position -= 1

        session.delete(card)
        session.commit()
        cache.clear()
        logger.info(f"Card deleted: {card_id}")

        return jsonify({"message": "Card deleted successfully"}), 200

    except Exception as e:
        session.rollback()
        logger.error(f"Error deleting card: {str(e)}")
        return jsonify({"message": "Server Error", "error": str(e)}), 500
    finally:
        session.close()


def move_card(card_id):
    session = Session()
    current_user = g.current_user
    try:
        try:
            card_uuid = uuid.UUID(card_id)
        except ValueError:
            return jsonify({"message": "Invalid card ID format"}), 400

   
        data = request.json
        if not data:
            return jsonify({"message": "Request body is required"}), 400

        new_list_id = data.get('new_list_id')
        new_position = data.get('new_position')

        if new_list_id is None or new_position is None:
            return jsonify({"message": "new_list_id and new_position are required"}), 400

        try:
            new_list_uuid = uuid.UUID(new_list_id)
            new_position = int(new_position)
        except (ValueError, TypeError):
            return jsonify({"message": "Invalid new_list_id or new_position format"}), 400


        card = session.query(Card).options(
            joinedload(Card.list).joinedload(List.board)
        ).filter_by(card_id=card_uuid).first()

        if not card:
            return jsonify({"message": "Card not found"}), 404

  
        new_list = session.query(List).options(
            joinedload(List.board)
        ).filter_by(list_id=new_list_uuid).first()

        if not new_list:
            return jsonify({"message": "Target list not found"}), 404

  
        current_board = card.list.board
        is_owner_current = current_board.owner_id == current_user.user_id
        is_member_current = any(
            member.user_id == current_user.user_id and member.role.value in ['EDITOR', 'ADMIN']
            for member in current_board.members
        )

        if not (is_owner_current or is_member_current):
            return jsonify({"message": "You do not have permission to move this card"}), 403

        target_board = new_list.board
        if target_board.board_id != current_board.board_id:
            return jsonify({"message": "Cannot move card to a different board"}), 400

        old_list_id = card.list_id
        old_position = card.position

        if old_list_id == new_list_uuid:
            if old_position == new_position:
                card_schema = CardSchema()
                return jsonify({
                    "message": "Card position unchanged",
                    "data": card_schema.dump(card)
                }), 200

            if new_position > old_position:
          
                cards_to_shift = session.query(Card).filter(
                    Card.list_id == card.list_id,
                    Card.position > old_position,
                    Card.position <= new_position
                ).all()
                for c in cards_to_shift:
                    c.position -= 1
            else:
   
                cards_to_shift = session.query(Card).filter(
                    Card.list_id == card.list_id,
                    Card.position >= new_position,
                    Card.position < old_position
                ).all()
                for c in cards_to_shift:
                    c.position += 1

            card.position = new_position

        else:
            old_list_cards = session.query(Card).filter(
                Card.list_id == old_list_id,
                Card.position > old_position
            ).all()
            for c in old_list_cards:
                c.position -= 1

            new_list_cards = session.query(Card).filter(
                Card.list_id == new_list_uuid,
                Card.position >= new_position
            ).all()
            for c in new_list_cards:
                c.position += 1

            card.list_id = new_list_uuid
            card.position = new_position

        session.commit()
        cache.clear()
        logger.info(f"Card moved: {card_id} to list {new_list_id} at position {new_position}")

        card_schema = CardSchema()
        return jsonify({
            "message": "Card moved successfully",
            "data": card_schema.dump(card)
        }), 200

    except ValidationError as err:
        session.rollback()
        return jsonify(err.messages), 400
    except Exception as e:
        session.rollback()
        logger.error(f"Error moving card: {str(e)}")
        return jsonify({"message": "Server Error", "error": str(e)}), 500
    finally:
        session.close()
