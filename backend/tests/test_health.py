from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app


def test_health_contract() -> None:
    with TestClient(create_app(Settings(_env_file=None))) as client:
        response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "pe-backend"}


def test_cors_preflight() -> None:
    with TestClient(create_app(Settings(_env_file=None))) as client:
        response = client.options(
            "/api/v1/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
