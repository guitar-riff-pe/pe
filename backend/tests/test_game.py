from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.infrastructure.repositories.sql import SqlStore
from app.infrastructure.sessions import MemorySessionStore
from app.main import create_app


class FrozenClock:
    def __init__(self, moment: datetime) -> None:
        self.moment = moment

    def now(self) -> datetime:
        return self.moment

    def advance(self, seconds: int) -> None:
        self.moment += timedelta(seconds=seconds)


@pytest.fixture
def clock() -> FrozenClock:
    return FrozenClock(datetime(2026, 10, 20, 15, 0, tzinfo=UTC))


@pytest.fixture
def client(clock: FrozenClock):
    settings = Settings(
        _env_file=None,
        password_iterations=1000,
        compose_seconds=300,
        vote_seconds=300,
    )
    app = create_app(
        settings,
        store=SqlStore("sqlite://"),
        sessions=MemorySessionStore(),
        clock=clock,
    )
    with TestClient(app) as test_client:
        yield test_client


def guest(client: TestClient, nickname: str) -> dict[str, str]:
    response = client.post("/api/v1/session/guest", json={"nickname": nickname})
    assert response.status_code == 201, response.text
    return {"Authorization": f"Bearer {response.json()['token']}"}


def create_room(client: TestClient, headers: dict[str, str]) -> dict[str, object]:
    response = client.post("/api/v1/rooms", headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def join(client: TestClient, headers: dict[str, str], code: str) -> dict[str, object]:
    response = client.post("/api/v1/rooms/join", headers=headers, json={"code": code})
    assert response.status_code == 200, response.text
    return response.json()


def start(
    client: TestClient,
    headers: dict[str, str],
    room_id: str,
    loop_id: str | None = None,
) -> dict[str, object]:
    payload = {} if loop_id is None else {"loop_id": loop_id}
    response = client.post(f"/api/v1/rooms/{room_id}/rounds", headers=headers, json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def save(
    client: TestClient,
    headers: dict[str, str],
    round_id: str,
    *,
    pitch: str = "E2",
    timbre: str = "clean",
    start_beat: float = 0,
    duration: float = 1,
) -> dict[str, object]:
    response = client.put(
        f"/api/v1/rounds/{round_id}/riff",
        headers=headers,
        json={
            "timbre": timbre,
            "notes": [{"pitch": pitch, "start": start_beat, "duration": duration, "velocity": 100}],
        },
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_guest_register_login_and_logout(client: TestClient) -> None:
    guest_headers = guest(client, "Олег")
    me = client.get("/api/v1/session/me", headers=guest_headers)
    assert me.status_code == 200
    assert me.json()["kind"] == "guest"
    assert me.json()["nickname"] == "Олег"

    registered = client.post(
        "/api/v1/auth/register",
        json={"username": "Alice", "password": "secret-pass", "nickname": "Алиса"},
    )
    assert registered.status_code == 201, registered.text
    assert registered.json()["player"]["kind"] == "account"
    assert registered.json()["player"]["nickname"] == "Алиса"

    duplicate = client.post(
        "/api/v1/auth/register",
        json={"username": "alice", "password": "secret-pass"},
    )
    assert duplicate.status_code == 409

    logged_in = client.post(
        "/api/v1/auth/login",
        json={"username": "ALICE", "password": "secret-pass"},
    )
    assert logged_in.status_code == 200, logged_in.text
    token = logged_in.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/v1/session/me", headers=headers).status_code == 200

    wrong = client.post(
        "/api/v1/auth/login",
        json={"username": "alice", "password": "nope-nope"},
    )
    assert wrong.status_code == 401

    assert client.post("/api/v1/auth/logout", headers=headers).status_code == 204
    assert client.get("/api/v1/session/me", headers=headers).status_code == 401
    assert client.get("/api/v1/session/me").status_code == 401


def test_room_is_shared_and_round_needs_two_players(client: TestClient) -> None:
    host = guest(client, "Хост")
    other = guest(client, "Гость")
    room = create_room(client, host)
    assert len(str(room["code"])) == 6

    alone = client.post(f"/api/v1/rooms/{room['id']}/rounds", headers=host, json={})
    assert alone.status_code == 409

    joined = join(client, other, str(room["code"]))
    assert [member["nickname"] for member in joined["members"]] == ["Хост", "Гость"]
    seen_by_host = client.get(f"/api/v1/rooms/{room['id']}", headers=host)
    assert seen_by_host.status_code == 200
    assert [member["nickname"] for member in seen_by_host.json()["members"]] == ["Хост", "Гость"]

    denied = client.post(f"/api/v1/rooms/{room['id']}/rounds", headers=other, json={})
    assert denied.status_code == 403

    missing = client.post("/api/v1/rooms/join", headers=host, json={"code": "ZZZZZZ"})
    assert missing.status_code == 404


def test_round_keeps_players_in_sync_and_hides_authors_until_results(
    client: TestClient, clock: FrozenClock
) -> None:
    host = guest(client, "Хост")
    other = guest(client, "СкрытыйАвтор")
    room = create_room(client, host)
    join(client, other, str(room["code"]))
    loops = client.get("/api/v1/loops", headers=host)
    assert loops.status_code == 200
    assert {item["bars"] for item in loops.json()} == {4, 6, 8, 16}

    started = start(client, host, str(room["id"]), "blast-155-8")
    assert started["bpm"] == 155
    assert started["bars"] == 8
    assert started["stage"] == "composing"
    assert started["loop_id"] == "blast-155-8"
    assert started["riffs"] is None

    other_view = client.get(f"/api/v1/rounds/{started['id']}", headers=other)
    assert other_view.status_code == 200
    assert other_view.json()["composing_ends_at"] == started["composing_ends_at"]
    assert other_view.json()["bpm"] == 155
    assert other_view.json()["server_now"] == "2026-10-20T15:00:00Z"

    save(client, host, str(started["id"]), pitch="G#1", timbre="distortion", duration=2)
    hidden = client.get(f"/api/v1/rounds/{started['id']}", headers=other)
    assert hidden.json()["riffs"] is None
    assert hidden.json()["own_riff"] is None
    assert "G#1" not in hidden.text
    assert "СкрытыйАвтор" not in hidden.text

    replaced = save(client, other, str(started["id"]), pitch="A2", timbre="clean")
    assert replaced["notes"][0]["pitch"] == "A2"
    save(client, other, str(started["id"]), pitch="B2", timbre="distortion", start_beat=4)
    own = client.get(f"/api/v1/rounds/{started['id']}", headers=other).json()["own_riff"]
    assert own["notes"][0]["pitch"] == "B2"
    assert own["timbre"] == "distortion"

    outside = client.put(
        f"/api/v1/rounds/{started['id']}/riff",
        headers=host,
        json={"timbre": "clean", "notes": [{"pitch": "E2", "start": 31, "duration": 2}]},
    )
    assert outside.status_code == 422

    clock.advance(299)
    assert save(client, host, str(started["id"]), pitch="E2")["notes"][0]["pitch"] == "E2"
    clock.advance(1)
    late = client.put(
        f"/api/v1/rounds/{started['id']}/riff",
        headers=host,
        json={"timbre": "clean", "notes": [{"pitch": "C3", "start": 0, "duration": 1}]},
    )
    assert late.status_code == 409
    still = client.get(f"/api/v1/rounds/{started['id']}", headers=host).json()["own_riff"]
    assert still["notes"][0]["pitch"] == "E2"

    voting = client.get(f"/api/v1/rounds/{started['id']}", headers=other)
    assert voting.json()["stage"] == "voting"
    assert "СкрытыйАвтор" not in voting.text
    me = client.get("/api/v1/session/me", headers=other).json()
    assert me["id"] not in voting.text
    for riff in voting.json()["riffs"]:
        assert riff["author_id"] is None
        assert riff["author_nickname"] is None
        assert riff["votes"] is None
    assert {riff["is_own"] for riff in voting.json()["riffs"]} == {True, False}

    own_riff_id = next(item["id"] for item in voting.json()["riffs"] if item["is_own"])
    other_riff_id = next(item["id"] for item in voting.json()["riffs"] if not item["is_own"])
    selfish = client.post(
        f"/api/v1/rounds/{started['id']}/votes",
        headers=other,
        json={"riff_id": own_riff_id},
    )
    assert selfish.status_code == 403
    voted = client.post(
        f"/api/v1/rounds/{started['id']}/votes",
        headers=other,
        json={"riff_id": other_riff_id},
    )
    assert voted.status_code == 201, voted.text
    again = client.post(
        f"/api/v1/rounds/{started['id']}/votes",
        headers=other,
        json={"riff_id": other_riff_id},
    )
    assert again.status_code == 409

    host_view = client.get(f"/api/v1/rounds/{started['id']}", headers=host).json()
    host_choice = next(item["id"] for item in host_view["riffs"] if not item["is_own"])
    host_vote = client.post(
        f"/api/v1/rounds/{started['id']}/votes",
        headers=host,
        json={"riff_id": host_choice},
    )
    assert host_vote.status_code == 201, host_vote.text

    clock.advance(299)
    assert client.get(f"/api/v1/rounds/{started['id']}", headers=host).json()["stage"] == "voting"
    clock.advance(1)
    results = client.get(f"/api/v1/rounds/{started['id']}", headers=host).json()
    assert results["stage"] == "results"
    assert results["winner_ids"]
    winners = [item for item in results["riffs"] if item["is_winner"]]
    assert len(winners) == 2
    assert {item["author_nickname"] for item in results["riffs"]} == {"Хост", "СкрытыйАвтор"}
    assert {item["votes"] for item in results["riffs"]} == {1}

    too_late = client.post(
        f"/api/v1/rounds/{started['id']}/votes",
        headers=host,
        json={"riff_id": host_choice},
    )
    assert too_late.status_code == 409

    nxt = start(client, host, str(room["id"]))
    assert nxt["number"] == 2
    assert nxt["stage"] == "composing"
    assert nxt["loop_id"] == "blast-155-8"
    assert nxt["bars"] == 8


def test_join_is_closed_during_a_round_and_host_role_moves_on(
    client: TestClient, clock: FrozenClock
) -> None:
    host = guest(client, "Хост")
    other = guest(client, "Второй")
    late = guest(client, "Третий")
    room = create_room(client, host)
    join(client, other, str(room["code"]))
    started = start(client, host, str(room["id"]))
    blocked = client.post("/api/v1/rooms/join", headers=late, json={"code": room["code"]})
    assert blocked.status_code == 409

    busy_owner = guest(client, "Занятый")
    busy = create_room(client, busy_owner)
    cannot_join = client.post("/api/v1/rooms/join", headers=busy_owner, json={"code": room["code"]})
    assert cannot_join.status_code == 409

    clock.advance(600)
    assert client.get(f"/api/v1/rounds/{started['id']}", headers=host).json()["stage"] == "results"
    join(client, late, str(room["code"]))
    left = client.delete(f"/api/v1/rooms/{room['id']}/membership", headers=host)
    assert left.status_code == 204
    transferred = client.get(f"/api/v1/rooms/{room['id']}", headers=other).json()
    assert transferred["host_id"] == next(
        member["id"] for member in transferred["members"] if member["nickname"] == "Второй"
    )
    assert transferred["stage"] == "results"
    assert [member["nickname"] for member in transferred["members"]] == ["Второй", "Третий"]

    nxt = start(client, other, str(room["id"]))
    assert nxt["number"] == 2
    assert client.get(f"/api/v1/rooms/{busy['id']}", headers=host).status_code == 404
