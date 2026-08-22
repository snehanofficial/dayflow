# Enterprise Hackathon Core Constitution

> **Status:** Authoritative  
> **Version:** 1.0.0  
> **Last Updated:** 2026-08-20  

This Constitution governs the architecture, development, evolution, and usage of the Enterprise Hackathon Core. All contributors (human and AI) must adhere to its provisions.

---

## 1. Mission

The Enterprise Hackathon Core exists to provide a reusable, enterprise-grade, domain-agnostic, AI-optimized, modular application foundation. It enables engineering teams to bootstrap hackathons or new product initiatives with 80%+ of infrastructure, tooling, CI/CD, and quality gates pre-established, letting developers focus purely on domain logic.

---

## 2. Scope

### In Scope
- Domain-independent boilerplate, templates, and libraries.
- Decoupled API-first backend architecture (Express.js) and frontend dashboard/SPA architecture (React).
- Relational database schema tooling and migrations (PostgreSQL + Prisma).
- Containerization and orchestration for local development and basic deployments (Docker + Compose).
- Foundational cross-cutting concerns: Identity, Authentication, Authorization, Configuration validation, Logging, and Error Handling.
- Production-grade CI/CD pipeline specifications.
- Automated architecture validation and quality gates.

### Out of Scope (Non-Goals)
- Domain-specific logic, entities, or schemas (e.g., hackathon judge scoring, hackathon registration, specific product forms).
- Complex microservices infrastructure or service meshes.
- Unnecessary orchestration layers (e.g., Kubernetes in core).
- Cloud-provider lock-in (e.g., AWS CDK or GCP specific scripts in the main core).
- Large, high-overhead observability stacks (e.g., full APM clusters).
- Event-driven message brokers (Kafka/RabbitMQ) unless specifically justified for a domain module.

---

## 3. Architectural Philosophy

The Core is built on a **Decoupled Polyrepo** philosophy:
1. **Separation of Concerns**: Frontend and backend are completely separate codebases, communicating strictly over HTTP/JSON REST APIs. The frontend never accesses the database.
2. **Low Coupling, High Cohesion**: Code modules must have clear boundaries and explicit interfaces. Imports across boundaries are restricted.
3. **No Eventual Consistency by Default**: Keep runtime topology simple. Use PostgreSQL transactions for safety.
4. **Core/Domain Separation**: The Core must remain completely independent of the business domain. The Core defines the environment; the domain defines the product.

---

## 4. Engineering Philosophy

1. **WCAG 2.2 AA Accessibility**: Accessible design is a first-class citizen built into the UI design tokens and components, not a post-build audit checklist.
2. **Machine Enforcement**: Any rule that can be verified programmatically must be enforced via Linter, Static Analysis, Architecture Tests, or CI gates.
3. **Simple and Readable over Clever**: Code must be optimized for developer (and AI) legibility. Avoid magic, meta-programming, and undocumented abstractions.
4. **Secure by Default**: All routes, data paths, and inputs are locked down by default. Developers must explicitly opt out or configure access rules to expose features.

---

## 5. AI Philosophy

AI coding assistants are **implementation partners**, not architects.
- **Specification-Guided**: AI must execute work mapped to explicit specifications and standards.
- **Verification-Required**: No AI-generated code is accepted without automated test coverage, type validation, and architecture rule checks.
- **API and Dependency Rigor**: AI is strictly forbidden from guessing APIs or updating dependencies without explicit, documented review.

---

## 6. Change Management

- **Domain Change**: Standard PR process.
- **Core Infrastructure Change**: Requires impact analysis, architecture decision record (ADR) update, technology baseline alignment, playbook updates, and multi-layered verification.
- **Breaking Changes**: Must include explicit migration scripts or backward-compatibility wrappers.
