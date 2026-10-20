from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True, slots=True)
class Note:
    pitch: str
    start: float
    duration: float
    velocity: int


@dataclass(frozen=True, slots=True)
class Player:
    id: UUID
    nickname: str
    account_id: UUID | None


@dataclass(frozen=True, slots=True)
class Account:
    id: UUID
    username: str
    password_hash: str
    created_at: datetime


@dataclass(frozen=True, slots=True)
class Room:
    id: UUID
    code: str
    host_id: UUID
    created_at: datetime


@dataclass(frozen=True, slots=True)
class Membership:
    room_id: UUID
    player_id: UUID
    nickname: str
    joined_at: datetime


@dataclass(frozen=True, slots=True)
class Round:
    id: UUID
    room_id: UUID
    number: int
    loop_id: str
    bpm: int
    bars: int
    composing_started_at: datetime
    composing_ends_at: datetime
    voting_ends_at: datetime


@dataclass(frozen=True, slots=True)
class Riff:
    id: UUID
    round_id: UUID
    author_id: UUID
    timbre: str
    notes: tuple[Note, ...]
    updated_at: datetime


@dataclass(frozen=True, slots=True)
class Vote:
    id: UUID
    round_id: UUID
    voter_id: UUID
    riff_id: UUID
    created_at: datetime
