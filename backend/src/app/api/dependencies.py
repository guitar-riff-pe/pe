from typing import Annotated

from fastapi import Depends, Header, Request

from app.core.config import Settings
from app.domain.errors import unauthorized
from app.domain.models import Player
from app.domain.store import SessionStore, Store
from app.services.auth import AuthService
from app.services.clock import Clock
from app.services.health import HealthService
from app.services.riff import RiffService
from app.services.room import RoomService
from app.services.round import RoundService
from app.services.session import SessionService
from app.services.vote import VoteService


class Services:
    def __init__(
        self,
        auth: AuthService,
        session: SessionService,
        room: RoomService,
        round: RoundService,
        riff: RiffService,
        vote: VoteService,
    ) -> None:
        self.auth = auth
        self.session = session
        self.room = room
        self.round = round
        self.riff = riff
        self.vote = vote


def get_health_service() -> HealthService:
    return HealthService()


def get_services(request: Request) -> Services:
    settings: Settings = request.app.state.settings
    store: Store = request.app.state.store
    sessions: SessionStore = request.app.state.sessions
    clock: Clock = request.app.state.clock
    return Services(
        auth=AuthService(
            store,
            sessions,
            clock,
            iterations=settings.password_iterations,
            session_ttl=settings.session_ttl_seconds,
        ),
        session=SessionService(store, sessions, clock, session_ttl=settings.session_ttl_seconds),
        room=RoomService(store, clock),
        round=RoundService(
            store,
            clock,
            compose_seconds=settings.compose_seconds,
            vote_seconds=settings.vote_seconds,
        ),
        riff=RiffService(store, clock),
        vote=VoteService(store, clock),
    )


def get_bearer(authorization: Annotated[str | None, Header()] = None) -> str:
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise unauthorized()
    return token.strip()


def get_current_player(
    token: Annotated[str, Depends(get_bearer)],
    services: Annotated[Services, Depends(get_services)],
) -> Player:
    return services.session.current(token)
