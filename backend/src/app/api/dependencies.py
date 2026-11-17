from typing import Annotated

from fastapi import Depends, Request

from app.domain.errors import unauthorized
from app.domain.models import Player
from app.services.factory import Services, build_services
from app.services.health import HealthService


def get_health_service() -> HealthService:
    return HealthService()


def get_services(request: Request) -> Services:
    state = request.app.state
    return build_services(state.settings, state.store, state.sessions, state.clock, state.mailer)


def get_session_token(request: Request) -> str:
    token = request.cookies.get(request.app.state.settings.auth_cookie_name)
    if not token:
        raise unauthorized()
    return token


def get_current_player(
    token: Annotated[str, Depends(get_session_token)],
    services: Annotated[Services, Depends(get_services)],
) -> Player:
    return services.session.current(token)
