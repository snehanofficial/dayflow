# Current State Audit

## Repository State
The repository has been bootstrapped with two main independent subdirectories representing the polyrepo architecture:
- `core-frontend/`: A React SPA + Vite project using TypeScript and Oxlint.
- `core-backend/`: An Express.js 5 API project using TypeScript, Prisma ORM (linked to PostgreSQL), and Vitest.
- `docs/`: Holds governance documents, Architecture specifications, ADRs, and the generated `openapi.json` contract.

## Verified Working Functionality
- **Express 5 API Service**: Startup and basic Express routing is functional.
- **OpenAPI generation**: Backend script `pnpm openapi:generate` successfully produces the contract file `docs/openapi.json`.
- **Frontend Type Generation**: Frontend script `pnpm gen:api` correctly parses `docs/openapi.json` and outputs compile-safe type definitions to `core-frontend/src/types/api.ts`.
- **Frontend Linting**: Oxlint linter runs successfully in `core-frontend`.

## Broken/Incomplete Functionality
- **Frontend TypeScript compilation is broken**: Running `pnpm build` in `core-frontend` fails with the error:
  `tsconfig.app.json:22:5 - error TS5023: Unknown compiler option 'erasableSyntaxOnly'.`
  This occurs because the TS compiler version in both `package.json` files is pinned to `5.7.3`, whereas `erasableSyntaxOnly` is a TypeScript 5.8+ option.
- **Backend Tests are empty**: Running `pnpm test` in `core-backend` fails because there are no test files yet.
- **Missing Database Foundation**: No `prisma/schema.prisma` file or migration workflow exists in `core-backend`.
- **No environment configuration (.env) files**: No `.env` or `.env.example` templates exist.

## Architecture Compliance
- **Polyrepo Boundary**: Follows ADR-0002 completely. No cross-repository source imports, no workspace links, and no shared mutable source directories exist.
- **Contract Boundary**: Follows the OpenAPI contract-first baseline. Frontend consumes generated type definitions without importing backend code.
- **No database leakage**: The frontend does not have any database drivers or Prisma client dependencies.

## Technology Compliance
- **TypeScript Mismatch**: The `docs/technology-baseline.md` mandates TypeScript `6.0.2`. Currently, both repositories use `5.7.3`. This mismatch directly breaks frontend compilation when compiler options like `erasableSyntaxOnly` are configured. Upgrading TypeScript to `6.0.2` resolves this mismatch.
- **Node.js**: The baseline specifies Node `24.19.0` (LTS), while the current host environment is running `v22.22.1`. However, package configurations (`@types/node`) are aligned with Node 24.
- **Other baseline libraries**: React (`19.2.8`), Vite (`8.2.0`), Express (`5.2.1`), and Prisma (`7.9.1`) are correctly aligned with the technology baseline.

## Documentation Gaps
- **Contributor / Setup Guidance**: Standardized instructions on starting, building, and verifying both codebases are missing.
- **Database Architecture Guidelines**: Explicit rules on naming conventions, indexing, and seed frameworks are missing.

## Testing Gaps
- **No architectural tests**: No checks verifying that the frontend does not import from the backend, or that core modules do not import from domain modules.
- **No integration/API tests**: No tests verify backend endpoint behavior.

## Security Gaps
- **Missing Security Middleware Configuration**: Although `helmet` and `cors` are loaded in `core-backend/src/index.ts`, there is no proper rate limiting, request validation, or environment-based CORS configuration.

## Infrastructure Gaps
- **No Docker Compose config**: A root-level `docker-compose.yml` to spin up local PostgreSQL and application containers is missing.
- **No Dockerfiles**: Individual container definitions for `core-frontend` and `core-backend` are not yet created.

## Immediate Next Action
Create the implementation plan to:
1. Upgrade TypeScript to `6.0.2` in both `core-frontend` and `core-backend` to fix the build issue and comply with the technology baseline.
2. Establish the repo engineering baselines (formatting, standard command contracts, linters) in both repositories (PHASE 04.5).
3. Implement the frontend foundation (PHASE 05) and backend foundation (PHASE 06).
4. Implement the database foundation (PHASE 07).
