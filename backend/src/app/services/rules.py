from datetime import datetime

from app.domain.errors import invalid
from app.domain.models import Note, Round

BEATS_PER_BAR = 4


def stage_at(item: Round, now: datetime) -> str:
    if now < item.composing_ends_at:
        return "composing"
    if now < item.voting_ends_at:
        return "voting"
    return "results"


def room_stage(item: Round | None, now: datetime) -> str:
    if item is None:
        return "lobby"
    return stage_at(item, now)


def ensure_notes_fit(notes: list[Note], bars: int) -> None:
    limit = bars * BEATS_PER_BAR
    for note in notes:
        if note.start + note.duration > limit + 1e-9:
            raise invalid("Нота выходит за длину лупа")
