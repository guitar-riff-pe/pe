from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response

from app.api.cookies import set_session_cookie
from app.api.dependencies import Services, get_current_player, get_services
from app.domain.models import Player
from app.domain.views import player_view
from app.schemas.auth import AuthOut, GuestIn, PlayerOut, auth_out, player_out

router = APIRouter(prefix="/session", tags=["session"])


@router.post("/guest", response_model=AuthOut, status_code=201)
def guest(
    payload: GuestIn,
    request: Request,
    response: Response,
    services: Annotated[Services, Depends(get_services)],
) -> AuthOut:
    view = services.session.guest(payload.nickname)
    set_session_cookie(response, view.token, request.app.state.settings)
    return auth_out(view)


@router.get("/me", response_model=PlayerOut)
def me(response: Response, player: Annotated[Player, Depends(get_current_player)]) -> PlayerOut:
    response.headers["Cache-Control"] = "no-store"
    return player_out(player_view(player))
