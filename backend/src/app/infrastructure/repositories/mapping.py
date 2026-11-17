from app.domain.models import Account, Membership, Note, Player, Riff, Room, Round, Vote
from app.domain.time import utc
from app.infrastructure.orm import (
    AccountRow,
    MembershipRow,
    PlayerRow,
    RiffRow,
    RoomRow,
    RoundRow,
    VoteRow,
)


def _account(row: AccountRow) -> Account:
    return Account(
        id=row.id,
        username=row.username,
        email=row.email,
        password_hash=row.password_hash,
        created_at=utc(row.created_at),
    )


def _player(row: PlayerRow) -> Player:
    return Player(
        id=row.id,
        nickname=row.nickname,
        account_id=row.account_id,
        session_version=row.session_version,
    )


def _room(row: RoomRow) -> Room:
    return Room(
        id=row.id,
        code=row.code,
        host_id=row.host_id,
        created_at=utc(row.created_at),
        name=row.name or f"Комната {row.code}",
        visibility=row.visibility or "public",
        capacity=row.capacity or 6,
        bars=row.bars,
        style=row.style or "Любой стиль",
        closed_at=None if row.closed_at is None else utc(row.closed_at),
    )


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
