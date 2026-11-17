from typing import Annotated

from fastapi import APIRouter, Depends, Header

from app.api.v1.auth import router as auth_router
from app.api.v1.health import router as health_router
from app.api.v1.loops import router as loops_router
from app.api.v1.profile import router as profile_router
from app.api.v1.rooms import router as rooms_router
from app.api.v1.rounds import router as rounds_router
from app.api.v1.session import router as session_router


def csrf_header(
    x_csrf_protection: Annotated[
        str | None, Header(description="For POST/PUT/PATCH/DELETE use the value 1")
    ] = None,
) -> None:
    # The middleware enforces it before request parsing, including public login routes.
    pass


api_router = APIRouter(dependencies=[Depends(csrf_header)])
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(session_router)
api_router.include_router(loops_router)
api_router.include_router(rooms_router)
api_router.include_router(rounds_router)
api_router.include_router(profile_router)
