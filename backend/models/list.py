import uuid
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


class List(Base):
    __tablename__ = "lists"

    list_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(100), nullable=False)

    position = Column(Integer, nullable=False)  # ordering

    board_id = Column(UUID(as_uuid=True), ForeignKey("boards.board_id"), nullable=False)

    board = relationship("Board", back_populates="lists")
    cards = relationship("Card", back_populates="list", cascade="all, delete-orphan")
