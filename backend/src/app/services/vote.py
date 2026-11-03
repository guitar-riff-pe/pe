from uuid import UUID, uuid4

from app.domain.errors import conflict, forbidden, not_found
from app.domain.models import Player, Vote
from app.domain.store import Store
from app.services.access import require_round_member
from app.services.clock import Clock
from app.services.rules import stage_at


class VoteService:
    def __init__(self, store: Store, clock: Clock) -> None:
        self._store = store
        self._clock = clock

    def cast(self, player: Player, round_id: UUID, riff_id: UUID) -> UUID:
        now = self._clock.now()
        with self._store.transaction() as tx:
            item = require_round_member(tx, round_id, player.id)
            if stage_at(item, now) != "voting":
                raise conflict("Сейчас нельзя голосовать")
            riff = tx.get_riff(riff_id)
            if riff is None or riff.round_id != item.id:
                raise not_found("Рифф не найден")
            if riff.author_id == player.id:
                raise forbidden("Нельзя голосовать за свой рифф")
            if tx.vote_by_voter(item.id, player.id) is not None:
                raise conflict("Вы уже проголосовали")
            tx.add_vote(
                Vote(
                    id=uuid4(),
                    round_id=item.id,
                    voter_id=player.id,
                    riff_id=riff.id,
                    created_at=now,
                )
            )
        return riff_id
