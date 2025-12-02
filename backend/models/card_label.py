import uuid
from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


class CardLabel(Base):
    __tablename__ = "card_labels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    card_id = Column(UUID(as_uuid=True), ForeignKey("cards.card_id"), nullable=False)
    label_id = Column(UUID(as_uuid=True), ForeignKey("labels.label_id"), nullable=False)

    card = relationship("Card", back_populates="labels")
    label = relationship("Label", back_populates="cards")
