from app.domain.health import HealthStatus


class HealthService:
    def check(self) -> HealthStatus:
        return HealthStatus(status="ok", service="pe-backend")
