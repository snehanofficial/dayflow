# ADR-0002: Polyrepo Separation & Shared Code Strategy

## Status
Approved

## Context
We need to define the repository boundaries and shared code policies for the Enterprise Hackathon Core. A single massive monorepo is often difficult to configure, has complex build chains, and mixes frontend and backend dependencies. On the other hand, extreme fragmentation (creating repositories for every microservice, package, or config) introduces orchestration overhead that a small team cannot sustain.

We need to establish:
1. The repository topology (at minimum, separating frontend and backend).
2. The mechanism for managing shared definitions (types, clients, schemas, and assets).

## Decisions

### 1. Repository Topology
We establish a **Two-Repository Baseline** structured as:
*   `client`: Holds the React + Vite SPA, UI components, static assets, and client-side routing/state.
*   `server`: Holds the Express.js API server, Prisma schema, migrations, database integrations, authentication/authorization layers, and business modules.

We deliberately reject additional separate repositories for infrastructure, deployment, design system, or documentation. These will be embedded inside the primary repositories as follows:
- **Design System**: Co-located in `client/src/design-system` as a modular directory, facilitating atomic development and direct hot-reloading.
- **Docker/Deployment Configurations**: Co-located inside their respective repositories (`client/Dockerfile` and `server/Dockerfile`), with a root-level `docker-compose.yml` orchestrating local development.
- **Documentation**: Root `/docs` directory present in both repositories, with `server` hosting the main API spec.

Every repository must represent a clear deployment boundary.

### 2. Shared Code & Contract Policy
To prevent tight coupling, cross-repository filesystem imports (`import ... from '../../server'`) are **strictly forbidden**.

We will manage shared code using:
1.  **OpenAPI 3.0 / Swagger API Contracts**: The backend defines the source-of-truth API schema.
2.  **Generated Types**: The frontend generates TypeScript types directly from the backend's OpenAPI definition, ensuring compile-time type safety without importing backend source files.
3.  **No Shared Mutable Code Directories**: Code will never be shared via copy-paste or local filesystem linking. If utility code is truly identical (e.g., specific math functions or validators), they will be duplicated in a controlled manner or published as a versioned npm package if they become stable core capabilities.
4.  **No Local File Dependencies in package.json**: Dependencies like `"shared": "file:../shared"` are forbidden because they break independent container builds and CD pipeline isolation.

```text
                  [ server ]
                         │
                         ▼
             Generate OpenAPI Spec (JSON)
                         │
                         ├────────────────────────┐
                         ▼                        ▼
                  [ HTTP / REST ]          Generate Types
                         ▲                        │
                         │                        ▼
                         └───────────────── [ client ]
```

## Consequences
- **Independent CI/CD**: Frontend and backend can be built, tested, and deployed at different times without triggering full-stack builds.
- **Contract-First Flow**: Changes to API endpoints must first be updated in the backend spec and then synced to the frontend by regenerating the API client/types.
- **Simplified Docker Builds**: Each container is self-contained. The build context is localized to a single repository, keeping Docker images small and builds fast.
- **Explicit Version Matching**: During production releases, the frontend and backend containers will be version-matched via tags (e.g., `v1.0.0-frontend` and `v1.0.0-backend`).
