import time
from uuid import UUID

from redis import Redis
from redis.exceptions import RedisError

from app.domain.errors import unavailable


class MemorySessionStore:
    def __init__(self) -> None:
        self._items: dict[str, tuple[UUID, float]] = {}

    def put(self, token: str, player_id: UUID, ttl_seconds: int) -> None:
        self._items[token] = (player_id, time.monotonic() + ttl_seconds)

    def get(self, token: str) -> UUID | None:
        item = self._items.get(token)
        if item is None:
            return None
        player_id, expires_at = item
        if expires_at <= time.monotonic():
            del self._items[token]
            return None
        return player_id

    def delete(self, token: str) -> None:
        self._items.pop(token, None)


class RedisSessionStore:
    def __init__(self, url: str) -> None:
        self._url = url
        self._client: Redis | None = None

    def put(self, token: str, player_id: UUID, ttl_seconds: int) -> None:
        try:
            self._redis().set(self._key(token), str(player_id), ex=ttl_seconds)
        except RedisError as exc:
            raise unavailable("Хранилище сессий недоступно") from exc

    def get(self, token: str) -> UUID | None:
        try:
            raw = self._redis().get(self._key(token))
        except RedisError as exc:
            raise unavailable("Хранилище сессий недоступно") from exc
        if raw is None:
            return None
        try:
            return UUID(str(raw))
        except ValueError:
            return None

    def delete(self, token: str) -> None:
        try:
            self._redis().delete(self._key(token))
        except RedisError as exc:
            raise unavailable("Хранилище сессий недоступно") from exc

    def _redis(self) -> Redis:
        if self._client is None:
            self._client = Redis.from_url(
                self._url,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
        return self._client

    @staticmethod
    def _key(token: str) -> str:
        return f"pe:session:{token}"
