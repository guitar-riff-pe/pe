from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from app.domain.models import Note, Player


@dataclass(frozen=True, slots=True)
class PlayerView:
    id: UUID
    nickname: str
    kind: str


@dataclass(frozen=True, slots=True)
class AuthView:
    token: str
    player: PlayerView


@dataclass(frozen=True, slots=True)
class MemberView:
    id: UUID
    nickname: str
    is_host: bool


@dataclass(frozen=True, slots=True)
class RoomView:
    id: UUID
    code: str
    host_id: UUID
    stage: str
    current_round_id: UUID | None
    members: tuple[MemberView, ...]


@dataclass(frozen=True, slots=True)
class RiffView:
    id: UUID
    timbre: str
    notes: tuple[Note, ...]
    is_own: bool
    updated_at: datetime | None = None
    author_id: UUID | None = None
    author_nickname: str | None = None
    votes: int | None = None
    is_winner: bool | None = None


@dataclass(frozen=True, slots=True)
class RoundView:
    id: UUID
    room_id: UUID
    number: int
    stage: str
    loop_id: str
    loop_title: str
    loop_url: str
    bpm: int
    bars: int
    composing_started_at: datetime
    composing_ends_at: datetime
    voting_ends_at: datetime
    server_now: datetime
    own_riff: RiffView | None
    riffs: tuple[RiffView, ...] | None
    your_vote_riff_id: UUID | None
    winner_ids: tuple[UUID, ...] | None


def player_view(player: Player) -> PlayerView:
    kind = "account" if player.account_id else "guest"
    return PlayerView(id=player.id, nickname=player.nickname, kind=kind)
