# DayFlow Project Bootstrapping Guide

This guide provides the minimal, step-by-step instructions to copy DayFlow into a new repository, configure its environment, spin up the development environment, and verify its integrity.

---

## 1. Copying DayFlow to a New Project

To copy DayFlow while excluding version control history, temporary build assets, and local dependencies, run the following command from the root of your new project directory:

```bash
rsync -av --exclude=".git" \
          --exclude="node_modules" \
          --exclude="dist" \
          --exclude=".pnpm-store" \
          --exclude=".env" \
          --exclude=".temp-verify" \
          /path/to/DayFlow/ ./
```

---

## 2. Renaming the Project (Optional)

To decouple your new project from DayFlow-specific default names:
1. **Docker Service**: In `docker-compose.yml`, change `container_name: dayflow-postgres` to your project name.
2. **Database name**: In `docker-compose.yml` (`POSTGRES_DB: dayflow`) and in `server/.env.example` (`/dayflow`), update the default database name.
3. **Frontend Branding**: In `client/src/components/AppShell.tsx`, update the `<span className="brand-logo">DayFlow</span>` brand layout text.
4. **OpenAPI Description**: In `server/src/openapi.ts`, update the `title` and `description` under `info`.

---

## 3. Environment Configuration

Copy the example environment files:

### Backend
```bash
cd server
cp .env.example .env
```
Update `server/.env` with your database credentials and backend port:
* `DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>?schema=public`
* `CORS_ORIGIN=http://localhost:5173`

### Frontend
```bash
cd client
cp .env.example .env
```
Update `client/.env` with the URL of the backend server:
* `VITE_API_URL=http://localhost:4000`

---

## 4. Dependencies and Database Setup

Initialize the package manager and database connection:

### Backend Setup
```bash
cd server
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
```

### Frontend Setup
```bash
cd client
pnpm install
```

---

## 5. API Type Generation (OpenAPI)

To synchronize the backend API contract with the frontend:
1. **Generate Spec**: In the backend, generate the OpenAPI document schema:
   ```bash
   cd server
   pnpm openapi:generate
   ```
2. **Generate Frontend Types**: In the frontend, compile the generated OpenAPI schema into TypeScript types:
   ```bash
   cd client
   pnpm gen:api
   ```

---

## 6. Development and Verification

### Run Verification Gates
Run formatting, linting, typechecking, tests, and builds to verify codebase integrity:

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

### Run Locally
Start the development servers:

* **Backend**:
  ```bash
  cd server
  pnpm run dev
  ```
* **Frontend**:
  ```bash
  cd client
  pnpm run dev
  ```
* **Database**:
  ```bash
  docker compose up -d
  ```
