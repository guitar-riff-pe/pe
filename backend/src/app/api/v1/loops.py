from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.dependencies import get_current_player
from app.domain.catalog import LOOPS
from app.domain.models import Player

router = APIRouter(prefix="/loops", tags=["loops"])


class LoopOut(BaseModel):
    id: str
    title: str
    bpm: int
    bars: int
    url: str


@router.get("", response_model=list[LoopOut])
def list_loops(_player: Annotated[Player, Depends(get_current_player)]) -> list[LoopOut]:
    return [
        LoopOut(id=item.id, title=item.title, bpm=item.bpm, bars=item.bars, url=item.url)
        for item in LOOPS
    ]
