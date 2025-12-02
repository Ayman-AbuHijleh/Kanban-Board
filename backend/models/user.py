import uuid
from sqlalchemy import Column, String, Enum, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash
from database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    phone = Column(String(20))
    password = Column(String(255), nullable=False)

    # Relationships
    boards_owned = relationship("Board", back_populates="owner")
    board_memberships = relationship("BoardMember", back_populates="user")
    comments = relationship("Comment", back_populates="user")
    assigned_cards = relationship("CardAssignee", back_populates="user")

    __table_args__ = (
        Index("idx_user_email", "email"),
    )

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)
