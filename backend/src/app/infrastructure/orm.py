from datetime import datetime
from uuid import UUID

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, UniqueConstraint, Uuid
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class AccountRow(Base):
    __tablename__ = "accounts"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True)
    username: Mapped[str] = mapped_column(String(32), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class PlayerRow(Base):
    __tablename__ = "players"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True)
    nickname: Mapped[str] = mapped_column(String(32))
    account_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("accounts.id"), unique=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class RoomRow(Base):
    __tablename__ = "rooms"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True)
    code: Mapped[str] = mapped_column(String(8), unique=True)
    host_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("players.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class MembershipRow(Base):
    __tablename__ = "memberships"

    player_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("players.id"), primary_key=True
    )
    room_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("rooms.id", ondelete="CASCADE"), index=True
    )
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    position: Mapped[int] = mapped_column(Integer)


class RoundRow(Base):
    __tablename__ = "rounds"
    __table_args__ = (UniqueConstraint("room_id", "number", name="uq_round_number"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True)
    room_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("rooms.id", ondelete="CASCADE"), index=True
    )
    number: Mapped[int]
    loop_id: Mapped[str] = mapped_column(String(64))
    bpm: Mapped[int]
    bars: Mapped[int]
    composing_started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    composing_ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    voting_ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class RiffRow(Base):
    __tablename__ = "riffs"
    __table_args__ = (UniqueConstraint("round_id", "author_id", name="uq_riff_author"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True)
    round_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("rounds.id", ondelete="CASCADE"), index=True
    )
    author_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("players.id"))
    timbre: Mapped[str] = mapped_column(String(16))
    notes: Mapped[list] = mapped_column(JSON)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class VoteRow(Base):
    __tablename__ = "votes"
    __table_args__ = (UniqueConstraint("round_id", "voter_id", name="uq_vote_voter"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True)
    round_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("rounds.id", ondelete="CASCADE"), index=True
    )
    voter_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("players.id"))
    riff_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("riffs.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
