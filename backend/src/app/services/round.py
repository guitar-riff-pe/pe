from datetime import datetime, timedelta
from uuid import UUID, uuid4

from app.domain.catalog import default_loop, get_loop
from app.domain.errors import conflict, forbidden, invalid
from app.domain.models import Player, Round
from app.domain.store import Store, Tx
from app.domain.views import RiffView, RoundView
from app.services.access import require_room_member, require_round_member
from app.services.clock import Clock
from app.services.rules import stage_at


class RoundService:
    """Сроки считает сервер: 5 минут сочинения и 5 минут голосования.

    Ничья — победители все риффы с наибольшим числом голосов.
    Пока идёт сочинение или голосование, авторы в ответе не раскрываются.
    """

    def __init__(
        self,
        store: Store,
        clock: Clock,
        *,
        compose_seconds: int,
        vote_seconds: int,
    ) -> None:
        self._store = store
        self._clock = clock
        self._compose_seconds = compose_seconds
        self._vote_seconds = vote_seconds

    def start(self, player: Player, room_id: UUID, loop_id: str | None) -> RoundView:
        now = self._clock.now()
        loop = default_loop() if loop_id is None else get_loop(loop_id)
        if loop is None:
            raise invalid("Такого барабанного лупа нет")
        with self._store.transaction() as tx:
            room = require_room_member(tx, room_id, player.id)
            if room.host_id != player.id:
                raise forbidden("Запустить раунд может только хост")
            if len(tx.list_members(room.id)) < 2:
                raise conflict("Нужны минимум два игрока")
            latest = tx.latest_round(room.id)
            if latest is not None and stage_at(latest, now) != "results":
                raise conflict("Раунд ещё не закончен")
            number = 1 if latest is None else latest.number + 1
            item = Round(
                id=uuid4(),
                room_id=room.id,
                number=number,
                loop_id=loop.id,
                bpm=loop.bpm,
                bars=loop.bars,
                composing_started_at=now,
                composing_ends_at=now + timedelta(seconds=self._compose_seconds),
                voting_ends_at=now + timedelta(seconds=self._compose_seconds + self._vote_seconds),
            )
            tx.add_round(item)
            return self._view(tx, item, player.id, now)

    def get(self, player: Player, round_id: UUID) -> RoundView:
        now = self._clock.now()
        with self._store.transaction() as tx:
            item = require_round_member(tx, round_id, player.id)
            return self._view(tx, item, player.id, now)

    def _view(self, tx: Tx, item: Round, player_id: UUID, now: datetime) -> RoundView:
        stage = stage_at(item, now)
        loop = get_loop(item.loop_id)
        riffs = tx.list_riffs(item.id)
        own = next((riff for riff in riffs if riff.author_id == player_id), None)
        ballot = tx.vote_by_voter(item.id, player_id)
        public: tuple[RiffView, ...] | None
        winners: tuple[UUID, ...] | None
        if stage == "composing":
            public = None
            winners = None
        elif stage == "voting":
            public = tuple(
                RiffView(
                    id=riff.id,
                    timbre=riff.timbre,
                    notes=riff.notes,
                    is_own=riff.author_id == player_id,
                )
                for riff in riffs
            )
            winners = None
        else:
            votes = tx.list_votes(item.id)
            counts = {riff.id: 0 for riff in riffs}
            for vote in votes:
                if vote.riff_id in counts:
                    counts[vote.riff_id] += 1
            best = max(counts.values()) if counts else None
            winners = tuple(
                riff.id for riff in riffs if best is not None and counts[riff.id] == best
            )
            authors = tx.players_by_ids([riff.author_id for riff in riffs])
            public = tuple(
                RiffView(
                    id=riff.id,
                    timbre=riff.timbre,
                    notes=riff.notes,
                    is_own=riff.author_id == player_id,
                    author_id=riff.author_id,
                    author_nickname=authors[riff.author_id].nickname,
                    votes=counts[riff.id],
                    is_winner=riff.id in winners,
                )
                for riff in riffs
            )
        own_view = None
        if own is not None:
            own_view = RiffView(
                id=own.id,
                timbre=own.timbre,
                notes=own.notes,
                is_own=True,
                updated_at=own.updated_at,
            )
        return RoundView(
            id=item.id,
            room_id=item.room_id,
            number=item.number,
            stage=stage,
            loop_id=item.loop_id,
            loop_title=loop.title if loop else item.loop_id,
            loop_url=loop.url if loop else "",
            bpm=item.bpm,
            bars=item.bars,
            composing_started_at=item.composing_started_at,
            composing_ends_at=item.composing_ends_at,
            voting_ends_at=item.voting_ends_at,
            server_now=now,
            own_riff=own_view,
            riffs=public,
            your_vote_riff_id=None if ballot is None else ballot.riff_id,
            winner_ids=winners,
        )
