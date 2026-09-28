# TaskHub Pro

## Table of contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Setup](#setup)
- [Demo accounts](#demo-accounts)
- [API reference](#api-reference)
- [Known limitations / what I'd do with more time](#known-limitations--what-id-do-with-more-time)

## Overview

TaskHub Pro is a small multi-tenant task-management app: users belong to an organization, sign in, and manage tasks scoped by role (USER/MANAGER/ADMIN) and organization. The original assessment brief specified NestJS + MongoDB; this implementation substitutes **Express + TypeScript + Prisma + PostgreSQL** on the backend, reproducing the same architectural concepts (layered app structure, DTO-style request validation, guard-equivalent middleware, an ODM/ORM-backed data layer) with a stack the author is more fluent in, plus a **React + Vite + TypeScript** frontend consuming that API.

## Architecture

**Backend layering:** `routes/` (Express routers, wire up middleware + controller) → `controllers/` (thin request/response glue, no business logic, wrapped in a shared `asyncHandler` so rejected promises reach the error middleware) → `services/` (business logic, Prisma queries) → `Prisma` (schema/migrations/client) over PostgreSQL. Request bodies/query strings are validated with `zod` schemas via `validate`/`validateQuery` middleware before controllers ever see them. A single `errorMiddleware`, mounted last, normalizes every thrown error (an `AppError` with an explicit status code and message, or any other error, treated as a 500) into one consistent JSON shape.

**RBAC + multi-tenancy:** every authenticated request carries a JWT-derived `req.user` (`id`, `email`, `orgId`, `role`). Two mechanisms enforce access: `requireRole(...roles)` middleware outright blocks whole endpoints from disallowed roles (e.g. bulk-update is MANAGER/ADMIN only), while `utils/taskScope.ts` builds row-level Prisma `where` filters (`buildTaskScopeWhere`) and per-record checks (`canAccessTask`) so a USER only ever sees/mutates their own tasks, a MANAGER sees their whole org, and an ADMIN sees across all orgs for **tasks** (a deliberate choice — see `PROGRESS.md` Phase 4 for the reasoning). `orgId` is always read from the verified JWT payload, never from client-supplied input, so a caller cannot escalate scope by forging a request field. **User management is a separate, ADMIN-only resource (`/api/users`) that is deliberately org-scoped, not global** — an ADMIN can view/change roles only for users in their own organization, never across orgs; see `PROGRESS.md` Phase 12 for the rationale.

**Auth token transport:** access (15m) and refresh (7d) JWTs are set by the server as `httpOnly`, `SameSite=Lax` cookies (`server/src/utils/cookies.ts`) rather than returned in the JSON body — client-side JavaScript never has access to the raw tokens, which closes off token exfiltration via XSS. The browser attaches them automatically on same-site/credentialed requests, so CORS is configured with an explicit `origin` (the Vite dev URL, from `CLIENT_URL`) and `credentials: true` (a wildcard `origin` can't be paired with credentialed cookies).

**Frontend:** an Axios instance (`withCredentials: true`) with a response interceptor (transparently refreshes+retries once on 401 by calling `POST /auth/refresh`, which relies on the refresh cookie being sent automatically; single in-flight refresh shared across concurrent requests) backs a small service layer, wrapped by an `AuthContext` and a `ProtectedRoute` guard. The Tasks page composes filter/table/modal/bulk-action components, keeping filter state in the URL (`useSearchParams`) so filtered views are shareable/bookmarkable.

## Tech stack

**Backend:** Express, TypeScript, Prisma ORM, PostgreSQL, zod (validation), jsonwebtoken (JWT access + refresh), bcryptjs (password hashing), cors, `tsx` (dev runner).

**Frontend:** React, Vite, TypeScript, Axios, React Router.

**Infra:** PostgreSQL via Docker for local dev.

## Setup

Requires Node.js and Docker.

### 1. Clone and start Postgres

```bash
git clone <this-repo-url>
cd assessment
docker run -d --name taskhub-db \
  -e POSTGRES_USER=taskhub \
  -e POSTGRES_PASSWORD=taskhub \
  -e POSTGRES_DB=taskhub \
  -p 5434:5432 \
  postgres:16
```

Port `5434` (not the default `5432`) is used because `5432`/`5433` were already taken by other local projects — free to use `5432` instead if it's available on your machine, just keep `DATABASE_URL` below in sync.

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
```

`server/.env.example` ships with values that already match the container above:

```
DATABASE_URL="postgresql://taskhub:taskhub@localhost:5434/taskhub"
PORT=4000
JWT_ACCESS_SECRET="change-me-access-secret"
JWT_REFRESH_SECRET="change-me-refresh-secret"
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

`CLIENT_URL` is the Vite dev origin, used as the exact (non-wildcard) `Access-Control-Allow-Origin` — required alongside `credentials: true` so the browser will send/accept the httpOnly auth cookies cross-port.

Then apply migrations, seed demo data, and start the API:

```bash
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

The API listens on `http://localhost:4000` (from `PORT` in `.env`). Confirm it's up:

```bash
curl http://localhost:4000/health
# {"status":"ok"}
```

### 3. Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

`client/.env.example`:

```
VITE_API_URL=http://localhost:4000/api
```

Vite serves on `http://localhost:5173` (or the next free port, e.g. `5174`, if that one's taken). Open it in a browser: `/` is a public landing page with **Log in** / **Sign up** links, `/login` signs in with an existing account (demo accounts below, or the seeded ones), `/register` creates a brand-new organization and its founding ADMIN user in one step (no separate login step needed afterward), and `/tasks` is the protected task list.

## Demo accounts

All seeded by `server/prisma/seed.ts`, password **`Password1!`** for every account.

| Email | Role | Organization |
|---|---|---|
| `admin@orga.com` | ADMIN | Org A (global visibility across all orgs) |
| `manager@orga.com` | MANAGER | Org A (org-wide visibility) |
| `user1@orga.com` | USER | Org A (own tasks only) |
| `user2@orga.com` | USER | Org A (own tasks only) |
| `user3@orgb.com` | USER | Org B (own tasks only) |
| `user4@orgb.com` | USER | Org B (own tasks only) |

The seed also creates ~50 tasks spread across both orgs with randomized status/priority/tags/due dates (including some overdue).

## API reference

All `/api/tasks/*` routes require an authenticated session — the `accessToken` httpOnly cookie set by `/api/auth/login`, `/register`, or `/refresh`, sent automatically by the browser (no manual header needed; `fetch`/`axios` calls need `credentials: 'include'` / `withCredentials: true`). Responses are scoped per the RBAC/multi-tenancy rules described above.

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | none | Log in with email + password; sets the `accessToken`/`refreshToken` httpOnly cookies and returns the user (no tokens in the body). |
| POST | `/api/auth/register` | none | Self-serve registration: `{ email, password, orgName }` creates a brand-new organization and the registrant as its founding ADMIN; sets auth cookies the same way as login (no separate login step needed afterward). |
| POST | `/api/auth/refresh` | none (valid `refreshToken` cookie) | Rotates the session and re-sets both auth cookies with a fresh pair; returns the user (no tokens in the body). |
| POST | `/api/auth/logout` | none (uses `refreshToken` cookie if present) | Deletes the session server-side and clears both auth cookies. |
| GET | `/api/auth/me` | required | Returns the authenticated user (from the verified `accessToken` cookie). |

### Tasks — `/api/tasks`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/tasks` | required | List tasks, scoped by role/org; supports `status`, `priority`, `tags` (csv), `q` (title search), `cursor`, `limit` query params; cursor-paginated. |
| POST | `/api/tasks` | required | Create a task (owner/org always derived from the caller, never the request body). |
| PATCH | `/api/tasks/bulk` | required, MANAGER/ADMIN only | Bulk-set `status`/`priority` on a list of task ids; returns `{ updatedIds, skippedIds }` (ids outside the caller's scope are silently skipped, not errored). |
| PATCH | `/api/tasks/:id` | required | Update a single task (404 if it doesn't exist, 403 if outside the caller's scope). |
| DELETE | `/api/tasks/:id` | required | Delete a single task (same 404/403 scoping as update). |

### Users — `/api/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users` | required, ADMIN only | List users in the caller's own organization (safe fields only: `id`, `email`, `role`, `createdAt`, never the password hash). |
| PATCH | `/api/users/:id/role` | required, ADMIN only | Change a user's role. 404 if the target doesn't exist, 403 if the target belongs to a different organization (cross-org protection, same class of guard as `canAccessTask`), 400 if the caller targets their own id (self-lockout protection — an ADMIN cannot change their own role). |

All error responses share one shape: `{ "error": { "message": string, "code"?: string } }`, with an appropriate HTTP status code (400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 500 unexpected). Unmatched routes also return this same shape with a 404, rather than a default HTML error page.

## Known limitations / what I'd do with more time

- **Manual browser QA has not been done.** Everything has been verified via `curl` (API level) and `tsc`/`npm run build` (type/build level) in an environment without a browser — login, the 401-refresh-retry flow, protected-route redirects, and the full Tasks UI (filters/search URL round-trip, create/edit/delete, bulk actions, "Load more" pagination, overdue highlighting) still need a real click-through pass before this is submission-ready.
- **No automated test suite.** All verification so far has been manual (curl scripts + type-checking); given more time I'd add integration tests for the auth/RBAC/scoping logic (the highest-risk area) and component/e2e tests for the Tasks UI.
- **No rate limiting** on auth endpoints (login/refresh), so brute-forcing credentials isn't mitigated at the application layer.
- **Cookie `secure` flag is `false` in dev** (driven off `NODE_ENV`, see `server/src/utils/cookies.ts`) since local dev runs over plain HTTP — this must become `true` before any deployment behind HTTPS, or browsers will silently drop the cookie over an insecure connection.
- **Owner column on the tasks table shows a raw `ownerId`**, not a resolved name/email — the list endpoint doesn't join the owner relation. A `select`/`include` on the Prisma query plus a small user lookup on the client would fix this.
