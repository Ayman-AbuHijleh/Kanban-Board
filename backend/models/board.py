import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


class Board(Base):
    __tablename__ = "boards"

    board_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)

    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)

    owner = relationship("User", back_populates="boards_owned")
    members = relationship("BoardMember", back_populates="board", cascade="all, delete-orphan")
    lists = relationship("List", back_populates="board", cascade="all, delete-orphan")
    labels = relationship("Label", back_populates="board", cascade="all, delete-orphan")
