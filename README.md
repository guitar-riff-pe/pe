# Riff Battle

Веб-платформа для гитарных баттлов: участники получают общий барабанный луп,
за пять минут создают рифф во встроенном Piano Roll, затем анонимно слушают
работы, голосуют и смотрят результаты. В MVP можно играть гостем по нику
или зарегистрироваться и входить через аккаунт; регистрация не обязательна.
Хост создаёт комнату и запускает раунд минимум для двух игроков.

**Игровой HTTP API реализован.** На backend работают регистрация, гостевой вход,
комнаты, раунды, сохранение риффа и голосование.

Команда: Пинаев О.К. и Соболев Д.Р.

- [Паспорт проекта и план семестра](docs/00-project.md)
- [Требования и модели системы](docs/01-requirements.md)
- [Материалы лабораторных](docs/README.md)
- [Запуск](#run)
- [Архитектура](#architecture)
- [Игровой API](#api)
- [Разработка и проверки](#development)
- [Docker](#docker)
- [GitHub Actions](#ci)

## Статус требований

Полные формулировки, критерии выполнения и сценарии — в [документе требований](docs/01-requirements.md). «Нужно доработать» означает, что API или макет уже есть, но сквозной сценарий в интерфейсе ещё не работает.

| № | Кратко | Приоритет | Состояние |
| --- | --- | --- | --- |
| FR-1 | Гостевой вход | Обязательно | Нужно доработать |
| FR-2 | Регистрация и вход | Обязательно | Нужно доработать |
| FR-3 | Восстановление пароля | Желательно | Нужно доработать |
| FR-4 | Поиск комнаты и вход по коду | Обязательно | Нужно доработать |
| FR-5 | Создание комнаты | Обязательно | Нужно доработать |
| FR-6 | Запуск раунда хостом | Обязательно | Нужно доработать |
| FR-7 | Создание и сохранение риффа | Обязательно | Нужно сделать |
| FR-8 | Анонимное голосование | Обязательно | Нужно доработать |
| FR-9 | Просмотр результатов | Обязательно | Нужно доработать |
| FR-10 | Профиль и история | Желательно | Нужно доработать |

<a id="run"></a>

## Запуск

### Docker Compose

Нужны Git, Docker Engine в режиме Linux containers и Compose v2 с поддержкой
`--wait`. Для первичной сборки нужен доступ к реестрам образов, npm и Python-пакетов.
Python 3.12+ на хосте нужен только для smoke-скрипта.

Из чистого клона — пять команд, включая проверку:

```sh
git clone https://github.com/guitar-riff-pe/pe.git
cd pe
docker compose up --build --wait --wait-timeout 180
docker compose ps
python scripts/smoke-compose.py
```

| Сервис | Адрес |
| --- | --- |
| Frontend | http://localhost:3000 |
| Вход / регистрация | http://localhost:3000/login, http://localhost:3000/register |
| FastAPI / Swagger UI | http://localhost:8000/docs |
| Состояние API | http://localhost:8000/api/v1/health |

Ручная проверка:

1. Открыть frontend: главная страница загружается, доступны переходы к комнатам и входу.
2. Открыть `/api/v1/health` на backend: ответ содержит `"status":"ok"` и `"service":"pe-backend"`.
3. Проверить `docker compose ps`: четыре сервиса работают и имеют healthy-статус.
   Smoke-скрипт дополнительно проверяет API, SSR и клиентские ресурсы.
   

### Локальная разработка

Нужны Node.js 22.18+ (в CI и Docker — 24), pnpm 10.14.0, Python 3.12+
и uv (в CI и Docker — 0.8.18). Из корня установить зависимости:

```sh
pnpm install --frozen-lockfile
uv sync --project backend --locked
```

В двух терминалах из корня:

```sh
pnpm dev:backend
```

```sh
pnpm dev
```

Адреса те же: frontend на 3000, API на 8000. Для текущего health API
PostgreSQL и Redis локально не нужны: приложение пока не обращается к ним.
Значения настроек по умолчанию работают локально. Для переопределения скопировать
`frontend/.env.example` в `frontend/.env`, `backend/.env.example` в `backend/.env`.

`uv run --project backend ...` сам использует окружение backend. Если нужна
ручная активация в PowerShell:

```powershell
.\backend\.venv\Scripts\Activate.ps1
```

<a id="architecture"></a>

## Архитектура

Монорепозиторий состоит из двух приложений. TanStack Start обслуживает React,
файловую маршрутизацию и SSR. FastAPI обслуживает HTTP API `/api/v1`.
Production-сборка frontend запускается как Node.js-сервер Nitro.

```mermaid
flowchart LR
    browser[Браузер] --> frontend[React / TanStack Start / Nitro]
    browser --> api[FastAPI /api/v1]
    frontend -->|SSR: внутренний HTTP API| api
    api --> postgres[(PostgreSQL)]
    api --> redis[(Redis)]
```

PostgreSQL хранит игроков, комнаты, раунды, риффы и голоса. Redis хранит
сессии. Таблицы создаются при старте, если задан `PE_INIT_DB=true`, иначе при
первом игровом запросе.

### Структура репозитория

```text
frontend/
  src/
    router.tsx          Точка входа TanStack Start
    app/                Маршруты, router/QueryClient, глобальные стили
    pages/              Страницы
    widgets/            Самостоятельные блоки интерфейса
    features/           Действия пользователя
    entities/           Сущности, типы и query options
    shared/             API-клиент, общие модули и инфраструктура браузера
  test/                 Тесты правил FSD
  Dockerfile
backend/
  src/app/
    main.py             Фабрика FastAPI и ASGI-приложение
    api/                HTTP-обработчики, роутеры и сборка зависимостей
    schemas/            Pydantic-модели запросов и ответов
    services/           Сценарии приложения
    domain/             Доменные модели и будущие интерфейсы репозиториев
    infrastructure/     Место для адаптеров БД и внешних интеграций
    core/               Настройки
  tests/                API-тесты
  Dockerfile
docs/                   Лабораторные работы, ADR и диаграммы
scripts/                Общие скрипты, включая smoke-compose.py
.github/workflows/      Проверки frontend, backend и всего проекта
compose.yaml            Четыре сервиса и постоянные тома
```

### Frontend: Feature-Sliced Design

Направление зависимостей: `app → pages → widgets → features → entities → shared`.
Слой может импортировать любой нижний слой, пропуская промежуточные. Слайсы
одного слоя изолированы; общие зависимости выносятся вниз, композиция — вверх.
`app` и `shared` организованы по сегментам без бизнес-слайсов.

Алиасы `@app/*`, `@pages/*`, `@widgets/*`, `@features/*`, `@entities/*`,
`@shared/*` настроены в TypeScript и Vite. Внешний код использует публичный
`index.ts` слайса; внутри слайса применяются относительные импорты.

```ts
import { HomePage } from '@pages/home'
import { healthQueryOptions } from '@entities/health'
```

Импорт `@features/filter-rooms/model/filter-rooms` из другого слайса обходит публичный
API и запрещён. Общие компоненты импортируются через публичный API `@shared/ui`.

`pnpm lint` запускает ESLint и Steiger. Steiger проверяет структуру слоёв,
слайсов и сегментов, импорты верхних слоёв и соседних слайсов, обход публичных
API, локальность импортов и wildcard-экспорты. Он учитывает алиасы и относительные
пути, включая импорты типов. Настройки — в `frontend/steiger.config.js`.
Исключены framework-entry `src/router.tsx` и генерируемый `app/routeTree.gen.ts`;

| Инструмент | Ответственность |
| --- | --- |
| TanStack Start / Router | SSR и файловые маршруты в `app/routes`; маршруты подключают `pages` |
| TanStack Query | Серверные данные, кэш, загрузка и ошибки; query options рядом с сущностью |
| SCSS | Глобальные стили в `app/styles`, локальные `*.module.scss` рядом с UI |

`QueryClient` создаётся внутри `getRouter()` отдельно для каждого router/SSR-запроса,
чтобы не смешивать пользовательские кэши. Router SSR Query переносит данные в браузер.

### Backend: слоистая архитектура

HTTP-обработчики вызывают сервисы, сервисы работают с доменными моделями:

```text
HTTP → api → services → domain
        ↓
     schemas
```

Pydantic-схемы описывают транспортный контракт и не заменяют доменные сущности.
`domain` не зависит от FastAPI, Pydantic или базы. Будущие интерфейсы репозиториев
предполагается описывать через `Protocol` в домене, реализации — в
`infrastructure/repositories`. `api/dependencies.py` связывает реализации
с сервисами через `Depends`. `main.py` собирает приложение, CORS и роутеры.

Текущий пример: `GET /api/v1/health → HealthService → HealthStatus → HealthResponse`.
Ответ — `{"status":"ok","service":"pe-backend"}`. Это liveness endpoint;
доступность PostgreSQL и Redis он не проверяет.

### Данные и игровой цикл

Пять сущностей уже лежат в PostgreSQL: игрок, комната, раунд, рифф и голос.
Игрок — гость или владелец аккаунта; сессия живёт в Redis и не даёт аккаунту
дополнительных игровых прав. Рифф — JSON нот и тембр `clean` или `distortion`.
Раунд берёт луп, BPM и число тактов из каталога и считает дедлайны на сервере.
Связка гостя с аккаунтом посреди раунда не делается. Локальное сохранение
черновиков риффов пока не реализовано. Базовый профиль с историей и статистикой доступен
через API. Рейтинги, турниры, запись
живой гитары и экспорт WAV остаются за объёмом MVP. Контракт — в [игровом API](#api).

### Конфигурация

| Где | Переменные | Назначение |
| --- | --- | --- |
| `frontend/.env` | `VITE_API_URL` | Публичный адрес API, включается в клиентскую сборку |
| Окружение Node.js | `API_INTERNAL_URL` | Адрес API для SSR при запуске; иначе используется публичный URL |
| Окружение Nitro | `HOST`, `PORT` | Адрес и порт production-сервера |
| `backend/.env` | `PE_APP_NAME`, `PE_DEBUG`, `PE_CORS_ORIGINS` | Настройки API и разрешённые origins |
| `backend/.env` | `PE_DATABASE_URL`, `PE_REDIS_URL`, `PE_INIT_DB` | PostgreSQL, Redis и создание таблиц при старте |
| `backend/.env` | `PE_COMPOSE_SECONDS`, `PE_VOTE_SECONDS` | Длительность сочинения и голосования, по умолчанию 300 и 300 |
| `backend/.env` | `PE_SMTP_*`, `PE_FRONTEND_RESET_URL`, `PE_RESET_TTL_SECONDS` | Отправка ссылок восстановления и срок их действия |
| Корневой `.env` | `FRONTEND_PORT`, `BACKEND_PORT`, `VITE_API_URL`, `POSTGRES_*` | Подстановки Compose и первичная инициализация PostgreSQL |

При запуске исходников backend читает свой `.env` независимо от рабочей директории;
переменные окружения имеют приоритет. Списки, например `PE_CORS_ORIGINS`, передаются
JSON-массивами. В контейнере Compose задаёт настройки через environment.
После изменения настроек перезапустите приложение.

После изменения `VITE_API_URL` нужен перезапуск dev-сервера или новая сборка.
Секреты нельзя хранить в `VITE_*`: значения доступны браузеру.
В Compose SSR использует `http://backend:8000/api/v1`, а браузер —
опубликованный адрес `http://localhost:8000/api/v1`.

<a id="api"></a>

## Игровой API

Базовый префикс — `/api/v1`. Health, регистрация, вход, восстановление,
гостевой сеанс и список публичных комнат не требуют токена. Остальные запросы
передают `Authorization: Bearer <token>`.
Ошибка приложения — JSON `{"code","detail"}`.

| Метод и путь | Назначение |
| --- | --- |
| `POST /auth/register` | Аккаунт: `email`, `nickname`, `password`; старый `username` также принимается |
| `POST /auth/login` | Вход по `email` и `password`; старый `username` также принимается |
| `POST /auth/logout` | Завершить текущую сессию |
| `POST /auth/password-reset/request` | Запросить ссылку по `email`; нужен SMTP |
| `POST /auth/password-reset/confirm` | Установить пароль по `token` и `password` |
| `POST /session/guest` | Вход по нику |
| `GET /session/me` | Текущий игрок |
| `GET /loops` | Каталог лупов: id, BPM, число тактов, URL |
| `GET /rooms` | Публичные активные комнаты; `limit` и `offset` |
| `POST /rooms` | Создать комнату: `name`, `visibility`, `capacity`, `bars`, необязательный `style` |
| `POST /rooms/join` | Войти по коду |
| `GET /rooms/{id}` | Состав, код, этап |
| `DELETE /rooms/{id}/membership` | Выйти; роль хоста переходит к тому, кто вошёл раньше |
| `POST /rooms/{id}/rounds` | Хост запускает раунд; тело может содержать `loop_id` |
| `GET /rounds/{id}` | Состояние раунда |
| `PUT /rounds/{id}/riff` | Сохранить или заменить свой рифф |
| `POST /rounds/{id}/votes` | Один голос за чужой рифф |
| `GET /profile/me` | Имя, handle, дата регистрации, статистика, лучший раунд и история аккаунта |
| `PATCH /profile/me` | Обновить `name` и `handle` |

Нота — `{pitch, start, duration, velocity}`. `start` и `duration` заданы в
долях, в такте четыре доли, длина лупа равна `bars * 4`. Тембр — `clean` или
`distortion`.


<a id="development"></a>

## Разработка и проверки

Все команды выполняются из корня. pnpm управляет JS-зависимостями,
uv — отдельным Python-проектом в `backend`.

| Команда | Назначение |
| --- | --- |
| `pnpm dev` | Frontend с обновлением при изменениях, порт 3000 |
| `pnpm dev:backend` | Uvicorn с reload, порт 8000 |
| `pnpm build` | Production-сборка Nitro и генерация маршрутов |
| `pnpm typecheck` | TypeScript; выполнять после первого build или dev |
| `pnpm lint` | ESLint и Steiger; предупреждения приводят к ошибке |
| `pnpm lint:fsd` | Только структура и зависимости FSD |
| `pnpm test:frontend` | Проверка FSD-конфигурации на допустимых и запрещённых примерах |
| `pnpm lighthouse` | Отчёты Lighthouse для запущенного приложения на `127.0.0.1:3000` |
| `pnpm lighthouse:check` | Проверка порогов отчёта: 70/80/80/80 для performance/accessibility/best-practices/SEO |
| `pnpm storybook` | Каталог UI-компонентов и страниц на `http://localhost:6006` |
| `pnpm storybook:build` | Статическая сборка Storybook в `frontend/storybook-static` |
| `pnpm lint:backend` | Ruff для backend |
| `pnpm test:backend` | Pytest: health API и CORS |
| `uv run --project backend ruff check backend scripts` | Ruff, включая общие скрипты |
| `uv run --project backend ruff format --check backend scripts` | Проверка форматирования Python |
| `uv build --project backend` | Wheel и source distribution |
| `pnpm --filter @pe/frontend start` | Запуск готовой `.output/server/index.mjs` |
| `pnpm --filter @pe/frontend preview` | Локальный просмотр сборки через Vite |


<a id="docker"></a>

## Docker

Оба Dockerfile используют корень репозитория как build context:

```sh
docker build -f frontend/Dockerfile -t pe-frontend .
docker build -f backend/Dockerfile -t pe-backend .
```

Frontend собирается в Node.js-стадии с pnpm; финальный образ содержит только
Nitro `.output` и запускает Node.js без Vite dev/preview. Backend собирает
production-venv через uv, включая приложение без editable-установки;
runtime содержит venv без uv и инструментов разработки, Uvicorn работает без reload.

В обоих runtime-образах создан пользователь `app` с UID/GID `10001`, задан
`USER app:app`. Compose включает init-процесс. `.dockerignore` исключает Git,
локальные зависимости, сборки и `.env` из build context.

| Сервис | Публикация портов по умолчанию | Хранение и проверка |
| --- | --- | --- |
| frontend | `127.0.0.1:3000:3000` | HTTP healthcheck страницы |
| backend | `127.0.0.1:8000:8000` | HTTP healthcheck `/api/v1/health` |
| postgres | Только внутри сети, `postgres:5432` | Том `postgres_data`, `pg_isready` |
| redis | Только внутри сети, `redis:6379` | Том `redis_data`, AOF, `redis-cli ping` |

Backend ожидает готовности PostgreSQL и Redis; frontend — готовности backend.
Все сервисы используют `restart: unless-stopped`. Порты приложений опубликованы
на loopback хоста; внешний доступ требует отдельной настройки.

```sh
docker compose ps
docker compose logs -f frontend backend
docker compose exec frontend id
docker compose exec backend id
docker compose down
```

Ожидаемый пользователь приложений — `uid=10001(app) gid=10001(app)`.
Обычный `down` сохраняет тома. **`docker compose down -v` удаляет данные
PostgreSQL и Redis** и нужен только для намеренного сброса окружения.

<a id="ci"></a>

## GitHub Actions

Общий [Project CI](.github/workflows/project.yml) запускается на push в любую
ветку, pull request и вручную. Он вызывает два reusable workflow, которые также
можно запускать вручную.

| Workflow / job | Проверки |
| --- | --- |
| [Frontend](.github/workflows/frontend.yml) | Node.js 24, pnpm и кэш; установка frozen, ESLint/Steiger, тесты FSD, production-сборка, Storybook, затем TypeScript |
| [Backend](.github/workflows/backend.yml) | Python 3.12, uv 0.8.18 и кэш; установка locked, Ruff lint/format, API-тесты и сборка пакета |
| Workflow validation | actionlint: YAML, выражения и shell-команды workflow |
| Docker Compose integration | Сборка образов, запуск четырёх сервисов, healthcheck, UID приложений, SQL-запрос, Redis PING, HTTP/SSR, статика и Lighthouse |
| CI | Итоговый успех только при успешном завершении всех проверок |

