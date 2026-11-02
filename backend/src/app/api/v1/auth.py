from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import Services, get_bearer, get_services
from app.schemas.auth import (
    AuthOut,
    LoginIn,
    RegisterIn,
    ResetConfirmIn,
    ResetRequestIn,
    auth_out,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthOut, status_code=201)
def register(
    payload: RegisterIn,
    services: Annotated[Services, Depends(get_services)],
) -> AuthOut:
    return auth_out(
        services.auth.register(payload.username, payload.password, payload.nickname, payload.email)
    )


@router.post("/login", response_model=AuthOut)
def login(payload: LoginIn, services: Annotated[Services, Depends(get_services)]) -> AuthOut:
    return auth_out(services.auth.login(payload.username, payload.password, payload.email))


@router.post("/logout", status_code=204)
def logout(
    token: Annotated[str, Depends(get_bearer)],
    services: Annotated[Services, Depends(get_services)],
) -> None:
    services.auth.logout(token)


@router.post("/password-reset/request", status_code=202)
def request_password_reset(
    payload: ResetRequestIn,
    services: Annotated[Services, Depends(get_services)],
) -> None:
    services.auth.request_password_reset(payload.email)


@router.post("/password-reset/confirm", status_code=204)
def confirm_password_reset(
    payload: ResetConfirmIn,
    services: Annotated[Services, Depends(get_services)],
) -> None:
    services.auth.reset_password(payload.token, payload.password)
