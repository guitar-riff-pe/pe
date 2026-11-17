from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class CsrfMiddleware(BaseHTTPMiddleware):
    """A non-simple header and exact-origin CORS also protect login/guest creation."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.url.path.startswith("/api/") and request.method not in {
            "GET",
            "HEAD",
            "OPTIONS",
        }:
            origin = request.headers.get("origin")
            allowed = {*request.app.state.settings.cors_origins, str(request.base_url).rstrip("/")}
            if request.headers.get("x-csrf-protection") != "1" or (
                origin is not None and origin not in allowed
            ):
                return JSONResponse(
                    {"code": "forbidden", "detail": "Запрос не прошёл проверку CSRF"},
                    status_code=403,
                )
        response = await call_next(request)
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response
