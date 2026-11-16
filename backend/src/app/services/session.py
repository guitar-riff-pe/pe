from uuid import uuid4

from app.domain.errors import unauthorized
from app.domain.models import Player
from app.domain.store import Store
from app.domain.views import AuthView, player_view
from app.services.clock import Clock
from app.services.tokens import JwtSessions


class SessionService:
    def __init__(
        self,
        store: Store,
        tokens: JwtSessions,
        clock: Clock,
    ) -> None:
        self._store = store
        self._tokens = tokens
        self._clock = clock

    def guest(self, nickname: str) -> AuthView:
        now = self._clock.now()
        player = Player(id=uuid4(), nickname=nickname, account_id=None)
        with self._store.transaction() as tx:
            tx.add_player(player, now)
        token = self._tokens.issue(player.id)
        return AuthView(token=token, player=player_view(player))

    def current(self, token: str) -> Player:
        player_id, version = self._tokens.current(token)
        with self._store.transaction() as tx:
            player = tx.get_player(player_id)
        if player is None or player.session_version != version:
            raise unauthorized()
        return player
