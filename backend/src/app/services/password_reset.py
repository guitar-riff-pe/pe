import hashlib
import logging
import secrets
from datetime import timedelta

from app.domain.errors import AppError, invalid, unavailable
from app.domain.store import Store
from app.infrastructure.mail import Mailer
from app.services.clock import Clock
from app.services.passwords import hash_password

logger = logging.getLogger(__name__)


class PasswordResetService:
    def __init__(
        self,
        store: Store,
        clock: Clock,
        *,
        iterations: int,
        mailer: Mailer,
        reset_ttl: int,
        frontend_reset_url: str,
    ) -> None:
        self._store = store
        self._clock = clock
        self._iterations = iterations
        self._mailer = mailer
        self._reset_ttl = reset_ttl
        self._frontend_reset_url = frontend_reset_url

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
