import uuid
from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base

class CardAssignee(Base):
    __tablename__ = "card_assignees"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    card_id = Column(UUID(as_uuid=True), ForeignKey("cards.card_id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)

    # Relationships
    card = relationship("Card", back_populates="assignees")
    user = relationship("User", back_populates="assigned_cards")
