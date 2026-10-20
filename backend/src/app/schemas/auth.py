from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.domain.views import AuthView, PlayerView
from app.schemas.music import clean_nickname


class PlayerOut(BaseModel):
    id: UUID
    nickname: str
    kind: Literal["guest", "account"]


class AuthOut(BaseModel):
    token: str
    player: PlayerOut


class RegisterIn(BaseModel):
    username: str = Field(min_length=3, max_length=32, pattern=r"^[A-Za-z0-9_]+$")
    password: str = Field(min_length=8, max_length=72)
    nickname: str | None = None

    @field_validator("username", mode="before")
    @classmethod
    def normalize_username(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower()
        return value

    @field_validator("nickname")
    @classmethod
    def normalize_nickname(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return clean_nickname(value)


class LoginIn(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=1, max_length=72)

    @field_validator("username", mode="before")
    @classmethod
    def normalize_username(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower()
        return value


class GuestIn(BaseModel):
    nickname: str

    @field_validator("nickname")
    @classmethod
    def normalize_nickname(cls, value: str) -> str:
        return clean_nickname(value)


def auth_out(view: AuthView) -> AuthOut:
    return AuthOut(token=view.token, player=player_out(view.player))


def player_out(player: PlayerView) -> PlayerOut:
    kind: Literal["guest", "account"] = "account" if player.kind == "account" else "guest"
    return PlayerOut(id=player.id, nickname=player.nickname, kind=kind)
