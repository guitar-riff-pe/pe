from uuid import uuid4

from app.domain.errors import unauthorized
from app.domain.models import Player
from app.domain.store import SessionStore, Store
from app.domain.views import AuthView, player_view
from app.services.clock import Clock
from app.services.tokens import issue_token


class SessionService:
    def __init__(
        self,
        store: Store,
        sessions: SessionStore,
        clock: Clock,
        *,
        session_ttl: int,
    ) -> None:
        self._store = store
        self._sessions = sessions
        self._clock = clock
        self._session_ttl = session_ttl

    def guest(self, nickname: str) -> AuthView:
        now = self._clock.now()
        player = Player(id=uuid4(), nickname=nickname, account_id=None)
        with self._store.transaction() as tx:
            tx.add_player(player, now)
        token = issue_token(self._sessions, player.id, self._session_ttl)
        return AuthView(token=token, player=player_view(player))

    def current(self, token: str) -> Player:
        player_id = self._sessions.get(token)
        if player_id is None:
            raise unauthorized()
        with self._store.transaction() as tx:
            player = tx.get_player(player_id)
        if player is None:
            raise unauthorized()
        return player
