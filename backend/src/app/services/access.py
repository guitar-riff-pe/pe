from uuid import UUID

from app.domain.errors import not_found
from app.domain.models import Room, Round
from app.domain.store import Tx


def require_room_member(tx: Tx, room_id: UUID, player_id: UUID) -> Room:
    room = tx.get_room(room_id)
    if room is None or not tx.has_member(room_id, player_id):
        raise not_found("Комната не найдена")
    return room


def require_round_member(tx: Tx, round_id: UUID, player_id: UUID) -> Round:
    item = tx.get_round(round_id)
    if item is None or not tx.has_member(item.room_id, player_id):
        raise not_found("Раунд не найден")
    return item
