from unittest.mock import patch

from sqlalchemy import event
from test_frontend_contract import Mailer, app_client, auth

from app.services.passwords import dummy_password_hash, verify_password


def test_unknown_login_still_verifies_password() -> None:
    dummy_password_hash(1000)
    with app_client() as client:
        with patch("app.services.auth.verify_password", wraps=verify_password) as verify:
            response = client.post(
                "/api/v1/auth/login",
                json={
                    "email": "missing@example.com",
                    "password": "wrong-password",
                },
            )
        assert response.status_code == 401
        verify.assert_called_once()


def test_reset_revokes_all_old_sessions_but_not_other_players() -> None:
    from urllib.parse import parse_qs, urlsplit

    mailer = Mailer()
    with app_client(mailer=mailer) as client:
        registered = client.post(
            "/api/v1/auth/register",
            json={
                "email": "reset@example.com",
                "nickname": "Reset",
                "password": "old-password",
            },
        )
        first = registered.cookies["riff_session"]
        second = client.post(
            "/api/v1/auth/login",
            json={
                "email": "reset@example.com",
                "password": "old-password",
            },
        ).cookies["riff_session"]
        other = auth(client, "Other")
        client.post("/api/v1/auth/password-reset/request", json={"email": "reset@example.com"})
        token = parse_qs(urlsplit(mailer.sent[0][1]).query)["token"][0]
        assert (
            client.post(
                "/api/v1/auth/password-reset/confirm",
                json={
                    "token": token,
                    "password": "new-password",
                },
            ).status_code
            == 204
        )
        for old in (first, second):
            assert (
                client.get(
                    "/api/v1/session/me",
                    headers={
                        "Cookie": f"riff_session={old}",
                    },
                ).status_code
                == 401
            )
        assert client.get("/api/v1/session/me", headers=other).status_code == 200
        assert (
            client.post(
                "/api/v1/auth/login",
                json={
                    "email": "reset@example.com",
                    "password": "new-password",
                },
            ).status_code
            == 200
        )
        assert client.get("/api/v1/session/me").status_code == 200


def test_public_room_query_count_does_not_grow_per_room() -> None:
    with app_client() as client:
        for index in range(12):
            player = auth(client, f"Player {index}")
            assert client.post("/api/v1/rooms", headers=player).status_code == 201
        statements = []
        engine = client.app.state.store._engine

        def capture(_conn, _cursor, statement, _params, _context, _many):
            statements.append(statement)

        event.listen(engine, "before_cursor_execute", capture)
        try:
            response = client.get("/api/v1/rooms")
        finally:
            event.remove(engine, "before_cursor_execute", capture)
        assert len(response.json()) == 12
        assert len(statements) == 3
