# Admin Enhancements — Implementation Tasks

All tasks descend from the Acceptance Criteria in `spec.md`. ACs are cross-linked by ID.

---

## AUDIT SUMMARY (2026-09-30)

### Already exists (reuse, no build required)

| Feature area | Existing | Evidence |
|---|---|---|
| 10.1 Total revenue across libraries | ✅ Complete | `/admin/stats → platformRevenue` (month-to-date); Admin Overview Platform Revenue KPI card + 12-month LineChart `admin/page.tsx` L117-L175 |
| 10.3 City library density chart | ✅ Complete | `/admin/stats → topCities` aggregate L33; Admin Overview vertical BarChart `Top Cities by Library Count` L179-L202 (recharts, no new libs needed) |
| 11.2 Refund calculator engine | ✅ Complete | `server/src/lib/refund.ts → computeRefund()` (FULL/HALF/NONE tiers); `Booking.paymentStatus ∈ {… REFUNDED}`, `status ∈ {… CANCELLED}` enums |
| Base models/routes primitives | ✅ Complete | `requireAdmin`, `requireAuth`, `Notification` model + socket `new_notification`, `Booking` model, `priceBooking()`/`splitPayout()` |

### Missing (requires build in this session)

| # | Missing | Linked FR/AC |
|---|---|---|
| 10.2 | New registrations weekly/monthly chart | FR-PA-2 / AC-PA-1 |
| 10.4 | Top performing libraries ranked card | FR-PA-4 / AC-PA-2, AC-PA-3 |
| 11.1 | Dispute model + student raise endpoint + UI | FR-DM-1 / AC-DM-1, AC-DM-2 |
| 11.2 | Admin dispute resolve + refund endpoint + UI | FR-DM-2 / AC-DM-3 |
| 12.1/12.2 | Coupon model + admin CRUD endpoints + page | FR-CP-1/FR-CP-2 / AC-CP-1 |
| 12.3 | Validate + apply at checkout | FR-CP-3 / AC-CP-2/3/4/5 |

---

## Task 1: New registrations weekly/monthly endpoint (AC-PA-1)

**Parent AC:** AC-PA-1
**Priority:** high
**Depends on:** none
**Scope of change:** `server/src/routes/admin.ts /admin/stats`

### Status: pending

Add new aggregations to existing `/admin/stats` endpoint within the existing `Promise.all`:
- `newRegistrations.weekly`: 8 buckets of week start ISO date → count of User.role==STUDENT created in that 7-day window. Use loop back 8*7 days, each bucket filter $gte bucketStart $lt bucketStart+7d. Zero-fill.
- `newRegistrations.monthly`: 12 months. Same pattern as revenueChart; `$match createdAt $gte 12monthAgo`, `$group _id {year, month}`, zero-fill 12-slot template with map.

Append both to the `res.json({…})` return object.

### Task-local Test Requirements (TR)

- **TR 1.1 (rule)** — weekly.length === 8, monthly.length === 12, keys present.
- **TR 1.2 (rule)** — `count` 0 ≤ n (no negatives, aggregates return numeric).

---

## Task 2: Top performing libraries endpoint (AC-PA-2, AC-PA-3)

**Parent AC:** AC-PA-2, AC-PA-3
**Priority:** high
**Depends on:** Task 1 (parallel safe — same endpoint Promise.all, no conflict)
**Scope of change:** `server/src/routes/admin.ts /admin/stats`

### Status: pending

Within same `Promise.all` in `/admin/stats`:
- `topLibraries`: PayoutLedger `$match createdAt gte startOfMonth`, `$group _id=libraryId sum=totalAmount`, `$sort sum:-1`, `$limit 5`. Then populate libraryId → name, city, ownerId → ownerName. Serialize plain object: `{_id, name, city, ownerName, revenueThisMonth}`.

Add `topLibraries` key to `res.json`.

### Task-local Test Requirements (TR)

- **TR 2.1 (rule)** — returns array length ≤5, descending order by `revenueThisMonth`.
- **TR 2.2 (rule)** — `_id, name, city, ownerName, revenueThisMonth` five keys present on each entry.

---

## Task 3: Admin Overview page UI — Weekly New Students Chart + Top 5 Libraries Card (AC-PA-3)

**Parent AC:** AC-PA-3 (rubric)
**Priority:** high
**Depends on:** Task 1, Task 2 (data shape)
**Scope of change:** `web/src/app/(dashboard)/admin/page.tsx`

### Status: pending

**3a** — Expand `Stats` type to include `newRegistrations: {weekly, monthly}` and `topLibraries` shape at L22-L32.

**3b** — Below existing "Platform Revenue 12 Months" card and above/beside the bottom charts row `cityData/examData`, insert a full-width card "New Student Registrations — Last 8 Weeks" with Recharts BarChart. X axis = week ISO, Y = count. Green bars, radius.

**3c** — Next to Exam Doughnut (or below Top Cities for vertical stacking on `lg:grid-cols-3` upgrade to the bottom row), add a ranked card **"Top Performing Libraries — This Month"**. For each of top 5 entries: rank medal 1-5, library name, city, owner name, ₹ amount. Sort descending. Clickable link → `/admin/libraries` (deep-link optional).

### Task-local Test Requirements (TR)

- **TR 3.1 (rule, rubric anchor)** — Overview renders both the weekly BarChart AND the top-libraries ranked card (AC-PA-3 score ≥2 requirement).
- **TR 3.2 (rule)** — City density bar chart continues working (no regression).

---

## Task 4: Dispute model + student endpoint + admin endpoint (AC-DM-1, AC-DM-2, AC-DM-3)

**Parent AC:** AC-DM-1, AC-DM-2, AC-DM-3 (rules)
**Priority:** high
**Depends on:** none
**Scope of change:** 3 new files/routes:
- NEW `server/src/models/Dispute.ts` model
- `server/src/routes/student.ts` — add POST `/student/disputes` (requireAuth)
- `server/src/routes/admin.ts` — add GET `/admin/disputes` list + PATCH `/admin/disputes/:id` resolve

### Status: pending

**4a — Dispute model (NEW file Dispute.ts):**
Schema fields match AC-DM-1. Enums category, status as per FR. Indexes: `libraryId + status` (for triage); `studentId` (student list view); timestamps.

**4b — POST /student/disputes in student.ts:**
Require STUDENT role. Validate `{libraryId, bookingId?, title, description, category ∈ enum}`. Library must exist (ownership check is admin side only). Create Dispute. Then create Notification for `userId = library.ownerId` with type LIBRARY, title "New dispute filed", message truncated description. Socket `io.to(user:${ownerId}).emit('new_notification', notification)`. Response 201 `{ dispute }`.

**4c — Admin routes:**
- GET `/admin/disputes?status=&category=` returns list, populate studentId (name, email), libraryId (name, city), bookingId if present (plan, startDate, amountPaid). Newest first.
- PATCH `/admin/disputes/:id` body `{status, resolutionNote?, issueRefund?:boolean}`:
  1. findById → check found.
  2. set `status` + `resolutionNote`.
  3. if `status === RESOLVED && issueRefund === true && bookingId`:
     - find booking; if `booking.paymentStatus === REFUNDED` already → skip refund silently (idempotent).
     - else `{ refundAmount, refundTier } = computeRefund(booking.amountPaid, booking.startDate, now)`; save to dispute.
     - Booking.findOneAndUpdate: `{paymentStatus: REFUNDED, status: CANCELLED}` filter `paymentStatus != REFUNDED` (avoid overwriting).
     - If booking.startDate > now:
       - Slot.findOneAndUpdate if booking.slotId: `availableSeats $inc +1`.
       - Library.findOneAndUpdate: `availableSeats $inc +1`.
  4. Student-side Notification: type PAYMENT, title="Dispute resolved", body with status + refundAmount if any. Socket push.
  5. Socket to library owner if status changed? Optional nice-to-have.
  6. Respond 200 dispute with refund fields populated.

(Wire the router into app.ts: import DisputeModel once? No need; mongoose registers models via default. Just add routes to existing routers in app.ts — they are already mounted so student.ts and admin.ts are mounted; adding routes inside them is sufficient — no app.ts changes.)

### Task-local Test Requirements (TR)

- **TR 4.1 (rule)** — Dispute model indexes + enums compile; mongoose registers without error.
- **TR 4.2 (rule)** — POST student/disputes creates document + owner Notification (call socket module; but since we can't test sockets in-process, code-level evidence — owner notification created with right userId).
- **TR 4.3 (rule)** — PATCH with issueRefund → booking transitions to REFUNDED/CANCELLED atomically; findOneAndUpdate filter prevents double-refund even on retry. Returns HTTP 200, refundAmount equals computeRefund() output.

---

## Task 5: Coupon model + admin CRUD endpoints + validate/apply endpoints + booking integration (AC-CP-1, AC-CP-2, AC-CP-3, AC-CP-4)

**Parent AC:** All rule ACs under Coupon. Interacts with booking create/confirm.
**Priority:** high
**Depends on:** none
**Scope of change:**
- NEW `server/src/models/Coupon.ts`
- `server/src/routes/admin.ts` → CRUD `/admin/coupons`
- `server/src/routes/bookings.ts` → POST `/coupons/validate` (requireAuth), update create-order for `promoCode`, update confirm-order for coupon usedCount atomic increment.

### Status: pending

**5a — Coupon model NEW Coupon.ts:**
Schema AC-CP-1. Unique index on `code` (uppercase). `discountValue` validator: PERCENTAGE → 1 ≤ value ≤ 100, FLAT → value ≥ 1. timestamps.

**5b — Admin coupon CRUD in admin.ts:**
- GET `/admin/coupons` list all, newest first; show `usedBy.length` derived count? No, usedBy is array could be long; include usedCount which is explicit.
- POST `/admin/coupons` body `{code, discountType, discountValue, minPurchaseAmount?, expiresAt, usageLimit}`. Normalize code to uppercase trim. Validate types/ranges via code (not mongoose; return 400). Return 201.
- PATCH `/admin/coupons/:id` — update allowed: expiresAt, usageLimit, minPurchaseAmount (never change type/code retroactively). Return 200.
- DELETE `/admin/coupons/:id` — if usedCount > 0, allow (soft delete is out of scope — hard delete OK, history tracked via bookings.couponId still). Return {success:true}.

**5c — Coupon validate (new endpoint in bookings.ts, public requireAuth):**
`POST /coupons/validate` body `{code, planTotal}`. Always returns {valid, originalTotal, discountAmount, newTotal, code, error?}. Steps:
- Uppercase code.trim(). findOne.
- If not found / expired / usedCount >= usageLimit → valid=false, error.
- Student check: `usedBy.some(u => String(u.userId) === String(user.id))` → valid=false, already used.
- If planTotal < minPurchaseAmount → valid=false.
- Compute discount = flat or Math.round(planTotal*pct/100).
- `newTotal = max(1, planTotal - discount)`.
- Return.

**5d — Create-order update (apply promoCode):**
Existing bookings.ts `create-order`:
- Destructure new optional `promoCode?: string` from body.
- After `const {libraryFee, platformFee, total: baseTotal} = priceBooking(planFee);` line ~92 and BEFORE referral discount block (line 94):
  - Initialize `let couponDiscount = 0; let couponId: ObjectId | undefined = undefined;`
  - If `promoCode`:
    - Reuse validation logic inline (extract helper function `validateAndApplyCoupon(code, userId, planTotal)` → returns {valid, couponId, discountAmount}).
    - If valid, set `couponDiscount = discountAmount` and `couponId = coupon._id`.
  - Then apply existing referral credits discount on top (the floor `baseTotal - couponDiscount - referralDiscount >= 1` clamp — reuse same pattern, clamp final to max(1, baseTotal - couponDiscount - referralDiscount) = `total`.
  - In `BookingModel.create({...})` at L130-L136, add `couponId` field if set.
  - Response JSON L138-144 add keys: `couponCode: promoCode || null`, `couponDiscount`, `discountedTotal: total`.

(Also need to add `couponId?: ObjectId` optional new field to **Booking.ts IBooking interface + schema.** Declare optional, no index needed. No breaking change.)

**5e — Confirm-order increment coupon usage atomically:**
bookings.ts POST confirm: After `if(!booking)` retry-check block L217-L231 (i.e. SUCCESS path, we already have `booking` object from the findOneAndUpdate L206-L215 success case, which is NEW booking → after success transition).
- If `booking.couponId`:
  ```
  Coupon.findOneAndUpdate(
    { _id: booking.couponId, usedCount: { $lt: usageLimitField?? } — easier: just $inc usedCount and $push usedBy, with filter "usedBy.userId != studentId" — if already has entry, returns null (safe). Since payment succeeded, ignore any failure silently (log) but don't error.
  ```
  Protect against 422 on confirm (payment succeeded is the priority; coupon bookkeeping being slightly off is acceptable because the alternative is duplicate charge).

### Task-local Test Requirements (TR)

- **TR 5.1 (rule)** — Coupon PERCENTAGE 50 value clamped rejects on create if >100 or <1 (create returns HTTP 400).
- **TR 5.2 (rule)** — validate on code already in usedBy[] for user returns valid=false "Coupon already used by this account".
- **TR 5.3 (rule)** — create-order with valid promoCode → booking.couponId set; response includes couponCode, couponDiscount, discountedTotal and final amount < original.
- **TR 5.4 (rule)** — confirm-order path increments usedCount (atomic filter usedCount < usageLimit) AND pushes usedBy entry for the student userId.

---

## Task 6: Admin Sidebar nav links + Admin Coupons page + Admin Disputes page (AC-DM-4, AC-CP-5)

**Parent AC:** rubric anchors for DM-4 and CP-5 plus navigation needed.
Three separate page files (no cross-file writes → parallel safe with Task 7 booking/student).
**Priority:** high
**Depends on:** Task 4 (API contracts), Task 5 (API contracts).
**Scope of change:**
- `web/src/components/dashboard/AdminSidebar.tsx` → NAV array, add Coupons + Disputes entries.
- NEW `web/src/app/(dashboard)/admin/coupons/page.tsx`
- NEW `web/src/app/(dashboard)/admin/disputes/page.tsx`

### Status: pending

**6a — Nav (AdminSidebar.tsx L25-L32 NAV):**
Add after Courses, before Notifications:
- `/admin/disputes` Label: Disputes Icon: AlertCircle? (or AlertTriangle from lucide).
- `/admin/coupons` Label: Coupons Icon: Ticket/TicketPercent.

**6b — Coupons page (NEW file):**
Header "Coupon & Promo Codes". Button "+ Add Coupon" opens Modal: form (code input, type select, value number, minPurchase optional, expiresAt date, usageLimit number default 1). POST /admin/coupons.
List: table of coupons (Code, Type, Value, Min ₹, Expires, Used / Limit, Status, Actions). Status: expired/active/depleted — color pills. Inline edit (expiry/limit/min). Delete action with confirm.

**6c — Disputes page (NEW file):**
Header "Dispute Management". Two-row filter row: status dropdown + category dropdown.
Cards or list per dispute: student name/email, library name, booking details if present (plan, dates, amountPaid), category pill, status pill, description text, filed date.
Actions: status select (OPEN/IN_PROGRESS/RESOLVED/DISMISSED), resolutionNote textarea, "Save Changes" button. If bookingId exists AND status RESOLVED → show "Issue Refund (Preview)" with computeRefund preview inline (compute the refund amount client-side from amountPaid + startDate — same algorithm server will use; actual refund only happens on server commit). Toggle checkbox: "Issue refund on resolve (updates booking to REFUNDED)". "Resolve & Issue Refund" → calls PATCH with issueRefund:true.

### Task-local Test Requirements (TR)

- **TR 6.1 (rule)** — Two nav entries added + click navigates to correct new routes.
- **TR 6.2 (rule)** — Add Coupon Modal creates a coupon (HTTP 201); code auto-uppercases on save.
- **TR 6.3 (rule, rubric DM-4 anchor CP-5)** — Disputes page has filters + status toggle + issue refund preview.

---

## Task 7: Student-side Raise Complaint button + BookingModal Coupon Apply field (AC-DM-4, AC-CP-5)

Two entirely separate files → no conflict, parallel-safe with Task 6.
**Priority:** high
**Depends on:** Task 4 API shape (dispute create), Task 5 validate API shape + create-order promo code in response.
**Scope of change:**
- `web/src/app/(dashboard)/student/bookings/page.tsx` — add Report icon button per booking card, open Complaint Modal
- `web/src/components/booking/BookingModal.tsx` — Review step, add coupon input + Apply button

### Status: pending

**7a — Student bookings page:**
Per active booking card (already a grid with icons) — add new lucide AlertCircle / Flag "Report Issue" button. onClick → open shadcn Modal (reuse existing Modal component from ui/modal.tsx — import). Modal contains: title "Report a Problem" / form fields: category select (5 enums), title input, description textarea (rows=5). Submit → POST /student/disputes → success toast banner, close, clear fields. aria-label "Report issue for booking".

**7b — Booking Modal coupon field:**
In the Review step (Step 2 of the indicator). Above the totals section (before the `Confirm & Pay` button), add a promo code row:
Input (type text, uppercase transform via CSS text-uppercase) placeholder "Enter coupon code" + small Button "Apply" variant outline size sm. OnClick → POST /coupons/validate body `{code: inputValue.trim().toUpperCase(), planTotal: total}`. Result:
- Valid: green inline banner: "Coupon applied! You saved ₹discountAmount. New total ₹newTotal." Local state for `appliedCoupon {code, discountAmount, newTotal}`. Feed into totals display below (override amount). Store code so when the confirm button is clicked, the create-order POST includes promoCode.
- Invalid: red inline banner shows returned error.
When user navigates back to Step 1 and changes plan/fees, the applied coupon auto-revalidate on next apply-click (no auto-revalidation on step change to keep simple — user must click Apply again if plan changed).

### Task-local Test Requirements (TR)

- **TR 7.1 (rule)** — Student Report button opens Modal; Submit → POST 201, closes modal.
- **TR 7.2 (rule, rubric CP-5 anchor)** — Coupon Apply shows success banner with discount/newTotal or error; on payment create-order submit, promoCode field is included in request body.

---

## Task 8: End-to-end verification

**Parent ACs:** all rule/rubric ACs
**Priority:** high
**Depends on:** Tasks 1–7
**Status:** pending (blocked on all frontend)

### Scope

1. Server `npx tsc --noEmit` → 0 errors.
2. Server `npm run test` → 81+ passing (no regressions; new models not tested unless tests are written but if no new tests count must not drop below 81).
3. Web `npx tsc --noEmit` → 0 errors.
4. Lint: 0 NEW lint errors on changed files.

### Task-local Test Requirements (TR)

- **TR 8.1 (rule)** — 0 TS errors across server & web.
- **TR 8.2 (rule)** — 0 failing tests (≥81 pass, or if new tests added count should be ≥81).
- **TR 8.3 (rubric)** — code-level review walkthrough of all new pages. Scale 0–2; threshold ≥1.

---

## Issue Queue

Empty — populated during independent Review on findings.
