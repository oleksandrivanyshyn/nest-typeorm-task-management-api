# Task Management API

A NestJS + TypeORM + PostgreSQL REST API for managing tasks with JWT authentication and
role-based access control. Built as an AWS deployment practical: two environments (`dev` /
`prod`), each running on its own EC2 instance via Docker, deployed through GitHub Actions
using self-hosted runners.

## Stack

- NestJS 11, TypeScript
- PostgreSQL via TypeORM
- JWT authentication, role-based guards
- Docker / Docker Compose
- GitHub Actions (self-hosted runners on AWS EC2)
- Sentry error monitoring

## Local setup

```bash
npm install
cp .env.example .env   # fill in the values, see below
docker compose up -d postgres
npm run start:dev
```

The app listens on `PORT` (default `3000`). `GET /health` returns `{"status":"ok"}` once it's up.

## Environment variables

See `.env.example` for the full list. Summary:

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port the app listens on |
| `APP_MESSAGE_PREFIX` | Prefix used by `GET /` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE` | PostgreSQL connection |
| `DB_SYNC` | `1` enables TypeORM schema auto-sync (dev convenience only — must be `0` wherever migrations are the source of truth) |
| `DB_SSL` | `true` if the database requires a TLS connection |
| `JWT_TOKEN`, `JWT_EXPIRES_IN` | JWT signing secret and token lifetime |
| `SENTRY_DSN`, `SENTRY_ENVIRONMENT` | Optional — Sentry error monitoring, safe to leave empty |

## Database & migrations

```bash
npm run migration:generate   # generate a migration from entity changes
npm run migration:run        # apply pending migrations (dev, via ts-node)
npm run migration:run:prod   # apply pending migrations from the compiled dist/ output
```

## Tests

```bash
npm test          # unit tests
npm run test:e2e  # e2e tests (needs a running Postgres — see docker-compose.yml)
```

## Docker

```bash
docker compose up -d postgres   # database only, for local dev against npm run start:dev
docker compose up -d --build    # full stack: database + containerized app
```

## API overview

**Auth** (`/auth`)
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/profile`
- `GET /auth/admin` — admin-only

**Tasks** (`/tasks`)
- `GET /tasks`, `GET /tasks/:id`
- `POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id`
- `POST /tasks/:id/labels`, `DELETE /tasks/:id/labels`

## Deployment

Two environments, each on its own EC2 instance with a self-hosted GitHub Actions runner
(labels `dev` / `prod`) and Postgres running alongside the app via Docker Compose.

- **`dev`** — every push to the `dev` branch auto-deploys ([`dev-deploy.yml`](.github/workflows/dev-deploy.yml)).
- **`prod`** — deploys only via manual dispatch from the Actions tab ([`prod-deploy.yml`](.github/workflows/prod-deploy.yml)), and only from `main`.

Both call the same reusable [`deploy.yml`](.github/workflows/deploy.yml) workflow — no
duplicated deployment logic between environments. [`ci.yml`](.github/workflows/ci.yml) runs
unit tests on every push/PR against `dev`/`main`.

Configuration (DB credentials, JWT secret, Sentry DSN, etc.) is stored per-environment in
GitHub Environment secrets/variables and materialized into `.env` at deploy time — nothing
environment-specific is committed to the repo.
