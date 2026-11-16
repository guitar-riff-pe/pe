from uuid import UUID, uuid4

import jwt

from app.domain.errors import unauthorized
from app.domain.store import SessionStore
from app.services.clock import Clock


class JwtSessions:
    """Signed JWTs with revocable session IDs; raw JWTs are never stored in Redis."""

    def __init__(
        self,
        sessions: SessionStore,
        clock: Clock,
        *,
        secret: str,
        issuer: str,
        audience: str,
        ttl_seconds: int,
    ) -> None:
        self._sessions = sessions
        self._clock = clock
        self._secret = secret
        self._issuer = issuer
        self._audience = audience
        self._ttl = ttl_seconds

    def issue(self, player_id: UUID, session_version: int = 0) -> str:
        now = int(self._clock.now().timestamp())
        session_id = uuid4().hex
        token = jwt.encode(
            {
                "sub": str(player_id),
                "ver": session_version,
                "jti": session_id,
                "iat": now,
                "exp": now + self._ttl,
                "iss": self._issuer,
                "aud": self._audience,
            },
            self._secret,
            algorithm="HS256",
        )
        self._sessions.put(session_id, player_id, self._ttl)
        return token

    def _claims(self, token: str) -> tuple[UUID, str, int]:
        try:
            claims = jwt.decode(
                token,
                self._secret,
                algorithms=["HS256"],
                issuer=self._issuer,
                audience=self._audience,
                options={
                    "require": ["sub", "jti", "iat", "exp", "iss", "aud"],
                    "strict_aud": True,
                    # Use the application's injected clock for time checks below.
                    "verify_exp": False,
                    "verify_iat": False,
                    "verify_nbf": False,
                },
            )
            now = self._clock.now().timestamp()
            if (
                type(claims["iat"]) is not int
                or type(claims["exp"]) is not int
                or claims["iat"] > now
                or claims["exp"] <= now
                or claims["exp"] <= claims["iat"]
            ):
                raise ValueError("Invalid JWT lifetime")
            if "nbf" in claims and (type(claims["nbf"]) is not int or claims["nbf"] > now):
                raise ValueError("JWT is not active yet")
            version = claims.get("ver", 0)
            if type(version) is not int or version < 0:
                raise ValueError("Invalid session version")
            player_id = UUID(claims["sub"])
            session_id = UUID(claims["jti"]).hex
        except (jwt.InvalidTokenError, ValueError, TypeError, AttributeError) as exc:
            raise unauthorized() from exc
        return player_id, session_id, version

    def current(self, token: str) -> tuple[UUID, int]:
        player_id, session_id, version = self._claims(token)
        if self._sessions.get(session_id) != player_id:
            raise unauthorized()
        return player_id, version

    def revoke(self, token: str) -> None:
        _, session_id, _ = self._claims(token)
        self._sessions.delete(session_id)
