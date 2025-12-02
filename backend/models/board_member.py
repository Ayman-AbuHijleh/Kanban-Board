import uuid
from sqlalchemy import Column, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
from models.enums import BoardRole


class BoardMember(Base):
    __tablename__ = "board_members"

    member_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    board_id = Column(UUID(as_uuid=True), ForeignKey("boards.board_id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)

    role = Column(Enum(BoardRole, name="board_roles"), nullable=False, default=BoardRole.VIEWER)

    board = relationship("Board", back_populates="members")
    user = relationship("User", back_populates="board_memberships")
