from datetime import timedelta

from app.domain.errors import conflict, forbidden, not_found
from app.domain.models import Player
from app.domain.store import Store
from app.domain.views import ProfileBattleView, ProfileView
from app.services.clock import Clock


class ProfileService:
    def __init__(self, store: Store, clock: Clock) -> None:
        self._store = store
        self._clock = clock

    def get(self, player: Player) -> ProfileView:
        if player.account_id is None:
            raise forbidden("Профиль доступен после регистрации")
        now = self._clock.now()
        with self._store.transaction() as tx:
            account = tx.get_account_by_id(player.account_id)
            if account is None:
                raise not_found("Профиль не найден")
            history: list[ProfileBattleView] = []
            for room, round_item, riff in tx.completed_riffs_by_author(player.id, now):
                riffs = tx.list_riffs(round_item.id)
                counts = {item.id: 0 for item in riffs}
                for vote in tx.list_votes(round_item.id):
                    if vote.riff_id in counts:
                        counts[vote.riff_id] += 1
                votes = counts.get(riff.id, 0)
                place = 1 + sum(count > votes for count in counts.values())
                history.append(
                    ProfileBattleView(
                        id=round_item.id,
                        title=room.name,
                        date=round_item.voting_ends_at,
                        place=place,
                        votes=votes,
                    )
                )
            week_start = now.date() - timedelta(days=now.weekday() + 7 * 7)
            week_starts = tuple(
                (week_start + timedelta(weeks=index)).isoformat() for index in range(8)
            )
            weekly = [0] * 8
            for battle in history:
                index = (battle.date.date() - week_start).days // 7
                if 0 <= index < 8:
                    weekly[index] += 1
            best = max(history, key=lambda battle: (battle.votes, battle.date)) if history else None
            return ProfileView(
                name=player.nickname,
                handle=f"@{account.username}",
                joined=account.created_at,
                battles=len(history),
                wins=sum(battle.place == 1 for battle in history),
                votes=sum(battle.votes for battle in history),
                weekly_battles=tuple(weekly),
                week_starts=week_starts,
                best_round=best,
                history=tuple(history),
            )

    def update(self, player: Player, name: str, handle: str) -> ProfileView:
        if player.account_id is None:
            raise forbidden("Профиль доступен после регистрации")
        clean_handle = handle.removeprefix("@").lower()
        with self._store.transaction() as tx:
            existing = tx.get_account_by_username(clean_handle)
            if existing is not None and existing.id != player.account_id:
                raise conflict("Такое имя пользователя уже занято")
            tx.update_profile(player.id, player.account_id, name, clean_handle)
        return self.get(Player(id=player.id, nickname=name, account_id=player.account_id))
