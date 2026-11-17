from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select

from app.domain.models import Riff, Room, Round, Vote
from app.infrastructure.orm import (
    RiffRow,
    RoomRow,
    RoundRow,
    VoteRow,
)

from .base import SqlRepository
from .mapping import _note_json, _riff, _room, _round, _vote


class RoundsRepository(SqlRepository):
    def add_round(self, item: Round) -> None:
        self._session.add(
            RoundRow(
                id=item.id,
                room_id=item.room_id,
                number=item.number,
                loop_id=item.loop_id,
                bpm=item.bpm,
                bars=item.bars,
                composing_started_at=item.composing_started_at,
                composing_ends_at=item.composing_ends_at,
                voting_ends_at=item.voting_ends_at,
            )
        )
        self._flush_unique("Раунд ещё не закончен")

    def get_round(self, round_id: UUID) -> Round | None:
        row = self._session.get(RoundRow, round_id)
        return None if row is None else _round(row)

    def latest_round(self, room_id: UUID) -> Round | None:
        row = self._session.scalar(
            select(RoundRow)
            .where(RoundRow.room_id == room_id)
            .order_by(RoundRow.number.desc())
            .limit(1)
        )
        return None if row is None else _round(row)

    def upsert_riff(self, riff: Riff) -> Riff:
        row = self._session.scalar(
            select(RiffRow).where(
                RiffRow.round_id == riff.round_id,
                RiffRow.author_id == riff.author_id,
            )
        )
        payload = [_note_json(note) for note in riff.notes]
        if row is None:
            row = RiffRow(
                id=riff.id,
                round_id=riff.round_id,
                author_id=riff.author_id,
                timbre=riff.timbre,
                notes=payload,
                updated_at=riff.updated_at,
            )
            self._session.add(row)
        else:
            row.timbre = riff.timbre
            row.notes = payload
            row.updated_at = riff.updated_at
        self._flush_unique("Рифф уже сохранён")
        return _riff(row)

    def list_riffs(self, round_id: UUID) -> list[Riff]:
        rows = self._session.scalars(
            select(RiffRow).where(RiffRow.round_id == round_id).order_by(RiffRow.id)
        )
        return [_riff(row) for row in rows]

    def get_riff(self, riff_id: UUID) -> Riff | None:
        row = self._session.get(RiffRow, riff_id)
        return None if row is None else _riff(row)

    def add_vote(self, vote: Vote) -> None:
        self._session.add(
            VoteRow(
                id=vote.id,
                round_id=vote.round_id,
                voter_id=vote.voter_id,
                riff_id=vote.riff_id,
                created_at=vote.created_at,
            )
        )
        self._flush_unique("Вы уже проголосовали")

    def round_scores(self, round_ids: list[UUID]) -> dict[UUID, dict[UUID, int]]:
        result = {round_id: {} for round_id in round_ids}
        if not round_ids:
            return result
        rows = self._session.execute(
            select(RiffRow.round_id, RiffRow.id, func.count(VoteRow.id))
            .outerjoin(VoteRow, VoteRow.riff_id == RiffRow.id)
            .where(RiffRow.round_id.in_(round_ids))
            .group_by(RiffRow.round_id, RiffRow.id)
        )
        for round_id, riff_id, count in rows:
            result[round_id][riff_id] = count
        return result

    def list_votes(self, round_id: UUID) -> list[Vote]:
        rows = self._session.scalars(select(VoteRow).where(VoteRow.round_id == round_id))
        return [_vote(row) for row in rows]

    def vote_by_voter(self, round_id: UUID, voter_id: UUID) -> Vote | None:
        row = self._session.scalar(
            select(VoteRow).where(VoteRow.round_id == round_id, VoteRow.voter_id == voter_id)
        )
        return None if row is None else _vote(row)

    def completed_riffs_by_author(
        self, player_id: UUID, now: datetime
    ) -> list[tuple[Room, Round, Riff]]:
        rows = self._session.execute(
            select(RoomRow, RoundRow, RiffRow)
            .join(RoundRow, RoundRow.room_id == RoomRow.id)
            .join(RiffRow, RiffRow.round_id == RoundRow.id)
            .where(RiffRow.author_id == player_id, RoundRow.voting_ends_at <= now)
            .order_by(RoundRow.voting_ends_at.desc(), RoundRow.id)
        )
        return [(_room(room), _round(round_item), _riff(riff)) for room, round_item, riff in rows]
