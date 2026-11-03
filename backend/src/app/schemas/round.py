from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.models import Note
from app.domain.views import RiffView, RoundView
from app.schemas.music import NoteIn, NoteOut


class RiffIn(BaseModel):
    timbre: Literal["clean", "distortion"]
    notes: list[NoteIn] = Field(max_length=512)


class VoteIn(BaseModel):
    riff_id: UUID


class VoteOut(BaseModel):
    riff_id: UUID


class RiffOut(BaseModel):
    id: UUID
    timbre: Literal["clean", "distortion"]
    notes: list[NoteOut]
    is_own: bool
    author_id: UUID | None = None
    author_nickname: str | None = None
    votes: int | None = None
    is_winner: bool | None = None


class OwnRiffOut(BaseModel):
    id: UUID
    timbre: Literal["clean", "distortion"]
    notes: list[NoteOut]
    updated_at: datetime


class RoundOut(BaseModel):
    id: UUID
    room_id: UUID
    number: int
    stage: Literal["composing", "voting", "results"]
    loop_id: str
    loop_title: str
    loop_url: str
    bpm: int
    bars: int
    composing_started_at: datetime
    composing_ends_at: datetime
    voting_ends_at: datetime
    server_now: datetime
    own_riff: OwnRiffOut | None
    riffs: list[RiffOut] | None
    your_vote_riff_id: UUID | None
    winner_ids: list[UUID] | None


def notes_in(items: list[NoteIn]) -> list[Note]:
    return [
        Note(pitch=item.pitch, start=item.start, duration=item.duration, velocity=item.velocity)
        for item in items
    ]


def _notes_out(notes: tuple[Note, ...]) -> list[NoteOut]:
    return [
        NoteOut(pitch=note.pitch, start=note.start, duration=note.duration, velocity=note.velocity)
        for note in notes
    ]


def _riff_out(view: RiffView) -> RiffOut:
    timbre: Literal["clean", "distortion"] = (
        "distortion" if view.timbre == "distortion" else "clean"
    )
    return RiffOut(
        id=view.id,
        timbre=timbre,
        notes=_notes_out(view.notes),
        is_own=view.is_own,
        author_id=view.author_id,
        author_nickname=view.author_nickname,
        votes=view.votes,
        is_winner=view.is_winner,
    )


def own_riff_out(view: RiffView) -> OwnRiffOut:
    if view.updated_at is None:
        raise ValueError("У сохранённого риффа нет времени обновления")
    timbre: Literal["clean", "distortion"] = (
        "distortion" if view.timbre == "distortion" else "clean"
    )
    return OwnRiffOut(
        id=view.id,
        timbre=timbre,
        notes=_notes_out(view.notes),
        updated_at=view.updated_at,
    )


def round_out(view: RoundView) -> RoundOut:
    stage: Literal["composing", "voting", "results"] = (
        "voting"
        if view.stage == "voting"
        else "results"
        if view.stage == "results"
        else "composing"
    )
    own = None if view.own_riff is None else own_riff_out(view.own_riff)
    riffs = None if view.riffs is None else [_riff_out(item) for item in view.riffs]
    winners = None if view.winner_ids is None else list(view.winner_ids)
    return RoundOut(
        id=view.id,
        room_id=view.room_id,
        number=view.number,
        stage=stage,
        loop_id=view.loop_id,
        loop_title=view.loop_title,
        loop_url=view.loop_url,
        bpm=view.bpm,
        bars=view.bars,
        composing_started_at=view.composing_started_at,
        composing_ends_at=view.composing_ends_at,
        voting_ends_at=view.voting_ends_at,
        server_now=view.server_now,
        own_riff=own,
        riffs=riffs,
        your_vote_riff_id=view.your_vote_riff_id,
        winner_ids=winners,
    )
