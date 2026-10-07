from typing import Any

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


def make_error_response(
    status_code: int,
    code: str,
    message: str,
    request_id: str,
    details: Any = None,
) -> JSONResponse:
    """Build standardized JSON error response matching README section 13."""
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details,
                "request_id": request_id,
            }
        },
    )


def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "unknown")


def setup_error_handlers(app: FastAPI) -> None:
    """Register custom error handlers on FastAPI application."""

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        request_id = get_request_id(request)
        code_map = {
            status.HTTP_400_BAD_REQUEST: "BAD_REQUEST",
            status.HTTP_401_UNAUTHORIZED: "UNAUTHORIZED",
            status.HTTP_403_FORBIDDEN: "FORBIDDEN",
            status.HTTP_404_NOT_FOUND: "NOT_FOUND",
            status.HTTP_409_CONFLICT: "CONFLICT",
            status.HTTP_422_UNPROCESSABLE_ENTITY: "UNPROCESSABLE_ENTITY",
            status.HTTP_429_TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
            status.HTTP_501_NOT_IMPLEMENTED: "NOT_IMPLEMENTED",
        }
        error_code = code_map.get(exc.status_code, "HTTP_ERROR")
        detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        resp = make_error_response(
            status_code=exc.status_code,
            code=error_code,
            message=detail,
            request_id=request_id,
            details=exc.detail if isinstance(exc.detail, dict | list) else None,
        )
        if exc.headers:
            resp.headers.update(exc.headers)
        return resp

    @app.exception_handler(StarletteHTTPException)
    async def starlette_http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        request_id = get_request_id(request)
        resp = make_error_response(
            status_code=exc.status_code,
            code="HTTP_ERROR",
            message=str(exc.detail),
            request_id=request_id,
        )
        if exc.headers:
            resp.headers.update(exc.headers)
        return resp

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        request_id = get_request_id(request)
        return make_error_response(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="VALIDATION_ERROR",
            message="Request payload validation failed",
            request_id=request_id,
            details=exc.errors(),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        request_id = get_request_id(request)
        return make_error_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected server error occurred",
            request_id=request_id,
        )
