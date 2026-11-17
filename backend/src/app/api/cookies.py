from fastapi import Response

from app.core.config import Settings


def set_session_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        settings.auth_cookie_name,
        token,
        max_age=settings.session_ttl_seconds,
        expires=settings.session_ttl_seconds,
        path="/",
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
    )
    response.headers["Cache-Control"] = "no-store"


def clear_session_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        settings.auth_cookie_name,
        path="/",
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
    )
    response.headers["Cache-Control"] = "no-store"
