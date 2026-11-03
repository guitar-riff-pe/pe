import secrets
from uuid import UUID

from app.domain.store import SessionStore


def issue_token(sessions: SessionStore, player_id: UUID, ttl_seconds: int) -> str:
    token = secrets.token_urlsafe(32)
    sessions.put(token, player_id, ttl_seconds)
    return token
