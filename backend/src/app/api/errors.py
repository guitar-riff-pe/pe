from fastapi import Request
from fastapi.responses import JSONResponse

from app.domain.errors import AppError


def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status, content={"code": exc.code, "detail": exc.message})
