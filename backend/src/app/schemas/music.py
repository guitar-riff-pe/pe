import re

from pydantic import BaseModel, Field, field_validator

_PITCH = re.compile(r"^[A-G](?:#|b)?[0-8]$")


def clean_nickname(value: str) -> str:
    collapsed = " ".join(value.split())
    if not 2 <= len(collapsed) <= 24:
        raise ValueError("Ник должен быть от 2 до 24 символов")
    if any(ord(char) < 32 for char in collapsed):
        raise ValueError("Ник содержит недопустимые символы")
    return collapsed


class NoteIn(BaseModel):
    pitch: str
    start: float = Field(ge=0, le=64)
    duration: float = Field(gt=0, le=64)
    velocity: int = Field(default=100, ge=1, le=127)

    @field_validator("pitch")
    @classmethod
    def known_pitch(cls, value: str) -> str:
        if _PITCH.fullmatch(value) is None:
            raise ValueError("Нужна нота вроде E2 или A#3")
        return value


class NoteOut(BaseModel):
    pitch: str
    start: float
    duration: float
    velocity: int
