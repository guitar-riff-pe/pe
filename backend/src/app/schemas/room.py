from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.domain.views import RoomView


class CreateRoomIn(BaseModel):
    name: str = Field(min_length=3, max_length=40)
    visibility: Literal["public", "private"] = "public"
    capacity: int = Field(default=4, ge=2, le=6)
    bars: Literal[4, 8] = 4
    style: Literal["Rock", "Metal", "Indie", "Любой стиль"] = "Любой стиль"

    @field_validator("name", mode="before")
    @classmethod
    def normalize_name(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value


class JoinIn(BaseModel):
    code: str = Field(min_length=4, max_length=8, pattern=r"^[A-Za-z0-9]+$")


class StartRoundIn(BaseModel):
    loop_id: str | None = None


class MemberOut(BaseModel):
    id: UUID
    nickname: str
    is_host: bool


class RoomOut(BaseModel):
    id: UUID
    code: str
    host_id: UUID
    stage: Literal["lobby", "composing", "voting", "results"]
    current_round_id: UUID | None
    members: list[MemberOut]
    name: str
    visibility: Literal["public", "private"]
    capacity: int
    bars: int | None
    style: str
    bpm: int
    players: int
    status: Literal["waiting", "playing"]


def room_out(view: RoomView) -> RoomOut:
    stage: Literal["lobby", "composing", "voting", "results"]
    if view.stage == "composing":
        stage = "composing"
    elif view.stage == "voting":
        stage = "voting"
    elif view.stage == "results":
        stage = "results"
    else:
        stage = "lobby"
    return RoomOut(
        id=view.id,
        code=view.code,
        host_id=view.host_id,
        stage=stage,
        current_round_id=view.current_round_id,
        members=[
            MemberOut(id=member.id, nickname=member.nickname, is_host=member.is_host)
            for member in view.members
        ],
        name=view.name,
        visibility="private" if view.visibility == "private" else "public",
        capacity=view.capacity,
        bars=view.bars,
        style=view.style,
        bpm=view.bpm,
        players=len(view.members),
        status="playing" if view.stage in {"composing", "voting"} else "waiting",
    )
