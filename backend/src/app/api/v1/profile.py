from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import Services, get_current_player, get_services
from app.domain.models import Player
from app.schemas.profile import ProfileOut, UpdateProfileIn, profile_out

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=ProfileOut)
def get_profile(
    player: Annotated[Player, Depends(get_current_player)],
    services: Annotated[Services, Depends(get_services)],
) -> ProfileOut:
    return profile_out(services.profile.get(player))


@router.patch("/me", response_model=ProfileOut)
def update_profile(
    payload: UpdateProfileIn,
    player: Annotated[Player, Depends(get_current_player)],
    services: Annotated[Services, Depends(get_services)],
) -> ProfileOut:
    return profile_out(services.profile.update(player, payload.name, payload.handle))
