from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.views import RoomView


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
    )
