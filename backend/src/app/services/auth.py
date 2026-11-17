import re
from uuid import uuid4

from app.domain.errors import conflict, unauthorized
from app.domain.models import Account, Player
from app.domain.store import Store
from app.domain.views import AuthView, player_view
from app.services.clock import Clock
from app.services.passwords import dummy_password_hash, hash_password, verify_password
from app.services.tokens import JwtSessions


class AuthService:
    def __init__(
        self,
        store: Store,
        tokens: JwtSessions,
        clock: Clock,
        *,
        iterations: int,
    ) -> None:
        self._store = store
        self._tokens = tokens
        self._clock = clock
        self._iterations = iterations

    def register(
        self,
        username: str | None,
        password: str,
        nickname: str | None,
        email: str | None = None,
    ) -> AuthView:
        now = self._clock.now()
        account_id = uuid4()
        generated_username = username is None
        if generated_username:
            username = (
                nickname.lower()
                if nickname and re.fullmatch(r"[\w]{3,32}", nickname)
                else f"user_{account_id.hex[:12]}"
            )
        assert username is not None
        username = username.strip().lower()
        display = nickname if nickname else username
        with self._store.transaction() as tx:
            if tx.get_account_by_username(username) is not None:
                if not generated_username:
                    raise conflict("Такое имя уже занято")
                username = f"user_{account_id.hex[:12]}"
            if email is not None and tx.get_account_by_email(email) is not None:
                raise conflict("Эта почта уже зарегистрирована")
            account = Account(
                id=account_id,
                username=username,
                email=email,
                password_hash=hash_password(password, iterations=self._iterations),
                created_at=now,
            )
            player = Player(id=uuid4(), nickname=display, account_id=account.id)
            tx.add_account(account)
            tx.add_player(player, now)
        return self._auth(player)

    def login(self, username: str | None, password: str, email: str | None = None) -> AuthView:
        with self._store.transaction() as tx:
            account = (
                tx.get_account_by_email(email)
                if email is not None
                else tx.get_account_by_username((username or "").strip().lower())
            )
            # Read the password and session version under the same account lock as reset.
            account = None if account is None else tx.lock_account(account.id)
            player = None if account is None else tx.get_player_by_account(account.id)
        stored = account.password_hash if account else dummy_password_hash(self._iterations)
        valid = verify_password(password, stored)
        if account is None or player is None or not valid:
            raise unauthorized("Неверная почта, имя пользователя или пароль")
        return self._auth(player)

    def logout(self, token: str) -> None:
        self._tokens.revoke(token)

    def _auth(self, player: Player) -> AuthView:
        token = self._tokens.issue(player.id, player.session_version)
        return AuthView(token=token, player=player_view(player))
