# Enterprise Hackathon Core Foundation Audit

This document presents the detailed, line-by-line verified audit of the existing foundations in `core-frontend`, `core-backend`, the Docker setup, and the Prisma configuration.

---

## 1. What Exists

### Frontend Repository (`core-frontend/`)
- **React + Vite SPA**: Configured using React `19.2.8` and Vite `8.2.0`.
- **Client-Side Routing**: Configured with `react-router` `7.1.5` in `src/App.tsx`.
- **Environment Validation**: Simple client-side environment helper `src/config.ts` loading `VITE_API_URL` (defaulting to `http://localhost:4000`).
- **Thin Fetch API Client**: `src/api/client.ts` implementing a standard type-safe wrapper over `fetch` API, extracting backend validation details (looks for standard `{ error: { message, code, details } }` wrapper).
- **React Error Boundary**: A traditional class-based Error Boundary in `src/components/ErrorBoundary.tsx` that catches rendering errors and displays a clean fallback UI with a reload button.
- **Application Shell**: `src/components/AppShell.tsx` offering a semantic `<header>` and `<main>` structure with a router `<Outlet />`.
- **Design Tokens/CSS Foundation**: Co-located in `src/index.css` defining semantic theme variables for light and dark modes (colors, layout variables, spacing).
- **Linter & Formatter**: Configured with Prettier and Oxlint.

### Backend Repository (`core-backend/`)
- **Express 5 API Server**: Express `5.2.1` server running on port 4000.
- **Config Validator**: Zod-based config validator `src/modules/core/config/index.ts` checking `PORT`, `NODE_ENV`, `DATABASE_URL`, and `CORS_ORIGIN` on boot.
- **Structured JSON Logger**: Pino `9.3.2` + `pino-pretty` (in development mode) in `src/modules/core/logger/index.ts`.
- **Error Taxonomy & Middleware**: `src/modules/core/errors/index.ts` declaring standard API error classes (`AppError`, `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `RateLimitError`, `InternalServerError`) and an Express-compatible error handler.
- **Security Middleware**: `src/middleware/security.ts` configuring `cors` and `helmet` along with an in-memory IP-based rate limiter (capped at 100 requests per minute).
- **Graceful Shutdown & Health Endpoint**: Implemented in `src/index.ts`. `SIGTERM` and `SIGINT` catch listeners trigger server closing with a 10s drain timeout. A basic GET `/api/health` endpoint exists.
- **Correlation ID Middleware**: `src/middleware/request-id.ts` injecting node's native `crypto.randomUUID()` request correlation tracking.

### Shared API & Database Setup
- **OpenAPI Schema Contract**: Authoritative REST contract defined in JS object at `core-backend/src/openapi.ts`, exported to `docs/openapi.json` via script.
- **Type Generation**: Frontend reads `docs/openapi.json` and runs `openapi-typescript` to output typescript contracts in `core-frontend/src/types/api.ts`.
- **Database Schema**: PostgreSQL 17 base configuration using Prisma 7 (`7.9.1`). Includes a single `User` table map in `prisma/schema.prisma`.
- **Docker Compose**: Orchestrates a single database container (`postgres:17-alpine`) mapping port 5432 and persisting volume data.

---

## 2. What is Verified

The following pipelines have been verified using live execution:
1. **Backend Build & Verification**: Running `pnpm run verify` in `core-backend` successfully executes Prettier check, Oxlint scan, TypeScript compilation, and TSX build without errors.
2. **Frontend Build & Verification**: Running `pnpm run verify` in `core-frontend` executes Prettier check, Oxlint scan, TypeScript project reference builds, and Vite asset production bundle compilation without errors.
3. **OpenAPI Schema Pipeline**: Running `pnpm run openapi:generate` in the backend updates `docs/openapi.json`. Then, running `pnpm run gen:api` in the frontend successfully compiles a type-safe `api.ts` file.

---

## 3. What is Incomplete

- **No Frontend Testing Setup**: The frontend has no test framework dependencies (such as Vitest), configuration, or runner scripts.
- **No Real Backend Tests**: The backend specifies `"test": "vitest run"` but fails execution because there are zero test files written.
- **No Automated Contract/API Validation**: There are no tests verifying that the Express API implementation actually conforms to `docs/openapi.json` at runtime, or that generated types are synced.
- **No Automated Architecture Rules**: Although an architecture specification document exists, there is no automated machinery (like static analysis, Dependency Cruiser, or custom eslint/typescript rules) enforcing import constraints (e.g. core-to-domain separation, frontend-to-database separation).
- **Missing Docker Development Topology**: A root `docker-compose.yml` runs PostgreSQL, but neither `core-backend` nor `core-frontend` has a Dockerfile or compose service to facilitate full-stack environment boot via `docker compose up`.

---

## 4. Architecture & Technology Deviations

### Architecture Specification
- **Strict Module Encapsulation (`index.ts` gateway)**:
  - Inside `core-backend/src/index.ts`, modules are imported directly from sub-paths (e.g., `import { config } from './modules/core/config/index.js'`) instead of a single core entry point. While acceptable, this violates strict public gateway architecture conventions.
  - The middleware is imported as `import { corsMiddleware, ... } from './middleware/security.js'` rather than package index entries.

### Technology Baseline
- **Node.js Target Version**: The baseline specifies Node `24.19.0` (LTS), but the current run environment uses `22.22.1`. However, runtime features utilized (`crypto.randomUUID()`) are fully supported, and package configurations target Node 24 types.

---

## 5. Security Gaps

1. **IP-Based In-Memory Rate Limiter**:
   - The in-memory map `rateLimitMap` will leak memory over time as IPs are added and never cleaned up (there is no background eviction task or garbage collection).
   - This in-memory limiter behaves correctly on single instances, but fails in multi-instance topologies.
2. **No Security Verification**:
   - Helmet and CORS are loaded, but no automated tests ensure headers (like HSTS or CSP) are active, or that unlisted origins are rejected.
3. **Missing Authentication and Authorization Boundaries**:
   - The `User` schema exists but is completely disconnected from session, login, or cookie verification routes.

---

## 6. Testing Gaps

- **0% Test Coverage**: Neither repository runs any unit, integration, or E2E tests in the verification pipelines.
- **No Mock Database Layer**: No testing database infrastructure is configured. Testing prisma queries will require configuring a postgres instance or writing transaction mock utilities.
- **No Health & Readiness Distinction**: GET `/api/health` returns `status: ok` immediately, but does not execute diagnostic checks on PostgreSQL to confirm readiness.

---

## 7. Documentation Gaps

- **Lack of Local Setup Guide**: No root developer instructions guide a new developer on how to launch the backend, migrate database schemas, seed mock users, and bind the Vite frontend.
- **Outdated State Records**: The existing `docs/implementation/current-state.md` references a broken TypeScript compilation issue which has already been fixed by setting TypeScript to `6.0.2`.

---

## 8. Risks

1. **AI Obsolete Code Leakage**: Without architecture checks, an AI agent could easily bypass the API gateway and create direct file or database imports inside `core-frontend`.
2. **Memory Growth Vulnerability**: The `rateLimitMap` in `core-backend/src/middleware/security.ts` accumulates memory for every unique IP accessing the app, exposing the system to memory exhaustion (OOM) under sustained scan queries.
3. **Silent OpenAPI Drifts**: A developer might modify an Express route handler but forget to update the object schema inside `core-backend/src/openapi.ts`. Without contract tests, this will compile but cause runtime frontend crashes.

---

## 9. Recommended Corrections

1. **Upgrade Rate Limiter**: Clear out-of-date rate limit IP maps, or cap the size of the IP map to prevent memory leak issues.
2. **Implement Vitest Setup for Frontend**: Add `vitest` and `@testing-library/react` to `core-frontend` devDependencies, set up `vitest.config.ts`, and create tests for `ErrorBoundary`, `AppShell`, and the `apiClient`.
3. **Implement Backend Tests**: Configure `vitest` in `core-backend` and test `config` schema rejection, health check route, error mapping, and correlation IDs.
4. **Automated OpenAPI Contract Checks**: Introduce a script or test validating the generated `openapi.json` against actual router declarations, or test that types compiled perfectly.
5. **Architecture Guardrails**: Write custom node-based scripts or use a tool to enforce repository boundary isolation (preventing frontend importing backend files and vice-versa, core-to-domain rules).
6. **Implement Liveness & Readiness**: Update the health module to distinguish between process liveness (lightweight) and system readiness (confirm database ping via Prisma `$queryRaw`).
