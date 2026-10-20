from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.errors import app_error_handler
from app.api.router import api_router
from app.core.config import Settings, get_settings
from app.domain.errors import AppError
from app.domain.store import SessionStore, Store
from app.infrastructure.repositories.sql import SqlStore
from app.infrastructure.sessions import RedisSessionStore
from app.services.clock import Clock, SystemClock


@asynccontextmanager
async def _lifespan(application: FastAPI) -> AsyncIterator[None]:
    if application.state.settings.init_db:
        application.state.store.ensure_ready()
    yield


def create_app(
    settings: Settings | None = None,
    *,
    store: Store | None = None,
    sessions: SessionStore | None = None,
    clock: Clock | None = None,
) -> FastAPI:
    settings = settings or get_settings()
    application = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=_lifespan)
    application.state.settings = settings
    application.state.store = store if store is not None else SqlStore(settings.database_url)
    application.state.sessions = (
        sessions if sessions is not None else RedisSessionStore(settings.redis_url)
    )
    application.state.clock = clock or SystemClock()
    application.add_exception_handler(AppError, app_error_handler)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )
    application.include_router(api_router, prefix="/api/v1")
    return application


app = create_app()
