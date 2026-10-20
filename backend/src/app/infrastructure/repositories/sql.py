from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from datetime import datetime
from uuid import UUID

from sqlalchemy import create_engine, delete, event, func, select
from sqlalchemy.engine import Engine
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.domain.errors import conflict, unavailable
from app.domain.models import Account, Membership, Note, Player, Riff, Room, Round, Vote
from app.domain.time import utc
from app.infrastructure.orm import (
    AccountRow,
    Base,
    MembershipRow,
    PlayerRow,
    RiffRow,
    RoomRow,
    RoundRow,
    VoteRow,
)


def normalize_database_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url.removeprefix("postgresql://")
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url.removeprefix("postgres://")
    return url


class SqlStore:
    def __init__(self, url: str) -> None:
        self._url = normalize_database_url(url)
        self._engine: Engine | None = None
        self._ready = False

    def ensure_ready(self) -> None:
        if self._ready:
            return
        engine = self._create_engine()
        try:
            Base.metadata.create_all(engine)
        except SQLAlchemyError as exc:
            engine.dispose()
            raise unavailable("База данных недоступна") from exc
        self._engine = engine
        self._ready = True

    @contextmanager
    def transaction(self) -> Iterator[SqlTx]:
        self.ensure_ready()
        assert self._engine is not None
        session = Session(self._engine)
        try:
            yield SqlTx(session)
            session.commit()
        except Exception as exc:
            session.rollback()
            if isinstance(exc, SQLAlchemyError):
                raise unavailable("База данных недоступна") from exc
            raise
        finally:
            session.close()

    def _create_engine(self) -> Engine:
        if self._url.startswith("sqlite"):
            engine = create_engine(
                self._url,
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
            )

            @event.listens_for(engine, "connect")
            def _enable_foreign_keys(dbapi_connection: object, _record: object) -> None:
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.close()

            return engine
        return create_engine(self._url, pool_pre_ping=True)


class SqlTx:
    def __init__(self, session: Session) -> None:
        self._session = session

    def add_account(self, account: Account) -> None:
        self._session.add(
            AccountRow(
                id=account.id,
                username=account.username,
                password_hash=account.password_hash,
                created_at=account.created_at,
            )
        )
        self._flush_unique("Такое имя уже занято")

    def get_account_by_username(self, username: str) -> Account | None:
        row = self._session.scalar(select(AccountRow).where(AccountRow.username == username))
        return None if row is None else _account(row)

    def add_player(self, player: Player, created_at: datetime) -> None:
        self._session.add(
            PlayerRow(
                id=player.id,
                nickname=player.nickname,
                account_id=player.account_id,
                created_at=created_at,
            )
        )
        self._flush_unique("Игрок уже существует")

    def get_player(self, player_id: UUID) -> Player | None:
        row = self._session.get(PlayerRow, player_id)
        return None if row is None else _player(row)

    def get_player_by_account(self, account_id: UUID) -> Player | None:
        row = self._session.scalar(select(PlayerRow).where(PlayerRow.account_id == account_id))
        return None if row is None else _player(row)

    def players_by_ids(self, player_ids: list[UUID]) -> dict[UUID, Player]:
        if not player_ids:
            return {}
        rows = self._session.scalars(select(PlayerRow).where(PlayerRow.id.in_(player_ids)))
        return {row.id: _player(row) for row in rows}

    def add_room(self, room: Room) -> None:
        self._session.add(
            RoomRow(id=room.id, code=room.code, host_id=room.host_id, created_at=room.created_at)
        )
        self._flush_unique("Не удалось создать комнату")

    def get_room(self, room_id: UUID) -> Room | None:
        row = self._session.get(RoomRow, room_id)
        return None if row is None else _room(row)

    def get_room_by_code(self, code: str) -> Room | None:
        row = self._session.scalar(select(RoomRow).where(RoomRow.code == code))
        return None if row is None else _room(row)

    def set_host(self, room_id: UUID, host_id: UUID) -> None:
        row = self._session.get(RoomRow, room_id)
        if row is not None:
            row.host_id = host_id

    def delete_room(self, room_id: UUID) -> None:
        round_ids = list(
            self._session.scalars(select(RoundRow.id).where(RoundRow.room_id == room_id))
        )
        if round_ids:
            self._session.execute(delete(VoteRow).where(VoteRow.round_id.in_(round_ids)))
            self._session.execute(delete(RiffRow).where(RiffRow.round_id.in_(round_ids)))
            self._session.execute(delete(RoundRow).where(RoundRow.id.in_(round_ids)))
        self._session.execute(delete(MembershipRow).where(MembershipRow.room_id == room_id))
        self._session.execute(delete(RoomRow).where(RoomRow.id == room_id))

    def add_membership(self, room_id: UUID, player_id: UUID, joined_at: datetime) -> None:
        last = self._session.scalar(select(func.max(MembershipRow.position)))
        position = 0 if last is None else int(last) + 1
        self._session.add(
            MembershipRow(
                player_id=player_id,
                room_id=room_id,
                joined_at=joined_at,
                position=position,
            )
        )
        self._flush_unique("Сначала выйдите из текущей комнаты")

    def delete_membership(self, room_id: UUID, player_id: UUID) -> None:
        self._session.execute(
            delete(MembershipRow).where(
                MembershipRow.room_id == room_id,
                MembershipRow.player_id == player_id,
            )
        )

    def membership_for_player(self, player_id: UUID) -> Membership | None:
        row = self._session.execute(
            select(MembershipRow, PlayerRow)
            .join(PlayerRow, PlayerRow.id == MembershipRow.player_id)
            .where(MembershipRow.player_id == player_id)
        ).one_or_none()
        if row is None:
            return None
        membership, player = row
        return _membership(membership, player.nickname)

    def has_member(self, room_id: UUID, player_id: UUID) -> bool:
        found = self._session.scalar(
            select(MembershipRow.player_id).where(
                MembershipRow.room_id == room_id,
                MembershipRow.player_id == player_id,
            )
        )
        return found is not None

    def list_members(self, room_id: UUID) -> list[Membership]:
        rows = self._session.execute(
            select(MembershipRow, PlayerRow)
            .join(PlayerRow, PlayerRow.id == MembershipRow.player_id)
            .where(MembershipRow.room_id == room_id)
            .order_by(MembershipRow.position, MembershipRow.player_id)
        )
        return [_membership(membership, player.nickname) for membership, player in rows]

    def add_round(self, item: Round) -> None:
        self._session.add(
            RoundRow(
                id=item.id,
                room_id=item.room_id,
                number=item.number,
                loop_id=item.loop_id,
                bpm=item.bpm,
                bars=item.bars,
                composing_started_at=item.composing_started_at,
                composing_ends_at=item.composing_ends_at,
                voting_ends_at=item.voting_ends_at,
            )
        )
        self._flush_unique("Раунд ещё не закончен")

    def get_round(self, round_id: UUID) -> Round | None:
        row = self._session.get(RoundRow, round_id)
        return None if row is None else _round(row)

    def latest_round(self, room_id: UUID) -> Round | None:
        row = self._session.scalar(
            select(RoundRow)
            .where(RoundRow.room_id == room_id)
            .order_by(RoundRow.number.desc())
            .limit(1)
        )
        return None if row is None else _round(row)

    def upsert_riff(self, riff: Riff) -> Riff:
        row = self._session.scalar(
            select(RiffRow).where(
                RiffRow.round_id == riff.round_id,
                RiffRow.author_id == riff.author_id,
            )
        )
        payload = [_note_json(note) for note in riff.notes]
        if row is None:
            row = RiffRow(
                id=riff.id,
                round_id=riff.round_id,
                author_id=riff.author_id,
                timbre=riff.timbre,
                notes=payload,
                updated_at=riff.updated_at,
            )
            self._session.add(row)
        else:
            row.timbre = riff.timbre
            row.notes = payload
            row.updated_at = riff.updated_at
        self._flush_unique("Рифф уже сохранён")
        return _riff(row)

    def list_riffs(self, round_id: UUID) -> list[Riff]:
        rows = self._session.scalars(
            select(RiffRow).where(RiffRow.round_id == round_id).order_by(RiffRow.id)
        )
        return [_riff(row) for row in rows]

    def get_riff(self, riff_id: UUID) -> Riff | None:
        row = self._session.get(RiffRow, riff_id)
        return None if row is None else _riff(row)

    def add_vote(self, vote: Vote) -> None:
        self._session.add(
            VoteRow(
                id=vote.id,
                round_id=vote.round_id,
                voter_id=vote.voter_id,
                riff_id=vote.riff_id,
                created_at=vote.created_at,
            )
        )
        self._flush_unique("Вы уже проголосовали")

    def list_votes(self, round_id: UUID) -> list[Vote]:
        rows = self._session.scalars(select(VoteRow).where(VoteRow.round_id == round_id))
        return [_vote(row) for row in rows]

    def vote_by_voter(self, round_id: UUID, voter_id: UUID) -> Vote | None:
        row = self._session.scalar(
            select(VoteRow).where(VoteRow.round_id == round_id, VoteRow.voter_id == voter_id)
        )
        return None if row is None else _vote(row)

    def _flush_unique(self, message: str) -> None:
        try:
            self._session.flush()
        except IntegrityError as exc:
            raise conflict(message) from exc


def _account(row: AccountRow) -> Account:
    return Account(
        id=row.id,
        username=row.username,
        password_hash=row.password_hash,
        created_at=utc(row.created_at),
    )


def _player(row: PlayerRow) -> Player:
    return Player(id=row.id, nickname=row.nickname, account_id=row.account_id)


def _room(row: RoomRow) -> Room:
    return Room(id=row.id, code=row.code, host_id=row.host_id, created_at=utc(row.created_at))


def _membership(row: MembershipRow, nickname: str) -> Membership:
    return Membership(
        room_id=row.room_id,
        player_id=row.player_id,
        nickname=nickname,
        joined_at=utc(row.joined_at),
    )


def _round(row: RoundRow) -> Round:
    return Round(
        id=row.id,
        room_id=row.room_id,
        number=row.number,
        loop_id=row.loop_id,
        bpm=row.bpm,
        bars=row.bars,
        composing_started_at=utc(row.composing_started_at),
        composing_ends_at=utc(row.composing_ends_at),
        voting_ends_at=utc(row.voting_ends_at),
    )


def _note_json(note: Note) -> dict[str, object]:
    return {
        "pitch": note.pitch,
        "start": note.start,
        "duration": note.duration,
        "velocity": note.velocity,
    }


def _notes(payload: list[object]) -> tuple[Note, ...]:
    notes: list[Note] = []
    for item in payload:
        if not isinstance(item, dict):
            continue
        notes.append(
            Note(
                pitch=str(item["pitch"]),
                start=float(item["start"]),
                duration=float(item["duration"]),
                velocity=int(item["velocity"]),
            )
        )
    return tuple(notes)


def _riff(row: RiffRow) -> Riff:
    raw_notes = row.notes if isinstance(row.notes, list) else []
    return Riff(
        id=row.id,
        round_id=row.round_id,
        author_id=row.author_id,
        timbre=row.timbre,
        notes=_notes(raw_notes),
        updated_at=utc(row.updated_at),
    )


def _vote(row: VoteRow) -> Vote:
    return Vote(
        id=row.id,
        round_id=row.round_id,
        voter_id=row.voter_id,
        riff_id=row.riff_id,
        created_at=utc(row.created_at),
    )
