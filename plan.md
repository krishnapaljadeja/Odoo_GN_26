# AssetFlow — Enterprise Asset & Resource Management System
## Full Implementation Plan (Frontend + Backend) for AI IDE

> **How to use this file:** Feed this entire document to the AI IDE as the master spec. Build in the order given in the "Build Order / Milestones" section at the bottom. Every screen in the Excalidraw mockup is covered here — the app must have **everything in the mockup, and may have more, never less**.

---

## 0. Project Summary

AssetFlow is a centralized ERP-style platform for organizations to track, allocate, and maintain physical assets and shared resources. Core capabilities:

1. Organization setup: departments, asset categories, employee directory (Admin only)
2. Asset registration + full lifecycle tracking (Available, Allocated, Reserved, Under Maintenance, Lost, Retired, Disposed)
3. Asset allocation with **double-allocation blocking** + transfer request workflow
4. Shared resource booking by time slot with **overlap validation**
5. Maintenance requests routed through an **approval workflow** (Kanban board UI)
6. Structured **audit cycles** with auditors + auto-generated discrepancy reports
7. Reports & analytics (utilization, maintenance frequency, idle assets, booking heatmap)
8. Notifications + full activity/audit logs
9. KPI dashboard with overdue-return flagging
10. Role-based access: Admin, Asset Manager, Department Head, Employee — **signup creates Employee only; roles are promoted by Admin from the Employee Directory (no self-assigned admin)**

**Explicitly out of scope:** purchasing, invoicing, accounting. (Acquisition Cost is stored only for ranking/reports.)

---

## 1. Tech Stack (already scaffolded — reuse, don't rebuild)

The repo is a **PERN + Prisma starter** with `client/` (React 18 + Vite) and `server/` (Express + Prisma + PostgreSQL). Reuse everything below; do not re-create auth, layout, form, or API plumbing from scratch.

**Frontend (exists):** React 18, Vite, React Router v5, Redux Toolkit + Redux Persist, Axios (`client/src/lib/api.js` helper — always use this, never raw axios), React Hook Form + Zod + `@hookform/resolvers/zod`, Tailwind CSS, shadcn-style components (`client/src/components/ui`, alias `@/*` → `client/src/*`), Sonner toasts, Lucide icons, GSAP (centralized in `client/src/lib/gsap.js`), `SmoothScroll` + `Reveal` animation wrappers, Vercel Analytics.

**Backend (exists):** Node.js, Express, Prisma ORM, PostgreSQL, JWT auth via HTTP-only cookies, bcryptjs, Nodemailer (OTP support + dev console fallback), CORS via `CLIENT_URL`, route/controller/service/validator scaffolding templates.

**Existing reusable pieces to build on:**
- Auth endpoints: `POST /auth/signup`, `POST /auth/login`, `DELETE /auth/logout`, `GET /auth/me` (+ `/api/auth/*` aliases)
- Templates to copy for every new module:
  - FE route: `client/src/app/routes/_template/index.jsx`
  - FE feature API: `client/src/features/example/api.js`
  - BE: `server/src/routes/_template/index.js`, `controllers/templateController.js`, `services/templateService.js`, `validators/templateValidator.js`
- Layout: `AppShell`, `DashboardLayout`, `PageHeader` (`client/src/app/components/layout`)
- Data-state: `DataState`, `EmptyState`, `StatCard` (`client/src/app/components/data`)
- Forms: `FormField`, `FormSection` (`client/src/app/components/forms`)
- UI: `Button`, `Input`, `Card`, `Loader`, `Toaster`, background wrappers
- Health: `GET /health`, `GET /api/status`

**Add-on libraries to install (client):**
- `@tanstack/react-table` (or headless table logic) — sortable/filterable tables everywhere
- `recharts` — Reports & Analytics charts (bar, line, heatmap-style grid)
- `date-fns` — date math for bookings, overdue detection, calendar view
- shadcn components as needed: `dialog`, `select`, `tabs`, `badge`, `table`, `dropdown-menu`, `popover`, `calendar`, `textarea`, `avatar`, `tooltip`, `skeleton`, `alert`, `separator`, `switch` (copy-paste into `client/src/components/ui`)
- Optional polish: 21st.dev components for hero/landing/login card if time permits (must remain Tailwind/shadcn compatible)

**Add-on (server):** `multer` (photo/document upload for assets + maintenance requests; store in `/uploads` static dir with file-type + size validation) — or accept base64/URL if time is short. `dayjs`/`date-fns` for overlap math.

---

## 2. Changes to Existing Setup

1. **Extend the `User` model** (do not replace auth) with: `role` enum (default `EMPLOYEE`), `departmentId` (nullable FK), `status` (ACTIVE/INACTIVE), `name` fields. Keep existing signup flow — it must **always create role = EMPLOYEE**; there must be **no role field in the signup form or signup API payload** (server ignores/rejects it even if sent).
2. **Add role middleware** in `server/src/middleware`: `requireAuth` (exists or extend), plus `requireRole(...roles)` — e.g. `requireRole('ADMIN')` for Organization Setup routes.
3. **Keep OTP signup support** as-is (optional email verification path); primary flow is direct signup per mockup ("Sign up creates an employee account, admin roles assigned later" — this exact hint text appears on the login screen).
4. **Redux state:** extend the persisted auth slice with `role` and `departmentId`; add slices (or RTK Query/feature hooks) for notifications unread count.
5. **Routing:** app uses React Router v5 — build a `ProtectedRoute` (exists) plus `RoleRoute` wrapper that redirects unauthorized roles to Dashboard with a Sonner toast.
6. **Seed script** (`server/prisma/seed.js`): 1 Admin (`admin@assetflow.test` / known password), 1 Asset Manager, 2 Department Heads, ~6 Employees, 3–4 departments (Engineering, Facilities, Field Ops (east) with parent Field Ops — matches mockup), categories (Electronics, Furniture, Vehicles), ~15 assets incl. AF-0114 Dell Laptop allocated to Priya Shah, AF-0062 Projector under maintenance, AF-0201 Office chair available in Warehouse, a bookable Conference Room B2 with a 9:00–10:00 booking, pending transfers, an open audit cycle, sample notifications. **Seeding matters for demo parity with the mockup.**

---

## 3. Roles & Permission Matrix

| Capability | Admin | Asset Manager | Dept Head | Employee |
|---|---|---|---|---|
| Organization Setup (departments, categories, directory, role promotion) | ✅ (only) | ❌ | ❌ | ❌ |
| Register assets | ✅ | ✅ | ❌ | ❌ |
| Allocate assets | ✅ | ✅ | ❌ | ❌ |
| Approve transfers | ✅ | ✅ | ✅ (own dept) | ❌ |
| Approve/reject maintenance, assign technician | ✅ | ✅ | ❌ | ❌ |
| Approve returns + condition check-in | ✅ | ✅ | ❌ | ❌ |
| Raise maintenance request | ✅ | ✅ | ✅ | ✅ |
| Book shared resources | ✅ | ✅ | ✅ (for dept) | ✅ |
| Initiate return/transfer request | ✅ | ✅ | ✅ | ✅ (own assets) |
| Create/close audit cycles, assign auditors | ✅ | ✅ (assist) | ❌ | ❌ |
| Act as auditor (mark Verified/Missing/Damaged) | if assigned | if assigned | if assigned | if assigned |
| View org-wide analytics | ✅ | ✅ | dept-scoped | own-scoped |
| View assets allocated to dept | ✅ | ✅ | ✅ | ❌ |
| View own allocated assets | ✅ | ✅ | ✅ | ✅ |

Enforce **on both FE (hide/disable UI) and BE (middleware — the source of truth)**.

---

## 4. Prisma Schema (server/prisma/schema.prisma)

Keep existing `User` + `SignupOtp`; extend `User`, add everything else. Run `npm run prisma:migrate -- --name assetflow_core`.

```prisma
enum Role {
  ADMIN
  ASSET_MANAGER
  DEPARTMENT_HEAD
  EMPLOYEE
}

enum UserStatus {
  ACTIVE
  INACTIVE
}

enum AssetStatus {
  AVAILABLE
  ALLOCATED
  RESERVED
  UNDER_MAINTENANCE
  LOST
  RETIRED
  DISPOSED
}

enum AssetCondition {
  NEW
  GOOD
  FAIR
  POOR
  DAMAGED
}

enum AllocationStatus {
  ACTIVE
  RETURN_REQUESTED
  RETURNED
  OVERDUE // derived, but stored flag updated by job/check is OK too
}

enum TransferStatus {
  REQUESTED
  APPROVED
  REJECTED
  COMPLETED
}

enum BookingStatus {
  UPCOMING
  ONGOING
  COMPLETED
  CANCELLED
}

enum MaintenanceStatus {
  PENDING
  APPROVED
  REJECTED
  TECHNICIAN_ASSIGNED
  IN_PROGRESS
  RESOLVED
}

enum MaintenancePriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum AuditCycleStatus {
  OPEN
  CLOSED
}

enum AuditItemResult {
  PENDING
  VERIFIED
  MISSING
  DAMAGED
}

model User {
  id           Int        @id @default(autoincrement())
  email        String     @unique
  username     String     @unique
  password     String
  name         String?
  role         Role       @default(EMPLOYEE)
  status       UserStatus @default(ACTIVE)
  departmentId Int?
  department   Department? @relation(fields: [departmentId], references: [id])
  headOf       Department[] @relation("DepartmentHead")
  allocations  Allocation[]
  bookings     Booking[]
  maintenanceRequests MaintenanceRequest[] @relation("Requester")
  technicianFor       MaintenanceRequest[] @relation("Technician")
  auditAssignments    AuditAssignment[]
  notifications       Notification[]
  activityLogs        ActivityLog[]
  transfersRequested  TransferRequest[] @relation("TransferFrom")
  transfersReceived   TransferRequest[] @relation("TransferTo")
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

model Department {
  id        Int        @id @default(autoincrement())
  name      String     @unique
  headId    Int?
  head      User?      @relation("DepartmentHead", fields: [headId], references: [id])
  parentId  Int?
  parent    Department? @relation("DeptHierarchy", fields: [parentId], references: [id])
  children  Department[] @relation("DeptHierarchy")
  status    UserStatus @default(ACTIVE)
  users     User[]
  assets    Asset[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model AssetCategory {
  id           Int     @id @default(autoincrement())
  name         String  @unique
  description  String?
  customFields Json?   // e.g. { "warrantyMonths": 12 } for Electronics
  assets       Asset[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Asset {
  id              Int            @id @default(autoincrement())
  assetTag        String         @unique // auto-generated AF-0001 style
  name            String
  categoryId      Int
  category        AssetCategory  @relation(fields: [categoryId], references: [id])
  serialNumber    String?        @unique
  acquisitionDate DateTime?
  acquisitionCost Decimal?       // for ranking/reports ONLY — never accounting
  condition       AssetCondition @default(GOOD)
  status          AssetStatus    @default(AVAILABLE)
  location        String?
  departmentId    Int?
  department      Department?    @relation(fields: [departmentId], references: [id])
  isBookable      Boolean        @default(false) // "shared/bookable" flag
  photoUrl        String?
  documents       Json?          // array of file URLs
  allocations     Allocation[]
  bookings        Booking[]
  maintenance     MaintenanceRequest[]
  transferRequests TransferRequest[]
  auditItems      AuditItem[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([status])
  @@index([categoryId])
  @@index([departmentId])
}

model Allocation {
  id                 Int              @id @default(autoincrement())
  assetId            Int
  asset              Asset            @relation(fields: [assetId], references: [id])
  userId             Int?
  user               User?            @relation(fields: [userId], references: [id])
  departmentId       Int?             // allocation can target employee OR department
  expectedReturnDate DateTime?
  allocatedAt        DateTime         @default(now())
  returnedAt         DateTime?
  returnCondition    AssetCondition?
  checkInNotes       String?
  status             AllocationStatus @default(ACTIVE)

  @@index([assetId, status])
  @@index([userId])
}

model TransferRequest {
  id         Int            @id @default(autoincrement())
  assetId    Int
  asset      Asset          @relation(fields: [assetId], references: [id])
  fromUserId Int
  fromUser   User           @relation("TransferFrom", fields: [fromUserId], references: [id])
  toUserId   Int
  toUser     User           @relation("TransferTo", fields: [toUserId], references: [id])
  reason     String
  status     TransferStatus @default(REQUESTED)
  decidedById Int?
  decidedAt  DateTime?
  createdAt  DateTime       @default(now())
}

model Booking {
  id        Int           @id @default(autoincrement())
  assetId   Int           // must be an asset with isBookable = true
  asset     Asset         @relation(fields: [assetId], references: [id])
  userId    Int
  user      User          @relation(fields: [userId], references: [id])
  startTime DateTime
  endTime   DateTime
  purpose   String?
  status    BookingStatus @default(UPCOMING)
  createdAt DateTime      @default(now())

  @@index([assetId, startTime, endTime])
}

model MaintenanceRequest {
  id           Int                 @id @default(autoincrement())
  assetId      Int
  asset        Asset               @relation(fields: [assetId], references: [id])
  requesterId  Int
  requester    User                @relation("Requester", fields: [requesterId], references: [id])
  description  String
  priority     MaintenancePriority @default(MEDIUM)
  photoUrl     String?
  status       MaintenanceStatus   @default(PENDING)
  technicianId Int?
  technician   User?               @relation("Technician", fields: [technicianId], references: [id])
  technicianName String?           // allow external technician by name (mockup: "tech: R varma")
  rejectionReason String?
  resolvedAt   DateTime?
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt

  @@index([status])
}

model AuditCycle {
  id          Int              @id @default(autoincrement())
  title       String           // e.g. "Q3 audit: Engineering dept"
  scopeDeptId Int?
  scopeLocation String?
  startDate   DateTime
  endDate     DateTime
  status      AuditCycleStatus @default(OPEN)
  assignments AuditAssignment[]
  items       AuditItem[]
  closedAt    DateTime?
  createdAt   DateTime         @default(now())
}

model AuditAssignment {
  id        Int        @id @default(autoincrement())
  cycleId   Int
  cycle     AuditCycle @relation(fields: [cycleId], references: [id])
  auditorId Int
  auditor   User       @relation(fields: [auditorId], references: [id])

  @@unique([cycleId, auditorId])
}

model AuditItem {
  id               Int             @id @default(autoincrement())
  cycleId          Int
  cycle            AuditCycle      @relation(fields: [cycleId], references: [id])
  assetId          Int
  asset            Asset           @relation(fields: [assetId], references: [id])
  expectedLocation String?
  result           AuditItemResult @default(PENDING)
  notes            String?
  verifiedById     Int?
  verifiedAt       DateTime?

  @@unique([cycleId, assetId])
}

model Notification {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  type      String   // ASSET_ASSIGNED, MAINTENANCE_APPROVED, MAINTENANCE_REJECTED, BOOKING_CONFIRMED, BOOKING_CANCELLED, BOOKING_REMINDER, TRANSFER_APPROVED, OVERDUE_RETURN, AUDIT_DISCREPANCY
  title     String
  body      String?
  isRead    Boolean  @default(false)
  meta      Json?
  createdAt DateTime @default(now())

  @@index([userId, isRead])
}

model ActivityLog {
  id        Int      @id @default(autoincrement())
  actorId   Int?
  actor     User?    @relation(fields: [actorId], references: [id])
  action    String   // e.g. ASSET_REGISTERED, ALLOCATED, TRANSFER_APPROVED...
  entity    String   // Asset, Booking, MaintenanceRequest, AuditCycle...
  entityId  Int?
  details   Json?
  createdAt DateTime @default(now())

  @@index([entity, entityId])
}
```

---

## 5. Backend API Design

Follow the existing pattern for **every** module: `routes/<module>/index.js` → `validators/<module>Validator.js` (Zod or express-validator, validate **before** controller) → `controllers/<module>Controller.js` → `services/<module>Service.js` (all Prisma + business rules live in services). All routes behind `requireAuth`; role checks per route via `requireRole`.

**Global conventions:**
- All list endpoints support: `?search=`, `?sortBy=`, `?sortOrder=asc|desc`, `?page=`, `?limit=` plus module-specific filters. Return `{ data, total, page, limit }`.
- Every state-changing service call writes an `ActivityLog` row and (where relevant) `Notification` rows inside the **same Prisma `$transaction`**.
- Consistent error shape: `{ error: { code, message, details? } }` with proper HTTP codes (400 validation, 401 auth, 403 role, 404 missing, 409 conflict).

### 5.1 Auth (extend existing)
- `POST /auth/signup` — email + username + password (+ name). **Server hard-codes role EMPLOYEE.** Reject any `role` in payload.
- `POST /auth/login`, `DELETE /auth/logout`, `GET /auth/me` (return role + department) — exist.
- `POST /auth/forgot-password` + `POST /auth/reset-password` — reuse Nodemailer/OTP infra (mockup has "Forgot password" link). Dev fallback: log token to console.

### 5.2 Organization Setup (`/api/org`) — ADMIN only
- `GET/POST /api/org/departments`, `PATCH /api/org/departments/:id`, `PATCH .../:id/status` (activate/deactivate — never hard delete; mockup shows Active/Inactive pills)
  - Fields: name (required, unique), headId (optional), parentId (optional, must not create a cycle), status
- `GET/POST/PATCH /api/org/categories` — name required + unique; optional `customFields` JSON (e.g. warranty for Electronics)
- `GET /api/org/employees` — directory with filters: department, role, status; search by name/email
- `PATCH /api/org/employees/:id/role` — **the ONLY place roles are assigned** (promote to DEPARTMENT_HEAD / ASSET_MANAGER, or demote). Cannot demote the last ADMIN.
- `PATCH /api/org/employees/:id` — department, status

### 5.3 Assets (`/api/assets`) — create/update: ADMIN + ASSET_MANAGER; read: all (scoped)
- `POST /api/assets` — name, categoryId, serialNumber?, acquisitionDate?, acquisitionCost?, condition, location?, departmentId?, isBookable, photo/docs. **Server auto-generates `assetTag`** `AF-` + zero-padded sequence (query max, or a Sequence table, inside a transaction to avoid dupes).
- `GET /api/assets` — filters: `status`, `categoryId`, `departmentId`, `location`, `isBookable`; search matches `assetTag | serialNumber | name` (this powers "Search by tag, serial, or QR code" — QR simply encodes the assetTag; scanning fills the search box). Sortable by tag, name, status, createdAt.
- `GET /api/assets/:id` — detail incl. **allocation history + maintenance history + booking history + audit results**
- `PATCH /api/assets/:id` — edit fields; direct status changes restricted to legal transitions (see 6.1). Mark LOST / RETIRED / DISPOSED here (with confirmation reason → ActivityLog).
- `GET /api/assets/:id/qr` — (nice-to-have) return QR PNG/SVG of assetTag using `qrcode` npm package.

### 5.4 Allocation & Transfer (`/api/allocations`, `/api/transfers`)
- `POST /api/allocations` (ADMIN/ASSET_MANAGER) — `{ assetId, userId? | departmentId?, expectedReturnDate? }`
  - **CONFLICT RULE (the core demo moment):** inside a transaction, check asset status. If already `ALLOCATED`, return **409** with body `{ error: { code: 'ALREADY_ALLOCATED', message: 'Already allocated to Priya Shah (Engineering). Direct re-allocation is blocked — submit a transfer request.', currentHolder: { id, name, department } } }`. FE renders the red banner from the mockup + shows the Transfer Request form.
  - Also block if `UNDER_MAINTENANCE`, `LOST`, `RETIRED`, `DISPOSED`. On success: asset → `ALLOCATED`, notification `ASSET_ASSIGNED` to holder, activity log.
- `POST /api/allocations/:id/return-request` (holder) and `POST /api/allocations/:id/return` (ADMIN/ASSET_MANAGER approves) — capture `returnCondition` + `checkInNotes`; asset → `AVAILABLE`; allocation status → `RETURNED`.
- `GET /api/allocations` — filters: status (active/returned/overdue), userId, departmentId, assetId. **Overdue = status ACTIVE && expectedReturnDate < now** (compute in query; also flagged on Dashboard + Notifications).
- `POST /api/transfers` — `{ assetId, toUserId, reason (required, min 10 chars) }`; fromUser inferred from current active allocation. Status `REQUESTED`.
- `PATCH /api/transfers/:id/approve` | `/reject` — ADMIN/ASSET_MANAGER, or DEPARTMENT_HEAD if both users in their dept. On approve (transaction): close old allocation (RETURNED), create new ACTIVE allocation, asset stays ALLOCATED, history updated automatically, notify both parties (`TRANSFER_APPROVED`).
- `GET /api/transfers` — filters: status, assetId, mine.

### 5.5 Resource Booking (`/api/bookings`)
- `GET /api/bookings/resources` — assets where `isBookable=true` (search + category filter)
- `GET /api/bookings?assetId=&date=` — bookings for the calendar view (day/week)
- `POST /api/bookings` — `{ assetId, startTime, endTime, purpose? }`
  - Validation: endTime > startTime, not in the past, duration ≤ configurable max (e.g. 8h), asset isBookable.
  - **OVERLAP RULE:** reject with **409** `{ code: 'SLOT_UNAVAILABLE' }` if any non-cancelled booking satisfies `existing.startTime < new.endTime && existing.endTime > new.startTime`. Back-to-back is allowed (10:00–11:00 after 9:00–10:00 is fine). Do the check inside a transaction/serializable query to avoid race double-booking.
  - Success → status UPCOMING + `BOOKING_CONFIRMED` notification.
- `PATCH /api/bookings/:id/cancel` (owner or ADMIN/ASSET_MANAGER) → CANCELLED + `BOOKING_CANCELLED` notification.
- `PATCH /api/bookings/:id/reschedule` — same overlap validation.
- Status derivation: a small helper (run on read, plus optional interval job) marks UPCOMING→ONGOING→COMPLETED based on now vs start/end. `BOOKING_REMINDER` notification generated for bookings starting within 30 min (interval job every minute is fine for a hackathon).

### 5.6 Maintenance (`/api/maintenance`)
- `POST /api/maintenance` (any role, typically the holder) — `{ assetId, description (min 10), priority, photoUrl? }` → PENDING
- `PATCH /api/maintenance/:id/approve` | `/reject` (ADMIN/ASSET_MANAGER) — reject requires `rejectionReason`. **On approve: asset status → UNDER_MAINTENANCE automatically** + notification.
- `PATCH /api/maintenance/:id/assign` — `{ technicianId? | technicianName }` → TECHNICIAN_ASSIGNED
- `PATCH /api/maintenance/:id/start` → IN_PROGRESS
- `PATCH /api/maintenance/:id/resolve` — `{ resolutionNotes? }` → RESOLVED. **Asset status auto-returns to AVAILABLE** (or back to ALLOCATED if it had an active allocation before maintenance — store previous status in `meta` or re-derive from active allocation) + notification.
- `GET /api/maintenance` — grouped by status for the Kanban board; filters: status, priority, assetId, requesterId. Enforce **legal transitions only**: PENDING→(APPROVED|REJECTED), APPROVED→TECHNICIAN_ASSIGNED, TECHNICIAN_ASSIGNED→IN_PROGRESS, IN_PROGRESS→RESOLVED.

### 5.7 Audit (`/api/audits`) — ADMIN (Asset Manager can assist)
- `POST /api/audits` — `{ title, scopeDeptId? | scopeLocation?, startDate, endDate, auditorIds[] }`. On create: snapshot all assets matching scope into `AuditItem` rows (expectedLocation from asset.location).
- `GET /api/audits` + `GET /api/audits/:id` — cycle detail: checklist of items with per-asset Verified/Missing/Damaged status.
- `PATCH /api/audits/:id/items/:itemId` — **only assigned auditors** (or Admin) mark result + notes.
- `GET /api/audits/:id/discrepancies` — **auto-generated discrepancy report**: all MISSING/DAMAGED items with asset, expected location, auditor, notes. Also fire `AUDIT_DISCREPANCY` notifications to Admin + Asset Managers when an item is flagged.
- `PATCH /api/audits/:id/close` — locks the cycle (no further item edits), and **updates asset statuses**: confirmed MISSING → `LOST`; DAMAGED → condition `DAMAGED` (+ optional auto maintenance request). Audit history retained per cycle.

### 5.8 Reports (`/api/reports`) — role-scoped
- `GET /api/reports/kpis` — dashboard numbers: available, allocated, underMaintenance/maintenanceToday, activeBookings, pendingTransfers, upcomingReturns (next 7 days), **overdueReturns** (separate!)
- `GET /api/reports/utilization?groupBy=department|category` — allocated vs total per group (bar chart)
- `GET /api/reports/maintenance-frequency?range=` — counts per month per asset/category (line chart)
- `GET /api/reports/most-used` — top bookable resources by booking count + top assets by allocation count; `GET /api/reports/idle` — assets with no allocation/booking in N days (mockup: "unused 60+ days")
- `GET /api/reports/due-soon` — maintenance due / nearing retirement (rule: age ≥ configurable years by category, or condition POOR)
- `GET /api/reports/booking-heatmap` — bookings bucketed by weekday × hour (peak usage windows)
- `GET /api/reports/allocation-summary?by=department`
- `GET /api/reports/export?type=...&format=csv` — CSV export (json2csv). Every report screen has an **Export report** button (mockup).

### 5.9 Notifications & Activity Logs (`/api/notifications`, `/api/logs`)
- `GET /api/notifications` — own notifications; filters/tabs: `type` group (All | Alerts | Approvals | Bookings — as in mockup), `isRead`; `GET /api/notifications/unread-count` (badge in sidebar/topbar)
- `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`
- `GET /api/logs` (ADMIN/ASSET_MANAGER; dept heads dept-scoped) — full audit log with filters: actor, entity, action, date range; searchable, sortable, paginated.
- Overdue detection: a lightweight `setInterval` job (every 15 min) or on-dashboard-load check that flags ACTIVE allocations past expectedReturnDate → creates one `OVERDUE_RETURN` notification per allocation (dedupe via meta).

---

## 6. Core Business Rules (must be demonstrably correct)

### 6.1 Asset lifecycle state machine (enforce in `assetService`)
```
AVAILABLE ↔ UNDER_MAINTENANCE      (approve request / resolve)
AVAILABLE → ALLOCATED               (allocation)
ALLOCATED → AVAILABLE               (return approved)
ALLOCATED → ALLOCATED               (transfer: holder changes, status stays)
AVAILABLE → RESERVED → ALLOCATED/AVAILABLE   (optional reservation flow)
ALLOCATED/UNDER_MAINTENANCE → via audit close → LOST
ANY (non-disposed) → RETIRED → DISPOSED     (terminal)
LOST → AVAILABLE (found — admin override, logged)
```
Reject illegal transitions with 409 + clear message. All transitions logged.

### 6.2 Double-allocation block (mockup Screen 5 — demo this exactly)
Selecting an already-allocated asset (e.g. AF-0114 Dell laptop) must show a **red banner**: *"Already Allocated to Priya Shah (Engineering) — Direct re-allocation is blocked — submit a transfer request below"*, and render the Transfer Request form (From: current holder pre-filled + read-only; To: employee select; Reason: required textarea; Submit Request). Allocation history list below (mockup shows "Mar 12 – Allocated to Priya Shah…", "Jan 09 – Returned by Arjun Nair – condition: good").

### 6.3 Booking overlap (mockup Screen 6 — demo this exactly)
Day calendar for the selected resource showing existing bookings as blocks (e.g. "Booked – Procurement Team – 9 to 10"). Attempting 9:30–10:30 shows an inline **dashed red slot + "conflict – slot is unavailable"** message (from the 409). 10:00–11:00 succeeds. "Book a slot" button opens a dialog with time pickers.

### 6.4 Maintenance approval gate
Repair work cannot start (no technician assignment / in-progress) before approval; asset flips to UNDER_MAINTENANCE **only on approval**, back to AVAILABLE **only on resolution** (mockup footnote says exactly this).

### 6.5 Non-self-elevating signup
Signup UI has no role picker; helper text on the card: "Sign up creates an employee account — admin roles assigned later" (mockup). Role changes happen only in Organization Setup → Employee Directory.

---

## 7. Frontend — Screens (mirror the mockup 1:1, then enhance)

**Global shell:** After login, every screen uses `DashboardLayout` with a persistent **left sidebar** (exact order from mockup): Dashboard, Organization setup (Admin only), Assets, Allocation & Transfer, Resource Booking, Maintenance, Audit, Reports, Notifications. Active item highlighted (mockup shows a highlighted pill). Top: `PageHeader` with title + primary action. Add a notifications bell with unread badge and a user menu (name, role badge, logout). **Dark theme by default** to match the mockup's near-black aesthetic (Tailwind dark palette: zinc-950 background, subtle borders, green primary accents like the mockup's buttons/pills). Use `GridBackground`/`NoiseTextureBackground` on auth + dashboard, GSAP `Reveal` on cards, `SmoothScroll` on long pages, Sonner for every success/error.

Routes live under `client/src/app/routes/<feature>/index.jsx` (copy `_template`); API modules under `client/src/features/<feature>/api.js`; all forms = React Hook Form + Zod resolver; all lists = `DataState`/`EmptyState`/skeletons while loading.

### Screen 1 — Login / Signup (`/login`, `/signup`)
- Centered card with AF logo avatar (mockup), fields Email + Password, "Forgot password" link, divider "New here?", helper text "Sign up creates an employee account — admin roles assigned later", **Create Account** button → signup page (email, username, name, password, confirm password). No role selection anywhere.
- Forgot-password flow: email input → token/OTP → reset form.
- Validation (Zod, shared FE+BE): email format; username 3–30 alphanumeric+underscore; password min 8 with at least 1 letter + 1 number; confirm matches. Inline errors under fields; disable submit while pending; toast on error ("Invalid credentials", "Email already registered").

### Screen 2 — Dashboard (`/dashboard`)
- **KPI StatCards row(s):** Assets Available, Assets Allocated, Available (bookable resources free now), Active Bookings, Pending Transfers, Upcoming Returns, Maintenance Today. (Mockup shows Available 128, Allocated 76, Available 4, Active Bookings 9, Pending Transfers 3, Upcoming returns 12.)
- **Overdue banner (red):** "3 assets overdue for return — flagged for follow-up" → clicking navigates to Allocations filtered overdue. Overdue is visually separate from upcoming returns (problem statement requirement).
- **Quick actions:** `+ Register Asset` (role-gated), `Book Resource`, `Raise Request` — buttons exactly as mockup.
- **Recent Activity** feed (last ~8 ActivityLog entries): "Laptop AF-0114 – allocated to Priya Shah – IT dept", "Room B2 – booking confirmed – 2:00 to 3:00 PM", etc.
- Role-aware: Employee sees own assets/bookings KPIs; Dept Head sees dept-scoped; Admin/AM see org-wide.

### Screen 3 — Organization Setup (`/organization`) — Admin only, 3 tabs
- shadcn `Tabs`: **Departments | Categories | Employees** + contextual `+ Add` button (mockup shows tab pills + "+ Add").
- **Departments tab:** table — Department, Head, Parent Dept, Status (Active/Inactive pill exactly like mockup: Engineering/aditi rao/—/Active; Facilities/rohan mehta/—/Active; Field ops (east)/sana iqbal/Field Ops/Inactive). Row actions: edit, toggle status. Add/Edit dialog: name (required), head (select from employees), parent department (select, cycle-guard), status. *Mockup note to honor:* "Editing a department here also drives the picklist in Screens 4 & 5" — department dropdowns everywhere must fetch live from this data (only ACTIVE ones selectable).
- **Categories tab:** table (name, description, #assets); add/edit dialog with optional custom fields (e.g. warranty months for Electronics).
- **Employees tab:** table — Name, Email, Department, Role (badge), Status; **filters:** department, role, status; **search** by name/email; sortable columns. Row action: **Promote/Change role** dialog (Employee ⇄ Department Head ⇄ Asset Manager) + assign department + toggle active. This is the only role-assignment UI in the app.

### Screen 4 — Asset Registration & Directory (`/assets`, `/assets/:id`)
- Top bar: **search input "Search by tag, serial, or QR code…"** + filter dropdowns **Category | Status | Department** (exact mockup) + optional Location filter + **`+ Register Asset`** button (role-gated).
- Table: Tag, Name, Category, Status (colored badge per lifecycle state), Location (+ Department, Condition columns); mockup rows: AF-0012 Dell Laptop/Electronics/Allocated/bengaluru; AF-0062 Projector/Electronics/Maintenance/HQ floor 2; AF-0201 Office chair/Furniture/Available/Warehouse. **All columns sortable; server-side pagination.**
- Register dialog/page: Name*, Category* (from org setup), Serial Number (unique), Acquisition Date (date picker, not future), Acquisition Cost (positive number, 2dp — "used for reports only" helper), Condition, Location, Department, **"Shared / bookable resource" switch**, photo upload (jpg/png ≤ 5MB) + documents. Asset Tag shown as "auto-generated on save" and displayed after creation.
- Asset detail page: header (tag, name, status badge, QR code of tag), tabs/sections: Details, **Allocation history**, **Maintenance history**, Bookings (if bookable), Audit results. Admin/AM actions: Edit, Mark Lost/Retired/Disposed (confirm dialog with reason).

### Screen 5 — Allocation & Transfer (`/allocations`)
- Asset picker (searchable combobox). If asset AVAILABLE → allocation form: allocate to Employee **or** Department (radio/toggle), Expected Return Date (optional, must be future), submit → success toast + history updates.
- If asset ALLOCATED → **red conflict banner** (exact mockup copy pattern): "Already Allocated to {holder} ({dept}) — Direct re-allocation is blocked — submit a transfer request below" + **Transfer Request form**: From (pre-filled, read-only), To (Select Employee… combobox), Reason (required, min 10 chars), **Submit Request** (green button).
- Below: **Allocation history** timeline for the selected asset.
- Additional tabs/sections on this screen: **Pending Transfers** list (approve/reject for AM/Admin/Dept Head — with reason shown), **Active Allocations** table (holder, dept, allocated date, expected return, overdue badge in red; filters: department, overdue-only; sortable), **Returns**: mark return → dialog capturing condition + check-in notes (AM/Admin approve).

### Screen 6 — Resource Booking (`/bookings`)
- Resource selector (searchable, bookable assets only) + date picker (mockup header: "Conference room B2 – Tue, 7 Jul").
- **Day-view time grid (9:00–17:00 rows or full day):** existing bookings rendered as solid blocks ("Booked – Procurement Team – 9 to 10"); when the user picks a conflicting slot, render the **dashed red block + "Requested 9:30 to 10:30: conflict – slot is unavailable"** inline (mockup). Non-conflicting requests confirm with toast + calendar refresh.
- **Book a slot** button (green) → dialog: start time, end time (end > start, same-day, not past, 15-min steps), purpose. Zod-validated.
- **My bookings** list: status badges Upcoming/Ongoing/Completed/Cancelled; cancel + reschedule actions; filter by status/resource; sortable by time.

### Screen 7 — Maintenance (`/maintenance`) — Kanban board
- Columns exactly as mockup: **Pending | Approved | Technician assigned | In progress | Resolved** (+ Rejected accessible via filter/toggle).
- Cards: asset tag + name + issue summary (mockup cards: "AF-0062 Projector bulb not turning on", "AF-003 ac unit noisy compressor", "AF-0078 forklift tech: R varma", "AF-897 Printer Jam parts ordered", "AF-873 Chair repair resolved 7 Jul"), priority badge, requester, date. Resolved cards green-tinted (mockup).
- Card actions by role: Approve/Reject (with reason) → Assign technician (employee select or free-text name) → Start → Resolve (notes). Move via buttons on card detail dialog (drag-and-drop optional/nice-to-have — buttons are the reliable demo path).
- **Raise Request** button: asset select (assets visible to user), description (min 10), priority select, photo upload.
- Footer note behavior (mockup): *"Approving a card moves the asset to under maintenance, resolving returns it to available"* — reflect live in Assets table.
- Filters: priority, asset, requester; search.

### Screen 8 — Asset Audit (`/audits`, `/audits/:id`)
- Cycle list + **Create Audit Cycle** (Admin): title, scope (department and/or location), date range (end ≥ start), assign auditors (multi-select employees). Mockup header: "Q3 audit: Engineering dept – 1–15 Jul, Auditors: A. Rao, S. Iqbal".
- Cycle detail: **checklist table** — Asset, Expected location, Verification action per row with three-state control **Verified (green) / Missing (red) / Damaged (red-orange)** + notes (mockup rows: AF-003 Dell laptop/Desk E12/Verified; AF-9921 Office chair/Desk E14/Missing; AF-9838 Monitor/Desk E15/Damaged). Only assigned auditors can mark; others read-only.
- **Auto-generated discrepancy banner** (amber, mockup): "2 assets flagged — discrepancy report generated automatically" → links to discrepancy report view (table of flagged items, exportable CSV).
- **Close audit cycle** button (confirm dialog: lists status changes it will make — missing → Lost). Closed cycles locked + kept in history.

### Screen 9 — Reports & Analytics (`/reports`)
- Chart cards (recharts, mockup layout): **Utilization by department** (bar), **Maintenance frequency** (line).
- **Most used assets** list (mockup: "Room B2: 34 bookings this month; Van AF-343: 21 trips; Projector AF-335: 18 uses") and **Idle assets** list ("Camera AF-0301: unused 60+ days; chair AF-0410: unused 45 days").
- **Assets due for maintenance / nearing retirement** ("Forklift AF-0087: service due in 5 days; Laptop AF-0020: 4 years old — nearing retirement").
- Department-wise allocation summary table + **booking heatmap** (weekday × hour grid with intensity colors).
- Date-range + department filters at top; **Export report** button per section (CSV download).
- Role scoping: Dept Head sees dept-only; Employee gets a slim personal view or is hidden from heavy analytics.

### Screen 10 — Activity Logs & Notifications (`/notifications`)
- Filter tab pills exactly as mockup: **All | Alerts | Approvals | Bookings** + relative timestamps ("2m ago", "18m ago").
- Notification rows (mockup examples): "Laptop AF-0014 assigned to Priya Shah", "Maintenance request AF-0055 approved", "Booking confirmed: Room B2, 2:00 to 3:00 PM", "Transfer approved: AF-0033 to facilities dept", "Overdue return: AF-0021 was due 3 days ago" (red accent), "audit discrepancy flagged: AF-0088 damaged". Unread dot; click → mark read + deep-link to the relevant entity; "Mark all read".
- **Activity Log** tab/section (Admin/AM): full who-did-what-when table with filters (actor, entity, action, date range), search, sort, pagination.

---

## 8. Validation Rules (Zod schemas shared shape FE + BE)

| Field | Rule |
|---|---|
| Email | valid format, lowercase-normalized, unique on signup |
| Username | 3–30, `^[a-zA-Z0-9_]+$`, unique |
| Password | min 8, ≥1 letter, ≥1 number; confirm must match |
| Names (dept/category/asset/person) | 2–100 chars, trimmed, non-empty |
| Serial number | optional; 3–64 alphanumeric+dashes; unique |
| Asset tag | server-generated only — never accepted from client |
| Acquisition date | valid date, not in future |
| Acquisition cost | positive decimal, ≤ 2 dp, max 10^9 |
| Expected return date | future date |
| Booking start/end | ISO datetimes, end > start, start ≥ now, duration ≤ 8h, 15-min granularity |
| Maintenance description / transfer reason | min 10, max 1000 chars |
| Rejection reason / check-in notes | required on reject/return, max 500 |
| Priority / status / role / condition | enum whitelist only |
| File uploads | jpg/png/pdf, ≤ 5 MB, sanitized filename |
| IDs in params | positive integers; verify existence + ownership/role before acting |
| Pagination | page ≥ 1, limit 1–100 |

Every form: inline field errors, disabled submit while pending, Sonner toast on server error, optimistic-safe refetch on success. **Never trust FE validation alone — every rule re-checked in BE validators.**

---

## 9. Filters, Sort & UX Enhancements (apply everywhere)

- Every table: column sorting (asc/desc), server-side pagination, text search, `EmptyState` when no rows, skeleton loaders, count badge.
- Filter bars: Assets (category/status/department/location/bookable), Employees (dept/role/status), Allocations (status/dept/overdue), Transfers (status), Bookings (status/resource/date), Maintenance (priority/status/asset), Audits (status), Logs (actor/entity/action/date range), Notifications (type tabs/read state).
- Status → color system used consistently: Available=green, Allocated=blue, Reserved=purple, Under Maintenance=amber, Lost=red, Retired=zinc, Disposed=dark zinc; Overdue always red.
- Keyboard-friendly comboboxes for employee/asset pickers; debounced search (300 ms).
- Responsive: sidebar collapses to a sheet/drawer on mobile; tables become card lists under `md`.
- GSAP: subtle `Reveal` on dashboard cards + report charts, animated KPI count-up, smooth scroll on long pages; respect reduced motion (starter already does).
- Toasts for every mutation; confirm dialogs for destructive/irreversible actions (close audit, retire/dispose, cancel booking).

---

## 10. Build Order / Milestones (for the AI IDE)

1. **M1 — Schema & Auth extension:** Prisma models + migration + seed script; extend User with role/department; role middleware; FE auth pages polish (login/signup/forgot per mockup); `RoleRoute`.
2. **M2 — Organization Setup:** departments/categories/employees CRUD + role promotion (Admin tab UI). Everything else depends on this master data.
3. **M3 — Assets:** register + directory (search/filter/sort/pagination) + detail page + lifecycle guards + tag auto-generation.
4. **M4 — Allocation & Transfer:** allocate, conflict block + transfer workflow + returns + overdue flagging. (Core demo #1.)
5. **M5 — Resource Booking:** calendar day view + overlap validation + cancel/reschedule + statuses. (Core demo #2.)
6. **M6 — Maintenance Kanban:** full workflow + auto asset-status flips. (Core demo #3.)
7. **M7 — Audit cycles:** create/assign/checklist/discrepancy report/close. 
8. **M8 — Dashboard KPIs + Notifications + Activity logs:** wire counts, overdue banner, recent activity, notification triggers from all modules, reminder/overdue jobs.
9. **M9 — Reports & Analytics:** all charts/lists + CSV export.
10. **M10 — Polish:** dark theme pass to match mockup, GSAP animations, responsive audit, empty/error states, seed-data demo walkthrough (Priya/AF-0114 conflict, Room B2 9:30 conflict, projector maintenance flow, Q3 audit).

**Demo script to verify at the end (mirrors problem statement's Basic Workflow):** Admin sets up depts/categories/promotes roles → AM registers asset (enters as Available) → allocation to Priya → Raj's allocation attempt blocked → transfer request → approval → booking Room B2 overlap rejected, adjacent slot accepted → maintenance request approved (asset flips Under Maintenance) → resolved (back to Available) → return with condition notes → overdue flag appears → audit cycle finds a Missing item → discrepancy report → close cycle marks it Lost → all of it visible in Dashboard, Notifications, Logs, and Reports.

---

## 11. Env / Config additions

`server/.env` additions: `MAX_BOOKING_HOURS=8`, `UPLOAD_DIR=uploads`, `OVERDUE_CHECK_MINUTES=15`, `REMINDER_LEAD_MINUTES=30`, `ASSET_RETIREMENT_YEARS=4`.
No client env changes beyond existing `VITE_API_URL`.

## 12. Definition of Done (per module)

- BE: validator → controller → service pattern, role middleware, transactions for multi-step writes, ActivityLog + Notification writes, 409s for conflicts with actionable messages.
- FE: mockup parity (layout, copy, colors, badges), RHF+Zod validation, filters + sort + pagination, loading/empty/error states, toasts, role-gated UI.
- Nothing in the mockup missing; enhancements allowed on top.