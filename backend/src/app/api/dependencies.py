from app.services.health import HealthService


def get_health_service() -> HealthService:
    return HealthService()
