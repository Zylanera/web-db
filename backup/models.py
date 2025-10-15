from sqlalchemy import String, Integer, Date, Float, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(10), default="user")  # 'user' | 'admin'
    collections: Mapped[list["Collection"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    books: Mapped[list["Book"]] = relationship(back_populates="owner", cascade="all, delete-orphan")

class Collection(Base):
    __tablename__ = "collections"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    owner: Mapped["User"] = relationship(back_populates="collections")
    books: Mapped[list["Book"]] = relationship(back_populates="collection")
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_user_collection_name"),)

class Book(Base):
    __tablename__ = "books"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    collection_id: Mapped[int | None] = mapped_column(ForeignKey("collections.id", ondelete="SET NULL"))
    cover: Mapped[str | None] = mapped_column(String(500))
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    price: Mapped[float] = mapped_column(Float, default=0.0)
    release_date: Mapped[Date | None] = mapped_column(Date)
    volumeNumber: Mapped[int] = mapped_column(Integer, default=1)
    isbn13: Mapped[str | None] = mapped_column(String(13))
    owner: Mapped["User"] = relationship(back_populates="books")
    collection: Mapped["Collection"] = relationship(back_populates="books")
