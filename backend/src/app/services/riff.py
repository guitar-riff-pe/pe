from uuid import UUID, uuid4

from app.domain.errors import conflict
from app.domain.models import Note, Player, Riff
from app.domain.store import Store
from app.domain.views import RiffView
from app.services.access import require_round_member
from app.services.clock import Clock
from app.services.rules import ensure_notes_fit, stage_at


class RiffService:
    def __init__(self, store: Store, clock: Clock) -> None:
        self._store = store
        self._clock = clock

    def save(self, player: Player, round_id: UUID, timbre: str, notes: list[Note]) -> RiffView:
        now = self._clock.now()
        with self._store.transaction() as tx:
            item = require_round_member(tx, round_id, player.id)
            if stage_at(item, now) != "composing":
                raise conflict("Время сочинения закончилось")
            ensure_notes_fit(notes, item.bars)
            current = next(
                (riff for riff in tx.list_riffs(item.id) if riff.author_id == player.id),
                None,
            )
            riff = Riff(
                id=uuid4() if current is None else current.id,
                round_id=item.id,
                author_id=player.id,
                timbre=timbre,
                notes=tuple(notes),
                updated_at=now,
            )
            saved = tx.upsert_riff(riff)
        return RiffView(
            id=saved.id,
            timbre=saved.timbre,
            notes=saved.notes,
            is_own=True,
            updated_at=saved.updated_at,
        )
