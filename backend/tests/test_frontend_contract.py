from datetime import UTC, datetime, timedelta
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect, text

from app.core.config import Settings
from app.infrastructure.repositories.sql import SqlStore
from app.infrastructure.sessions import MemorySessionStore
from app.main import create_app


class Clock:
    def __init__(self) -> None:
        self.moment = datetime(2026, 10, 20, 15, tzinfo=UTC)

    def now(self) -> datetime:
        return self.moment

    def advance(self, seconds: int) -> None:
        self.moment += timedelta(seconds=seconds)


class Mailer:
    def __init__(self) -> None:
        self.sent: list[tuple[str, str]] = []

    def available(self) -> bool:
        return True

    def send_password_reset(self, recipient: str, link: str) -> None:
        self.sent.append((recipient, link))


def app_client(clock: Clock | None = None, mailer: Mailer | None = None) -> TestClient:
    return TestClient(
        create_app(
            Settings(
                _env_file=None, password_iterations=1000, compose_seconds=300, vote_seconds=300
            ),
            store=SqlStore("sqlite://"),
            sessions=MemorySessionStore(),
            clock=clock or Clock(),
            mailer=mailer or Mailer(),
        )
    )


def auth(client: TestClient, nickname: str) -> dict[str, str]:
    response = client.post("/api/v1/session/guest", json={"nickname": nickname})
    assert response.status_code == 201, response.text
    return {"Authorization": f"Bearer {response.json()['token']}"}


def test_email_identity_and_password_reset() -> None:
    mailer = Mailer()
    with app_client(mailer=mailer) as client:
        registered = client.post(
            "/api/v1/auth/register",
            json={
                "email": "  Player@Example.com ",
                "nickname": "NeonRiff",
                "password": "old-password",
            },
        )
        assert registered.status_code == 201, registered.text
        assert registered.json()["player"]["nickname"] == "NeonRiff"
        same_nickname = client.post(
            "/api/v1/auth/register",
            json={
                "email": "another@example.com",
                "nickname": "NeonRiff",
                "password": "old-password",
            },
        )
        assert same_nickname.status_code == 201, same_nickname.text
        duplicate = client.post(
            "/api/v1/auth/register",
            json={
                "email": "player@example.com",
                "nickname": "SomeoneElse",
                "password": "old-password",
            },
        )
        assert duplicate.status_code == 409
        login = client.post(
            "/api/v1/auth/login",
            json={
                "email": "PLAYER@example.com",
                "password": "old-password",
            },
        )
        assert login.status_code == 200, login.text
        assert (
            client.post(
                "/api/v1/auth/password-reset/request",
                json={
                    "email": "nobody@example.com",
                },
            ).status_code
            == 202
        )
        assert not mailer.sent
        requested = client.post(
            "/api/v1/auth/password-reset/request",
            json={
                "email": "player@example.com",
            },
        )
        assert requested.status_code == 202, requested.text
        assert len(mailer.sent) == 1
        token = parse_qs(urlsplit(mailer.sent[0][1]).query)["token"][0]
        changed = client.post(
            "/api/v1/auth/password-reset/confirm",
            json={
                "token": token,
                "password": "new-password",
            },
        )
        assert changed.status_code == 204, changed.text
        assert (
            client.post(
                "/api/v1/auth/password-reset/confirm",
                json={
                    "token": token,
                    "password": "another-password",
                },
            ).status_code
            == 422
        )
        assert (
            client.post(
                "/api/v1/auth/login",
                json={
                    "email": "player@example.com",
                    "password": "old-password",
                },
            ).status_code
            == 401
        )
        assert (
            client.post(
                "/api/v1/auth/login",
                json={
                    "email": "player@example.com",
                    "password": "new-password",
                },
            ).status_code
            == 200
        )


def test_room_settings_public_list_capacity_and_archive() -> None:
    clock = Clock()
    with app_client(clock=clock) as client:
        host = auth(client, "Хост")
        other = auth(client, "Гость")
        extra = auth(client, "Третий")
        created = client.post(
            "/api/v1/rooms",
            headers=host,
            json={
                "name": "  Midnight Garage  ",
                "visibility": "public",
                "capacity": 2,
                "bars": 8,
                "style": "Metal",
            },
        )
        assert created.status_code == 201, created.text
        room = created.json()
        assert (room["name"], room["capacity"], room["bars"], room["style"]) == (
            "Midnight Garage",
            2,
            8,
            "Metal",
        )
        listed = client.get("/api/v1/rooms").json()
        assert len(listed) == 1 and listed[0]["id"] == room["id"]
        assert listed[0]["players"] == 1 and listed[0]["status"] == "waiting"
        joined = client.post("/api/v1/rooms/join", headers=other, json={"code": room["code"]})
        assert joined.status_code == 200, joined.text
        assert (
            client.post(
                "/api/v1/rooms/join",
                headers=extra,
                json={
                    "code": room["code"],
                },
            ).status_code
            == 409
        )
        wrong_loop = client.post(
            f"/api/v1/rooms/{room['id']}/rounds",
            headers=host,
            json={
                "loop_id": "hat-90-4",
            },
        )
        assert wrong_loop.status_code == 422
        started = client.post(f"/api/v1/rooms/{room['id']}/rounds", headers=host, json={})
        assert started.status_code == 201, started.text
        assert started.json()["bars"] == 8
        assert client.get("/api/v1/rooms").json()[0]["status"] == "playing"
        clock.advance(600)
        assert (
            client.delete(f"/api/v1/rooms/{room['id']}/membership", headers=other).status_code
            == 204
        )
        assert (
            client.delete(f"/api/v1/rooms/{room['id']}/membership", headers=host).status_code == 204
        )
        assert client.get("/api/v1/rooms").json() == []
        assert (
            client.post(
                "/api/v1/rooms/join",
                headers=extra,
                json={
                    "code": room["code"],
                },
            ).status_code
            == 404
        )


def test_private_room_and_profile_history_survives_closure() -> None:
    clock = Clock()
    with app_client(clock=clock) as client:
        registered = client.post(
            "/api/v1/auth/register",
            json={
                "email": "neon@example.com",
                "nickname": "NeonRiff",
                "password": "secret-pass",
            },
        )
        assert registered.status_code == 201, registered.text
        host = {"Authorization": f"Bearer {registered.json()['token']}"}
        other = auth(client, "Гость")
        room_response = client.post(
            "/api/v1/rooms",
            headers=host,
            json={
                "name": "Secret Room",
                "visibility": "private",
                "capacity": 4,
                "bars": 4,
            },
        )
        assert room_response.status_code == 201, room_response.text
        room = room_response.json()
        assert client.get("/api/v1/rooms").json() == []
        assert (
            client.post(
                "/api/v1/rooms/join",
                headers=other,
                json={
                    "code": room["code"],
                },
            ).status_code
            == 200
        )
        started = client.post(f"/api/v1/rooms/{room['id']}/rounds", headers=host, json={})
        assert started.status_code == 201, started.text
        round_id = started.json()["id"]
        riff_body = {
            "timbre": "clean",
            "notes": [
                {
                    "pitch": "E2",
                    "start": 0,
                    "duration": 1,
                    "velocity": 100,
                }
            ],
        }
        own_riff = client.put(f"/api/v1/rounds/{round_id}/riff", headers=host, json=riff_body)
        assert own_riff.status_code == 200, own_riff.text
        other_riff = client.put(f"/api/v1/rounds/{round_id}/riff", headers=other, json=riff_body)
        assert other_riff.status_code == 200, other_riff.text
        clock.advance(300)
        voted = client.post(
            f"/api/v1/rounds/{round_id}/votes",
            headers=other,
            json={
                "riff_id": own_riff.json()["id"],
            },
        )
        assert voted.status_code == 201, voted.text
        clock.advance(300)
        assert (
            client.delete(f"/api/v1/rooms/{room['id']}/membership", headers=other).status_code
            == 204
        )
        assert (
            client.delete(f"/api/v1/rooms/{room['id']}/membership", headers=host).status_code == 204
        )
        profile = client.get("/api/v1/profile/me", headers=host)
        assert profile.status_code == 200, profile.text
        data = profile.json()
        assert (data["name"], data["handle"], data["battles"], data["wins"], data["votes"]) == (
            "NeonRiff",
            "@neonriff",
            1,
            1,
            1,
        )
        assert data["history"][0]["title"] == "Secret Room"
        assert data["bestRound"]["votes"] == 1
        assert sum(data["weeklyBattles"]) == 1
        assert len(data["weekStarts"]) == 8
        updated = client.patch(
            "/api/v1/profile/me",
            headers=host,
            json={
                "name": "NewName",
                "handle": "@newhandle",
            },
        )
        assert updated.status_code == 200, updated.text
        assert updated.json()["name"] == "NewName"
        assert updated.json()["handle"] == "@newhandle"
        assert (
            client.post(
                "/api/v1/auth/login",
                json={
                    "email": "neon@example.com",
                    "password": "secret-pass",
                },
            ).status_code
            == 200
        )
        guest_profile = client.get("/api/v1/profile/me", headers=other)
        assert guest_profile.status_code == 403


def test_existing_database_gains_columns_without_losing_data(tmp_path: Path) -> None:
    database_path = tmp_path / "old.sqlite"
    engine = create_engine(f"sqlite:///{database_path}")
    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE accounts (id VARCHAR(32) PRIMARY KEY, username VARCHAR(32), "
                "password_hash VARCHAR(255), created_at TIMESTAMP)"
            )
        )
        connection.execute(
            text(
                "CREATE TABLE rooms (id VARCHAR(32) PRIMARY KEY, code VARCHAR(8), "
                "host_id VARCHAR(32), created_at TIMESTAMP)"
            )
        )
        connection.execute(
            text("INSERT INTO accounts VALUES ('one', 'legacy', 'hash', '2026-10-20 15:00:00')")
        )
        connection.execute(
            text("INSERT INTO rooms VALUES ('two', 'ABC123', 'one', '2026-10-20 15:00:00')")
        )
    engine.dispose()
    store = SqlStore(f"sqlite:///{database_path}")
    store.ensure_ready()
    engine = create_engine(f"sqlite:///{database_path}")
    assert "email" in {item["name"] for item in inspect(engine).get_columns("accounts")}
    assert "capacity" in {item["name"] for item in inspect(engine).get_columns("rooms")}
    with engine.connect() as connection:
        assert connection.scalar(text("SELECT username FROM accounts WHERE id='one'")) == "legacy"
        assert connection.scalar(text("SELECT code FROM rooms WHERE id='two'")) == "ABC123"
    engine.dispose()
