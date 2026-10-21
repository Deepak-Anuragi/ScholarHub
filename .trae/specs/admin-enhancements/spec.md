# Admin Enhancements — Specification

## 1. Problem & Goals

Scholar'sHub admins need platform-level operations tools beyond the current basic overview (library verification, payouts, courses). Currently missing are the features that actually *operate* a marketplace: granular analytics (new registrations, top libraries), a structured dispute-resolution workflow between students and libraries, and a coupon/promo system to drive acquisition and re-engagement.

### Primary users

- **Admin** — logs in via ADMIN role; manages platform-wide operations. Admin routes are protected by `requireAdmin` middleware.
- **Student (indirect user)** — raises disputes and applies coupons at booking checkout. Continues using STUDENT role.

### Goals

1. **Platform Analytics Dashboard** — total revenue across libraries (already exists), new user-registrations weekly/monthly chart, city-wise library density chart, top-performing libraries leaderboard.
2. **Dispute Management** — students raise a complaint against a library (attached to a specific booking or generic); admin triages, can resolve and issue a refund (reusing existing refund-tiers calculator).
3. **Coupon / Promo Code System** — admin creates discount codes (percentage or flat rupee) with expiry date + usage cap; students apply a code at booking checkout; discount is applied to the payment amount and never drives it below ₹1.

### Non-goals

- Financial accounting beyond what `PayoutLedger` + `computeRefund()` already cover.
- Geospatial map-tiles or map-API rendering for density (recharts bar-chart substitute per existing framework constraints).
- Per-student coupon stacking — max **one** coupon per booking.
- Real Razorpay refund API integration — DB-side `paymentStatus: REFUNDED` + `status: CANCELLED` + returning `availableSeats` is the scope (matches existing `mock_order_` demo pattern; real refund calls are an environment-only upgrade later).

---

## 2. Functional Requirements

### 2.1 Platform Analytics Dashboard

**FR-PA-1 Total revenue across all libraries (carry-forward).**
Reused as-is from existing Admin Overview. Current surfaces: `/admin/stats → platformRevenue` (month-to-date) and `/admin/revenue` with 3 KPI cards + 12-month revenue `LineChart` on `/admin`. Covered so the audit & plan is complete.

**FR-PA-2 New registrations per week / per month chart.**
`/admin/stats` returns a new aggregations field: new students/users registered, bucketed both weekly and monthly over the last 8 weeks and 12 months respectively. Admin Overview page (`/admin`) renders a new BarChart card below the existing revenue line chart showing weekly new registrations.

**FR-PA-3 City-wise library density chart.**
Reuses existing `topCities` aggregation from `/admin/stats` (Top 10 libraries/city). Admin Overview carries on rendering the current vertical `BarChart` ("Top Cities by Library Count") as the MVP density view (no map library — per framework/stack constraints). **Coverage note:** no new data model needed; FR is satisfied by the existing recharts bar rendering which currently already exists.

**FR-PA-4 Top performing libraries.**
`/admin/stats` returns a new `topLibraries` field (top 5 by current-month `PayoutLedger.totalAmount` sum; includes library name, city, owner name, total revenue). Admin Overview page renders a "Top 5 Performing Libraries (This Month)" ranked card/list below the density row. The existing `/admin/libraries` react-table keeps sortable `monthlyRevenue` column as the detail drill-down.

### 2.2 Dispute Management

**FR-DM-1 Students raise a complaint against a library.**
New `Dispute` / Complaint collection. A student submits a dispute via a new form on `/student/bookings` ("Raise Complaint" / Report icon per booking card). Fields: `studentId`, `libraryId`, `bookingId` (optional — can be a general complaint too), `title`, `description`, `category` enum (PAYMENT, SEAT, BEHAVIOUR, HYGIENE, OTHER), `status` (OPEN, IN_PROGRESS, RESOLVED, DISMISSED), `createdAt`. Owner receives `Notification` type LIBRARY + socket push when a dispute is opened against their library.

**FR-DM-2 Admin resolves disputes and issues refunds.**
Admin list page `/admin/disputes` shows all disputes (filterable status / category), sorted newest first. Per-dispute actions:
- Change status (OPEN → IN_PROGRESS → RESOLVED | DISMISSED).
- Add a `resolutionNote` text.
- If applicable: **Issue Refund** action computes via existing `computeRefund(booking.amountPaid, booking.startDate, new Date())` then sets the booking to `{paymentStatus: "REFUNDED", status: "CANCELLED"}`, writes a `refundAmount` / `refundTier` / `refundDate` snapshot on the dispute; if booking.startDate > now, returns `availableSeats +1` to both slot (if any) and library documents. Student receives `Notification` type PAYMENT whenever a dispute is resolved/refunded.

### 2.3 Coupon / Promo Code System

**FR-CP-1 Create discount coupons (percentage or flat ₹ amount).**
New `Coupon` model: unique uppercase `code` string, `discountType` enum PERCENTAGE | FLAT, `discountValue` number (for PERCENTAGE: validated 1 ≤ x ≤ 100), `minPurchaseAmount?` number, `expiresAt` Date, `usageLimit` number (cap per coupon, default 1 — unlimited not allowed), `usedCount` number (starts at 0, incremented after a successful booking `confirm`). Admin CRUD: `GET /admin/coupons`, `POST /admin/coupons`, `PATCH /admin/coupons/:id`, `DELETE /admin/coupons/:id`. Admin page `/admin/coupons` shows list + Add Coupon Form modal, edit in place, delete.

**FR-CP-2 Set expiry date and usage limit.**
Expiry `expiresAt` and usage `usageLimit` are required fields on every coupon; validation rejects expired or depleted codes at apply time. Per-student limit default = 1 use per coupon per student (enforced via `Coupon.usedBy[]` array of `{userId, date}`).

**FR-CP-3 Apply coupon at booking checkout.**
- Student-facing: on the booking flow's "Review" step in `BookingModal.tsx`, add a coupon code input + Apply button. Apply calls `POST /coupons/validate` (public auth endpoint so only logged-in users can validate, via `requireAuth` — same as create-order).
- Validation response: `{ valid:boolean, discountAmount:number, newTotal:number, originalTotal:number, code?, error? }`.
- `POST /bookings/create-order` accepts an optional `promoCode` string. If provided, performs the same validation inline, computes discount, subtracts from the total computed in `baseTotal` so the razorpay order is minted with the discounted amount; additionally stores `couponId` as a new Booking model field so it can be reconciled at confirm-time.
- `POST /bookings/confirm` — after payment succeeds and the booking transitions SUCCESS, if the booking has a `couponId`, atomically increments `usedCount` and pushes the student's user-id/date to `usedBy[]` on that coupon document (guarded against double-counting because confirm is already idempotent via `paymentStatus: "PENDING"` filter in the findOneAndUpdate).

---

## 3. Non-functional Requirements

- **NFR-1 Performance.** Admin analytics aggregates must complete in < 2s on a dataset of 50k bookings / 10k users. Use `$match` to scope aggregations.
- **NFR-2 Safety.**
  - Coupon apply → total after discount is always ≥ ₹1 (same floor used for referral credits).
  - `usedCount` of a coupon NEVER exceeds `usageLimit` even under race conditions (atomic `findOneAndUpdate` filter `usedCount < usageLimit` → `$inc usedCount`).
  - Admin refund → only allowed if current `paymentStatus !== REFUNDED` already; booking status only transitions `ACTIVE → CANCELLED` once.
- **NFR-3 Integrity.** Double-spend prevention for coupons is done at confirm-time, not create-time (because create-order just reserves a tentative razorpay amount; only confirmed bookings should count against the cap).
- **NFR-4 Compatibility.** Existing flows (no coupon provided) must behave identically to today — no schema breaking changes; all new Booking and User fields are optional with defaults.
- **NFR-5 Accessibility.** New buttons carry descriptive `aria-label`s: Report a problem, Apply coupon, Toggle dispute status, Issue refund, etc. Keyboard-focusable controls.

---

## 4. Constraints, Dependencies, Assumptions, Open Questions

### Constraints

- Existing tech stack only. Recharts v3.x for charts (used everywhere admin); lucide-react for icons; shadcn Button, Modal primitives. No new npm packages.
- No map-tile vendor (Mapbox/Leaflet) per NFR-3; city density is a bar chart per current recharts pattern.

### Dependencies

- `computeRefund()` exported from [server/src/lib/refund.ts](file:///e:/VS%20Code/Web_Developement/Projects/Scholar'sHub/ScholarHub/server/src/lib/refund.ts) (already written and exported, used in dispute refunds).
- Existing `Notification` model & socket `new_notification` push → reuse for dispute opened / dispute resolved + refunded events.
- Existing price flow in bookings/create-order: `planFee → libraryFee, platformFee, baseTotal → discountAmount (referral today, + coupon now) → total = baseTotal - discounts → razorpay order`.

### Assumptions

- **DB-side refunds only.** Because the app has mock-order mode and Razorpay config is optional, FR-DM-2 refunds DB records + `REFUNDED` status + seat return only. Real Razorpay refund API calls are out of scope and left as a later env upgrade.
- Coupons are student-wide, one per booking. Cannot stack with referral credits? *Decision:* allow both (coupon discount first, referral credits second, total still floor ₹1). Reason: maximizes student value — no reason to force a choice.
- Per-student limit per coupon = 1 (default). A `usedBy` array on the coupon enforces this cheaply at confirm-time.
- Coupon codes are uppercase, stripped of whitespace. Both apply & create normalize.

### Open Questions (non-blocking, future work)

1. **Should coupon validation/checkout expose a `/validate` public endpoint separately from create-order?** → Yes, so the BookingModal "Apply" can show pre-payment confirmation without minting an order.
2. **Dispute categories** — PAYMENT, SEAT, BEHAVIOUR, HYGIENE, OTHER chosen as standard five. Expand later via enum-only change.

---

## 5. Acceptance Criteria

Every AC is typed **rule** (binary pass/fail) or **rubric** (0–2 evaluative with threshold).

### Platform Analytics

- **AC-PA-1 (rule)** — `GET /admin/stats` returns `newRegistrations: { weekly: [{ week, count }]*8, monthly: [{ month, count }]*12 }` (contiguous buckets, zero-filled).
- **AC-PA-2 (rule)** — `GET /admin/stats` returns `topLibraries: [{ _id, name, city, ownerName, revenueThisMonth }]* ≤ 5` by current-month payout-ledger total, descending.
- **AC-PA-3 (rubric)** — Admin Analytics presentation. Scale 0–2, threshold ≥ 2.
  - 0: missing charts/leaderboard.
  - 1: weekly registration chart missing OR top-libraries list missing.
  - 2: Admin Overview renders Weekly New Students BarChart AND renders Top 5 Performing Libraries ranked card (with revenue, owner, city) AND carries city-density bar chart (existing).

### Dispute Management

- **AC-DM-1 (rule)** — `Dispute` collection exists with schema fields `studentId, libraryId, bookingId?, title, description, category, status ∈ {OPEN,IN_PROGRESS,RESOLVED,DISMISSED}, resolutionNote?, refundAmount?, refundTier?, refundDate?`.
- **AC-DM-2 (rule)** — `POST /student/disputes` (requireAuth+student-role only) creates a Dispute document scoped to the caller's userId; creates Notification for library owner with socket push.
- **AC-DM-3 (rule)** — `PATCH /admin/disputes/:id` updates status + resolutionNote. If status=RESOLVED and `issueRefund:true` in body (for REFUND option path):
  1. Calls computeRefund() to determine `refundAmount ∈ {0, 50%, 100%}` of `booking.amountPaid`;
  2. findOneAndUpdate booking: `paymentStatus: REFUNDED, status: CANCELLED` idempotently IF current `paymentStatus !== REFUNDED`;
  3. If booking startDate > NOW AND booking had slotId: atomically return 1 availableSeats to the slot.
  4. Creates Notification of PAYMENT type to the student, with refund amount.
- **AC-DM-4 (rubric)** — Dispute UIs. Scale 0–2, threshold ≥ 2.
  - 0: UIs missing.
  - 1: Admin list only OR student-raise form only.
  - 2: Student Raise Complaint Form (booking card) opens in Modal; Admin Disputes page has filters, status toggles, Issue Refund action with refund calculator preview before commit.

### Coupon / Promo System

- **AC-CP-1 (rule)** — `Coupon` collection schema: unique uppercase `code`, `discountType ∈ {PERCENTAGE, FLAT}`, `discountValue: number (min 1, percentage max 100)`, `minPurchaseAmount? number ≥ 0`, `expiresAt: Date`, `usageLimit: number ≥ 1`, `usedCount: number default 0`, `usedBy: [{ userId: ObjectId, date: Date }] default []`.
- **AC-CP-2 (rule)** — `POST /coupons/validate` (requireAuth) body `{ code, planTotal }` returns `{valid:boolean, originalTotal, discountAmount, newTotal}`; rejects if expired OR `usedCount >= usageLimit` OR student has an entry in `usedBy[]` already OR `planTotal < minPurchaseAmount`; percentage discount: `Math.round(planTotal * discountValue / 100)`.
- **AC-CP-3 (rule)** — `POST /bookings/create-order` new optional param `promoCode`. When present and valid: computes discount; `total = baseTotal - couponDiscount - referralDiscount` clamped to ≥ ₹1; stores `couponId` on the created Booking document; order response includes keys `couponCode`, `couponDiscount`, `discountedTotal`.
- **AC-CP-4 (rule)** — `POST /bookings/confirm` idempotently (after transition PENDING→SUCCESS) if `booking.couponId` exists: `Coupon.findOneAndUpdate({ _id: couponId, usedCount: { $lt: usageLimit }, "usedBy.userId": { $ne: userId } }, { $inc: { usedCount: 1 }, $push: { usedBy: { userId, date: now } } })`. Rejected double-spend → still answer 200 OK (already counted by prior confirm), because payment was already successful — don't fail user-facing confirm due to a coupon-bookkeeping race.
- **AC-CP-5 (rubric)** — Coupon UIs. Scale 0–2, threshold ≥ 2.
  - 0: missing coupons UI entirely OR no apply-at-checkout field.
  - 1: Admin Coupon list works but modal Add Coupon form is missing OR checkout coupon input exists but no validation feedback (discount preview, error messages).
  - 2: Admin page `/admin/coupons` has list, Add Modal, in-line edit (type, value, expiry, limit), delete; BookingModal Review step has coupon input + Apply button showing either success (discount applied, new total highlighted) OR inline error (why invalid).
