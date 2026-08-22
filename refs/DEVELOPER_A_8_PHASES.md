# Developer A --- Dayflow HRMS \| Antigravity 8-Phase Implementation

## Agent Mission

You are **Developer A** for the Dayflow Human Resource Management
System.

Your responsibility is the **Employee + Attendance + Employee
Dashboard** domain.

You must implement the work in exactly **8 sequential phases**.

> **MANDATORY APPROVAL GATE:** After completing each phase, STOP. Do not
> begin the next phase until the user explicitly approves continuation
> with a response such as `approved`, `continue`, `proceed`, or
> equivalent.

Do not assume approval from silence.

------------------------------------------------------------------------

# 1. Branch and Ownership

Branch:

``` bash
dev/developer-a
```

Merge target:

``` text
main
```

Developer A owns:

-   Employee profile management
-   Employee management
-   Employee dashboard
-   Attendance
-   Attendance insights
-   Employee-side UI for these modules
-   Required permissions for A-owned data

Developer B owns separate modules:

-   Leave
-   Leave approval
-   Leave balance/calendar
-   Payroll
-   Salary slips
-   Analytics
-   Notifications
-   Optional AI

**Do not implement B's business logic.**

------------------------------------------------------------------------

# 2. Non-Negotiable Agent Rules

1.  Work only inside Developer A's scope.
2.  Inspect the existing repository before creating or changing
    architecture.
3.  Reuse existing Odoo models/components when appropriate.
4.  Do not duplicate Odoo's employee/user models unnecessarily.
5.  Do not rewrite unrelated code.
6.  Do not modify Developer B's modules.
7.  Avoid shared-file changes.
8.  Make each phase independently testable.
9.  Run appropriate tests/checks after every phase.
10. Fix errors introduced by the current phase before asking for
    approval.
11. At the end of each phase, provide:

-   What was implemented
-   Files changed
-   Tests/checks performed
-   Known limitations
-   Git commit hash
-   What the next phase will do

12. Then **STOP and wait for explicit user approval**.

------------------------------------------------------------------------

# 3. Eight-Phase Plan

## PHASE 1 --- Repository Audit + Module Foundation

### Objective

Understand the existing Odoo project and establish a clean foundation
for Developer A.

### Tasks

-   Inspect repository structure.
-   Identify Odoo version.
-   Identify existing custom addons.
-   Identify existing employee/user/authentication models.
-   Identify existing frontend/UI architecture.
-   Identify current security/access-control approach.
-   Identify existing shared components that can be reused.
-   Identify whether a Dayflow module already exists.
-   Create the Developer A addon/module boundary if needed.
-   Create/update manifest and module initialization.
-   Do not implement business features yet.

Recommended boundary:

``` text
dayflow_employee/
├── __init__.py
├── __manifest__.py
├── models/
├── views/
├── security/
├── data/
└── static/
```

### Deliverable

A clean installable module foundation with no unnecessary repository
restructuring.

### Validation

-   Module loads.
-   Odoo starts without errors.
-   No broken existing modules.
-   No B-owned files modified.

### Commit

``` text
chore(employee): initialize developer A module
```

### Approval Gate

After reporting results, STOP.

``` text
PHASE 1 COMPLETE — Waiting for user approval to begin Phase 2.
```

------------------------------------------------------------------------

## PHASE 2 --- Employee Profile + Employee Management

### Objective

Implement employee profile functionality and HR employee management.

### Employee Profile

Display:

-   Personal details
-   Job details
-   Salary information as a read-only reference if already available
-   Documents
-   Profile picture

Employee may edit only:

-   Address
-   Phone
-   Profile picture

### HR/Admin

HR/Admin can:

-   View employees
-   Search employees
-   Open employee details
-   Edit employee information
-   Filter by department/status where supported

### Data

Reuse existing Odoo employee/user structures where possible.

Suggested information:

``` text
employee_id
name
email
phone
address
profile_image
department
designation
joining_date
employment_status
user_id
```

Do not implement payroll logic.

### Validation

Test:

-   Employee profile access
-   Limited employee editing
-   HR full editing
-   Employee cannot edit restricted fields
-   HR can view employees
-   Access rules work server-side

### Commit

``` text
feat(employee): implement employee profile management
```

### Approval Gate

STOP and request explicit approval.

------------------------------------------------------------------------

## PHASE 3 --- Attendance Data Model + Employee Check-In/Check-Out

### Objective

Implement core attendance functionality.

### Attendance

Support:

-   Check-in
-   Check-out
-   Daily record
-   Worked hours
-   Attendance status

Statuses:

``` text
Present
Absent
Half-day
Leave
```

Suggested fields:

``` text
employee_id
check_in
check_out
date
status
worked_hours
remarks
```

### Rules

-   Prevent duplicate active check-in.
-   Prevent checkout without check-in.
-   Prevent duplicate checkout.
-   Calculate worked hours.
-   Employee can access only their own attendance.

### UI

Employee:

``` text
Today's Attendance
Check In
Check Out
Current status
Worked hours
```

### Validation

Test normal and invalid attendance flows.

### Commit

``` text
feat(attendance): implement check-in and check-out
```

### Approval Gate

STOP.

------------------------------------------------------------------------

## PHASE 4 --- Attendance History + Daily/Weekly Views

### Objective

Build complete attendance viewing.

### Employee

Provide:

-   Today
-   Daily history
-   Weekly view
-   Attendance history
-   Status
-   Check-in/check-out times
-   Worked hours

### HR/Admin

Provide:

-   All employee attendance
-   Employee filter
-   Date filter
-   Status filter
-   Daily/weekly overview

### Security

Employee must never retrieve another employee's records by manipulating
IDs/URLs.

### Validation

Test employee and HR access separately.

### Commit

``` text
feat(attendance): add attendance history and views
```

### Approval Gate

STOP.

------------------------------------------------------------------------

## PHASE 5 --- Employee Dashboard

### Objective

Create the employee home/dashboard experience.

### Dashboard

Include:

-   Welcome section
-   Today's attendance
-   Working hours
-   Attendance percentage/summary
-   Profile quick access
-   Recent activity
-   Attendance status
-   Leave summary placeholder/read-only integration only if B's data is
    already available

Do not implement leave or payroll logic.

### UX

Include:

-   Loading states
-   Empty states
-   Error states
-   Clear status badges
-   Responsive layout

Reuse the repository's existing design system.

### Validation

-   Dashboard loads for employee.
-   Cards display correct A-owned data.
-   No B-owned business logic is duplicated.

### Commit

``` text
feat(employee): add employee dashboard
```

### Approval Gate

STOP.

------------------------------------------------------------------------

## PHASE 6 --- Attendance Insights + Employee Search/Filters

### Objective

Add lightweight intelligent attendance insights and complete filtering.

### Attendance Insights

Rule-based only.

Detect:

-   Late check-ins
-   Missing checkout
-   Low attendance
-   Repeated absence
-   Repeated half-day

Example:

``` text
⚠ Rahul
3 late check-ins this week
```

No AI is required.

### Search/Filters

Employee management:

-   Name
-   Employee ID
-   Department
-   Status

Attendance:

-   Employee
-   Date
-   Status
-   Department where available

### Validation

Test deterministic rules with known attendance data.

### Commit

``` text
feat(attendance): add insights and filters
```

### Approval Gate

STOP.

------------------------------------------------------------------------

## PHASE 7 --- Security Hardening + Integration Readiness

### Objective

Make Developer A's implementation safe and ready to merge with Developer
B.

### Tasks

-   Review Odoo access control.
-   Review record rules.
-   Verify employee isolation.
-   Verify HR/Admin privileges.
-   Remove duplicated logic.
-   Check server-side authorization.
-   Test invalid IDs and unauthorized routes.
-   Check error handling.
-   Check database constraints.
-   Check UI loading/error states.
-   Verify B-owned modules were not modified.
-   Identify the minimum integration points needed by B.

### Integration Contract

Document read-only information B may consume:

``` text
employee_id
employee name
department
designation
attendance summary
attendance insights
```

Do not create unnecessary coupling.

### Validation

Run the full A-owned test flow.

### Commit

``` text
fix(employee): harden permissions and integration boundaries
```

### Approval Gate

STOP.

------------------------------------------------------------------------

## PHASE 8 --- Final QA + Demo Readiness

### Objective

Prepare Developer A's branch for final integration/demo.

### Full Test Checklist

-   [ ] Module installs
-   [ ] Module upgrades
-   [ ] Employee profile works
-   [ ] Employee limited editing works
-   [ ] HR employee management works
-   [ ] Employee check-in works
-   [ ] Employee check-out works
-   [ ] Duplicate check-in blocked
-   [ ] Invalid checkout blocked
-   [ ] Attendance history works
-   [ ] Daily view works
-   [ ] Weekly view works
-   [ ] Employee sees only own attendance
-   [ ] HR sees all attendance
-   [ ] Attendance insights work
-   [ ] Search/filter works
-   [ ] Employee dashboard works
-   [ ] Access rules work
-   [ ] No critical console/server errors
-   [ ] No B-owned business logic was introduced

### Final Cleanup

-   Remove dead code.
-   Remove debug logs.
-   Remove temporary test data unless intentionally required.
-   Check UI consistency.
-   Check responsive behavior.
-   Check commit history.
-   Ensure branch is ready to merge.

### Final Commit

``` text
chore(employee): complete phase 8 QA and demo readiness
```

### Final Output

Provide:

``` text
Developer A — COMPLETE

Branch:
dev/developer-a

Final commit:
<hash>

Implemented:
<summary>

Integration notes for Developer B:
<summary>

Known limitations:
<summary>
```

Then STOP.

------------------------------------------------------------------------

# 4. Git Discipline

Never work directly on `main`.

At the beginning:

``` bash
git checkout main
git pull origin main
git checkout dev/developer-a
```

Commit each completed phase.

Suggested sequence:

``` text
Phase 1 → chore(employee): initialize developer A module
Phase 2 → feat(employee): implement employee profile management
Phase 3 → feat(attendance): implement check-in and check-out
Phase 4 → feat(attendance): add attendance history and views
Phase 5 → feat(employee): add employee dashboard
Phase 6 → feat(attendance): add insights and filters
Phase 7 → fix(employee): harden permissions and integration boundaries
Phase 8 → chore(employee): complete phase 8 QA and demo readiness
```

Do not squash phases unless the user explicitly requests it.

------------------------------------------------------------------------

# 5. Approval Protocol --- CRITICAL

The agent must **not automatically continue**.

At the end of every phase:

``` text
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

Then stop execution.

Only continue when the user explicitly approves.

If the user gives feedback instead of approval:

1.  Fix the requested issue.
2.  Re-run validation.
3.  Report the fix.
4.  Ask for approval again.
5.  Do not move to the next phase.

If the user says "go back", "redo", or requests changes to the current
phase, remain in that phase until the user approves it.

------------------------------------------------------------------------

# 6. Final Scope Boundary

Developer A owns:

``` text
EMPLOYEE
├── Profile
├── Employee Management
├── Employee Dashboard
└── Attendance
    ├── Check-in/out
    ├── History
    ├── Daily/Weekly View
    └── Insights
```

Developer B owns:

``` text
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

Keep these boundaries intact throughout all 8 phases.
