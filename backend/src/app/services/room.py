import secrets
from datetime import datetime
from uuid import UUID, uuid4

from app.domain.catalog import default_loop_for_bars
from app.domain.errors import conflict, not_found, unavailable
from app.domain.models import Player, Room
from app.domain.store import Store, Tx
from app.domain.views import MemberView, RoomView
from app.services.access import require_room_member
from app.services.clock import Clock
from app.services.rules import room_stage

_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


class RoomService:
    def __init__(self, store: Store, clock: Clock) -> None:
        self._store = store
        self._clock = clock

    def create(
        self,
        player: Player,
        name: str | None = None,
        visibility: str = "public",
        capacity: int = 6,
        bars: int | None = None,
        style: str = "Любой стиль",
    ) -> RoomView:
        now = self._clock.now()
        with self._store.transaction() as tx:
            if tx.membership_for_player(player.id) is not None:
                raise conflict("Сначала выйдите из текущей комнаты")
            code = self._fresh_code(tx)
            room = Room(
                id=uuid4(),
                code=code,
                host_id=player.id,
                created_at=now,
                name=name or f"Комната {code}",
                visibility=visibility,
                capacity=capacity,
                bars=bars,
                style=style,
            )
            tx.add_room(room)
            tx.add_membership(room.id, player.id, now)
            return self._view(tx, room, now)

    def join(self, player: Player, code: str) -> RoomView:
        now = self._clock.now()
        normalized = code.strip().upper()
        with self._store.transaction() as tx:
            room = tx.lock_room_by_code(normalized)
            if room is None:
                raise not_found("Комната не найдена")
            if room.closed_at is not None:
                raise not_found("Комната не найдена")
            current = tx.membership_for_player(player.id)
            if current is not None and current.room_id == room.id:
                return self._view(tx, room, now)
            if current is not None:
                raise conflict("Сначала выйдите из текущей комнаты")
            latest = tx.latest_round(room.id)
            if room_stage(latest, now) in {"composing", "voting"}:
                raise conflict("Раунд уже идёт, войти нельзя")
            if len(tx.list_members(room.id)) >= room.capacity:
                raise conflict("В комнате нет свободных мест")
            tx.add_membership(room.id, player.id, now)
            return self._view(tx, room, now)

    def get(self, player: Player, room_id: UUID) -> RoomView:
        now = self._clock.now()
        with self._store.transaction() as tx:
            room = require_room_member(tx, room_id, player.id)
            return self._view(tx, room, now)

    def list_public(self, *, limit: int = 100, offset: int = 0) -> list[RoomView]:
        now = self._clock.now()
        with self._store.transaction() as tx:
            return [self._view(tx, room, now) for room in tx.list_public_rooms(limit, offset)]

    def leave(self, player: Player, room_id: UUID) -> None:
        now = self._clock.now()
        with self._store.transaction() as tx:
            room = require_room_member(tx, room_id, player.id)
            members = tx.list_members(room.id)
            tx.delete_membership(room.id, player.id)
            remaining = [item for item in members if item.player_id != player.id]
            if not remaining:
                tx.close_room(room.id, now)
                return
            if room.host_id == player.id:
                tx.set_host(room.id, remaining[0].player_id)

    def _fresh_code(self, tx: Tx) -> str:
        for _ in range(8):
            code = "".join(secrets.choice(_CODE_ALPHABET) for _ in range(6))
            if tx.get_room_by_code(code) is None:
                return code
        raise unavailable("Не удалось создать комнату")

    def _view(self, tx: Tx, room: Room, now: datetime) -> RoomView:
        members = tx.list_members(room.id)
        latest = tx.latest_round(room.id)
        loop = default_loop_for_bars(room.bars) if latest is None else None
        return RoomView(
            id=room.id,
            code=room.code,
            host_id=room.host_id,
            stage=room_stage(latest, now),
            current_round_id=None if latest is None else latest.id,
            members=tuple(
                MemberView(
                    id=item.player_id,
                    nickname=item.nickname,
                    is_host=item.player_id == room.host_id,
                )
                for item in members
            ),
            name=room.name,
            visibility=room.visibility,
            capacity=room.capacity,
            bars=room.bars,
            style=room.style,
            bpm=latest.bpm if latest is not None else loop.bpm if loop is not None else 120,
        )
