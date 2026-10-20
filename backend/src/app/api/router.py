from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.health import router as health_router
from app.api.v1.loops import router as loops_router
from app.api.v1.rooms import router as rooms_router
from app.api.v1.rounds import router as rounds_router
from app.api.v1.session import router as session_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(session_router)
api_router.include_router(loops_router)
api_router.include_router(rooms_router)
api_router.include_router(rounds_router)
