from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.dependencies import Services, get_current_player, get_services
from app.domain.models import Player
from app.schemas.round import OwnRiffOut, RiffIn, RoundOut, VoteIn, VoteOut, notes_in, own_riff_out
from app.schemas.round import round_out as to_round_out

router = APIRouter(prefix="/rounds", tags=["rounds"])


@router.get("/{round_id}", response_model=RoundOut)
def get_round(
    round_id: UUID,
    player: Annotated[Player, Depends(get_current_player)],
    services: Annotated[Services, Depends(get_services)],
) -> RoundOut:
    return to_round_out(services.round.get(player, round_id))


@router.put("/{round_id}/riff", response_model=OwnRiffOut)
def save_riff(
    round_id: UUID,
    payload: RiffIn,
    player: Annotated[Player, Depends(get_current_player)],
    services: Annotated[Services, Depends(get_services)],
) -> OwnRiffOut:
    saved = services.riff.save(player, round_id, payload.timbre, notes_in(payload.notes))
    return own_riff_out(saved)


@router.post("/{round_id}/votes", response_model=VoteOut, status_code=201)
def cast_vote(
    round_id: UUID,
    payload: VoteIn,
    player: Annotated[Player, Depends(get_current_player)],
    services: Annotated[Services, Depends(get_services)],
) -> VoteOut:
    return VoteOut(riff_id=services.vote.cast(player, round_id, payload.riff_id))
