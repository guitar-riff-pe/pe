import secrets
from datetime import datetime
from uuid import UUID, uuid4

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

    def create(self, player: Player) -> RoomView:
        now = self._clock.now()
        with self._store.transaction() as tx:
            if tx.membership_for_player(player.id) is not None:
                raise conflict("Сначала выйдите из текущей комнаты")
            code = self._fresh_code(tx)
            room = Room(id=uuid4(), code=code, host_id=player.id, created_at=now)
            tx.add_room(room)
            tx.add_membership(room.id, player.id, now)
            return self._view(tx, room, now)

    def join(self, player: Player, code: str) -> RoomView:
        now = self._clock.now()
        normalized = code.strip().upper()
        with self._store.transaction() as tx:
            room = tx.get_room_by_code(normalized)
            if room is None:
                raise not_found("Комната не найдена")
            current = tx.membership_for_player(player.id)
            if current is not None and current.room_id == room.id:
                return self._view(tx, room, now)
            if current is not None:
                raise conflict("Сначала выйдите из текущей комнаты")
            latest = tx.latest_round(room.id)
            if room_stage(latest, now) in {"composing", "voting"}:
                raise conflict("Раунд уже идёт, войти нельзя")
            tx.add_membership(room.id, player.id, now)
            return self._view(tx, room, now)

    def get(self, player: Player, room_id: UUID) -> RoomView:
        now = self._clock.now()
        with self._store.transaction() as tx:
            room = require_room_member(tx, room_id, player.id)
            return self._view(tx, room, now)

    def leave(self, player: Player, room_id: UUID) -> None:
        with self._store.transaction() as tx:
            room = require_room_member(tx, room_id, player.id)
            members = tx.list_members(room.id)
            tx.delete_membership(room.id, player.id)
            remaining = [item for item in members if item.player_id != player.id]
            if not remaining:
                tx.delete_room(room.id)
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
        )
