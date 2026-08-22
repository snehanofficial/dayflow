# Developer A Implementation Tracker

Project:
Dayflow HRMS

Owner:
Developer A

Scope:
Employee + Attendance Modules

## Architecture Decisions
- Adopted Feature-based codebase separation: Backend domain logic resides in `server/src/modules/domain/employee` and frontend pages/components reside in `client/src/features/employee`.
- The OpenAPI contract in `server/src/openapi.ts` remains the single source of truth for communication. Types are synchronized to the client via `pnpm run gen:api`.
- Profile endpoint retrieves or auto-initializes the profile (to avoid breaking existing auth accounts).

## Database Changes
- Added the `Employee` model to `server/prisma/schema.prisma` with a 1-to-1 relationship with the `User` model.
- Added modern authentication fields to the `User` model (`employeeId`, `role`, `emailVerified`, `verificationToken`, `verificationTokenExpiry`).
- Executed migration `20260822053552_add_employee_model` successfully.

## API Contracts
- Registered `/api/employee/profile` (GET and PATCH)
- Registered `/api/employees` (GET - list)
- Registered `/api/employees/{id}` (GET - detail)

## Frontend Routes
- Registered `/profile` route mapping to the `<ProfilePage />` component within the protected layout context.

## Components Created
- `client/src/features/employee/ProfilePage.tsx` - Employee profile page for viewing organizational data and modifying personal contact details.

## Backend Modules Created
- `server/src/modules/domain/employee/repository.ts` - Database query abstractions for profile management.
- `server/src/modules/domain/employee/service.ts` - Profile retrieval and auto-initialization flow.
- `server/src/modules/domain/employee/controller.ts` - Express router handlers, parameter validation, and user role authorization checks.
- `server/src/modules/domain/employee/index.ts` - Route bindings.

## Completed Tasks
- [x] Initial codebase audit and verification run
- [x] Fixed false positive in backend architecture tests for `@prisma/client` import
- [x] Added `Employee` model to Prisma schema and updated migration script
- [x] Reset database, ran migrations, and seeded the test database
- [x] Updated OpenAPI contract and compiled frontend TypeScript bindings
- [x] Wrote profile repository, service, controller, and router in backend
- [x] Wrote 11 backend integration tests for employee endpoints (all green)
- [x] Created `ProfilePage` frontend component with `react-hook-form` and validation
- [x] Mounted route inside React Router and sidebar navigation config
- [x] Passed full backend and frontend verification suites (`pnpm run verify`)

# Phase 2 — Employee Profile + Employee Management

Status:
Completed

Implemented:

## Backend
- Expanded Employee model with optional fields: profileImage, address, employmentStatus
- Updated OpenAPI spec schemas for GET/PATCH profile, GET list, and GET detail endpoints
- Updated Repository and Service logic supporting profile creation with extra fields
- Enforced role checks for directory listing and own-profile ownership verification in detail retrieval

## Frontend
- Added role checking logic to AppShell navigation rendering
- Registered Directory sidebar nav config and mounted `/employees` and `/employees/:id` routes
- Created EmployeeDirectoryPage featuring local search filter, loading/empty/error states, and table layout responsive converting to cards on mobile
- Created EmployeeDetailPage displaying structured personal and organizational data with permission boundary error handles

## Database
- Executed migration 20260822060721_add_employee_extra_fields to add columns to the employees table

## APIs
- GET /api/employees (HR role only)
- GET /api/employees/:id (HR or owner employee only)
- PATCH /api/employees/:id (HR role only — update any employee's details)

## Tests
- All 11 domain integration tests verified green
- Sync tests passing for OpenAPI spec drift and typecheck compatibility

## Known Issues
- None

# Phase 2 — Fix: HR Employee Edit (Hotfix)

Status:
Completed

Commit: `7e949e4`

Implemented:

### Backend
- Added `updateById` to repository.ts
- Added `updateEmployeeProfile` to service.ts
- Added `employeeHrUpdateSchema` validation + `updateEmployeeById` handler to controller.ts
- Bound `PATCH /api/employees/:id` to `requireRole('HR')` route in index.ts
- Extended OpenAPI spec with new endpoint and refreshed `docs/openapi.json` + `client/src/types/api.ts`

### Frontend
- Updated `EmployeeDetailPage.tsx` to toggle between read-only view and an inline edit form
- Edit form is only shown to users with `role === 'HR'`
- Form fields: First Name, Last Name, Phone, Address, Department, Designation, Joining Date, Employment Status, Profile Image URL
- Uses `react-hook-form` with Zod schema validation
- On save, sends `PATCH /api/employees/:id` and updates local state
- `Cancel` button resets the form back to loaded profile values
- Fixed `useCallback` wrapping of `fetchProfile` to clear `react-hooks/exhaustive-deps` lint warning

# Phase 3 — Attendance Management

Status:
Completed

## Database Changes
- Added `Attendance` model with fields `id`, `employeeId`, `attendanceDate` (mapped as `@db.Date`), `checkIn`, `checkOut`, `status` (enum: `PRESENT`, `LATE`, `ABSENT`, `HALF_DAY`), `createdAt`, `updatedAt` and unique index on `(employeeId, attendanceDate)`.
- Executed migration `20260822155117_add_attendance_model` successfully.

## API Changes
- POST `/api/attendance/check-in` - Record employee daily check-in (computes status based on configured threshold and app-wide timezone).
- POST `/api/attendance/check-out` - Record employee daily check-out.
- GET `/api/attendance/today` - Retrieve current calendar day attendance status.
- GET `/api/attendance/history` - Retrieve own attendance history with filter ranges and page offsets.

## Frontend Changes
- Registered `/attendance` route mapped to `<AttendancePage />` protected under `['EMPLOYEE', 'HR']` roles.
- Linked "Attendance" sidebar navigation under AppShell using `clock` icon.
- Created `client/src/features/attendance/AttendancePage.tsx` supporting status cards, action buttons, historical search controls, and accessibility skip links.

## Tests
- Created backend integration tests in `server/src/modules/domain/attendance/attendance.test.ts` covering double check-in/out, isolation boundaries, error mapping, and timezone calendar rollover bounds.
- Created frontend unit/integration tests in `client/src/features/attendance/AttendancePage.test.tsx` verifying card triggers, empty states, and errors.

## Next Phase
Attendance Insights

## Testing Status
- Backend Vitest suite: 11 test files, 69 tests passing.
- Frontend Vitest suite: 10 test files, 43 tests passing.

## Known Issues
- None.

## Technical Debt
- None.

## Performance Notes
- Timezone operations run on server using `Intl.DateTimeFormat` configured once from centralized service.
- Database index on `(employeeId, attendanceDate)` ensures constant-time check-in lookup.

## Security Checklist
- [x] Enforce `requireAuth` on all employee & attendance endpoints.
- [x] Enforce ownership check (users can only view/edit their own profile; HR can view all).
- [x] Enforce `requireRole('HR')` on `PATCH /api/employees/:id` — employees cannot edit other profiles.
- [x] Authoritatively resolve employee self-service identity from `req.user.id` on backend (no client input allowed).
- [x] Zod schema validation for all patch inputs (self and HR).
- [x] Double-submit cookie CSRF middleware verification.

## Deployment Notes
- Prisma migrations must be executed via `pnpm run prisma:migrate` before deploying server updates.
- Centralized `ATTENDANCE_TIMEZONE=Asia/Kolkata` and `ATTENDANCE_LATE_AFTER=09:00` config bindings must be set in environment variables.
