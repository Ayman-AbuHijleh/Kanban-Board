import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


class Label(Base):
    __tablename__ = "labels"

    label_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), nullable=False)
    color = Column(String(20), nullable=False)

    board_id = Column(UUID(as_uuid=True), ForeignKey("boards.board_id"), nullable=False)

    board = relationship("Board", back_populates="labels")
    cards = relationship("CardLabel", back_populates="label")
