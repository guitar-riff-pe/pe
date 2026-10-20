from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import Services, get_bearer, get_services
from app.schemas.auth import AuthOut, LoginIn, RegisterIn, auth_out

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthOut, status_code=201)
def register(
    payload: RegisterIn,
    services: Annotated[Services, Depends(get_services)],
) -> AuthOut:
    return auth_out(services.auth.register(payload.username, payload.password, payload.nickname))


@router.post("/login", response_model=AuthOut)
def login(payload: LoginIn, services: Annotated[Services, Depends(get_services)]) -> AuthOut:
    return auth_out(services.auth.login(payload.username, payload.password))


@router.post("/logout", status_code=204)
def logout(
    token: Annotated[str, Depends(get_bearer)],
    services: Annotated[Services, Depends(get_services)],
) -> None:
    services.auth.logout(token)
