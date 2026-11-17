from app.core.config import Settings
from app.domain.store import SessionStore, Store
from app.infrastructure.mail import Mailer
from app.services.auth import AuthService
from app.services.clock import Clock
from app.services.password_reset import PasswordResetService
from app.services.profile import ProfileService
from app.services.riff import RiffService
from app.services.room import RoomService
from app.services.round import RoundService
from app.services.session import SessionService
from app.services.tokens import JwtSessions
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
        profile: ProfileService,
        password_reset: PasswordResetService,
    ) -> None:
        self.auth = auth
        self.session = session
        self.room = room
        self.round = round
        self.riff = riff
        self.vote = vote
        self.profile = profile
        self.password_reset = password_reset


def build_services(
    settings: Settings, store: Store, sessions: SessionStore, clock: Clock, mailer: Mailer
) -> Services:
    tokens = JwtSessions(
        sessions,
        clock,
        secret=settings.jwt_secret.get_secret_value(),
        issuer=settings.jwt_issuer,
        audience=settings.jwt_audience,
        ttl_seconds=settings.session_ttl_seconds,
    )
    return Services(
        auth=AuthService(
            store,
            tokens,
            clock,
            iterations=settings.password_iterations,
        ),
        password_reset=PasswordResetService(
            store,
            clock,
            iterations=settings.password_iterations,
            mailer=mailer,
            reset_ttl=settings.reset_ttl_seconds,
            frontend_reset_url=settings.frontend_reset_url,
        ),
        session=SessionService(store, tokens, clock),
        room=RoomService(store, clock),
        round=RoundService(
            store,
            clock,
            compose_seconds=settings.compose_seconds,
            vote_seconds=settings.vote_seconds,
        ),
        riff=RiffService(store, clock),
        vote=VoteService(store, clock),
        profile=ProfileService(store, clock),
    )
