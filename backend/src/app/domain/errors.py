class AppError(Exception):
    def __init__(self, status: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message


def unauthorized(message: str = "Нужно войти") -> AppError:
    return AppError(401, "unauthorized", message)


def forbidden(message: str) -> AppError:
    return AppError(403, "forbidden", message)


def not_found(message: str = "Не найдено") -> AppError:
    return AppError(404, "not_found", message)


def conflict(message: str) -> AppError:
    return AppError(409, "conflict", message)


def invalid(message: str) -> AppError:
    return AppError(422, "invalid", message)


def unavailable(message: str) -> AppError:
    return AppError(503, "unavailable", message)
