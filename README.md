# HTX_THA

HTX Take Home Assignment

- **db** — PostgreSQL 18, schema and seed data applied on first start
- **backend** — Express 5 + TypeScript, `pg` with a repository layer, Swagger docs
- **frontend** — React + TypeScript, bundled with webpack, styled with Tailwind

Tasks form a tree through `parent_id`, carry required skills, and may only be
assigned to a developer holding every skill the task requires.

---

## Prerequisites

- Docker Desktop (for the compose setup)
- Node.js 20+ and npm (for local development)

---

## Running everything with Docker Compose

From the repository root.

**1. Create the environment file**

```bash
cp .env.example .env
```

Values it controls:

| variable | default | used for |
| --- | --- | --- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `htx` / `change_me` / `htx_tha` | database credentials, applied on first start only |
| `POSTGRES_PORT` | `5432` | host port for Postgres |
| `BACKEND_PORT` | `9000` | API port, and the origin the frontend bundle calls |
| `FRONTEND_PORT` | `8080` | host port for the web app, and the allowed CORS origin |
| `GEMINI_API_KEY` | empty | optional, see [Skill inference](#skill-inference-optional) |
| `GEMINI_MODEL` | `gemini-3.6-flash` | optional |

**2. Start the stack**

```bash
docker compose up -d
```

Both images are built from `./backend` and `./frontend` on every `up` — they are
never pulled from a registry. Services come up in order —
Postgres must report healthy before the backend starts, and the backend must
report healthy before the frontend starts.

| service | URL |
| --- | --- |
| frontend | http://localhost:8080 |
| backend | http://localhost:9000/api/v1/health |
| API docs | http://localhost:9000/api/v1/docs |
| Postgres | `localhost:5432` |

**3. Stopping**

```bash
docker compose down       # keeps the database volume
docker compose down -v    # also drops the database
```

### Rebuilding after a code change

Both services set `pull_policy: build`, so `docker compose up -d` rebuilds from
source every time. Layer caching keeps that to a couple of seconds when nothing
has changed. To rebuild ignoring the cache:

```bash
docker compose build --no-cache backend frontend
docker compose up -d --force-recreate
```

The frontend's `API_BASE_URL` is compiled **into** the bundle, so changing
`BACKEND_PORT` requires rebuilding the frontend image, not just restarting it.

---

## Backend — local development

Runs on **port 3000** and talks to the Postgres container. Nothing else from
the compose stack needs to be running.

```bash
# from the repository root, start the database only
docker compose up -d postgres

cd backend
cp .env.example .env      # then fill in DATABASE_URL if your credentials differ
npm install
npm run dev
```

`http://localhost:3000/api/v1/health` should return `{"status":"ok",...}`.

**`backend/.env`**

| variable | local value | notes |
| --- | --- | --- |
| `NODE_ENV` | `development` | selects which env file is loaded |
| `PORT` | `3000` | |
| `CORS_ORIGIN` | `http://localhost:3001` | must match the frontend dev server |
| `DATABASE_URL` | `postgres://admin:password@localhost:5432/tha` | `localhost`, since Postgres is published on the host |
| `GEMINI_API_KEY` | empty | optional |

The credentials in `DATABASE_URL` must match the `POSTGRES_*` values the
database volume was **first created** with — they are ignored on later starts.

### Scripts

| command | does |
| --- | --- |
| `npm run dev` | watch mode via `tsx` |
| `npm run build` | compile to `dist/` |
| `npm start` | run the compiled build in production mode |
| `npm run clean` | remove `dist/` |
| `npm run typecheck` | `tsc --noEmit` |

### Endpoints

```
GET    /api/v1/health
GET    /api/v1/tasks              GET /api/v1/tasks/:id
POST   /api/v1/tasks              PATCH /api/v1/tasks/:id
GET    /api/v1/developers         GET /api/v1/developers/:id
GET    /api/v1/skills             GET /api/v1/skills/:id
GET    /api/v1/docs               Swagger UI  (docs.json for the raw spec)
```

Two rules are enforced on write, both returning `409`:

- a task may only be assigned to a developer holding **every** required skill
- a task may only become `done` once **every** subtask beneath it is `done`
- *Assumption* : In the scenario where a branch of tasks is `done`, when a subtask is set to todo/doing, the walk up to root is set as `doing`
---

## Frontend — local development

Runs on **port 3001** and expects the backend on port 3000.

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:3001.

**`frontend/.env`**

| variable | local value | notes |
| --- | --- | --- |
| `NODE_ENV` | `development` | selects which env file is loaded |
| `PORT` | `3001` | webpack dev server port |
| `API_BASE_URL` | `http://localhost:3000` | must match the backend's `PORT` |

### Scripts

| command | does |
| --- | --- |
| `npm run dev` | webpack dev server with hot reload |
| `npm run build` | production bundle into `dist/` |
| `npm run clean` | remove `dist/` |
| `npm run typecheck` | `tsc --noEmit` |

### Running both together

Three terminals:

```bash
docker compose up -d postgres   # from the repository root
cd backend && npm run dev       # port 3000
cd frontend && npm run dev      # port 3001
```

`CORS_ORIGIN` in `backend/.env` must name the frontend's origin
(`http://localhost:3001`), otherwise the browser blocks every request.

---

## Database

`db/init/` runs automatically **the first time** the data volume is created:

- `01-schema.sql` — `developers`, `skills`, `tasks`, and the `developer_skill` /
  `task_skill` pairing tables
- `02-seed.sql` — sample developers, skills and tasks with fixed UUIDs

Editing these files has no effect on an existing volume. To re-apply them:

```bash
docker compose down -v && docker compose up -d
```

That destroys all data. A psql shell into the running container:

```bash
docker compose exec postgres psql -U admin -d tha
```

---

## Skill inference (optional)

When a task is created without any skills selected, the backend can infer them
from the title using the Google Gemini API. Set a free key from
[aistudio.google.com](https://aistudio.google.com) in the root `.env`
(compose) or `backend/.env` (local dev):

```
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-3.6-flash
```

Without a key the feature is inert and nothing else changes. If the call fails
for any reason — no key, timeout, quota exhausted, or no skill matching the
title — the task is still created and falls back to the **Backend** skill, with
the reason logged:

---
## Additional Notes
### Areas for improvement
- Proper backend logging to be implemented
- Backend unit testing to be implemented
- If repository layer bloats up, convert to ORM, preferably PRISMA
### Areas where AI was used
#### Backend
- Repository Layer
- Generating of swagger docs
- Debugging of Skill Inference middleware
#### Frontend
- Tree implementation and how the walk was done for subtree.


