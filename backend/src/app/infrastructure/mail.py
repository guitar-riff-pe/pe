import smtplib
from email.message import EmailMessage
from typing import Protocol

from app.domain.errors import unavailable


class Mailer(Protocol):
    def available(self) -> bool: ...

    def send_password_reset(self, recipient: str, link: str) -> None: ...


class SmtpMailer:
    def __init__(
        self,
        host: str | None,
        port: int,
        sender: str | None,
        username: str | None,
        password: str | None,
    ) -> None:
        self._host = host
        self._port = port
        self._sender = sender
        self._username = username
        self._password = password

    def available(self) -> bool:
        return bool(self._host and self._sender)

    def send_password_reset(self, recipient: str, link: str) -> None:
        if not self.available():
            raise unavailable("Отправка писем не настроена")
        assert self._host is not None and self._sender is not None
        message = EmailMessage()
        message["From"] = self._sender
        message["To"] = recipient
        message["Subject"] = "Сброс пароля Riff Battle"
        message.set_content(f"Для смены пароля откройте ссылку:\n{link}\n")
        try:
            with smtplib.SMTP(self._host, self._port, timeout=10) as smtp:
                smtp.starttls()
                if self._username and self._password:
                    smtp.login(self._username, self._password)
                smtp.send_message(message)
        except (OSError, smtplib.SMTPException) as exc:
            raise unavailable("Не удалось отправить письмо") from exc
