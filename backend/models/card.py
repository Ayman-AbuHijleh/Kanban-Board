import uuid
from sqlalchemy import Column, String, Text, Date, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


class Card(Base):
    __tablename__ = "cards"

    card_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(150), nullable=False)
    description = Column(Text)
    due_date = Column(Date)
    position = Column(Integer, nullable=False)

    list_id = Column(UUID(as_uuid=True), ForeignKey("lists.list_id"), nullable=False)

    list = relationship("List", back_populates="cards")
    comments = relationship("Comment", back_populates="card")
    assignees = relationship("CardAssignee", back_populates="card")
    labels = relationship("CardLabel", back_populates="card")
