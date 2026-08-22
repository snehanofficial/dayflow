# ADR-0001: Frontend Framework Selection

## Status
Approved

## Context
We need to select the standard frontend technology foundation for the Enterprise Hackathon Core. The primary options are:
1. **React SPA with Vite** (Single Page Application, static build).
2. **Next.js** (React framework with Server-Side Rendering (SSR), Server Components, and built-in API routes).

Our target applications are primarily hackathon projects, operational dashboards, authenticated admin panels, and internal enterprise tools. These applications require high interactivity, rapid iteration, simple deployment, and compatibility with AI-assisted code generation.

## Evaluation

### 1. Requirements & Use Cases
- **SEO & SSR**: Most hackathon and dashboard interfaces sit behind authentication walls. Search Engine Optimization (SEO) and Server-Side Rendering (SSR) are not core requirements.
- **SPA vs SSR**: Dashboards require rapid client-side routing, local state retention, and real-time data fetching. Client-side SPAs match this need naturally.
- **Frontend/Backend separation**: The Core architecture demands a decoupled backend repository (Express.js + Prisma + PostgreSQL) to keep the database behind a strict API gateway.

### 2. Operational & Deployment Complexity
- **React + Vite**: Compiles down to pure static HTML, CSS, and JS. Can be hosted on any static file server (Nginx, Apache) or CDN (S3, Cloudflare Pages, Netlify) for near-zero cost, infinite scale, and zero server maintenance.
- **Next.js**: Requires a continuous Node.js server environment at runtime for SSR, Server Actions, and ISR. This introduces backend execution environments on the frontend side, memory leak risks, complex Docker configurations, and vendor lock-in (Vercel/Amplify) or active container management.

### 3. API Separation and Architectural Cleanliness
- **React + Vite**: Forces absolute separation. The frontend *cannot* access the database or node system APIs directly. All interactions are strictly via HTTP requests to the Express.js backend.
- **Next.js**: The boundaries between client and server are porous (e.g., Server Components, Server Actions, API routes). Developers can easily write database queries directly inside page components. In a team or hackathon environment, this inevitably leads to domain logic leakage and architectural decay.

### 4. Developer Experience & AI Alignment
- **React + Vite**: Extremely stable ecosystem. The core concepts of React SPA routing (React Router) and data fetching (React Query / Axios) have remained consistent for years. AI agents can generate high-quality, bug-free components without hallucinating framework-specific configuration or breaking server/client boundaries.
- **Next.js**: High version churn (Next.js 13 -> 14 -> 15 -> 16). Complex server component rules, async headers changes, and cache invalidation policies lead to AI confusion, outdated patterns, and debugging overhead during time-critical hackathons.

## Comparison Summary

| Metric | React + Vite (SPA) | Next.js (SSR) |
| :--- | :--- | :--- |
| **SEO Needed** | Low | High |
| **Hosting Cost & Effort**| Low (Static CDN) | High (Node.js Server/Vercel) |
| **Architecture Isolation**| Enforced by runtime boundary | Porous (Server/Client mix) |
| **AI Generation Safety** | High (Highly stable APIs) | Medium (High framework API churn) |
| **Build Time** | Fast (Vite/esbuild) | Slower (Next.js/Webpack/Turbopack) |
| **State Management** | Simple client-side state | Multi-layered (Server/Client state) |

## Decision
**We select React SPA powered by Vite (using TypeScript)** as the standard frontend framework for the Enterprise Hackathon Core. 

We will structure the frontend repository as a pure static application that consumes the backend's REST APIs.

## Consequences
- **Zero SSR/SEO by default**: If a future project explicitly requires high public SEO (e.g., a public landing page), it should be built as a separate static site or a standalone sub-project, keeping the dashboard/core app as a Vite SPA.
- **Clean Polyrepo boundary**: The frontend and backend codebases remain completely isolated, with clear REST API contracts as the only point of interaction.
- **Static Hosting**: Frontend containerization will use a lightweight Nginx container serving static files, maximizing performance and minimizing memory usage.
- **Developer Onboarding**: Simple structure makes it easy for new developers and AI agents to understand the entry points, routing, and state.
