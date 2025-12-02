from flask import jsonify, request, g
from models import Board, BoardMember, User
from models.enums import BoardRole
from database import Session
from schemas.board_schema import InviteMemberSchema, UpdateMemberRoleSchema, BoardMemberSchema, BoardMembersResponseSchema
from marshmallow import ValidationError
from sqlalchemy.orm import joinedload
import uuid
from utils import cache, logger


def invite_member(board_id):
    session = Session()
    current_user = g.current_user
    schema = InviteMemberSchema()
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
            return jsonify({"message": "Only the board owner can invite members"}), 403

        user_to_invite = session.query(User).filter_by(email=data['email']).first()

        if not user_to_invite:
            return jsonify({"message": "User with this email does not exist"}), 404

        if user_to_invite.user_id == board.owner_id:
            return jsonify({"message": "Board owner is already part of the board"}), 400

        existing_member = session.query(BoardMember).filter_by(
            board_id=board_uuid,
            user_id=user_to_invite.user_id
        ).first()

        if existing_member:
            return jsonify({"message": "User is already a member of this board"}), 400

        new_member = BoardMember(
            member_id=uuid.uuid4(),
            board_id=board_uuid,
            user_id=user_to_invite.user_id,
            role=BoardRole.VIEWER
        )

        session.add(new_member)
        session.commit()
        cache.clear()
        logger.info(f"Member invited to board: {data['email']}")

        member_with_user = session.query(BoardMember).options(
            joinedload(BoardMember.user)
        ).filter_by(member_id=new_member.member_id).first()

        member_schema = BoardMemberSchema()
        return jsonify({
            "message": "Member invited successfully",
            "member": member_schema.dump(member_with_user)
        }), 201

    except ValidationError as err:
        session.rollback()
        return jsonify(err.messages), 400
    except Exception as e:
        session.rollback()
        logger.error(f"Error inviting member: {str(e)}")
        return jsonify({"message": "Server Error", "error": str(e)}), 500
    finally:
        session.close()


def get_board_members(board_id):
    session = Session()
    current_user = g.current_user
    try:
        try:
            board_uuid = uuid.UUID(board_id)
        except ValueError:
            return jsonify({"message": "Invalid board ID format"}), 400

        board = session.query(Board).options(
            joinedload(Board.owner),
            joinedload(Board.members).joinedload(BoardMember.user)
        ).filter_by(board_id=board_uuid).first()

        if not board:
            return jsonify({"message": "Board not found"}), 404

        is_owner = board.owner_id == current_user.user_id
        is_member = any(member.user_id == current_user.user_id for member in board.members)

        if not (is_owner or is_member):
            return jsonify({"message": "You do not have access to this board"}), 403

        response_schema = BoardMembersResponseSchema()
        response_data = response_schema.dump({
            'owner': board.owner,
            'members': board.members
        })

        return jsonify({
            "message": "Board members retrieved successfully",
            **response_data
        }), 200

    except Exception as e:
        logger.error(f"Error fetching board members: {str(e)}")
        return jsonify({"message": "Server Error", "error": str(e)}), 500
    finally:
        session.close()


def update_member_role(board_id, user_id):
    session = Session()
    current_user = g.current_user
    schema = UpdateMemberRoleSchema()
    try:
        try:
            board_uuid = uuid.UUID(board_id)
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            return jsonify({"message": "Invalid ID format"}), 400

        data = schema.load(request.json)
        board = session.query(Board).filter_by(board_id=board_uuid).first()

        if not board:
            return jsonify({"message": "Board not found"}), 404

        if board.owner_id != current_user.user_id:
            return jsonify({"message": "Only the board owner can update member roles"}), 403

        if user_uuid == board.owner_id:
            return jsonify({"message": "Cannot change the board owner's role"}), 400

        member = session.query(BoardMember).filter_by(
            board_id=board_uuid,
            user_id=user_uuid
        ).first()

        if not member:
            return jsonify({"message": "Member not found in this board"}), 404

        member.role = BoardRole[data['role'].upper()]
        session.commit()
        session.refresh(member)
        cache.clear()
        logger.info(f"Member role updated: {data['role']}")

        member_with_user = session.query(BoardMember).options(
            joinedload(BoardMember.user)
        ).filter_by(member_id=member.member_id).first()

        member_schema = BoardMemberSchema()
        return jsonify({
            "message": "Member role updated successfully",
            "member": member_schema.dump(member_with_user)
        }), 200

    except ValidationError as err:
        session.rollback()
        return jsonify(err.messages), 400
    except Exception as e:
        session.rollback()
        logger.error(f"Error updating member role: {str(e)}")
        return jsonify({"message": "Server Error", "error": str(e)}), 500
    finally:
        session.close()
