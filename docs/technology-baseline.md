# Technology Baseline Registry

> **Version:** 1.0.0  
> **Verification Date:** 2026-08-20  
> **Status:** Authoritative  

This registry contains the verified technology baseline. Every dependency, library, runtime, and container image used in the Core must match the pins and patterns defined here.

---

## 1. Core Technology Version Matrix

| Technology | Approved Version | Official Documentation | Status | Verification Method |
| :--- | :--- | :--- | :--- | :--- |
| **Node.js** | `24.19.0` (LTS) | [nodejs.org](https://nodejs.org/en/docs/) | APPROVED | `node -v` |
| **React** | `19.2.8` | [react.dev](https://react.dev/reference/react) | APPROVED | package.json check |
| **Vite** | `8.2.0` | [vitejs.dev](https://vitejs.dev/guide/) | APPROVED | package.json check |
| **Express.js**| `5.2.1` | [expressjs.com](https://expressjs.com/en/5x/api.html) | APPROVED | package.json check |
| **Prisma ORM**| `7.9.1` | [prisma.io](https://www.prisma.io/docs) | APPROVED | `prisma -v` |
| **PostgreSQL**| `17-alpine` | [postgresql.org](https://www.postgresql.org/docs/) | APPROVED | Docker pull / `SELECT version();` |
| **TypeScript**| `6.0.2` | [typescriptlang.org](https://www.typescriptlang.org/docs/) | APPROVED | `tsc -v` |
| **Docker** | `27.x` / Compose `2.x` | [docs.docker.com](https://docs.docker.com/) | APPROVED | `docker --version` |

---

## 2. Infrastructure Dependency Decisions

This section defines the boundary between what belongs in the core baseline (recurring infrastructure) and what belongs to specific projects (domain features).

### KEEP (Core Baseline)
| Package | Purpose |
|---|---|
| `react-router` | Client-side routing |
| `sonner` | Toast notifications (abstracted) |
| `zod` | Config and request validation |
| `pino`, `helmet`, `cors` | Backend logging and security |
| `vitest`, `jsdom`, `@testing-library/*` | Component testing |
| `openapi-typescript` | API contract type generation |

### ADD (Core Baseline)
| Package | Replaces | Justification |
|---|---|---|
| `axios` | Custom fetch wrapper | Interceptors, credentials, CSRF header injection |
| `@tanstack/react-query` | Manual `useState` | Used **internally** for auth session state |
| `react-hook-form` + `@hookform/resolvers` | Manual form state | Form lifecycle and controlled inputs |
| `lucide-react` | Inline SVGs | Single consistent icon source |
| `clsx` | Template strings | Conditional class merging |
| `msw` | `vi.fn(fetch)` | Network-boundary API mocking |
| `argon2` | Custom `crypto.scrypt` | Industry standard password hashing |
| `express-rate-limit` | Custom in-memory Map | Handles X-Forwarded-For, IPv6 |

### OPTIONAL (Project-Specific)
| Package | When to Add |
|---|---|
| `@testing-library/user-event` | Recommended for interactive component tests |
| `playwright` | E2E browser testing |
| `vite-plugin-pwa` / Workbox | Advanced caching strategies |
| `dexie` / IndexedDB | Offline-first data projects |
| TanStack Table, Recharts | Data-heavy dashboards |

### DO NOT ADD
| Package | Reason |
|---|---|
| `redux`, `zustand`, `jotai` | React context is sufficient for global UI state |
| Radix UI, shadcn/ui | Design system is intentionally custom CSS |
| JWT | Cookie-session architecture is correct and intentional |
| `redis` | In-memory store is appropriate for the baseline starter |
| `socket.io`, Sentry, GraphQL | Project-specific infrastructure |
| `cookie-parser` | CSRF implementation uses a custom parser intentionally |

---

## 3. Technology Playbooks & Standards

### 3.1 Node.js
- **Approved APIs**: ECMAScript Modules (ESM) only, `fs/promises` for file handling, async/await for asynchronous operations.
- **Forbidden/Deprecated Patterns**: CommonJS (`require()`), synchronous file methods (`fs.readFileSync`), callback-based asynchronous flows, mixing ES Modules and CommonJS.
- **Security Guidance**: Run containers as non-root user (e.g., using default `node` user in Alpine), enforce strict HTTP headers (using Helmet).

### 3.2 React 19
- **Approved APIs**: Functional Components, React Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`), `use` hook (React 19 native resource resolution), `<form>` actions for interactive validation.
- **Forbidden/Deprecated Patterns**: Class components, legacy context API, direct DOM manipulation, `findDOMNode`, old string refs, writing inline styles for non-dynamic structural CSS (all styles must use layout/utility styles or CSS variables).
- **SEO/SSR**: Client-side single page application only. Routing managed client-side via React Router.

### 3.3 Express 5
- **Approved APIs**: Router-level middleware, async error handling (Express 5 natively supports returning promises from route handlers and catching errors without `next(err)` boilerplate), clean JSON response format (`res.status().json()`).
- **Forbidden/Deprecated Patterns**: Express 4 callback structures for error handling, legacy router methods, writing inline SQL (always route through Prisma).
- **Middlewares**: `cors` (CORS management), `helmet` (Security headers), `express.json()` (Body parser), custom authentication/authorization middlewares.

### 3.4 Prisma ORM 7
- **Approved APIs**: Typed Client query methods (`prisma.user.findUnique()`), explicit database schema relations, prisma migrations (`prisma migrate dev`), raw queries ONLY when performance demands (`prisma.$queryRaw`).
- **Forbidden/Deprecated Patterns**: Direct database access bypass (always run through Express service layer), raw SQL strings containing user input (SQL injection risk), deprecated Client APIs, manual schema mutation without generating a Prisma migration.
- **Database Schema Rules**: Every model must have explicit `id` (UUID or Autoincrement), `createdAt`, `updatedAt` timestamps.

### 3.5 PostgreSQL
- **Approved Usage**: Atomic transactions, constraints, indexes on lookup fields, JSONB only for unstructured configuration/logs, UUIDs for entity identifiers.
- **Forbidden Patterns**: Storing plain-text credentials, triggers for business logic (business logic belongs in the backend service layer), unindexed foreign keys.
