from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.domain.views import ProfileBattleView, ProfileView
from app.schemas.music import clean_nickname


class ProfileBattleOut(BaseModel):
    id: UUID
    title: str
    date: datetime
    place: int
    votes: int


class ProfileOut(BaseModel):
    name: str
    handle: str
    joined: datetime
    battles: int
    wins: int
    votes: int
    weekly_battles: list[int] = Field(serialization_alias="weeklyBattles")
    week_starts: list[str] = Field(serialization_alias="weekStarts")
    best_round: ProfileBattleOut | None = Field(serialization_alias="bestRound")
    history: list[ProfileBattleOut]


class UpdateProfileIn(BaseModel):
    name: str
    handle: str = Field(min_length=3, max_length=25, pattern=r"^@?[\w]{3,24}$")

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return clean_nickname(value)


def _battle_out(view: ProfileBattleView) -> ProfileBattleOut:
    return ProfileBattleOut(
        id=view.id,
        title=view.title,
        date=view.date,
        place=view.place,
        votes=view.votes,
    )


def profile_out(view: ProfileView) -> ProfileOut:
    return ProfileOut(
        name=view.name,
        handle=view.handle,
        joined=view.joined,
        battles=view.battles,
        wins=view.wins,
        votes=view.votes,
        weekly_battles=list(view.weekly_battles),
        week_starts=list(view.week_starts),
        best_round=None if view.best_round is None else _battle_out(view.best_round),
        history=[_battle_out(item) for item in view.history],
    )
