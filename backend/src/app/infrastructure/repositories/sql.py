from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.domain.errors import unavailable
from app.infrastructure.migrations import migrate_existing_tables
from app.infrastructure.orm import (
    Base,
)

from .accounts import AccountsRepository
from .rooms import RoomsRepository
from .rounds import RoundsRepository


def normalize_database_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url.removeprefix("postgresql://")
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url.removeprefix("postgres://")
    return url


class SqlStore:
    def __init__(self, url: str) -> None:
        self._url = normalize_database_url(url)
        self._engine: Engine | None = None
        self._ready = False

    def ensure_ready(self) -> None:
        if self._ready:
            return
        engine = self._create_engine()
        try:
            migrate_existing_tables(engine)
            Base.metadata.create_all(engine)
        except SQLAlchemyError as exc:
            engine.dispose()
            raise unavailable("База данных недоступна") from exc
        self._engine = engine
        self._ready = True

    @contextmanager
    def transaction(self) -> Iterator[SqlTx]:
        self.ensure_ready()
        assert self._engine is not None
        session = Session(self._engine)
        try:
            yield SqlTx(session)
            session.commit()
        except Exception as exc:
            session.rollback()
            if isinstance(exc, SQLAlchemyError):
                raise unavailable("База данных недоступна") from exc
            raise
        finally:
            session.close()

    def _create_engine(self) -> Engine:
        if self._url.startswith("sqlite"):
            engine = create_engine(
                self._url,
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
            )

            @event.listens_for(engine, "connect")
            def _enable_foreign_keys(dbapi_connection: object, _record: object) -> None:
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.close()

            return engine
        return create_engine(self._url, pool_pre_ping=True)


class SqlTx(AccountsRepository, RoomsRepository, RoundsRepository):
    """Domain repositories share this transaction's SQLAlchemy session."""
