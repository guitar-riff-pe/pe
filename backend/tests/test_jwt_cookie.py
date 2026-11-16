from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.config import Settings
from app.infrastructure.repositories.sql import SqlStore
from app.infrastructure.sessions import MemorySessionStore
from app.main import create_app

SECRET = "test-cookie-jwt-signing-secret-0123456789"
CSRF = {"X-CSRF-Protection": "1"}


class Clock:
    def __init__(self) -> None:
        self.moment = datetime.now(UTC)

    def now(self) -> datetime:
        return self.moment


@pytest.fixture
def client():
    app = create_app(
        Settings(_env_file=None, jwt_secret=SECRET, password_iterations=1000),
        store=SqlStore("sqlite://"),
        sessions=MemorySessionStore(),
        clock=Clock(),
    )
    with TestClient(app, headers=CSRF) as client:
        yield client


def guest(client: TestClient) -> str:
    response = client.post("/api/v1/session/guest", json={"nickname": "Гитарист"})
    assert response.status_code == 201, response.text
    assert set(response.json()) == {"player"}
    return response.cookies["riff_session"]


def claims(token: str) -> dict:
    return jwt.decode(
        token, SECRET, algorithms=["HS256"], audience="riff-battle-api", issuer="riff-battle"
    )


def test_guest_cookie_claims_and_me(client: TestClient) -> None:
    response = client.post("/api/v1/session/guest", json={"nickname": "Гитарист"})
    token = response.cookies["riff_session"]
    decoded = claims(token)
    assert decoded["sub"] == response.json()["player"]["id"]
    assert decoded["exp"] - decoded["iat"] == 604800
    assert decoded["jti"] != token
    assert client.app.state.sessions.get(decoded["jti"]) is not None
    assert client.app.state.sessions.get(token) is None
    cookie = response.headers["set-cookie"]
    assert "HttpOnly" in cookie and "SameSite=lax" in cookie and "Path=/" in cookie
    assert "Max-Age=604800" in cookie and "Domain=" not in cookie
    assert "token" not in response.json()
    me = client.get("/api/v1/session/me")
    assert me.status_code == 200 and me.json()["nickname"] == "Гитарист"
    assert me.headers["cache-control"] == "no-store"


def test_register_login_and_logout_revoke_a_copied_jwt(client: TestClient) -> None:
    registered = client.post(
        "/api/v1/auth/register",
        json={
            "email": "cookie@example.com",
            "password": "test-password",
            "nickname": "Neon",
        },
    )
    assert registered.status_code == 201
    assert "token" not in registered.json()
    old = registered.cookies["riff_session"]
    logged_in = client.post(
        "/api/v1/auth/login",
        json={
            "email": "cookie@example.com",
            "password": "test-password",
        },
    )
    token = logged_in.cookies["riff_session"]
    assert token != old
    out = client.post("/api/v1/auth/logout")
    assert out.status_code == 204 and "Max-Age=0" in out.headers["set-cookie"]
    assert client.get("/api/v1/session/me").status_code == 401
    assert (
        client.get("/api/v1/session/me", headers={"Cookie": f"riff_session={token}"}).status_code
        == 401
    )
    assert client.post("/api/v1/auth/logout").status_code == 204


@pytest.mark.parametrize(
    "change",
    [
        {"exp": None},
        {"exp": "9999999999"},
        {"exp": True},
        {"exp": 1},
        {"iat": 9999999999},
        {"iat": "1"},
        {"nbf": 9999999999},
        {"aud": "another-api"},
        {"aud": ["riff-battle-api"]},
        {"iss": "another-issuer"},
        {"sub": "not-a-uuid"},
        {"sub": str(uuid4())},
        {"jti": "invalid"},
    ],
)
def test_invalid_claims_are_rejected(client: TestClient, change: dict) -> None:
    payload = claims(guest(client)) | change
    if change.get("exp", 0) is None:
        payload.pop("exp")
    token = jwt.encode(payload, SECRET, algorithm="HS256")
    assert (
        client.get("/api/v1/session/me", headers={"Cookie": f"riff_session={token}"}).status_code
        == 401
    )


def test_bad_signature_none_algorithm_and_legacy_bearer_are_rejected(client: TestClient) -> None:
    token = guest(client)
    payload = claims(token)
    for forged in [
        jwt.encode(payload, "another-key-012345678901234567890123", algorithm="HS256"),
        jwt.encode(payload, "", algorithm="none"),
        "malformed",
    ]:
        assert (
            client.get(
                "/api/v1/session/me", headers={"Cookie": f"riff_session={forged}"}
            ).status_code
            == 401
        )
    client.cookies.clear()
    assert (
        client.get("/api/v1/session/me", headers={"Authorization": f"Bearer {token}"}).status_code
        == 401
    )


def test_expiration_uses_server_clock(client: TestClient) -> None:
    guest(client)
    client.app.state.clock.moment += timedelta(days=7, seconds=1)
    assert client.get("/api/v1/session/me").status_code == 401
    assert client.post("/api/v1/auth/logout").status_code == 204
    assert not client.cookies.get("riff_session")


def test_csrf_rejects_forms_login_csrf_and_foreign_origins(client: TestClient) -> None:
    client.headers.pop("X-CSRF-Protection")
    assert client.post("/api/v1/session/guest", json={"nickname": "Гость"}).status_code == 403
    assert not client.cookies
    for origin in ["https://evil.example", "http://localhost:3000.evil.example", "null"]:
        response = client.post(
            "/api/v1/session/guest", json={"nickname": "Гость"}, headers=CSRF | {"Origin": origin}
        )
        assert response.status_code == 403
        assert not client.cookies
    client.headers.update(CSRF)
    guest(client)
    client.headers.pop("X-CSRF-Protection")
    assert client.post("/api/v1/auth/logout").status_code == 403
    assert client.get("/api/v1/session/me").status_code == 200


def test_cors_credentials_and_secure_cookie(client: TestClient) -> None:
    response = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,x-csrf-protection",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-credentials"] == "true"
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    client.app.state.settings.auth_cookie_secure = True
    response = client.post("/api/v1/session/guest", json={"nickname": "Гость"})
    assert "; Secure" in response.headers["set-cookie"]
    # A Secure cookie is not sent back over HTTP by the client cookie jar.
    assert client.get("/api/v1/session/me").status_code == 401


def test_secret_and_cors_configuration_are_validated() -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, jwt_secret="short")
    with pytest.raises(ValidationError):
        Settings(_env_file=None, cors_origins=["*"])
