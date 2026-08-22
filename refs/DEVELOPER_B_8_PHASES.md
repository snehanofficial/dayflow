# Developer B --- Dayflow HRMS \| Antigravity 8-Phase Implementation

## Agent Mission

You are **Developer B** for the Dayflow Human Resource Management
System.

Your responsibility is the **Leave + Payroll + HR Intelligence +
Notifications** domain.

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
dev/developer-b
```

Merge target:

``` text
main
```

Developer B owns:

-   Leave/time-off management
-   Leave approval workflow
-   Leave balance
-   Leave calendar
-   Payroll
-   Salary structure
-   Salary slips
-   HR analytics/reports
-   Notifications
-   Optional AI HR assistant

Developer A owns separate modules:

-   Employee/profile
-   Employee management
-   Attendance
-   Employee dashboard
-   Attendance insights

**Do not implement A's business logic.**

------------------------------------------------------------------------

# 2. Non-Negotiable Agent Rules

1.  Work only inside Developer B's scope.
2.  Inspect the existing repository before creating/changing
    architecture.
3.  Reuse existing Odoo models/components where appropriate.
4.  Do not duplicate Employee or Attendance models unnecessarily.
5.  Do not rewrite unrelated code.
6.  Do not modify Developer A's modules.
7.  Avoid shared-file changes.
8.  Make every phase independently testable.
9.  Run tests/checks after every phase.
10. Fix errors introduced by the current phase before requesting
    approval.
11. At the end of every phase provide:

-   What was implemented
-   Files changed
-   Tests/checks performed
-   Known limitations
-   Git commit hash
-   Next phase summary

12. Then **STOP and wait for explicit user approval**.

------------------------------------------------------------------------

# 3. Eight-Phase Plan

## PHASE 1 --- Repository Audit + Module Foundation

### Objective

Understand the Odoo repository and establish a clean Developer B module
boundary.

### Tasks

-   Inspect repository structure.
-   Identify Odoo version.
-   Identify existing custom addons.
-   Identify existing employee/user models.
-   Identify existing attendance model.
-   Identify existing payroll/leave functionality.
-   Identify security/access-control approach.
-   Identify shared UI components.
-   Create Developer B addon/module if needed.
-   Create/update manifest and initialization.
-   Do not implement full business logic yet.

Recommended boundary:

``` text
dayflow_hr/
├── __init__.py
├── __manifest__.py
├── models/
├── views/
├── security/
├── data/
└── static/
```

### Deliverable

Clean, installable module foundation.

### Validation

-   Odoo starts.
-   Module installs.
-   Existing modules remain functional.
-   No A-owned files modified.

### Commit

``` text
chore(hr): initialize developer B module
```

### Approval Gate

STOP.

------------------------------------------------------------------------

## PHASE 2 --- Leave Application + Leave Data Model

### Objective

Implement employee leave/time-off requests.

### Leave Types

``` text
Paid
Sick
Unpaid
```

### Leave Request

Fields:

``` text
employee_id
leave_type
start_date
end_date
number_of_days
remarks
status
hr_comment
created_at
```

Initial status:

``` text
Pending
```

### Employee Actions

-   Open leave page
-   Select leave type
-   Select date range
-   Add remarks
-   Submit request
-   View own leave history/status

### Validation

-   Start date cannot be after end date.
-   Number of days is calculated consistently.
-   Employee can only see own requests.
-   Unauthorized users cannot create requests for another employee.
-   Pending status is created correctly.

Do not implement complex balance rules until Phase 4.

### Commit

``` text
feat(leave): implement leave application
```

### Approval Gate

STOP.

------------------------------------------------------------------------

## PHASE 3 --- HR Leave Approval + Notifications

### Objective

Implement the complete leave approval workflow.

### HR Actions

-   View all leave requests
-   Filter requests
-   Open request details
-   Approve
-   Reject
-   Add comment

Workflow:

``` text
Pending
   ↓
 ┌───────────┐
 ↓           ↓
Approved   Rejected
```

### Employee

Employee sees updated status immediately.

### Notifications

Add basic in-app notifications for:

``` text
New leave request → HR
Leave approved → Employee
Leave rejected → Employee
```

Keep notification implementation inside B's module.

### Validation

-   HR can approve.
-   HR can reject.
-   Employee cannot approve/reject.
-   Employee sees updated state.
-   Notification is generated correctly.

### Commit

``` text
feat(leave): add approval workflow and notifications
```

### Approval Gate

STOP.

------------------------------------------------------------------------

## PHASE 4 --- Leave Balance + Leave Calendar

### Objective

Add practical leave management enhancements.

### Leave Balance

Support:

``` text
Paid Leave
Sick Leave
Unpaid Leave
```

Example:

``` text
Paid: 12 / 15 remaining
Sick: 7 / 10 remaining
```

Rules:

-   Pending requests do not reduce balance.
-   Approved requests reduce relevant balance.
-   Rejected requests do not reduce balance.
-   Prevent excessive leave where the business rule requires it.
-   Unpaid leave may follow a configurable rule.

### Leave Calendar

Display:

-   Employee
-   Leave type
-   Start/end dates
-   Status

Useful visual states:

``` text
Approved
Pending
Rejected
```

### Validation

Test overlapping requests and balance updates.

### Commit

``` text
feat(leave): add balance and calendar
```

### Approval Gate

STOP.

------------------------------------------------------------------------

## PHASE 5 --- Payroll + Salary Structure

### Objective

Implement employee and HR payroll functionality.

### Employee Payroll

Read-only display:

``` text
Basic Salary
Allowances
Deductions
Net Salary
```

Calculation:

``` text
Net Salary = Basic Salary + Allowances - Deductions
```

### HR/Admin Payroll

HR/Admin can:

-   View payroll for all employees
-   Update salary structure
-   View salary components
-   View net salary

### Security

Employee must not be able to edit payroll.

Server-side authorization is required.

### Validation

-   Salary calculation is correct.
-   Employee read-only restriction works.
-   HR/Admin can update salary.
-   Changes reflect in employee view.

### Commit

``` text
feat(payroll): implement salary structure and payroll
```

### Approval Gate

STOP.

------------------------------------------------------------------------

## PHASE 6 --- Salary Slip + Reports + HR Analytics

### Objective

Create useful HR reporting.

### Salary Slip

Generate:

``` text
Employee
Employee ID
Department
Designation
Month
Basic Salary
Allowances
Deductions
Net Salary
```

Provide print/download if practical.

### Reports

At minimum:

**Attendance summary**

``` text
Employee
Present
Absent
Leave
Half-day
Attendance %
```

**Leave report**

``` text
Employee
Leave Type
Approved
Rejected
Pending
Days
```

**Payroll report**

``` text
Employee
Basic
Allowances
Deductions
Net Salary
```

### HR Analytics

Cards:

``` text
Total Employees
Present Today
Absent Today
On Leave
Attendance %
Pending Leaves
Payroll Total
```

Charts where practical:

``` text
Attendance Trend
Leave Distribution
Department Distribution
Payroll Summary
```

Use existing A-owned attendance data rather than creating a duplicate
attendance model.

### Validation

-   Reports load.
-   Filters work.
-   Salary slip reflects payroll.
-   Analytics use correct source data.

### Commit

``` text
feat(analytics): add reports and HR analytics
```

### Approval Gate

STOP.

------------------------------------------------------------------------

## PHASE 7 --- Integration + Security Hardening

### Objective

Prepare B for clean integration with Developer A.

### Tasks

-   Verify leave permissions.
-   Verify payroll permissions.
-   Verify notification permissions.
-   Test employee isolation.
-   Test HR/Admin access.
-   Remove duplicated employee/attendance data structures.
-   Ensure B reads A-owned data rather than copying it.
-   Check unauthorized routes/IDs.
-   Check server-side authorization.
-   Check validation and error handling.
-   Check shared-file changes.
-   Document integration points.

### Integration Contract

B may consume stable A-owned information such as:

``` text
employee_id
employee name
department
designation
attendance summary
attendance insights
```

A should consume B-owned read-only summaries such as:

``` text
leave status
leave balance
upcoming leave
notification count
payroll summary
```

Do not tightly couple the modules.

### Validation

Test the B module independently and with the available A module/data.

### Commit

``` text
fix(hr): harden security and integration boundaries
```

### Approval Gate

STOP.

------------------------------------------------------------------------

## PHASE 8 --- Final QA + Demo Readiness

### Objective

Prepare Developer B's branch for final merge/demo.

### Full Test Checklist

-   [ ] Module installs
-   [ ] Module upgrades
-   [ ] Employee can apply leave
-   [ ] Leave types work
-   [ ] Leave date validation works
-   [ ] Pending status works
-   [ ] HR sees requests
-   [ ] HR can approve
-   [ ] HR can reject
-   [ ] HR comments work
-   [ ] Employee sees updated status
-   [ ] Notifications work
-   [ ] Leave balance works
-   [ ] Leave calendar works
-   [ ] Employee can view payroll
-   [ ] Employee cannot edit payroll
-   [ ] HR can edit salary structure
-   [ ] Net salary calculation works
-   [ ] Salary slip works
-   [ ] Reports work
-   [ ] Analytics work
-   [ ] Filters work
-   [ ] Security rules work
-   [ ] No critical errors
-   [ ] No A-owned business logic was introduced

### Final Cleanup

-   Remove dead/debug code.
-   Remove temporary logs.
-   Check UI consistency.
-   Check responsive behavior.
-   Verify module dependencies.
-   Verify integration boundaries.
-   Ensure branch is ready to merge.

### Final Commit

``` text
chore(hr): complete phase 8 QA and demo readiness
```

### Final Output

Provide:

``` text
Developer B — COMPLETE

Branch:
dev/developer-b

Final commit:
<hash>

Implemented:
<summary>

Integration notes for Developer A:
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
git checkout dev/developer-b
```

Suggested phase commits:

``` text
Phase 1 → chore(hr): initialize developer B module
Phase 2 → feat(leave): implement leave application
Phase 3 → feat(leave): add approval workflow and notifications
Phase 4 → feat(leave): add balance and calendar
Phase 5 → feat(payroll): implement salary structure and payroll
Phase 6 → feat(analytics): add reports and HR analytics
Phase 7 → fix(hr): harden security and integration boundaries
Phase 8 → chore(hr): complete phase 8 QA and demo readiness
```

Do not squash phases unless explicitly requested.

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
phase, remain in that phase until approved.

------------------------------------------------------------------------

# 6. Final Scope Boundary

Developer B owns:

``` text
HR
├── Leave
│   ├── Application
│   ├── Approval
│   ├── Balance
│   └── Calendar
├── Payroll
│   ├── Salary Structure
│   └── Salary Slip
├── Analytics
├── Reports
└── Notifications
```

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

Keep these boundaries intact throughout all 8 phases.
