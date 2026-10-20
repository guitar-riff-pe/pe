from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_health_service
from app.schemas.health import HealthResponse
from app.services.health import HealthService

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health(service: Annotated[HealthService, Depends(get_health_service)]) -> HealthResponse:
    result = service.check()
    return HealthResponse(status=result.status, service=result.service)
