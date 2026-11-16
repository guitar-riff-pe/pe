from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.domain.errors import conflict


class SqlRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def _flush_unique(self, message: str) -> None:
        try:
            self._session.flush()
        except IntegrityError as exc:
            raise conflict(message) from exc
