import hashlib
import logging
import re
import secrets
from datetime import timedelta
from uuid import uuid4

from app.domain.errors import AppError, conflict, invalid, unauthorized, unavailable
from app.domain.models import Account, Player
from app.domain.store import SessionStore, Store
from app.domain.views import AuthView, player_view
from app.infrastructure.mail import Mailer
from app.services.clock import Clock
from app.services.passwords import dummy_password_hash, hash_password, verify_password
from app.services.tokens import issue_token

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(
        self,
        store: Store,
        sessions: SessionStore,
        clock: Clock,
        *,
        iterations: int,
        session_ttl: int,
        mailer: Mailer,
        reset_ttl: int,
        frontend_reset_url: str,
    ) -> None:
        self._store = store
        self._sessions = sessions
        self._clock = clock
        self._iterations = iterations
        self._session_ttl = session_ttl
        self._mailer = mailer
        self._reset_ttl = reset_ttl
        self._frontend_reset_url = frontend_reset_url

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
            player = None if account is None else tx.get_player_by_account(account.id)
        stored = account.password_hash if account else dummy_password_hash(self._iterations)
        if account is None or player is None or not verify_password(password, stored):
            raise unauthorized("Неверная почта, имя пользователя или пароль")
        return self._auth(player)

    def logout(self, token: str) -> None:
        if self._sessions.get(token) is None:
            raise unauthorized()
        self._sessions.delete(token)

    def request_password_reset(self, email: str) -> None:
        if not self._mailer.available():
            raise unavailable("Отправка писем не настроена")
        with self._store.transaction() as tx:
            account = tx.get_account_by_email(email)
            if account is None:
                return
            token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            tx.add_password_reset(
                token_hash,
                account.id,
                self._clock.now() + timedelta(seconds=self._reset_ttl),
            )
        separator = "&" if "?" in self._frontend_reset_url else "?"
        link = f"{self._frontend_reset_url}{separator}token={token}"
        try:
            self._mailer.send_password_reset(email, link)
        except AppError:
            logger.exception("Не удалось отправить письмо для сброса пароля")

    def reset_password(self, token: str, password: str) -> None:
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        with self._store.transaction() as tx:
            account_id = tx.redeem_password_reset(token_hash, self._clock.now())
            if account_id is None:
                raise invalid("Ссылка для смены пароля недействительна или устарела")
            tx.update_account_password(
                account_id,
                hash_password(password, iterations=self._iterations),
            )

    def _auth(self, player: Player) -> AuthView:
        token = issue_token(self._sessions, player.id, self._session_ttl)
        return AuthView(token=token, player=player_view(player))
