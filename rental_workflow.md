# EV Rental End-to-End Workflow

The booking, handover and drop-off lifecycle, as implemented.

Status enum lives in `Backend/src/modules/bookings/bookings.constants.js`; the
allowed transitions are enforced in `bookings.state-machine.js`.

```
RESERVED → PENDING_VERIFICATION → CONFIRMED → ACTIVE → PENDING_RETURN → COMPLETED
                                                 ↓  ↑         ↓
                                              OVERDUE ────────┘
```

## 1. Booking & Document Approval (`CONFIRMED`)
* **User:** books the EV, uploads KYC (Aadhar, License, photo) and pays. Status becomes `RESERVED` → `PENDING_VERIFICATION`.
* **Admin:** gets a real-time popup (socket `NEW_BOOKING` + FCM), reviews the documents, clicks **Approve**.
* **Result:** `CONFIRMED`. Vehicle moves `RESERVED` → `BOOKED`.
* ⏳ **The trip timer does NOT start here.** `actualPickupAt` and `tripEndsAt` are still null.
* **User UI:** "Ready for Pickup" with a **Navigate to Pickup Hub** button. The same button is on every `CONFIRMED` row in **My Bookings**, so the user can get back to it after closing the app.

## 2. User Travels to the Hub
* `/user/navigation?type=pickup&bookingId=…` routes to the hub (zone `pickupLocation`).
* **Reached Pickup Hub? Show Booking ID** opens a handover card with the booking ID for the counter. The user cannot start their own trip — the app only waits here.

## 3. Admin Confirms Pickup → Trip Starts (`ACTIVE`)
* **Admin UI:** *Bookings → Upcoming Pickups* → **Confirm Pickup & Start Trip**.
* **API:** `PATCH /api/bookings/:id/confirm-pickup` (ADMIN / SUPER_ADMIN only).
* **Effects:** status `ACTIVE`; `actualPickupAt = now`; `tripEndsAt = actualPickupAt + booked duration`; `depositStatus = COLLECTED`; `pickupConfirmedBy` recorded.
* ⏱️ **The timer starts strictly from this moment.** `GET /api/bookings/:id/live` computes against `tripEndsAt`, so a late pickup no longer eats the customer's time.
* Reminder and overdue jobs are queued off `tripEndsAt`.

## 4. Active Ride
* The user's app moves to `/user/rental/active` automatically (socket `BOOKING_STATUS_UPDATED`).
* Server-authoritative countdown, **Navigate to Drop & Return**, and **Extend Rental (+1h)** — an extension moves `endDate` *and* `tripEndsAt`, re-arms the reminder, and lifts `OVERDUE` if the new deadline is in the future.

## 5. Expiry Reminder
* `rental-reminder` job fires `RENTAL_REMINDER_LEAD_MS` (15 min) before `tripEndsAt`.
* Delivered three ways so it survives a closed app: persisted `Notification`, socket `RENTAL_EXPIRING_SOON`, and a targeted FCM push to the user's `fcmToken`.
* Guarded by `reminderSentAt` so it never fires twice, and skipped if the deadline moved.
* `rental-overdue` job flips `ACTIVE → OVERDUE` `OVERDUE_GRACE_MS` (5 min) after the deadline.
* With `BULLMQ_ENABLED=false` both fall back to in-process timers (see `scheduleTripJobs`).

## 6. User Returns the EV (`PENDING_RETURN`)
* `/user/navigation?type=drop` → **Reached Drop Hub? Confirm Return**.
* **API:** `PATCH /api/bookings/:id/request-return` (owner only).
* **Effects:** status `PENDING_RETURN`; `returnRequestedAt = now`.
* ⚠️ **The vehicle stays `BOOKED`** — it is not back in the fleet until an admin says so.
* Admins get socket `RETURN_REQUESTED` + FCM; the user sees "Awaiting hub verification".

## 7. Admin Verifies the Return (`COMPLETED`)
* **Admin UI:** *Bookings → Live Active Rentals* → **Verify Return** (pending returns sort to the top).
* **API:** `PATCH /api/bookings/:id/confirm-return`, optional `depositStatus: REFUNDED | COLLECTED`.
* **Effects:** `COMPLETED`; `actualReturnAt`; `lateFee` computed at `LATE_FEE_MULTIPLIER` × hourly rate per started overtime hour; deposit settled; vehicle released to `AVAILABLE`; reminder/overdue jobs cancelled.
* **Reject path:** `PATCH /api/bookings/:id/reject-return` returns the booking to `ACTIVE` (or `OVERDUE`) when the EV is not actually at the hub.

---

## Admin Snapshot — resolved as Option B
The earlier open question ("admin ko har time ka ek snap short show hona chiye") is
implemented as **Option B, the timestamped timeline**: every transition appends to
`booking.statusHistory` as `{ status, at, by, note }`, and the live payload returns it.

**Option A (photo evidence) is still open.** The `Inspection` model already carries
`type: PICKUP | RETURN`, `photos[]` and damage findings, but nothing in the booking
flow creates one. Wiring a required photo capture into confirm-pickup and
confirm-return is the natural next step if photo proof is wanted.
