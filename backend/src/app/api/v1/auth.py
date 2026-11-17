from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response

from app.api.cookies import clear_session_cookie, set_session_cookie
from app.api.dependencies import Services, get_services
from app.domain.errors import AppError
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
    request: Request,
    response: Response,
    services: Annotated[Services, Depends(get_services)],
) -> AuthOut:
    view = services.auth.register(
        payload.username, payload.password, payload.nickname, payload.email
    )
    set_session_cookie(response, view.token, request.app.state.settings)
    return auth_out(view)


@router.post("/login", response_model=AuthOut)
def login(
    payload: LoginIn,
    request: Request,
    response: Response,
    services: Annotated[Services, Depends(get_services)],
) -> AuthOut:
    view = services.auth.login(payload.username, payload.password, payload.email)
    set_session_cookie(response, view.token, request.app.state.settings)
    return auth_out(view)


@router.post("/logout", status_code=204)
def logout(
    request: Request,
    response: Response,
    services: Annotated[Services, Depends(get_services)],
) -> None:
    token = request.cookies.get(request.app.state.settings.auth_cookie_name)
    if token:
        try:
            services.auth.logout(token)
        except AppError as exc:
            if exc.status != 401:
                raise
    clear_session_cookie(response, request.app.state.settings)


@router.post("/password-reset/request", status_code=202)
def request_password_reset(
    payload: ResetRequestIn,
    services: Annotated[Services, Depends(get_services)],
) -> None:
    services.password_reset.request_password_reset(payload.email)


@router.post("/password-reset/confirm", status_code=204)
def confirm_password_reset(
    payload: ResetConfirmIn,
    services: Annotated[Services, Depends(get_services)],
) -> None:
    services.password_reset.reset_password(payload.token, payload.password)
