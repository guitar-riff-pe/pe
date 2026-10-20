from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import Services, get_current_player, get_services
from app.domain.models import Player
from app.domain.views import player_view
from app.schemas.auth import AuthOut, GuestIn, PlayerOut, auth_out, player_out

router = APIRouter(prefix="/session", tags=["session"])


@router.post("/guest", response_model=AuthOut, status_code=201)
def guest(payload: GuestIn, services: Annotated[Services, Depends(get_services)]) -> AuthOut:
    return auth_out(services.session.guest(payload.nickname))


@router.get("/me", response_model=PlayerOut)
def me(player: Annotated[Player, Depends(get_current_player)]) -> PlayerOut:
    return player_out(player_view(player))
