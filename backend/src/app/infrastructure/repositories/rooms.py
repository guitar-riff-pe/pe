from datetime import datetime
from uuid import UUID

from sqlalchemy import delete, func, select

from app.domain.models import Membership, Room, Round
from app.infrastructure.orm import (
    MembershipRow,
    PlayerRow,
    RoomRow,
    RoundRow,
)

from .base import SqlRepository
from .mapping import _membership, _room, _round


class RoomsRepository(SqlRepository):
    def add_room(self, room: Room) -> None:
        self._session.add(
            RoomRow(
                id=room.id,
                code=room.code,
                host_id=room.host_id,
                created_at=room.created_at,
                name=room.name,
                visibility=room.visibility,
                capacity=room.capacity,
                bars=room.bars,
                style=room.style,
                closed_at=room.closed_at,
            )
        )
        self._flush_unique("Не удалось создать комнату")

    def get_room(self, room_id: UUID) -> Room | None:
        row = self._session.get(RoomRow, room_id)
        return None if row is None else _room(row)

    def lock_room(self, room_id: UUID) -> Room | None:
        row = self._session.scalar(select(RoomRow).where(RoomRow.id == room_id).with_for_update())
        return None if row is None else _room(row)

    def get_room_by_code(self, code: str) -> Room | None:
        row = self._session.scalar(select(RoomRow).where(RoomRow.code == code))
        return None if row is None else _room(row)

    def lock_room_by_code(self, code: str) -> Room | None:
        row = self._session.scalar(select(RoomRow).where(RoomRow.code == code).with_for_update())
        return None if row is None else _room(row)

    def list_public_rooms(self, limit: int, offset: int) -> list[Room]:
        rows = self._session.scalars(
            select(RoomRow)
            .where(
                RoomRow.closed_at.is_(None),
                (RoomRow.visibility == "public") | RoomRow.visibility.is_(None),
            )
            .order_by(RoomRow.created_at.desc(), RoomRow.id)
            .offset(offset)
            .limit(limit)
        )
        return [_room(row) for row in rows]

    def set_host(self, room_id: UUID, host_id: UUID) -> None:
        row = self._session.get(RoomRow, room_id)
        if row is not None:
            row.host_id = host_id

    def close_room(self, room_id: UUID, closed_at: datetime) -> None:
        row = self._session.get(RoomRow, room_id)
        if row is not None:
            row.closed_at = closed_at

    def add_membership(self, room_id: UUID, player_id: UUID, joined_at: datetime) -> None:
        last = self._session.scalar(select(func.max(MembershipRow.position)))
        position = 0 if last is None else int(last) + 1
        self._session.add(
            MembershipRow(
                player_id=player_id,
                room_id=room_id,
                joined_at=joined_at,
                position=position,
            )
        )
        self._flush_unique("Сначала выйдите из текущей комнаты")

    def delete_membership(self, room_id: UUID, player_id: UUID) -> None:
        self._session.execute(
            delete(MembershipRow).where(
                MembershipRow.room_id == room_id,
                MembershipRow.player_id == player_id,
            )
        )

    def membership_for_player(self, player_id: UUID) -> Membership | None:
        row = self._session.execute(
            select(MembershipRow, PlayerRow)
            .join(PlayerRow, PlayerRow.id == MembershipRow.player_id)
            .where(MembershipRow.player_id == player_id)
        ).one_or_none()
        if row is None:
            return None
        membership, player = row
        return _membership(membership, player.nickname)

    def has_member(self, room_id: UUID, player_id: UUID) -> bool:
        found = self._session.scalar(
            select(MembershipRow.player_id).where(
                MembershipRow.room_id == room_id,
                MembershipRow.player_id == player_id,
            )
        )
        return found is not None

    def list_members(self, room_id: UUID) -> list[Membership]:
        rows = self._session.execute(
            select(MembershipRow, PlayerRow)
            .join(PlayerRow, PlayerRow.id == MembershipRow.player_id)
            .where(MembershipRow.room_id == room_id)
            .order_by(MembershipRow.position, MembershipRow.player_id)
        )
        return [_membership(membership, player.nickname) for membership, player in rows]

    def members_by_rooms(self, room_ids: list[UUID]) -> dict[UUID, list[Membership]]:
        result = {room_id: [] for room_id in room_ids}
        if not room_ids:
            return result
        rows = self._session.execute(
            select(MembershipRow, PlayerRow)
            .join(PlayerRow, PlayerRow.id == MembershipRow.player_id)
            .where(MembershipRow.room_id.in_(room_ids))
            .order_by(MembershipRow.position, MembershipRow.player_id)
        )
        for member, player in rows:
            result[member.room_id].append(_membership(member, player.nickname))
        return result

    def latest_rounds(self, room_ids: list[UUID]) -> dict[UUID, Round]:
        if not room_ids:
            return {}
        latest = (
            select(RoundRow.room_id, func.max(RoundRow.number).label("number"))
            .where(RoundRow.room_id.in_(room_ids))
            .group_by(RoundRow.room_id)
            .subquery()
        )
        rows = self._session.scalars(
            select(RoundRow).join(
                latest,
                (RoundRow.room_id == latest.c.room_id) & (RoundRow.number == latest.c.number),
            )
        )
        return {row.room_id: _round(row) for row in rows}
