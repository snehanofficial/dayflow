# Dayflow HRMS — Foundation + Authentication Implementation

## Developer Mission

You are responsible for establishing the **basic application structure and authentication foundation** for the Dayflow Human Resource Management System using the existing **DayFlow scaffold**.

This work must provide a stable foundation that allows:

* Developer A to implement Employee + Attendance
* Developer B to implement Leave + Payroll + HR modules
* Authentication and authorization to be shared by all modules
* The existing DayFlow architecture/design system to remain intact
* Frontend and backend to remain independently modular and deployable

This document covers **foundation and authentication only**.

Do **not** implement Employee, Attendance, Leave, Payroll, Analytics, or Notifications business logic.

---

# 1. Project Context

## Product

**Dayflow — Human Resource Management System**

The HRMS is intended to digitize core HR operations including:

* Employee onboarding
* Profile management
* Attendance tracking
* Leave management
* Payroll visibility
* HR/Admin approval workflows

The requirements define two primary user classes:

```text
Admin / HR Officer
Employee
```

Admin/HR users have management and approval privileges, while employees have limited access to their own HR information.

The requirements specifically define:

* Secure Sign Up / Sign In
* Employee and HR roles
* Employee ID, email, password and role during registration
* Password security rules
* Email verification
* Email/password login
* Authentication error handling
* Dashboard redirection after successful login

---

# 2. Architecture — Decoupled Polyrepo + Modular Architecture

## 2.1 Core Architecture Principle

Dayflow must use a **decoupled frontend/backend architecture with independent repositories**.

The root project acts as the overall development/orchestration directory.

The two application layers are independently structured:

```text
Frontend
    ↓
HTTP / HTTPS API
    ↓
Backend
    ↓
Database / Odoo
```

The frontend must never directly access backend internals or the database.

The backend must remain independently executable and testable without requiring the frontend source code.

---

# 2.2 Root Project Structure

The root structure must contain only the two independent application repositories and root-level orchestration/configuration.

```text
dayflow/
│
├── frontend/
│   ├── .git/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   └── .gitignore
│
├── backend/
│   ├── .git/
│   ├── src/
│   ├── package.json / equivalent
│   ├── Dockerfile
│   └── .gitignore
│
├── .gitignore
├── docker-compose.yml
└── README.md
```

If the project convention prefers:

```text
client/
server/
```

instead of:

```text
frontend/
backend/
```

use the existing DayFlow convention consistently.

Do not maintain both naming conventions.

---

# 2.3 Polyrepo Principle

The two application layers are independently owned:

```text
                    DAYFLOW
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
         FRONTEND            BACKEND
        Independent         Independent
           Repo                 Repo
              │                 │
              │   HTTP / API    │
              └─────────────────┘
```

Frontend and backend must have:

* Independent Git histories
* Independent dependency management
* Independent builds
* Independent tests
* Independent deployment capability
* Clear API boundaries

Do not introduce monorepo workspace tooling.

Do not introduce:

```text
apps/
packages/
turbo.json
nx.json
pnpm-workspace.yaml
```

unless the existing DayFlow scaffold already requires an equivalent mechanism.

---

# 2.4 Frontend Repository

The frontend owns the user-facing application.

Conceptual structure:

```text
frontend/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── layouts/
│   ├── services/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── ...
│
├── public/
├── package.json
├── Dockerfile
└── .gitignore
```

The exact framework and folder naming must follow the existing DayFlow scaffold.

Do not restructure the frontend unnecessarily.

---

# 2.5 Frontend Modular Architecture

Frontend functionality should be organized by feature/domain.

Conceptually:

```text
frontend/
└── src/
    ├── app/
    │
    ├── components/
    │   ├── ui/
    │   ├── layout/
    │   └── shared/
    │
    ├── features/
    │   ├── auth/
    │   │   ├── components/
    │   │   ├── pages/
    │   │   ├── hooks/
    │   │   ├── services/
    │   │   ├── schemas/
    │   │   └── types/
    │   │
    │   ├── employee/
    │   ├── attendance/
    │   ├── leave/
    │   ├── payroll/
    │   └── analytics/
    │
    ├── layouts/
    ├── services/
    ├── hooks/
    ├── lib/
    └── types/
```

This is a **conceptual modular structure**.

Do not create empty modules for features that are not yet implemented.

---

# 2.6 Backend Repository

The backend owns:

* API
* Authentication
* Authorization
* Business logic
* Data access
* Domain modules
* Integration with Odoo/database

Conceptual structure:

```text
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── employee/
│   │   ├── attendance/
│   │   ├── leave/
│   │   ├── payroll/
│   │   ├── analytics/
│   │   └── notifications/
│   │
│   ├── config/
│   ├── middleware/
│   ├── database/
│   ├── routes/
│   ├── utils/
│   └── ...
│
├── package.json / equivalent
├── Dockerfile
└── .gitignore
```

The exact backend architecture must follow the existing DayFlow/Odoo implementation where appropriate.

Do not introduce a second backend architecture unnecessarily.

---

# 2.7 Backend Modular Architecture

Backend functionality should be isolated into domain modules.

Conceptually:

```text
backend/
└── src/
    └── modules/
        ├── auth/
        │   ├── controller/
        │   ├── service/
        │   ├── repository/
        │   ├── routes/
        │   ├── validation/
        │   └── types/
        │
        ├── employee/
        │
        ├── attendance/
        │
        ├── leave/
        │
        ├── payroll/
        │
        ├── analytics/
        │
        └── notifications/
```

Each module should encapsulate its own:

```text
Routes
Controllers
Services
Validation
Data access
Types
Business logic
```

where supported by the backend framework.

Avoid creating one large global file containing unrelated business logic.

---

# 2.8 API Boundary

Frontend and backend communicate only through the API boundary.

```text
                 FRONTEND
                     │
                     │ HTTP / HTTPS
                     ▼
                 BACKEND API
                     │
                     ▼
                DOMAIN MODULES
                     │
                     ▼
               DATABASE / ODOO
```

Do not:

```text
❌ Import backend source code into frontend
❌ Import frontend source code into backend
❌ Share database credentials with frontend
❌ Access database directly from frontend
❌ Duplicate backend business logic in frontend
❌ Allow frontend-only authorization to protect sensitive operations
```

---

# 2.9 Docker Architecture

Both applications must be independently containerizable.

```text
                    Docker Compose
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
        frontend container    backend container
              │                     │
              └──────── API ────────┘
```

Frontend:

```text
frontend/Dockerfile
```

Backend:

```text
backend/Dockerfile
```

Root orchestration:

```text
docker-compose.yml
```

Each Dockerfile must build its own application independently.

Do not make the frontend Docker build depend on backend source files.

Do not make the backend Docker build depend on frontend source files.

---

# 2.10 Root Docker Compose

The root `docker-compose.yml` exists only for local orchestration.

Conceptually:

```yaml
services:
  frontend:
    build:
      context: ./frontend

  backend:
    build:
      context: ./backend
```

Add database or supporting services only if required by the actual DayFlow architecture.

Do not invent unnecessary infrastructure.

---

# 2.11 Environment Separation

Frontend and backend must maintain independent environment configuration.

Example:

```text
frontend/
└── .env.example

backend/
└── .env.example
```

Frontend may contain:

```text
API_BASE_URL
```

Backend may contain:

```text
DATABASE_URL
AUTH_SECRET
EMAIL_PROVIDER_CONFIG
```

Use the actual environment variables required by the existing scaffold.

Never commit real secrets.

---

# 2.12 Git Architecture

The project follows a **polyrepo model**.

Conceptually:

```text
dayflow/
├── frontend/
│   └── .git/
│
├── backend/
│   └── .git/
│
├── .gitignore
├── docker-compose.yml
└── README.md
```

Frontend and backend have independent commit histories.

Frontend changes should not require committing backend source into the frontend repository.

Backend changes should not require committing frontend source into the backend repository.

---

# 2.13 Root `.gitignore`

The root `.gitignore` should ignore project-level artifacts.

Conceptually:

```gitignore
# Environment
.env
.env.*
!.env.example

# Dependencies
node_modules/
vendor/

# Build output
dist/
build/
.next/

# Runtime
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Python
__pycache__/
*.py[cod]
.venv/

# Docker
docker-compose.override.yml

# Local data
*.sqlite
*.db
```

Individual frontend and backend repositories may maintain their own more specific `.gitignore` files.

Do not blindly overwrite existing DayFlow ignore rules.

---

# 3. Scope

## This Developer Owns

```text
FOUNDATION
├── Application structure
├── Shared routing structure
├── Shared authentication infrastructure
├── Sign Up
├── Sign In
├── Email verification
├── Session/auth state
├── Role handling
├── Route protection
├── Authentication error handling
└── Auth-related reusable UI/components
```

## Developer A Owns

```text
EMPLOYEE
├── Employee Profile
├── Employee Management
├── Employee Dashboard
└── Attendance
```

Developer A's existing implementation plan explicitly assigns Employee, Profile, Dashboard and Attendance to Developer A.

## Developer B Owns

```text
HR
├── Leave
├── Leave Approval
├── Leave Balance
├── Leave Calendar
├── Payroll
├── Salary Slips
├── Analytics
└── Notifications
```

Developer B's implementation plan explicitly assigns these modules to Developer B.

### Hard Boundary

Do not implement business logic belonging to Developer A or Developer B.

Authentication may expose the user's identity and role to those modules, but it must not implement their domain functionality.

---

# 4. Non-Negotiable Rules

1. Inspect the existing DayFlow scaffold before changing architecture.
2. Preserve the existing DayFlow design system.
3. Reuse existing components and utilities whenever appropriate.
4. Do not replace the scaffold with a completely new architecture.
5. Do not introduce unnecessary dependencies.
6. Do not duplicate existing authentication utilities.
7. Do not create duplicate user/employee models if an existing model already exists.
8. Keep frontend and backend independently executable.
9. Keep frontend/backend communication API-based.
10. Do not allow frontend direct database access.
11. Do not modify Developer A's business modules.
12. Do not modify Developer B's business modules.
13. Avoid unnecessary shared-file changes.
14. Keep authentication reusable by both developers.
15. Keep authorization enforced server-side.
16. Never rely only on frontend role checks for security.
17. Make each phase independently testable.
18. Fix errors introduced by the current phase before proceeding.
19. Do not expose sensitive credentials.
20. Preserve modular boundaries throughout implementation.

---

# 5. Phase Structure

This implementation is divided into **four foundation phases**.

```text
PHASE 1
Repository Audit + Application Foundation

        ↓

PHASE 2
Authentication Infrastructure

        ↓

PHASE 3
Sign Up + Email Verification

        ↓

PHASE 4
Sign In + Route Protection + Auth QA
```

Each phase must be completed and validated before moving to the next phase.

---

# PHASE 1 — Repository Audit + Application Foundation

## Objective

Understand the existing DayFlow scaffold and establish the minimum Dayflow application foundation.

Do not implement authentication business logic yet.

---

## 1.1 Inspect Existing Scaffold

Identify:

* Frontend framework
* Backend framework
* Package manager
* Existing routing
* Existing API architecture
* Existing database layer
* Existing ORM/data access
* Existing authentication utilities
* Existing session/token implementation
* Existing form components
* Existing validation utilities
* Existing notification/toast system
* Existing layout components
* Existing design tokens
* Existing button/input/card components
* Existing error/loading components
* Existing environment configuration
* Existing testing setup
* Existing Docker configuration
* Existing Git structure

Do not assume these technologies exist.

Inspect the repository first.

---

# 1.2 Confirm Polyrepo Boundary

Confirm that:

```text
frontend/
```

and:

```text
backend/
```

are independently structured repositories.

Verify:

* Independent `package.json` or equivalent
* Independent dependencies
* Independent source tree
* Independent Dockerfile
* Independent `.gitignore`
* Independent Git history where applicable

The root should only contain:

```text
.gitignore
docker-compose.yml
README.md
frontend/
backend/
```

plus other explicitly required root-level project configuration.

---

# 1.3 Identify Existing Structure

Document the actual structure before modifying it.

Conceptual target:

```text
dayflow/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   └── .gitignore
│
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   ├── middleware/
│   │   ├── config/
│   │   ├── database/
│   │   └── utils/
│   ├── package.json / equivalent
│   ├── Dockerfile
│   └── .gitignore
│
├── .gitignore
├── docker-compose.yml
└── README.md
```

This is only a conceptual target.

**Do not force this structure if DayFlow already has an appropriate architecture.**

---

# 1.4 Establish Application-Level Routes

The authentication layer should establish clear route boundaries.

Conceptual route map:

```text
PUBLIC
/
├── /sign-in
├── /sign-up
└── /verify-email

PROTECTED
/dashboard
/employee/*
/hr/*
```

The actual route names must follow the existing scaffold conventions.

---

# 1.5 Authentication Route Boundary

Create a clear distinction between:

```text
Public Routes
        ↓
Authentication
        ↓
Authenticated Session
        ↓
Role-Based Application
```

Conceptually:

```text
                    ┌───────────────┐
                    │ Public Routes │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │ Authentication│
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │ Authenticated │
                    │    Session    │
                    └───────┬───────┘
                            │
                  ┌─────────┴─────────┐
                  │                   │
            ┌─────▼─────┐       ┌─────▼─────┐
            │ Employee  │       │ HR / Admin│
            │   Role    │       │    Role   │
            └───────────┘       └───────────┘
```

---

# 1.6 Foundation Validation

Verify:

```text
[ ] Frontend runs independently
[ ] Backend runs independently
[ ] Frontend build works
[ ] Backend build works
[ ] Root Docker Compose can orchestrate services
[ ] Frontend can communicate with backend through API
[ ] No direct frontend/database connection exists
[ ] Existing DayFlow functionality remains intact
```

---

## Phase 1 Deliverable

A clean Dayflow application foundation integrated into DayFlow without breaking existing functionality.

### Validation

* [ ] Existing application starts successfully
* [ ] Existing scaffold functionality still works
* [ ] Existing routes still work
* [ ] Frontend runs independently
* [ ] Backend runs independently
* [ ] Dockerfiles are valid
* [ ] Docker Compose configuration works
* [ ] Root `.gitignore` is present
* [ ] Frontend/backend boundaries are documented
* [ ] No unnecessary dependencies added
* [ ] No A-owned business logic introduced
* [ ] No B-owned business logic introduced
* [ ] Authentication route boundaries are established
* [ ] Application structure is documented

### Suggested Commit

```text
chore(auth): establish dayflow application foundation
```

### Approval Gate

Stop after Phase 1.

Report:

```text
Phase 1 completed.

Implemented:
...

Files changed:
...

Validation:
...

Known limitations:
...

Commit:
...

Next phase:
Authentication infrastructure

Waiting for user approval to continue.
```

---

# PHASE 2 — Authentication Infrastructure

## Objective

Implement the shared authentication foundation that both Employee and HR/Admin modules will consume.

The requirements specify that users authenticate using email and password, while registration includes Employee ID, email, password and role.

---

# 2.1 User Identity Model

First inspect whether DayFlow/Odoo already provides a suitable user model.

Prefer:

```text
Existing User
     │
     ├── Authentication credentials
     ├── Email
     ├── Role
     └── Identity
```

rather than creating a duplicate user system.

If an existing Odoo user/authentication model is appropriate, integrate with it.

Do not create duplicate employee/user records without a clear architectural reason.

---

# 2.2 Required Authentication Concepts

The authentication system should conceptually support:

```text
User
├── id
├── email
├── password credential
├── role
├── email_verified
└── authentication/session metadata
```

Roles:

```text
EMPLOYEE
HR
```

Use the project's existing naming conventions if they differ.

---

# 2.3 Authentication States

The application should distinguish:

```text
Unauthenticated
        ↓
Authenticated but email unverified
        ↓
Authenticated + email verified
        ↓
Role-authorized application access
```

---

# 2.4 Session Management

Implement authentication sessions using the mechanism already established by DayFlow/Odoo.

The implementation must provide:

* Login persistence
* Logout
* Current-user retrieval
* Session validation
* Protected-route handling
* Role availability to authorized application code

Do not expose sensitive credentials to the frontend.

---

# 2.5 Authorization Foundation

Create reusable authorization utilities.

Conceptually:

```text
requireAuth()
requireRole("EMPLOYEE")
requireRole("HR")
```

Actual naming should follow the existing project conventions.

Authorization must ultimately be enforced on the server/API side.

Frontend checks are for UX only.

---

# 2.6 Authentication API Contract

Establish a clean contract between frontend and backend.

Conceptual operations:

```text
POST /auth/signup
POST /auth/signin
POST /auth/signout
GET  /auth/me
POST /auth/verify-email
POST /auth/resend-verification
```

Do not blindly create these exact endpoints if the existing scaffold/Odoo architecture already provides equivalent functionality.

---

# 2.7 Frontend API Client Boundary

The frontend authentication module should consume the backend only through an API client/service layer.

Conceptually:

```text
frontend
└── src/
    └── features/
        └── auth/
            └── services/
                └── auth-api
```

The frontend must not directly import backend services, repositories, database clients, or server modules.

---

# 2.8 Backend Authentication Module

Authentication backend functionality should remain isolated:

```text
backend/
└── src/
    └── modules/
        └── auth/
            ├── controller/
            ├── service/
            ├── repository/
            ├── routes/
            ├── validation/
            └── types/
```

Actual structure must follow the existing backend framework.

---

# 2.9 Error Contract

Authentication errors should be predictable.

Conceptually:

```text
AUTH_INVALID_CREDENTIALS
AUTH_EMAIL_EXISTS
AUTH_EMAIL_NOT_VERIFIED
AUTH_INVALID_VERIFICATION
AUTH_SESSION_EXPIRED
AUTH_UNAUTHORIZED
AUTH_FORBIDDEN
AUTH_VALIDATION_ERROR
```

Do not expose sensitive implementation details.

Bad:

```text
User exists in database with password hash...
```

Good:

```text
Invalid email or password.
```

---

## Phase 2 Deliverable

A reusable authentication infrastructure that can be consumed by both developers.

### Validation

* [ ] User authentication infrastructure works
* [ ] Session creation works
* [ ] Session retrieval works
* [ ] Logout works
* [ ] Current-user retrieval works
* [ ] Role information is available
* [ ] Server-side authorization exists
* [ ] Authentication errors have consistent handling
* [ ] No sensitive credentials are exposed
* [ ] Frontend consumes backend only through API
* [ ] Backend authentication is modular
* [ ] A/B business logic remains untouched

### Suggested Commit

```text
feat(auth): implement shared authentication infrastructure
```

### Approval Gate

Stop and wait for approval.

---

# PHASE 3 — Sign Up + Email Verification

## Objective

Implement the Dayflow registration experience.

The problem statement requires registration using:

```text
Employee ID
Email
Password
Role
```

and requires email verification.

---

# 3.1 Sign Up Page

Create:

```text
/sign-up
```

The page should contain:

```text
Dayflow
────────────────────────

Create your account

Employee ID
[________________]

Email
[________________]

Password
[________________]

Confirm Password
[________________]

Role
[ Employee ▼ ]

[ Create Account ]

Already have an account?
Sign in
```

The exact visual design must reuse DayFlow's existing components/design system.

---

# 3.2 Form Validation

Validate:

### Employee ID

* Required
* Valid format according to the project's domain rules
* Duplicate IDs rejected where applicable

### Email

* Required
* Valid email format
* Duplicate email rejected

### Password

* Required
* Must satisfy the project's password security rules

### Confirm Password

* Required
* Must match password

### Role

Supported roles:

```text
Employee
HR
```

Do not allow arbitrary role strings.

---

# 3.3 Password Security

Never:

* Store plaintext passwords
* Return password hashes to the frontend
* Log passwords
* Include passwords in error messages
* Store passwords in browser storage

Use the authentication mechanism already supported by the underlying architecture.

---

# 3.4 Email Verification

After successful registration:

```text
Signup
  ↓
Account created
  ↓
Verification email
  ↓
User opens verification link
  ↓
Email verified
  ↓
User can sign in
```

Create an appropriate verification state.

Example:

```text
Email not verified
        ↓
Verification pending
        ↓
Email verified
```

---

# 3.5 Verification Page

Create:

```text
/verify-email
```

States:

### Waiting

```text
Check your email

We've sent a verification link
to your registered email address.
```

### Success

```text
Email verified successfully.

[ Continue to Sign In ]
```

### Invalid/Expired

```text
This verification link is invalid or has expired.

[ Resend Verification Email ]
```

---

# 3.6 Sign Up Success Behavior

Do not automatically expose protected application pages before the required verification state is satisfied.

Recommended flow:

```text
Sign Up
   ↓
Success
   ↓
Check Email
   ↓
Verify Email
   ↓
Sign In
   ↓
Dashboard
```

---

# 3.7 Sign Up Error States

Support clear UI states for:

```text
Invalid employee ID
Invalid email
Email already registered
Employee ID already registered
Weak password
Passwords do not match
Invalid role
Verification email failure
Server error
Network error
```

Do not expose database or internal server errors directly.

---

## Phase 3 Deliverable

A complete registration and email verification experience.

### Validation

* [ ] Sign-up page renders
* [ ] Employee ID validation works
* [ ] Email validation works
* [ ] Password validation works
* [ ] Confirm-password validation works
* [ ] Employee role works
* [ ] HR role works
* [ ] Duplicate registration is rejected
* [ ] Verification email flow works
* [ ] Verification success state works
* [ ] Invalid verification state works
* [ ] Resend verification works where supported
* [ ] Protected access is blocked before required verification
* [ ] Responsive UI works
* [ ] Loading/error states work
* [ ] Frontend and backend remain decoupled

### Suggested Commit

```text
feat(auth): implement signup and email verification
```

### Approval Gate

Stop and wait for approval.

---

# PHASE 4 — Sign In + Route Protection + Authentication QA

## Objective

Implement the complete login experience and connect authentication to the Dayflow application.

The requirements specify that users sign in using email and password, incorrect credentials must display an error, and successful login redirects to the dashboard.

---

# 4.1 Sign In Page

Create:

```text
/sign-in
```

Conceptual UI:

```text
Dayflow
────────────────────────

Welcome back

Email
[________________]

Password
[________________]

[ Sign In ]

Don't have an account?
Create account
```

Use existing DayFlow components.

---

# 4.2 Sign In Validation

Validate:

```text
Email required
Valid email format
Password required
```

Do not perform insecure client-only authentication.

---

# 4.3 Invalid Credentials

If credentials are incorrect:

```text
Invalid email or password.
```

Do not reveal whether:

```text
Email exists
Password exists
User exists but password is wrong
```

unless the underlying authentication architecture explicitly requires a different safe behavior.

---

# 4.4 Unverified Account

If the user has not verified their email:

```text
Please verify your email before signing in.
```

Provide an appropriate recovery/resend path.

---

# 4.5 Successful Authentication

After successful login:

```text
Sign In
   ↓
Validate credentials
   ↓
Validate account state
   ↓
Create session
   ↓
Resolve role
   ↓
Dashboard
```

The exact dashboard destination should follow the application routing architecture.

---

# 4.6 Role-Based Redirect

If the application has role-specific dashboard routes:

```text
Employee
   ↓
Employee Dashboard

HR
   ↓
HR Dashboard
```

If DayFlow uses a shared dashboard shell:

```text
Authenticated User
        ↓
Dashboard
        ↓
Role-specific navigation/content
```

Choose the approach that best matches the existing scaffold.

Do not implement Developer A/B dashboard business logic here.

Only establish the authentication-to-dashboard boundary.

---

# 4.7 Protected Routes

Unauthenticated users attempting to access:

```text
/dashboard
/employee/*
/hr/*
```

must be redirected to:

```text
/sign-in
```

or the project's equivalent authentication route.

---

# 4.8 Role Protection

An Employee must not access HR-only routes.

Example:

```text
Employee
   ↓
/hr/payroll
   ↓
403 / Forbidden
```

Similarly, HR-only functionality must not become available merely by manually modifying a frontend route.

Authorization must be enforced server-side.

---

# 4.9 Logout

Implement:

```text
Logout
   ↓
Invalidate session
   ↓
Clear client authentication state
   ↓
Redirect to Sign In
```

After logout, protected pages must not remain accessible through stale client state.

---

# 4.10 Authentication Loading States

Provide appropriate states for:

```text
Checking session...
Signing in...
Creating account...
Verifying email...
Signing out...
```

Avoid flashing protected application content before authentication state is known.

---

# 4.11 Authentication Error Boundary

Authentication-related failures should have user-friendly UI.

Examples:

```text
Something went wrong.
Please try again.
```

For validation:

```text
Please enter a valid email.
```

For authorization:

```text
You don't have permission to access this page.
```

---

## Phase 4 Deliverable

A complete authentication experience:

```text
Sign Up
   ↓
Email Verification
   ↓
Sign In
   ↓
Session
   ↓
Role Resolution
   ↓
Protected Dashboard
```

### Validation

* [ ] Sign-in page works
* [ ] Correct credentials authenticate
* [ ] Incorrect credentials show safe error
* [ ] Unverified users are handled correctly
* [ ] Successful login redirects correctly
* [ ] Session persists correctly
* [ ] Logout works
* [ ] Protected routes reject unauthenticated users
* [ ] Employee cannot access HR-only routes
* [ ] HR can access authorized HR routes
* [ ] Server-side authorization works
* [ ] Refreshing protected pages preserves valid sessions
* [ ] Expired sessions are handled
* [ ] No stale authenticated state remains after logout
* [ ] Loading states work
* [ ] Error states work
* [ ] Mobile/responsive authentication UI works
* [ ] Frontend/backend remain independently buildable
* [ ] Dockerized frontend/backend work together

---

# 6. Shared Authentication Contract

This section is critical because Developer A and Developer B will build on top of this foundation.

The authentication layer should expose a minimal stable contract.

---

## 6.1 Current User

Conceptually:

```text
currentUser
├── id
├── employeeId
├── email
├── role
└── emailVerified
```

Do not expose unnecessary sensitive information.

---

# 6.2 Roles

Canonical roles:

```text
EMPLOYEE
HR
```

If the underlying system uses different names, define a clear mapping rather than allowing arbitrary strings throughout the application.

---

# 6.3 Authentication Utilities

Provide reusable equivalents of:

```text
getCurrentUser()

requireAuth()

requireRole("EMPLOYEE")

requireRole("HR")

signIn()

signOut()
```

Actual implementation names should follow DayFlow conventions.

---

# 6.4 Developer A Integration

Developer A should be able to consume:

```text
currentUser.id
currentUser.employeeId
currentUser.role
```

for Employee/Profile/Attendance features.

Developer A must not need to recreate authentication.

Developer A's implementation must remain within the existing Employee/Attendance ownership boundary.

---

# 6.5 Developer B Integration

Developer B should be able to consume:

```text
currentUser.id
currentUser.employeeId
currentUser.role
```

for Leave/Payroll/HR features.

Developer B must not create another user/authentication system.

Developer B's implementation must remain within the existing HR/Leave/Payroll ownership boundary.

---

# 7. Authentication Frontend Module

Authentication UI belongs inside the frontend repository.

Conceptually:

```text
frontend/
└── src/
    └── features/
        └── auth/
            ├── components/
            │   ├── AuthLayout
            │   ├── AuthForm
            │   ├── SignInForm
            │   ├── SignUpForm
            │   ├── PasswordField
            │   ├── RoleSelector
            │   └── VerificationStatus
            │
            ├── pages/
            │   ├── sign-in/
            │   ├── sign-up/
            │   └── verify-email/
            │
            ├── hooks/
            ├── services/
            │   └── auth-api
            ├── schemas/
            └── types/
```

Use the actual DayFlow frontend conventions where available.

---

# 8. Authentication Backend Module

Authentication backend functionality belongs inside the backend repository.

Conceptually:

```text
backend/
└── src/
    └── modules/
        └── auth/
            ├── controller/
            ├── service/
            ├── repository/
            ├── routes/
            ├── validation/
            ├── middleware/
            └── types/
```

Responsibilities include:

```text
Sign Up
Sign In
Sign Out
Current User
Email Verification
Resend Verification
Session Management
Role Validation
Authorization
```

Use the existing backend/Odoo conventions where applicable.

---

# 9. UI/UX Requirements

Authentication should feel like part of the same Dayflow application rather than a separate prototype.

Reuse:

* Existing typography
* Existing colors
* Existing spacing
* Existing buttons
* Existing inputs
* Existing cards
* Existing icons
* Existing toast/notification components
* Existing responsive utilities

Do not introduce a second design system.

---

## Required UX States

Every authentication page should support:

```text
Default
Loading
Validation Error
Server Error
Success
Disabled
Empty
Verification Pending
Verification Success
Verification Failed
```

---

# 10. Accessibility

Authentication forms must support:

* Proper labels
* Keyboard navigation
* Visible focus states
* Accessible error messages
* Appropriate autocomplete attributes
* Sufficient contrast
* Screen-reader-friendly form validation
* Logical tab order

Do not rely solely on color to communicate errors.

---

# 11. Security Requirements

## Never

```text
❌ Plaintext passwords
❌ Passwords in logs
❌ Passwords in localStorage
❌ Sensitive tokens in UI
❌ Client-only authorization
❌ Trusting a submitted role blindly
❌ Exposing database errors
❌ Returning unnecessary user information
❌ Direct frontend/database communication
```

## Always

```text
✅ Secure password handling
✅ Server-side authentication
✅ Server-side authorization
✅ Session validation
✅ Safe authentication errors
✅ Input validation
✅ Role validation
✅ Email verification
✅ API boundary between frontend and backend
```

---

# 12. Out of Scope

Do not implement:

```text
❌ Employee profile business logic
❌ Employee CRUD
❌ Attendance
❌ Check-in/check-out
❌ Attendance analytics
❌ Leave requests
❌ Leave approval
❌ Leave balance
❌ Leave calendar
❌ Payroll calculations
❌ Salary slips
❌ HR analytics
❌ Notifications
❌ AI HR assistant
```

These remain with Developer A and Developer B according to their existing phase plans.

---

# 13. Final Authentication Flow

The completed foundation should support:

```text
                         ┌─────────────┐
                         │   Landing   │
                         └──────┬──────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
               ┌────▼────┐             ┌────▼────┐
               │ Sign Up  │             │ Sign In  │
               └────┬─────┘             └────┬─────┘
                    │                        │
                    ▼                        │
             Create Account                  │
                    │                        │
                    ▼                        │
             Email Verification             │
                    │                        │
                    └──────────┬─────────────┘
                               │
                               ▼
                       Authenticate User
                               │
                               ▼
                         Resolve Role
                               │
                    ┌──────────┴──────────┐
                    │                     │
               ┌────▼────┐           ┌────▼────┐
               │ Employee│           │ HR/Admin │
               └────┬────┘           └────┬────┘
                    │                     │
                    ▼                     ▼
              Employee Area          HR Area
```

Authentication stops at the application boundary.

The downstream Employee and HR features are implemented by Developers A and B.

---

# 14. Integration Requirements

Before handing the foundation to Developers A and B, document:

## Authentication API

```text
Available authentication operations
```

## Current User

```text
Available user fields
```

## Roles

```text
Supported roles
```

## Session

```text
How authenticated state is retrieved
```

## Authorization

```text
How protected routes/API operations are enforced
```

## Errors

```text
Authentication error format
```

## Route Conventions

```text
Public routes
Protected routes
Employee routes
HR routes
```

Do not require A or B to understand internal authentication implementation details.

---

# 15. Recommended Development Workflow

Because frontend and backend are independently decoupled, development should follow:

```text
1. Inspect DayFlow
       ↓
2. Establish frontend/backend boundaries
       ↓
3. Establish backend authentication API
       ↓
4. Establish frontend authentication client
       ↓
5. Build Sign Up
       ↓
6. Build Email Verification
       ↓
7. Build Sign In
       ↓
8. Add Session Handling
       ↓
9. Add Route Protection
       ↓
10. Validate Role Authorization
       ↓
11. Dockerize Both Applications
       ↓
12. Validate Full Authentication Flow
```

Do not implement all frontend pages first with fake authentication and then attempt to connect the backend later.

The API contract should remain clear throughout development.

---

# 16. Independent Development

A developer must be able to work inside either repository independently.

Frontend:

```bash
cd frontend

# install dependencies
# run frontend
# test frontend
```

Backend:

```bash
cd backend

# install dependencies
# run backend
# test backend
```

The frontend requires the backend only when executing features that consume backend APIs.

The backend must be testable independently of the frontend.

---

# 17. Phase 1 Architecture Deliverable

Before implementing authentication, confirm:

```text
[ ] Root structure established
[ ] frontend repository identified/initialized
[ ] backend repository identified/initialized
[ ] Existing DayFlow architecture inspected
[ ] Frontend/backend boundaries documented
[ ] Root .gitignore established
[ ] Frontend Dockerfile established/adapted
[ ] Backend Dockerfile established/adapted
[ ] Root docker-compose.yml established/adapted
[ ] Frontend can run independently
[ ] Backend can run independently
[ ] Frontend → Backend API boundary established
[ ] No monorepo workspace tooling introduced
[ ] No unnecessary restructuring performed
```

Only after this foundation is validated should Phase 2 authentication infrastructure begin.

---

# 18. Final QA Checklist

## Application Foundation

* [ ] DayFlow scaffold remains functional
* [ ] Existing architecture was reused
* [ ] No unnecessary restructuring
* [ ] No unnecessary dependencies
* [ ] Public/protected route boundary exists
* [ ] Frontend is independently runnable
* [ ] Backend is independently runnable
* [ ] Frontend/backend API boundary exists
* [ ] Dockerfiles work
* [ ] Docker Compose works
* [ ] Root `.gitignore` works

## Sign Up

* [ ] Employee ID
* [ ] Email
* [ ] Password
* [ ] Confirm password
* [ ] Role
* [ ] Validation
* [ ] Duplicate handling
* [ ] Secure password handling

## Email Verification

* [ ] Verification email
* [ ] Verification link
* [ ] Success state
* [ ] Invalid/expired state
* [ ] Resend flow where supported
* [ ] Unverified account handling

## Sign In

* [ ] Email
* [ ] Password
* [ ] Validation
* [ ] Invalid credentials
* [ ] Successful authentication
* [ ] Session creation
* [ ] Dashboard redirect

## Authorization

* [ ] Authentication required for protected routes
* [ ] Employee role recognized
* [ ] HR role recognized
* [ ] Employee cannot access HR-only routes
* [ ] Server-side authorization enforced

## Session

* [ ] Session persists correctly
* [ ] Current user works
* [ ] Refresh works
* [ ] Logout works
* [ ] Expired session handled
* [ ] Stale auth state cleared

## UI/UX

* [ ] Responsive
* [ ] Loading states
* [ ] Error states
* [ ] Success states
* [ ] Accessible forms
* [ ] Existing DayFlow design system reused

## Integration

* [ ] Developer A can consume authentication
* [ ] Developer B can consume authentication
* [ ] No duplicate user model
* [ ] No duplicate authentication system
* [ ] No A-owned business logic
* [ ] No B-owned business logic
* [ ] Frontend does not access database directly
* [ ] Backend remains independently executable

---

# 19. Git Discipline

Never work directly on `main`.

Use the project's existing branch strategy.

If this foundation has its own repository branch, use:

```text
dev/auth-foundation
```

Otherwise follow the branch strategy already established by the repository.

Suggested commits:

```text
Phase 1
chore(auth): establish dayflow application foundation

Phase 2
feat(auth): implement shared authentication infrastructure

Phase 3
feat(auth): implement signup and email verification

Phase 4
feat(auth): implement signin and route protection
```

Do not squash phase commits unless explicitly requested.

---

# 20. Completion Report

After Phase 4, provide:

```text
Authentication Foundation — COMPLETE

Frontend repository:
<branch / commit>

Backend repository:
<branch / commit>

Root orchestration:
<summary>

Implemented:
- Application foundation
- Decoupled frontend/backend architecture
- Authentication infrastructure
- Sign Up
- Email verification
- Sign In
- Session management
- Role handling
- Route protection
- Authorization

Frontend files changed:
<summary>

Backend files changed:
<summary>

Root files changed:
<summary>

Authentication contract for Developer A:
<summary>

Authentication contract for Developer B:
<summary>

Known limitations:
<summary>

Validation:
<summary>
```

---

# 21. Critical Approval Rule

The authentication developer must **not automatically continue through all phases**.

After every phase:

```text
Phase X completed.

Implemented:
...

Validation:
...

Commit:
...

Next phase:
...

Waiting for user approval to continue.
```

Then STOP.

Only continue when the user explicitly approves with:

```text
approved
continue
proceed
```

or an equivalent instruction.

If the user requests changes to the current phase:

1. Remain in the current phase.
2. Apply the requested changes.
3. Re-run validation.
4. Report the result.
5. Ask for approval again.
6. Do not move to the next phase.

---

# 22. Final Architecture

```text
                           DAYFLOW
                              │
             ┌────────────────┴────────────────┐
             │                                 │
             ▼                                 ▼
      ┌──────────────┐                  ┌──────────────┐
      │   FRONTEND   │                  │   BACKEND    │
      │ Independent  │                  │ Independent  │
      │    Repo      │                  │    Repo      │
      └──────┬───────┘                  └──────┬───────┘
             │                                 │
             │       HTTP / HTTPS API          │
             └─────────────────────────────────┘
                                               │
                                               ▼
                                      ┌─────────────────┐
                                      │ Database / Odoo │
                                      └─────────────────┘
```

## Frontend

```text
frontend/
└── src/
    ├── app/
    ├── components/
    ├── features/
    │   ├── auth/
    │   ├── employee/
    │   ├── attendance/
    │   ├── leave/
    │   ├── payroll/
    │   └── analytics/
    ├── layouts/
    ├── services/
    ├── hooks/
    ├── lib/
    └── types/
```

## Backend

```text
backend/
└── src/
    ├── modules/
    │   ├── auth/
    │   ├── employee/
    │   ├── attendance/
    │   ├── leave/
    │   ├── payroll/
    │   ├── analytics/
    │   └── notifications/
    ├── middleware/
    ├── config/
    ├── database/
    ├── routes/
    └── utils/
```

## Root

```text
dayflow/
├── frontend/
├── backend/
├── .gitignore
├── docker-compose.yml
└── README.md
```

The root is an **orchestration container**, not a monorepo workspace.

Frontend and backend remain **independent repositories with a clean API boundary**.

---

# Final Ownership Model

```text
                    DAYFLOW FOUNDATION
                           │
                           ▼
                    AUTHENTICATION
                    ┌──────┴──────┐
                    │             │
                EMPLOYEE          HR
                    │             │
            ┌───────┴──────┐ ┌────┴────────────┐
            │ Developer A  │ │  Developer B    │
            ├──────────────┤ ├─────────────────┤
            │ Profile      │ │ Leave           │
            │ Employees    │ │ Approval        │
            │ Dashboard    │ │ Balance         │
            │ Attendance   │ │ Calendar        │
            │ Insights     │ │ Payroll         │
            │              │ │ Salary Slips    │
            │              │ │ Analytics       │
            │              │ │ Notifications   │
            └──────────────┘ └─────────────────┘
```

Authentication is **shared infrastructure**.

It is not a replacement for either developer's domain implementation.

Keep the authentication boundary stable so Developer A and Developer B can independently build their modules on top of it.
