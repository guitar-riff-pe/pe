from uuid import uuid4

from app.domain.errors import conflict, unauthorized
from app.domain.models import Account, Player
from app.domain.store import SessionStore, Store
from app.domain.views import AuthView, player_view
from app.services.clock import Clock
from app.services.passwords import dummy_password_hash, hash_password, verify_password
from app.services.tokens import issue_token


class AuthService:
    def __init__(
        self,
        store: Store,
        sessions: SessionStore,
        clock: Clock,
        *,
        iterations: int,
        session_ttl: int,
    ) -> None:
        self._store = store
        self._sessions = sessions
        self._clock = clock
        self._iterations = iterations
        self._session_ttl = session_ttl

    def register(self, username: str, password: str, nickname: str | None) -> AuthView:
        now = self._clock.now()
        username = username.strip().lower()
        display = nickname if nickname else username
        with self._store.transaction() as tx:
            if tx.get_account_by_username(username) is not None:
                raise conflict("Такое имя уже занято")
            account = Account(
                id=uuid4(),
                username=username,
                password_hash=hash_password(password, iterations=self._iterations),
                created_at=now,
            )
            player = Player(id=uuid4(), nickname=display, account_id=account.id)
            tx.add_account(account)
            tx.add_player(player, now)
        return self._auth(player)

    def login(self, username: str, password: str) -> AuthView:
        username = username.strip().lower()
        with self._store.transaction() as tx:
            account = tx.get_account_by_username(username)
            player = None if account is None else tx.get_player_by_account(account.id)
        stored = account.password_hash if account else dummy_password_hash(self._iterations)
        if account is None or player is None or not verify_password(password, stored):
            raise unauthorized("Неверное имя или пароль")
        return self._auth(player)

    def logout(self, token: str) -> None:
        if self._sessions.get(token) is None:
            raise unauthorized()
        self._sessions.delete(token)

    def _auth(self, player: Player) -> AuthView:
        token = issue_token(self._sessions, player.id, self._session_ttl)
        return AuthView(token=token, player=player_view(player))
