# Architecture Enforcement Matrix

This matrix tracks the key architectural boundaries of HackCore and how they are enforced to prevent architectural drift by humans and AI coding agents.

| Boundary / Rule | Rationale | Enforcement Mechanism | Status |
| :--- | :--- | :--- | :--- |
| **Repository Isolation** | Keep frontend and backend decoupled; prevent cross-repo imports. | Automated tests checking import statements. | **PASS** |
| **Database Boundary** | Frontend must not contain database drivers, Prisma client, or schemas. | Automated tests verifying no db references in frontend. | **PASS** |
| **Core vs Domain Separation** | Core modules must remain domain-agnostic and never import domain code. | Automated tests checking Core-to-Domain imports. | **PASS** |
| **Configuration Containment** | Prevent reading unvalidated env vars directly; enforce typed config. | Automated tests checking `process.env`/`import.meta.env` usage. | **PASS** |
| **Standardized Logging** | Ensure structured logs in production; avoid untracked console calls. | Automated tests prohibiting `console.*` outside allowed files. | **PASS** |
| **Module Encapsulation** | Sibling module imports must go through public interfaces (`index.js`). | Automated tests validating import depth in core modules. | **PASS** |
| **API Contract Integrity** | OpenAPI remains the contract; generated frontend types must match contract. | Vitest sync tests comparing generated types with OpenAPI spec. | **PASS** |
| **Strict ESM Compliance** | Ensure backend uses ESM and avoids deprecated CommonJS syntax. | Technology baseline & tsconfig rules. | **PASS** |

## Invariants & Policies

### 1. Repository Boundary
*   **Frontend**: Must communicate with the backend exclusively via HTTP/JSON. Cannot import any code from `core-backend` or relative paths reaching out of the package.
*   **Backend**: Must not import from `core-frontend`.

### 2. Configuration Boundary
*   All environment variables must be validated at startup inside `core-backend/src/modules/core/config/index.ts` and `core-frontend/src/config.ts`.
*   Direct access to `process.env` (backend) or `import.meta.env` (frontend) is prohibited in any other source files.

### 3. Generated Files Boundary
*   The OpenAPI specification (`docs/openapi.json`) is the source of truth for the API contract.
*   The frontend types file (`core-frontend/src/types/api.ts`) is generated from `docs/openapi.json`.
*   Neither file should be manually edited. Drift is prevented by verification scripts checking generated outputs against committed versions.
