# Dayflow — Human Resource Management System

> **Every workday, perfectly aligned.**

Dayflow is a modern **Human Resource Management System (HRMS)** designed to digitize and streamline essential HR operations through a centralized platform.

The system provides dedicated experiences for **Employees** and **HR/Admin users**, covering employee management, attendance tracking, leave and time-off management, payroll visibility, approval workflows, notifications, analytics, and reporting.

---

## Overview

Dayflow brings common HR workflows into a single platform.

```text
                         DAYFLOW HRMS
                              │
               ┌──────────────┴──────────────┐
               │                             │
           EMPLOYEE                       HR / ADMIN
               │                             │
      ┌────────┼────────┐          ┌─────────┼─────────┐
      │        │        │          │         │         │
   Profile  Attendance Leave    Employees  Payroll  Analytics
      │        │        │          │         │         │
      └────────┴────────┘          └─────────┴─────────┘
                              │
                       PostgreSQL Database
```

The platform is designed around two primary roles:

- **Employee** — self-service access to profile, attendance, leave, and salary information.
- **HR/Admin** — workforce management, approvals, payroll management, analytics, and reporting.

---

# Features

## 🔐 Authentication & Authorization

- User registration
- User login
- Employee ID and email-based registration
- Role-based access control
- Employee and HR/Admin roles
- JWT-based authentication
- Secure HTTP-only cookie-based authentication
- Argon2 password hashing
- CSRF protection
- Zod request validation
- Protected routes and API endpoints
- Server-side authorization

---

## 👤 Employee Management

### Employee Profile

Employees can view:

- Personal information
- Job information
- Department
- Designation
- Joining date
- Profile picture
- Documents
- Salary information

Employees can edit permitted personal fields such as:

- Phone number
- Address
- Profile picture

### HR/Admin Employee Management

HR/Admin users can:

- View employees
- Search employees
- Filter employees
- View detailed employee profiles
- Edit employee information
- View employee-related records

---

## 🕒 Attendance Management

Employees can:

- Check in
- Check out
- View today's attendance
- View daily attendance
- View weekly attendance
- View attendance history
- View worked hours

Attendance statuses include:

- Present
- Absent
- Half-day
- Leave

### HR/Admin Attendance

HR/Admin users can:

- View attendance across employees
- Filter attendance
- View attendance history
- Monitor attendance statistics
- Review attendance trends

### Attendance Validation

The system prevents invalid attendance operations such as:

- Duplicate active check-ins
- Check-out without check-in
- Duplicate check-outs

---

## 🧠 Attendance Insights

Dayflow provides rule-based attendance insights to help identify unusual attendance patterns.

Examples include:

- Late check-ins
- Missing check-outs
- Low attendance
- Repeated absences
- Repeated half-days

Example:

```text
⚠ Attendance Insight

Rahul has had 3 late check-ins this week.
```

These insights are designed to help HR identify attendance issues quickly.

---

## 🏖️ Leave & Time-Off Management

Employees can apply for:

- Paid Leave
- Sick Leave
- Unpaid Leave

A leave request contains:

- Leave type
- Start date
- End date
- Number of days
- Remarks

Leave statuses:

```text
Pending
Approved
Rejected
```

Employees can also:

- View their leave history
- Track request status
- View leave balance
- View upcoming leave

---

## ✅ Leave Approval Workflow

HR/Admin users can:

- View all leave requests
- Filter leave requests
- Review employee leave details
- Approve requests
- Reject requests
- Add comments

Workflow:

```text
Employee
    │
    ▼
Apply Leave
    │
    ▼
Pending
    │
    ▼
HR Review
    │
    ├───────────────┐
    ▼               ▼
Approved         Rejected
    │               │
    └───────┬───────┘
            ▼
      Employee Updated
```

Once the request is processed, the employee sees the updated status.

---

## 📅 Leave Calendar

The leave calendar provides HR with a visual overview of employee time-off.

It can display:

- Employee
- Leave type
- Start date
- End date
- Leave status
- Upcoming leave

This makes it easier to identify overlapping leave periods and workforce availability.

---

## 🎯 Leave Balance

Dayflow provides leave balance visibility.

Example:

```text
Paid Leave
12 / 15 days remaining

Sick Leave
7 / 10 days remaining
```

Approved leave reduces the relevant balance.

Pending and rejected requests do not incorrectly reduce the available balance.

---

## 💰 Payroll & Salary Management

### Employee Payroll

Employees have read-only access to their payroll information.

They can view:

- Basic salary
- Allowances
- Deductions
- Net salary

The basic calculation is:

```text
Net Salary =
Basic Salary + Allowances - Deductions
```

### HR/Admin Payroll

HR/Admin users can:

- View employee payroll
- Manage salary structures
- Update salary components
- Review payroll information
- Maintain payroll accuracy

Employees cannot modify payroll information.

---

## 📄 Salary Slips

Dayflow supports salary slip generation containing information such as:

- Employee name
- Employee ID
- Department
- Designation
- Salary period
- Basic salary
- Allowances
- Deductions
- Net salary

Where supported by the implementation, salary slips can be printed or downloaded.

---

## 📊 HR Analytics & Reports

The HR dashboard provides organizational insights.

### Dashboard Metrics

- Total employees
- Present today
- Absent today
- Employees on leave
- Attendance percentage
- Pending leave requests
- Payroll summary

### Attendance Reports

```text
Employee
Present
Absent
Leave
Half-day
Attendance %
```

### Leave Reports

```text
Employee
Leave Type
Approved
Rejected
Pending
Days
```

### Payroll Reports

```text
Employee
Basic Salary
Allowances
Deductions
Net Salary
```

Additional analytics can include:

- Attendance trends
- Leave distribution
- Department distribution
- Payroll summaries

---

## 🔔 Notifications

Dayflow includes an in-app notification system.

### Employee Notifications

- Leave approved
- Leave rejected
- Attendance alerts
- Missing checkout alerts
- Salary-related updates

### HR/Admin Notifications

- New leave request
- Attendance alerts
- HR-related updates

Example:

```text
🔔 Notifications

✓ Leave Approved
Your leave request for Aug 25–27 was approved.

⚠ Attendance Alert
You have a missing checkout.
```

---

# Technology Stack

## Frontend

| Technology | Purpose |
|---|---|
| **React** | Frontend application and UI |
| **React Router** | Client-side routing |
| **JavaScript / TypeScript** | Frontend application logic |
| **CSS / Tailwind CSS** | Styling and responsive design |

> Use the styling and language configuration present in the actual project repository.

---

## Backend

| Technology | Purpose |
|---|---|
| **Node.js** | Backend runtime |
| **Express.js** | REST API framework |
| **Prisma ORM** | Database access and ORM layer |
| **Zod** | Request and data validation |

---

## Database

| Technology | Purpose |
|---|---|
| **PostgreSQL** | Primary relational database |
| **Prisma Migrate** | Database schema migrations |
| **Prisma ORM** | Type-safe database access |

---

## Authentication & Security

| Technology | Purpose |
|---|---|
| **JWT** | Authentication tokens |
| **HTTP-only Cookies** | Secure token storage |
| **Argon2** | Password hashing |
| **CSRF Protection** | Protection against cross-site request forgery |
| **Zod** | Input/request validation |

### Security Flow

```text
User
 │
 ▼
React Frontend
 │
 ▼
Express API
 │
 ├── CSRF Validation
 │
 ├── JWT Authentication
 │
 ├── Authorization
 │
 └── Zod Validation
 │
 ▼
Application Services
 │
 ▼
Prisma ORM
 │
 ▼
PostgreSQL
```

Passwords are never stored as plaintext. They are securely hashed using **Argon2**.

Authentication tokens are handled through secure cookies rather than exposing sensitive tokens directly to client-side JavaScript.

---

# System Architecture

Dayflow follows a layered web application architecture.

```text
┌──────────────────────────────────────────────────────┐
│                  REACT FRONTEND                      │
│                                                      │
│ Pages • Components • Routes • Hooks • Services      │
└──────────────────────────┬───────────────────────────┘
                           │
                      REST / HTTP
                           │
┌──────────────────────────▼───────────────────────────┐
│                 EXPRESS BACKEND                      │
│                                                      │
│ Routes → Controllers → Services → Validation         │
│                         │                            │
│              Authentication / Security               │
└──────────────────────────┬───────────────────────────┘
                           │
                      Prisma ORM
                           │
┌──────────────────────────▼───────────────────────────┐
│                    PostgreSQL                        │
│                                                      │
│ Users • Employees • Attendance • Leave • Payroll    │
│ Notifications • Reports                             │
└──────────────────────────────────────────────────────┘
```

---

# Project Structure

The project is organized into separate frontend and backend applications.

```text
dayflow/
│
├── client/
│   ├── public/
│   │   └── ...
│   │
│   ├── src/
│   │   ├── assets/
│   │   │   └── ...
│   │   │
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── forms/
│   │   │   ├── dashboard/
│   │   │   └── ...
│   │   │
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── employee/
│   │   │   ├── attendance/
│   │   │   ├── leave/
│   │   │   ├── payroll/
│   │   │   ├── analytics/
│   │   │   └── ...
│   │   │
│   │   ├── layouts/
│   │   │   ├── EmployeeLayout.jsx
│   │   │   ├── AdminLayout.jsx
│   │   │   └── ...
│   │   │
│   │   ├── routes/
│   │   │   └── ...
│   │   │
│   │   ├── hooks/
│   │   │   └── ...
│   │   │
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── auth.js
│   │   │   ├── employee.js
│   │   │   ├── attendance.js
│   │   │   ├── leave.js
│   │   │   └── payroll.js
│   │   │
│   │   ├── context/
│   │   │   └── ...
│   │   │
│   │   ├── utils/
│   │   │   └── ...
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── ...
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── ...
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── employee.controller.js
│   │   │   ├── attendance.controller.js
│   │   │   ├── leave.controller.js
│   │   │   ├── payroll.controller.js
│   │   │   └── ...
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── employee.routes.js
│   │   │   ├── attendance.routes.js
│   │   │   ├── leave.routes.js
│   │   │   ├── payroll.routes.js
│   │   │   └── ...
│   │   │
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   ├── employee.service.js
│   │   │   ├── attendance.service.js
│   │   │   ├── leave.service.js
│   │   │   ├── payroll.service.js
│   │   │   └── ...
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── csrf.middleware.js
│   │   │   ├── validation.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   └── ...
│   │   │
│   │   ├── validators/
│   │   │   ├── auth.schema.js
│   │   │   ├── employee.schema.js
│   │   │   ├── attendance.schema.js
│   │   │   ├── leave.schema.js
│   │   │   └── payroll.schema.js
│   │   │
│   │   ├── utils/
│   │   │   ├── jwt.js
│   │   │   ├── password.js
│   │   │   └── ...
│   │   │
│   │   ├── lib/
│   │   │   └── prisma.js
│   │   │
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   │   └── ...
│   │   └── seed.js
│   │
│   ├── package.json
│   └── ...
│
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── ...
```

> The structure above represents the intended architecture. Existing repository conventions should be preserved when they differ from this reference structure.

---

# Backend Layer Responsibilities

## Routes

Define API endpoints and map requests to controllers.

```text
/auth
/employees
/attendance
/leave
/payroll
/notifications
/analytics
```

## Controllers

Controllers handle:

- HTTP requests
- Request/response formatting
- Calling application services

Controllers should avoid containing large amounts of business logic.

## Services

Services contain the primary business logic for:

- Authentication
- Employee management
- Attendance
- Leave
- Payroll
- Notifications
- Analytics

## Validators

Zod schemas validate incoming data before it reaches business logic.

Example:

```text
Request
   ↓
Zod Validation
   ↓
Controller
   ↓
Service
   ↓
Prisma
```

## Middleware

Middleware handles cross-cutting concerns such as:

- Authentication
- Authorization
- CSRF protection
- Validation
- Error handling

---

# Database

PostgreSQL is the primary database and Prisma ORM provides the application data layer.

Core entities include:

```text
User
Employee
Attendance
LeaveRequest
LeaveBalance
Payroll
Notification
Department
```

A simplified relationship model:

```text
User
 │
 └── Employee
       │
       ├── Attendance
       ├── LeaveRequest
       ├── LeaveBalance
       └── Payroll

Department
 │
 └── Employee

User
 │
 └── Notification
```

The exact Prisma schema should be treated as the source of truth for the implemented database model.

---

# Authentication Flow

Dayflow uses JWT authentication with secure cookies.

```text
                LOGIN
                  │
                  ▼
            Validate Input
                  │
                  ▼
          Find User in Database
                  │
                  ▼
       Verify Argon2 Password Hash
                  │
                  ▼
             Create JWT
                  │
                  ▼
      Set Secure HTTP-only Cookie
                  │
                  ▼
          Authenticated Session
```

For protected requests:

```text
Client Request
      │
      ▼
CSRF Validation
      │
      ▼
Read Authentication Cookie
      │
      ▼
Verify JWT
      │
      ▼
Check User Role / Permissions
      │
      ▼
Controller
      │
      ▼
Service
      │
      ▼
Prisma
```

---

# API Design

The backend follows a REST-oriented API structure.

Example endpoint groups:

```text
/api/auth
/api/employees
/api/attendance
/api/leave
/api/payroll
/api/notifications
/api/analytics
```

Typical operations include:

```text
GET     → Retrieve resources
POST    → Create resources
PUT     → Update resources
PATCH   → Partially update resources
DELETE  → Remove resources
```

API responses should use consistent HTTP status codes and structured error responses.

---

# Security Principles

Dayflow treats security as a core part of the application architecture.

### Password Security

Passwords are hashed with:

```text
Argon2
```

Plaintext passwords are never stored.

### Authentication

Authentication uses:

```text
JWT
+
HTTP-only Cookies
```

### CSRF Protection

State-changing requests are protected against cross-site request forgery.

### Input Validation

All externally supplied data should be validated using:

```text
Zod
```

### Authorization

Authentication alone is not sufficient.

The backend verifies:

```text
Authenticated User
        ↓
User Role
        ↓
Resource Ownership
        ↓
Requested Action
```

This prevents employees from accessing or modifying other employees' private records.

---

# User Roles & Permissions

## Employee

```text
Profile
   ├── View own profile
   └── Edit permitted fields

Attendance
   ├── Check in/out
   └── View own attendance

Leave
   ├── Apply
   └── View own requests

Payroll
   └── View own salary

Notifications
   └── View own notifications
```

## HR / Admin

```text
Employees
   ├── View
   ├── Search
   └── Manage

Attendance
   └── Organization-wide access

Leave
   ├── View requests
   ├── Approve
   ├── Reject
   └── Comment

Payroll
   ├── View
   └── Manage salary structure

Analytics
   └── Organization-wide insights
```

---

# Core User Workflows

## Employee Attendance

```text
Employee Login
      ↓
Dashboard
      ↓
Check In
      ↓
Working
      ↓
Check Out
      ↓
Attendance Record
```

## Leave Request

```text
Employee
      ↓
Select Leave Type
      ↓
Select Date Range
      ↓
Add Remarks
      ↓
Submit
      ↓
Pending
      ↓
HR Review
      ↓
Approved / Rejected
      ↓
Employee Notification
```

## Payroll

```text
Salary Structure
      ↓
Basic Salary
      +
Allowances
      -
Deductions
      ↓
Net Salary
      ↓
Employee Payroll
      ↓
Salary Slip
```

---

# Setup

## Prerequisites

Make sure the development environment has:

- Node.js
- npm
- PostgreSQL
- Git

## Clone the Repository

```bash
git clone <repository-url>
cd dayflow
```

## Install Dependencies

Install frontend dependencies:

```bash
cd client
npm install
```

Install backend dependencies:

```bash
cd ../server
npm install
```

## Environment Variables

Create environment files based on `.env.example`.

Typical backend configuration may include:

```env
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
COOKIE_SECRET=
CSRF_SECRET=
CLIENT_URL=
PORT=
```

Never commit real credentials or secrets.

## Database Setup

From the server directory:

```bash
npx prisma generate
npx prisma migrate dev
```

If seed data is provided:

```bash
npx prisma db seed
```

## Start Backend

```bash
cd server
npm run dev
```

## Start Frontend

In another terminal:

```bash
cd client
npm run dev
```

The exact commands may differ depending on the package scripts configured in the repository.

---

# Development Guidelines

### Keep Frontend and Backend Responsibilities Clear

Frontend:

```text
UI
Routing
User Interaction
Client State
API Consumption
```

Backend:

```text
Authentication
Authorization
Validation
Business Logic
Database Operations
Security
```

### Keep Business Logic on the Server

Critical operations such as:

- Leave approval
- Payroll modification
- Attendance modification
- Role checks
- Resource ownership

must be validated server-side.

### Use Prisma for Database Access

Avoid writing raw SQL for normal application operations unless there is a clear technical reason.

### Validate External Input

All request bodies, query parameters, and relevant route parameters should be validated with Zod.

### Protect Sensitive Data

Do not expose:

- Password hashes
- JWT secrets
- Database credentials
- Private tokens
- Internal security configuration

---

# Future Enhancements

Potential future improvements include:

- 🤖 AI-powered HR assistant
- 📱 QR-based attendance
- 📈 Advanced workforce analytics
- 📧 Automated email notifications
- 🧮 Advanced payroll calculations
- 👥 Employee performance management
- 📱 Mobile-first employee experience
- 📄 Advanced document management
- 🔮 Workforce forecasting
- ⚙️ Advanced HR automation

---

# Project Vision

Dayflow aims to bring essential HR workflows into one centralized platform.

Instead of managing employee information, attendance, leave, payroll, approvals, notifications, and reports through disconnected processes, Dayflow provides a unified experience for employees and HR teams.

> **Dayflow — Every workday, perfectly aligned.**
