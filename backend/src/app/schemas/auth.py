import re
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

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
    username: str | None = Field(
        default=None, min_length=3, max_length=32, pattern=r"^[A-Za-z0-9_]+$"
    )
    email: str | None = Field(default=None, max_length=320)
    password: str = Field(min_length=8, max_length=72)
    nickname: str | None = None

    @model_validator(mode="after")
    def require_identity(self) -> "RegisterIn":
        if self.username is None and self.email is None:
            raise ValueError("Нужны email или имя пользователя")
        return self

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

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        return _email(value)


class LoginIn(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=32)
    email: str | None = Field(default=None, max_length=320)
    password: str = Field(min_length=1, max_length=72)

    @model_validator(mode="after")
    def require_identity(self) -> "LoginIn":
        if self.username is None and self.email is None:
            raise ValueError("Нужны email или имя пользователя")
        return self

    @field_validator("username", mode="before")
    @classmethod
    def normalize_username(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower()
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        return _email(value)


def _email(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip().lower()
    if re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized) is None:
        raise ValueError("Нужен корректный email")
    return normalized


class GuestIn(BaseModel):
    nickname: str

    @field_validator("nickname")
    @classmethod
    def normalize_nickname(cls, value: str) -> str:
        return clean_nickname(value)


class ResetRequestIn(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        result = _email(value)
        assert result is not None
        return result


class ResetConfirmIn(BaseModel):
    token: str = Field(min_length=20, max_length=256)
    password: str = Field(min_length=8, max_length=72)


def auth_out(view: AuthView) -> AuthOut:
    return AuthOut(token=view.token, player=player_out(view.player))


def player_out(player: PlayerView) -> PlayerOut:
    kind: Literal["guest", "account"] = "account" if player.kind == "account" else "guest"
    return PlayerOut(id=player.id, nickname=player.nickname, kind=kind)
