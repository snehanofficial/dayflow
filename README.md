# DayFlow - Personal Full-Stack Starter

DayFlow is a clean, domain-agnostic, and reusable full-stack starter designed for bootstrapping hackathons, mini-projects, and applications with a robust, pre-established engineering baseline.

---

## The Source-Based Reuse Model

DayFlow is structured as a source template, not a runtime dependency or package library.

```text
DayFlow
   │
   ├── [Copy/Adapt Source]
   ▼
New Project (Fully owns all its code)
```

### Invariants for Copied Projects
When initializing a new project from DayFlow, the target repository must have:
* **No runtime dependency** on DayFlow.
* **No workspace references** or cross-project package dependencies.
* **No symbolic links** or Git submodules referencing DayFlow.
* **No absolute filesystem paths** pointing back to DayFlow.

Once copied, the new project is completely decoupled and self-contained.

---

## Technology Stack

The baseline stack includes:
* **Frontend**: React (19.x), Vite (8.x), TypeScript (6.x), React Router (7.x)
* **Backend**: Express (5.x), TypeScript (6.x), Zod (3.x)
* **Database**: PostgreSQL (17), Prisma ORM (7.x)
* **Testing**: Vitest (4.x), Testing Library (React)
* **Linters/Formatters**: Oxlint (1.x), Prettier (3.x)
* **Development Environment**: Docker Compose

---

## Quick Start & Setup

### 1. Copy the Source Code
Copy DayFlow to your new project directory while excluding git history, build assets, and local packages:
```bash
rsync -av --exclude=".git" \
          --exclude="node_modules" \
          --exclude="dist" \
          --exclude=".pnpm-store" \
          --exclude=".env" \
          --exclude=".temp-verify" \
          /path/to/DayFlow/ /path/to/new-project/
```

### 2. Rename & Configure
To decouple your new project from default DayFlow names:
1. **Docker Service**: Update `container_name` in `docker-compose.yml` to your project name.
2. **Database Configuration**: Rename the Postgres database from `dayflow` to your target database name in `docker-compose.yml` (`POSTGRES_DB`) and `.env` template.
3. **Branding**: Customize the logo brand text inside `client/src/components/AppShell.tsx` and the `<title>` tag inside `client/index.html`.
4. **API Spec**: Update OpenAPI title and description in `server/src/openapi.ts`.

### 3. Environment Setup
Copy the environment variable templates and customize them:

#### Backend Setup
```bash
cd server
cp .env.example .env
```
Ensure `DATABASE_URL` matches your local database settings (default: `postgresql://postgres:postgres@localhost:5432/dayflow?schema=public`).

#### Frontend Setup
```bash
cd client
cp .env.example .env
```
Ensure `VITE_API_URL` points to your backend instance (default: `http://localhost:4000`).

---

## Running Development Environment

1. **Spin up PostgreSQL Database**:
   ```bash
   docker compose up -d
   ```

2. **Initialize Database and Client**:
   ```bash
   cd server
   pnpm install
   pnpm prisma:migrate
   pnpm prisma:generate
   ```

3. **Start backend developer server**:
   ```bash
   pnpm run dev
   ```

4. **Initialize Frontend Client**:
   ```bash
   cd ../client
   pnpm install
   pnpm run gen:api
   pnpm run dev
   ```

---

## Verification & Testing

Verify code quality, formatting, compilation, and tests across both applications:

* **Backend**:
  ```bash
  cd server
  pnpm run verify
  ```

* **Frontend**:
  ```bash
  cd client
  pnpm run verify
  ```

The verification pipeline executes the following checks:
`prettier (format:check)` → `oxlint (lint)` → `tsc (typecheck)` → `vitest (test)` → `build`
