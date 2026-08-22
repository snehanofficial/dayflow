# HackCore Project Bootstrapping Guide

This guide provides the minimal, step-by-step instructions to copy HackCore into a new repository, configure its environment, spin up the development environment, and verify its integrity.

---

## 1. Copying HackCore to a New Project

To copy HackCore while excluding version control history, temporary build assets, and local dependencies, run the following command from the root of your new project directory:

```bash
rsync -av --exclude=".git" \
          --exclude="node_modules" \
          --exclude="dist" \
          --exclude=".pnpm-store" \
          --exclude=".env" \
          --exclude=".temp-verify" \
          /path/to/HackCore/ ./
```

---

## 2. Renaming the Project (Optional)

To decouple your new project from HackCore-specific default names:
1. **Docker Service**: In `docker-compose.yml`, change `container_name: hackcore-postgres` to your project name.
2. **Database name**: In `docker-compose.yml` (`POSTGRES_DB: hackcore`) and in `core-backend/.env.example` (`/hackcore`), update the default database name.
3. **Frontend Branding**: In `core-frontend/src/components/AppShell.tsx`, update the `<span className="brand-logo">HackCore</span>` brand layout text.
4. **OpenAPI Description**: In `core-backend/src/openapi.ts`, update the `title` and `description` under `info`.

---

## 3. Environment Configuration

Copy the example environment files:

### Backend
```bash
cd core-backend
cp .env.example .env
```
Update `core-backend/.env` with your database credentials and backend port:
* `DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>?schema=public`
* `CORS_ORIGIN=http://localhost:5173`

### Frontend
```bash
cd core-frontend
cp .env.example .env
```
Update `core-frontend/.env` with the URL of the backend server:
* `VITE_API_URL=http://localhost:4000`

---

## 4. Dependencies and Database Setup

Initialize the package manager and database connection:

### Backend Setup
```bash
cd core-backend
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
```

### Frontend Setup
```bash
cd core-frontend
pnpm install
```

---

## 5. API Type Generation (OpenAPI)

To synchronize the backend API contract with the frontend:
1. **Generate Spec**: In the backend, generate the OpenAPI document schema:
   ```bash
   cd core-backend
   pnpm openapi:generate
   ```
2. **Generate Frontend Types**: In the frontend, compile the generated OpenAPI schema into TypeScript types:
   ```bash
   cd core-frontend
   pnpm gen:api
   ```

---

## 6. Development and Verification

### Run Verification Gates
Run formatting, linting, typechecking, tests, and builds to verify codebase integrity:

* **Backend**:
  ```bash
  cd core-backend
  pnpm run verify
  ```
* **Frontend**:
  ```bash
  cd core-frontend
  pnpm run verify
  ```

### Run Locally
Start the development servers:

* **Backend**:
  ```bash
  cd core-backend
  pnpm run dev
  ```
* **Frontend**:
  ```bash
  cd core-frontend
  pnpm run dev
  ```
* **Database**:
  ```bash
  docker compose up -d
  ```
