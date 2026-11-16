from datetime import datetime
from uuid import UUID

from sqlalchemy import delete, select, update

from app.domain.models import Account, Player
from app.domain.time import utc
from app.infrastructure.orm import (
    AccountRow,
    PasswordResetRow,
    PlayerRow,
)

from .base import SqlRepository
from .mapping import _account, _player


class AccountsRepository(SqlRepository):
    def add_account(self, account: Account) -> None:
        self._session.add(
            AccountRow(
                id=account.id,
                username=account.username,
                email=account.email,
                password_hash=account.password_hash,
                created_at=account.created_at,
            )
        )
        self._flush_unique("Такое имя уже занято")

    def get_account_by_username(self, username: str) -> Account | None:
        row = self._session.scalar(select(AccountRow).where(AccountRow.username == username))
        return None if row is None else _account(row)

    def get_account_by_email(self, email: str) -> Account | None:
        row = self._session.scalar(select(AccountRow).where(AccountRow.email == email))
        return None if row is None else _account(row)

    def get_account_by_id(self, account_id: UUID) -> Account | None:
        row = self._session.get(AccountRow, account_id)
        return None if row is None else _account(row)

    def lock_account(self, account_id: UUID) -> Account | None:
        row = self._session.scalar(
            select(AccountRow)
            .where(AccountRow.id == account_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        return None if row is None else _account(row)

    def update_account_password(self, account_id: UUID, password_hash: str) -> None:
        row = self._session.get(AccountRow, account_id)
        if row is not None:
            row.password_hash = password_hash
            self._session.execute(
                update(PlayerRow)
                .where(PlayerRow.account_id == account_id)
                .values(session_version=PlayerRow.session_version + 1)
            )

    def add_password_reset(self, token_hash: str, account_id: UUID, expires_at: datetime) -> None:
        self._session.execute(
            delete(PasswordResetRow).where(PasswordResetRow.account_id == account_id)
        )
        self._session.add(
            PasswordResetRow(
                token_hash=token_hash,
                account_id=account_id,
                expires_at=expires_at,
            )
        )

    def redeem_password_reset(self, token_hash: str, now: datetime) -> UUID | None:
        row = self._session.scalar(
            select(PasswordResetRow)
            .where(PasswordResetRow.token_hash == token_hash)
            .with_for_update()
        )
        if row is None:
            return None
        account_id = row.account_id if utc(row.expires_at) > now else None
        self._session.delete(row)
        return account_id

    def update_profile(self, player_id: UUID, account_id: UUID, name: str, handle: str) -> None:
        player = self._session.get(PlayerRow, player_id)
        account = self._session.get(AccountRow, account_id)
        if player is not None and account is not None:
            player.nickname = name
            account.username = handle
            self._flush_unique("Такое имя пользователя уже занято")

    def add_player(self, player: Player, created_at: datetime) -> None:
        self._session.add(
            PlayerRow(
                id=player.id,
                nickname=player.nickname,
                account_id=player.account_id,
                created_at=created_at,
            )
        )
        self._flush_unique("Игрок уже существует")

    def get_player(self, player_id: UUID) -> Player | None:
        row = self._session.get(PlayerRow, player_id)
        return None if row is None else _player(row)

    def get_player_by_account(self, account_id: UUID) -> Player | None:
        row = self._session.scalar(select(PlayerRow).where(PlayerRow.account_id == account_id))
        return None if row is None else _player(row)

    def players_by_ids(self, player_ids: list[UUID]) -> dict[UUID, Player]:
        if not player_ids:
            return {}
        rows = self._session.scalars(select(PlayerRow).where(PlayerRow.id.in_(player_ids)))
        return {row.id: _player(row) for row in rows}
