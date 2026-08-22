# AGENTS.md - AI & Developer Coding Constitution

> **Status:** Authoritative  
> **Applicability:** All AI Coding Agents & Human Developers  

This document contains the guidelines and architectural contracts that must be followed when building features on this codebase.

---

## 1. Quick Development Checklist

When implementing new features or making edits:
1. **Inspect Before Abstracting**: Review the existing code structure in `core-backend` and `core-frontend` before writing new helper functions or libraries.
2. **Follow the Architecture**: Respect the strict boundary between the frontend UI, backend API service, and PostgreSQL database.
3. **Use the OpenAPI Contract**: Do not manually duplicate frontend API types. Modify the schema in `core-backend/src/openapi.ts`, run `pnpm run openapi:generate`, and then compile client types via `pnpm run gen:api` in `core-frontend`.
4. **No Database Leakage**: Never import database drivers, Prisma clients, database credentials, or server-side schemas in frontend code.
5. **No Direct Environment Access**: Never read raw environment variables (e.g., `process.env` or `import.meta.env`) directly in application code. All environment access must go through validated config modules (`core-backend/src/modules/core/config/` and `core-frontend/src/config.ts`).
6. **Core vs. Domain Separation**: Keep domain/business modules distinct from the core framework logic. Do not pollute generic `modules/core` directories with project-specific business details.
7. **Use Modern APIs**: Adhere to ESM, Express 5 async route handling (native rejection capture), Prisma 7, and React 19 functional components.
8. **Verify Early and Often**: Always run verification before concluding a task:
   ```bash
   pnpm run verify
   ```
9. **Update Documentation**: Log implementation progress in the tracker (`docs/implementation-tracker.md`) and keep relevant specifications updated.

---

## 2. Progressive Context Path

Before starting a development cycle, load codebase context in this order:
```text
  [AGENTS.md] (This file)
      ↓
  [README.md] (Installation & running guide)
      ↓
  [docs/project-architecture.md] (Architectural boundaries)
      ↓
  [docs/technology-baseline.md] (Technology versions and API reference)
```
