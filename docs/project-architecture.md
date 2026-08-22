# HackCore System Architecture Specification

This document details the layout, architectural boundaries, and boundaries enforcement for the HackCore project.

---

## 1. presentation/Backend Separation

The application is structured as a **Polyrepo** containing two completely decoupled applications:

```text
               [ USER / BROWSER ]
                       │
                       ▼ (HTTP / Port 80)
              ┌─────────────────┐
              │ core-frontend   │ (React Single Page Application)
              └────────┬────────┘
                       │
                       ▼ OpenAPI JSON HTTP / REST (Port 4000)
              ┌─────────────────┐
              │ core-backend    │ (Express API Server)
              └────────┬────────┘
                       │
                       ▼ TCP / Prisma (Port 5432)
              ┌─────────────────┐
              │ PostgreSQL      │ (Relational Database)
              └─────────────────┘
```

* **Frontend**: Decoupled presentation layer compiled into a static client bundle. Runs in the browser and accesses remote endpoints.
* **Backend**: Stateless REST API service providing route handling, authorization, and data mapping.
* **PostgreSQL**: Relational database storage accessed exclusively by the backend service.

---

## 2. Architectural Boundaries

To prevent coupling and degradation of the stack, four key boundaries are programmatically checked:

### 2.1 The OpenAPI Contract Boundary
* The frontend must never write manual fetch functions or custom TypeScript types mirroring the backend database structures.
* The API structure is declared in a single source of truth: `core-backend/src/openapi.ts`.
* Any API schema change compiles to `docs/openapi.json` and gets auto-generated into frontend TypeScript typings in `core-frontend/src/types/api.ts`.
* Communication occurs strictly over this validated REST API contract.

### 2.2 The Database Boundary
* The frontend has no access to the database layer.
* Frontend code must never import Postgres, pg, Prisma, or server-side schemas.
* All database access is locked inside the backend's repository/Prisma layer.

### 2.3 The Configuration Boundary
* Raw process environment variables (such as `process.env` or `import.meta.env`) must not leak into business services or React views.
* All configuration variables must be loaded and validated inside central schemas:
  - Backend: `core-backend/src/modules/core/config/index.ts` (validated using Zod at startup).
  - Frontend: `core-frontend/src/config.ts`.

### 2.4 Core vs. Domain Separation
* **Core** infrastructure handles cross-cutting concerns (logging, configuration, security middleware, request IDs, standard error wrappers).
* Future project **Domain** features (business models, entities, routes, controllers) must not be written in Core directories. They should live inside a new domain-specific module.

---

## 3. Where to Add New Features

When expanding the application with new domain features, follow this file location convention:

### Backend
1. **Prisma Schema**: Add models inside `core-backend/prisma/schema.prisma` and run `pnpm prisma:migrate`.
2. **API Contract**: Add endpoints to the openApi document in `core-backend/src/openapi.ts`. Generate types with `pnpm openapi:generate`.
3. **Domain Module**: Create a new module folder in `core-backend/src/modules/domain/<feature>/`:
   - `controller.ts` (for handling Express route requests/responses)
   - `service.ts` (for business logic rules and calculations)
   - `repository.ts` (for database access utilizing the Prisma Client)
   - `index.ts` (exporting the module's public gateway interface)
4. **App Integration**: Register routes in `core-backend/src/app.ts` under `/api`.

### Frontend
1. **Regenerate Types**: Compile the updated contract types using `pnpm run gen:api` in the `core-frontend` folder.
2. **API Client**: Consume endpoints using the thin API client `core-frontend/src/api/client.ts`.
3. **Views & Components**: Add route views or custom components in `core-frontend/src/components/` and register pages in `core-frontend/src/App.tsx`.
