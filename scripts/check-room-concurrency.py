"""Run inside backend: isolated PostgreSQL schema, removed after the checks."""

from concurrent.futures import ThreadPoolExecutor
from threading import Event
from uuid import uuid4

from app.core.config import Settings
from app.domain.errors import AppError
from app.domain.models import Player
from app.infrastructure.orm import Base
from app.infrastructure.repositories.sql import SqlStore, normalize_database_url
from app.services.clock import SystemClock
from app.services.room import RoomService
from app.services.round import RoundService
from sqlalchemy import create_engine, text


def main():
    url = normalize_database_url(Settings().database_url)
    assert url.startswith("postgresql+psycopg://")
    schema = "audit_" + uuid4().hex
    admin = create_engine(url)
    with admin.begin() as connection:
        connection.execute(text(f'CREATE SCHEMA "{schema}"'))
    engine = create_engine(url, connect_args={"options": f"-csearch_path={schema}"})
    store = SqlStore(url)
    store._engine = engine
    store._ready = True
    try:
        Base.metadata.create_all(engine)
        clock = SystemClock()
        rooms = RoomService(store, clock)
        rounds = RoundService(store, clock, compose_seconds=300, vote_seconds=300)

        def setup():
            players = [
                Player(id=uuid4(), nickname=f"Player {i}", account_id=None)
                for i in range(3)
            ]
            with store.transaction() as tx:
                for player in players:
                    tx.add_player(player, clock.now())
            room = rooms.create(players[0])
            for player in players[1:]:
                rooms.join(player, room.code)
            return players, room

        with ThreadPoolExecutor(max_workers=2) as pool:
            players, room = setup()
            entered = Event()

            def leave_second():
                entered.set()
                rooms.leave(players[1], room.id)

            # The second leaver must wait while host departure is committed.
            with store.transaction() as tx:
                tx.lock_room(room.id)
                future = pool.submit(leave_second)
                assert entered.wait(5)
                try:
                    future.result(timeout=0.5)
                    raise AssertionError("leave did not wait for the room lock")
                except TimeoutError:
                    pass
                tx.delete_membership(room.id, players[0].id)
                tx.set_host(room.id, players[1].id)
            future.result(timeout=10)
            current = rooms.get(players[2], room.id)
            assert current.host_id == players[2].id
            assert len(current.members) == 1
            print("PASS concurrent departures preserve a remaining host")

            players, room = setup()
            entered.clear()

            def start():
                entered.set()
                return rounds.start(players[0], room.id, None)

            with store.transaction() as tx:
                tx.lock_room(room.id)
                future = pool.submit(start)
                assert entered.wait(5)
                try:
                    future.result(timeout=0.5)
                    raise AssertionError("start did not wait for the room lock")
                except TimeoutError:
                    pass
                tx.delete_membership(room.id, players[2].id)
            try:
                future.result(timeout=10)
                raise AssertionError("round started with fewer than three players")
            except AppError as error:
                assert error.status == 409
            print("PASS start checks membership after concurrent departure commits")
    finally:
        engine.dispose()
        with admin.begin() as connection:
            connection.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
        admin.dispose()


if __name__ == "__main__":
    main()
