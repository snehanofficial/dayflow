# Core Architecture Specification

> **Version:** 1.0.0  
> **Status:** Authoritative  
> **Owner:** Lead Architect  

This specification defines the runtime topology, system boundaries, data governance, and modular boundaries of the Enterprise Hackathon Core.

---

## 1. System Topology & Boundaries

The Core follows a completely decoupled, multi-container architecture. It isolates the presentation layer from the data layer and routes all external access through explicit APIs.

```text
               [ USER / BROWSER ]
                       │
                       ▼ (Port 80/443)
              ┌─────────────────┐
              │ core-frontend   │ (Nginx / Static SPA)
              └────────┬────────┘
                       │
                       ▼ HTTP / REST (Port 4000)
              ┌─────────────────┐
              │ core-backend    │ (Express API Server)
              └────────┬────────┘
                       │
                       ▼ TCP / Prisma (Port 5432)
              ┌─────────────────┐
              │ PostgreSQL      │ (Relational Database)
              └─────────────────┘
```

### Invariants
1. **No Direct Database Access**: The frontend container has no database drivers and cannot communicate directly with the database.
2. **Stateless Backend**: The Express.js backend container stores no user session state on its filesystem. All state is stored in the database or passed inside cryptographically signed tokens (JWTs).
3. **CORS Boundary**: Cross-Origin Resource Sharing (CORS) is explicitly configured on the backend. Only requests from the approved frontend origin are accepted.

---

## 2. Core Capability Modules

The backend is structured into domain-independent capabilities. Each capability is isolated within its own folder and exposes an explicit public interface.

```text
core-backend/src/modules/
├── core/
│   ├── config/          # Startup configuration and .env validation
│   ├── logger/          # Structured JSON logging utility
│   ├── errors/          # Global error handling and custom API exceptions
│   ├── identity/        # Identity representation and user context
│   ├── auth/            # Authentication (JWT token validation)
│   └── security/        # Global rate-limiting, CORS, and sanitization
└── domain/              # Space reserved for project-specific business modules
```

### 2.1 Core Modules Detail
- **Configuration (`core/config`)**: Validates environment variables (using Zod or standard validator) on application boot. If any required configuration is missing or invalid, the process terminates immediately (Fail-Fast).
- **Logging (`core/logger`)**: Provides a structured JSON logger (e.g., Winston or Pino). Automatically injects Request IDs into every log statement.
- **Error Handling (`core/errors`)**: Catches all unhandled exceptions, logs them with details, and returns normalized JSON error responses to the client:
  ```json
  {
    "error": {
      "code": "BAD_REQUEST",
      "message": "Validation failed",
      "details": [...]
    }
  }
  ```
- **Identity (`core/identity`)**: Defines the standard `UserContext` structure. It is injected into requests after token verification.
- **Authentication (`core/auth`)**: Validates JSON Web Tokens (JWT) or session cookies.
- **Security (`core/security`)**: Configures rate limiters, security headers, and query sanitization to protect against XSS and SQL injection.

---

## 3. Dependency Rules & Architecture Enforcement

To maintain modularity and low coupling, we enforce the following import rules:

1. **Strict Core -> Domain Separation**: Core modules (`/core/*`) must NEVER import from domain modules (`/domain/*`). The Core must remain 100% domain-agnostic.
2. **Strict Module Encapsulation**: A module should only expose its capabilities via an `index.ts` file acting as its public gateway. Direct imports of a module's internal files from outside that module are forbidden (e.g., `import ... from '../auth/utils/hash'` is forbidden; use `import { hash } from '../auth'` instead).
3. **Layer Integrity**: Controllers may only speak to Services; Services may only speak to repositories/Prisma. Database schema structures must not leak directly to the client layer without translation/mapping.
