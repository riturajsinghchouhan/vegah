# Accounting Ledger — status

Double-entry ledger for the rental and battery swap business. One ledger, three
reports generated from it, automatic posting from business events.

**Status:** core built and working. Fixed assets and depreciation are blocked on
decisions from the CA. See [Not built yet](#not-built-yet).

**Branch state:** all new files, plus hooks added to existing services. No
existing endpoint or page was changed, so current behaviour is unaffected.

---

## 1. The idea

Three statements, one source of data:

| Report | What it answers | Where it comes from |
|---|---|---|
| Balance sheet | What we own and owe | Asset / liability / equity account balances |
| Profit & loss | Revenue less expenses for a period | Income / expense account movements |
| Receipts & payments | Cash in and out | Movements on accounts flagged `isCash` |

Nothing is reconciled between them because nothing is kept separately. Every
money event posts one balanced journal entry; the reports are three views of
those entries. If they ever disagree, something is wrong with the ledger, not
with a sync job.

**Key rules the code enforces:**

- Every entry must balance. `postEntry` rejects anything where debits ≠ credits.
- Amounts are stored as **integer paise**, not rupee floats. Rupee floats cannot
  be summed without drift, and one paisa of drift breaks the only invariant the
  ledger rests on.
- Posted entries are **immutable**. Schema hooks block every update and delete
  path. Corrections are reversing entries, so the mistake and the fix both stay
  visible.
- Prepaid rent is **deferred revenue**, released daily. A 7-day plan paid today
  is not 7 days of income today.
- Deposits, wallet credit, advances and GST collected are **liabilities**, not
  income.

---

## 2. Files

### New — `Backend/src/modules/ledger/`

| File | What it does |
|---|---|
| `chartOfAccounts.js` | 61 accounts as plain data — 18 asset, 11 liability, 3 equity, 9 income, 20 expense, of which 19 are sub-ledger control accounts. Posting rules address accounts by `key`, never `code`, so the CA can renumber the chart without a code change. |
| `money.js` | Paise conversion and `splitEvenly`, which spreads a plan's value across days so the last day absorbs the remainder and deferred revenue closes at exactly zero. |
| `eventMapping.js` | Pure functions: domain record in, journal entry description out. No database access, so the whole mapping is testable without a connection. |
| `ledger.service.js` | The posting engine. `postEntry` is the only way anything enters the ledger. Also reversals, period locking, manual vouchers, cash handover, gateway settlement, trial balance, chart install. |
| `reports.service.js` | Balance sheet, P&L, receipts & payments, journal list, daily check, CSV export. |
| `hooks.js` | Where business events meet the ledger. Every function here is non-blocking by design. |
| `backfill.js` | Posts historical events so the reports have data before live posting accumulates. Opt-in; deliberately **not** registered with the seed runner. |
| `ledger.controller.js`, `ledger.routes.js` | HTTP layer. |

### New — models

`LedgerAccount`, `JournalEntry`, `AccountingPeriod`, `LedgerSequence`.

`LedgerSequence` is an atomic counter for entry numbers (`JV-202610-00001`).
Booking ids use a random suffix, which is fine for bookings but not for a
ledger, where numbers must be unique and gapless.

### New — other

- `Backend/src/jobs/ledgerDaily.job.js` — end-of-day close.
- `Frontend/src/modules/admin/pages/accounting/AdminLedger.jsx` — the UI.

### Changed — existing files

| File | Change |
|---|---|
| `bookings.service.js` | Ledger hook after commit; bounded BullMQ enqueues. |
| `payments.service.js` | Hooks for online capture and wallet payment. |
| `wallet.service.js` | Hooks for top-up and refund payout. |
| `finance/accounting.service.js` | Hook on expense creation. |
| `app.js` | Mounts `/api/admin/ledger` before the `/api/admin` catch-all. |
| `jobs/index.js` | System worker + daily close schedule. |
| `config/bullmq.js` | Queue error handlers, `enqueue`/`queueOp` with timeouts. |
| `config/redis.js` | Error log suppression, separate rate-limit connection. |
| `middleware/rateLimiter.js` | Per-limiter stores, `passOnStoreError`, project logger. |
| `config/socket.js` | Subscriber error log suppression. |

The last four are unrelated bug fixes found while testing — see
[Bugs found](#5-bugs-found-and-fixed).

---

## 3. Event-to-journal mapping

20 event types implemented. `E1`–`E22` numbering matches the brief given to the
accountant.

### Posted automatically from live events

| Event | Trigger | Entry |
|---|---|---|
| `E1_BOOKING_CONFIRMED` | Booking → `CONFIRMED` | Dr Receivable, Dr Discounts; Cr Deferred Revenue, Fees, GST, Deposits |
| `E2_REVENUE_RECOGNISED` | Daily, per elapsed day | Dr Deferred Revenue; Cr Rental / Swap Income |
| `E3_PAYMENT_CAPTURED` | Razorpay verified | Dr Gateway Receivable; Cr Receivable |
| `E5_CASH_COLLECTED` | Handover on a cash booking | Dr Cash in Hand; Cr Receivable |
| `E7_WALLET_TOP_UP` | Rider tops up | Dr Gateway Receivable; Cr Wallet |
| `E8_PAID_FROM_WALLET` | Booking paid from wallet | Dr Wallet; Cr Receivable |
| `E9_DEPOSIT_SETTLED` | Return signed off | Dr Deposits; Cr Refunds Payable, Receivable (late fee netted) |
| `E11_LATE_FEE` | Overdue return | Dr Receivable; Cr Late Fee Income, GST |
| `E13_REFUND_PAID` | Refund → `COMPLETED` | Dr Refunds Payable; Cr Wallet |
| `E17_EXPENSE_PAID` | Expense created | Dr expense account; Cr Cash / Bank |
| Reversal | Booking cancelled | Mirror of the original `E1` |

### Posted by an admin action

| Event | Where |
|---|---|
| `E4_GATEWAY_SETTLEMENT` | Controls tab → Record a Razorpay settlement |
| `E6_CASH_HANDOVER` | Controls tab → Bank the hub cash |
| `MANUAL_VOUCHER` | Controls tab → Journal voucher |

### Mapped, not yet wired to a trigger

`E10_DAMAGE_RECOVERED`, `E12_CANCELLATION_FEE`, `E14_ASSET_PURCHASED`,
`E15_DEPRECIATION`, `E19_ASSET_WRITTEN_OFF`, `E20_BAD_DEBT`,
`E22_UNMATCHED_RECEIPT`, `E9_DEPOSIT_REFUNDED` (direct cash-back variant).

The functions exist and are tested for balance; they have no trigger because the
app has no corresponding action yet. `E12` in particular: `cancellationFee`
exists only as a settings value and no booking is ever actually charged it.

### Not mapped

| Event | Why |
|---|---|
| `E18` swap station charges | The partner integration records swaps but no cost. Nothing to post. |
| `E21` challan paid for a rider | The app holds no challan record. |

---

## 4. How money actually moves

Riders pay **online via Razorpay** or **cash (COD) at the hub**. Neither lands in
the bank directly, and this tripped up the first build:

```
ONLINE:  E3 capture  ->  Gateway Receivable  ->  E4 settlement (net of fee)  ->  Bank
CASH:    E5 collect  ->  Cash in Hand        ->  E6 handover                 ->  Bank
```

Without `E4` and `E6` the money piles up in the two holding accounts and the bank
balance only ever decreases as expenses are paid — it went to **−₹2,469** in
testing. Both are now recordable from the Controls tab, with two guards:

- Cannot bank more cash than the ledger says is in hand.
- Cannot settle more than the gateway is recorded as owing.

The first one is the useful one: if a hub collection was missed or miscounted, it
surfaces when someone tries to deposit.

`E4` also books the Razorpay commission to **Payment Gateway Charges** and the
GST on it to **Input Tax Credit**. Before this, gateway cost was absent from the
P&L entirely.

---

## 5. Controls

| Control | Implementation |
|---|---|
| Debits = credits | Enforced on every `postEntry`; checked again daily |
| Immutable entries | Schema-level hooks on all update and delete paths |
| Reversal only | `reverseEntry`; unique index prevents reversing twice |
| Period locking | `AccountingPeriod`; a closed month rejects all postings |
| Reopen is logged | Requires a reason, records who and when |
| Audit trail | Every entry stores `postedBy` and `postedByType` |
| Idempotency | Stable keys per event; replays return the existing entry |
| Suspense must be zero | Checked daily, reported with its age |
| Sub-ledger controls | Wallet, deposits and refunds payable compared against the app's own records |
| Approver-only writes | Vouchers, reversals, period close, settlements, handovers are `SUPER_ADMIN` |
| No posting over HTTP | There is no route that posts an automatic event; those come only from the mapping |

### Non-blocking by design

Every function in `hooks.js` is wrapped so a ledger failure **cannot** break a
booking, payment or refund. A failed posting is logged for the daily check to
surface, never raised into the operational flow.

The hook also runs **immediately after commit**, before the re-fetch, socket
emit and push notification. Those are presentation; a failure there must not
cost the accounting entry.

If the chart of accounts is not installed, posting is skipped silently rather
than logging an error on every event.

---

## 6. API

All under `/api/admin/ledger`. Reads are `ADMIN`/`SUPER_ADMIN`; writes are
`SUPER_ADMIN`.

### Reads

```
GET  /balance-sheet          ?asOf=
GET  /profit-loss            ?from= &to=
GET  /receipts-payments      ?from= &to=
GET  /trial-balance          ?from= &to=
GET  /daily-check            ?asOf=
GET  /journal                ?from= &to= &eventType= &periodKey= &page= &limit=
GET  /accounts
GET  /periods
GET  /pending-money
GET  /export/:report         balance-sheet | profit-loss | receipts-payments | trial-balance | journal
```

### Writes

```
POST /cash-handover          { amount, date?, reference? }
POST /gateway-settlement     { grossSettled, gatewayFee?, gstOnFee?, date?, reference? }
POST /voucher                { narration, date?, lines: [{ accountKey, debit?, credit? }] }
POST /journal/:id/reverse    { reason }
POST /periods/close          { periodKey }
POST /periods/reopen         { periodKey, reason }
POST /install-chart
```

---

## 7. Admin UI

`/admin/accounting/ledger` — sidebar: **Accounting → Ledger**

Seven tabs: Balance Sheet, Profit & Loss, Receipts & Payments, Trial Balance,
Journal, Chart of Accounts, Controls.

- A daily-check banner at the top: "Balanced", or only the exceptions with reasons.
- Four stat cards. Cash & Bank shows unbanked money ("₹38,498 in hand · ₹3,504 awaiting Razorpay").
- Journal rows expand to the full double entry, with `reversal` / `reversed` badges and a Reverse action.
- CSV export on every report tab.
- Controls tab: money into the bank, period close/reopen, journal voucher, chart install.

The four existing accounting pages (`/accounting`, `/balance`, `/profit-loss`,
`/revenue`) are **untouched** and still read the old `earning − expense`
aggregation. They can be retired once the ledger is trusted.

---

## 8. What has been tested

All against a **copy** of the live database on a separate cluster. Production was
only ever read.

### Pure mapping checks (no database)

| Check | Result |
|---|---|
| `E1` on the brief's worked example | ₹4,330 both sides, 8 lines, matches the document exactly |
| 7-day recognition schedule | Releases ₹1,400 and ₹500 with the remainder on day 7; deferred closes at zero |
| `splitEvenly` on awkward divisions | ₹333/30 days, ₹0.01/7 days — all sum back exactly |
| `E4` settlement arithmetic | ₹4,230 gross − ₹84.60 fee − ₹15.23 GST = ₹4,130.17 net |
| Idempotency keys | Stable and distinct across all events |

### Engine behaviour

| Check | Result |
|---|---|
| Unbalanced entry | Refused, with the difference in the message |
| Control account without a sub-ledger id | Refused |
| Posted entry edit / delete | Blocked at the schema |
| Reversal | Mirrors correctly; second attempt refused |
| Closed period | Rejects postings |
| Reopen without a reason | Refused |
| Voucher without an approver | Refused |
| Replayed event | Returns the existing entry, no duplicate |
| Over-banking cash / over-settling gateway | Both refused with the available figure |

### Full rider lifecycle, through the real services

Reserve → cash chosen → admin approve → handover → rider drop → admin sign-off →
refund payout → wallet top-up → expense. The accounting equation was checked
**after every step**, not just at the end:

```
[1] empty ledger          entries= 66  assets=28166.88  L+E=28166.88  BALANCED
[2] after reserve         entries= 66                                 BALANCED
[4] after invoice (E1)    entries= 74  assets=36597.88  L+E=36597.88  BALANCED
[5] after handover        entries= 76                                 BALANCED
[7] after return (E9)     entries= 77                                 BALANCED
[9] after top-up+expense  entries= 80  assets=35147.88  L+E=35147.88  BALANCED
```

Business behaviour confirmed: no entry for a bare reservation; rent goes to
deferred revenue on invoice, not income; day 1 recognised ₹238.57 and nothing for
future days; deposit became a liability then released; wallet top-up booked as a
liability, not income.

### Both payment paths

```
ONLINE  E3 ₹3504 -> gateway receivable ₹3504 (not bank)
CASH    E5 ₹3504 -> cash in hand

before:  bank -2469.12   cash 38498.00   awaiting 3504.00
E4: gross 3504, fee 70.08, GST 12.61
E6: 38498.00
after:   bank 39450.19   cash 0.00       awaiting 0.00
```

### Do the three statements agree?

This is the brief's central claim, so it is asserted explicitly:

| Cross-check | Result |
|---|---|
| Balance sheet surplus = P&L net profit | ₹8,562.69 both |
| Balance sheet cash = receipts & payments closing | ₹39,450.19 both |
| Assets = liabilities + equity | difference ₹0.00 |
| Debits = credits | ₹193,699.53 both sides |
| Daily check | BALANCED over 7 checks |

### Resilience

Period deliberately closed so every posting would be refused, then an expense
created through the real service: **the expense was created, no entry was
written, and no error reached the caller.** This is the property that matters —
the ledger cannot break the business.

### HTTP layer

Logged in as a real admin and called every endpoint. All 20 return 200. CSV
exports return `text/csv` with a filename. Validation messages are specific
("Cannot bank ₹999999: only ₹0 is recorded as cash in hand").

### Regression

Every pre-existing endpoint still returns 200: finance summary, accounting
summary, tax & billing, expenses, settlements, dashboard stats, bookings,
vehicles, wallet summary / refunds / customers. Frontend production build is
clean. Server boots in 18 log lines with no stack traces.

### Not tested

**The UI has not been opened in a browser.** No browser tooling was available in
the session. What was verified: the production build compiles, and every field
the component reads is present in the API responses. Layout and spacing are
unverified.

---

## 9. Bugs found and fixed

Testing found these. They are listed because several are unrelated to the ledger
and affect the running app.

### Ledger bugs

1. **The immutability guard was itself broken.** The schema hook took a `next`
   callback, which Mongoose 8 does not always supply, so instead of blocking a
   write it threw `TypeError: next is not a function`. Rewritten as throwing
   hooks and verified to actually block.

2. **Deposits were released twice.** The live hook posted under key `E9b:` and
   the backfill under `E9:`, so idempotency did not catch the overlap — one
   booking showed ₹3,500 released against a ₹1,750 deposit. The backfill also
   modelled it wrongly, crediting bank directly when the real flow raises a
   refund paid through the wallet. Both now use the same event.

3. **Late fees drove receivables negative.** Settling a deposit nets the late fee
   off it by crediting the rider's receivable, but the backfill never posted the
   charge that created the fee. One booking went to −₹1,750 and ₹3,623 of late
   fee income vanished. `E11` now posts first; that booking correctly shows
   **+₹1,873** still owed.

4. **Negative bank balance.** No path existed for money to reach the bank — see
   [section 4](#4-how-money-actually-moves).

### Unrelated bugs, fixed in passing

5. **Rate limiter crashed the server on boot.** One `RedisStore` instance was
   shared between two limiters, which `express-rate-limit` v7+ rejects outright.
   Only visible with `REDIS_ENABLED=true`. Each limiter now has its own store and
   key prefix — which also matters because a shared store means one shared
   counter, so ordinary API traffic would eat into the stricter auth allowance.

6. **Every request hung when Redis was down.** After fixing (5), the server
   booted but no request completed. BullMQ's connection sets
   `maxRetriesPerRequest: null` because its workers need commands to wait, so a
   rate-limiter command against a dead Redis never settled. Rate limiting now
   uses a separate connection with offline queueing disabled, plus
   `passOnStoreError`, so a Redis outage degrades rate limiting instead of taking
   down the API.

7. **Creating a booking hung forever when Redis was down.** Same root cause:
   `await bookingQueue.add(...)` in `reserveVehicle` was unguarded. This was live
   in the current configuration. All queue operations now go through `enqueue` /
   `queueOp` with a 5s bound, falling back to the existing in-process timers.

8. **959 lines of boot log noise.** Redis connection errors were logged on every
   retry, including 76 full stack traces from BullMQ queues with no error
   listener. Each failure is now reported once, in one line, and reset on
   reconnect. Boot is **18 lines**.

---

## 10. Not built yet

### Blocked on the CA

| Item | Needs |
|---|---|
| Fixed asset register, per-asset profitability | **D2** depreciation method, rate, life per class · **D3** is a battery pack a separate asset, capitalisation threshold |
| Monthly depreciation | **D2** |
| Per-line GST, HSN/SAC on invoices | **D1** GST treatment and rate for a battery swap vs a rental |
| Loan / hire-purchase accounts | **D4** owned or financed |
| Opening balances | **D10** opening trial balance, including the real bank balance |

`E14`, `E15` and `E19` are written and tested for balance. What is missing is the
schema (`Vehicle` has no purchase cost or date; batteries are not records at all)
and the policy to drive it. Inventing a depreciation rate would produce a wrong
balance sheet and a wrong tax position, so it is left alone.

The lettered decisions are from the document prepared for the CA.

### Blocked on missing data

- **Swap station costs** — the partner integration records swaps but no cost, so
  the profitability of the unlimited swap plan is unknowable. Combined with the
  next point, the swap business is invisible in both directions.
- **Bank reconciliation** — nothing ingests a bank statement.
- **Challan recovery** — no challan record exists.

### Still to build

- Retire the four old accounting pages once the ledger is trusted.
- Triggers for the mapped-but-unwired events (damage recovery, bad debt write-off, unmatched receipts).
- Razorpay Settlements API integration, so settlement figures are fetched rather than typed.
- A read-only role for the CA.
- PDF export (CSV is done).

---

## 11. Operating notes

### Installing

The chart of accounts is **not** in the database until someone installs it,
either from Controls → Install chart of accounts, or `POST /install-chart`. It is
deliberately not wired into `npm run seed`, because that runs every registered
seed at once and would write to whichever database is connected.

Then run the backfill once to bring history onto the ledger. It is idempotent, so
a second run posts nothing new, and it refuses to run against the production
cluster.

### Redis

`REDIS_ENABLED=true` with Redis not running is a working but degraded state:
rate limiting falls back to per-process, and **BullMQ jobs do not run at all** —
reservation expiry, rental reminders and the ledger daily close never fire. For
local work either start Redis or set `REDIS_ENABLED=false` and
`BULLMQ_ENABLED=false`.

Without the daily job, revenue recognition only advances on a booking status
change, so deferred revenue will lag.

### Daily close

Scheduled at 00:00 IST (`30 18 * * *` UTC). It releases the day's earned revenue
across live bookings, runs the seven checks, and notifies admins with either
"Books balanced" or the list of exceptions.

### Known figures that need attention

- **Swap plans are priced at zero.** `batteryPackageUnlimited`,
  `batteryPackageSingle`, `serviceCharge` and `platformFee` are all `0` in
  settings, and every booking is on the unlimited plan. Accounts 4020, 4030 and
  4040 will sit at nil. That is a pricing decision, not an accounting problem.
- **GST is configured at 5%**, not the 18% the code defaults to. The CA has been
  asked to confirm it, since it is charged on rental and swap as one combined
  supply.
- **`pricePerDay` holds the weekly price and `pricePerHour` the monthly price.**
  Misleading names that have already caused one billing bug. Worth renaming
  before more code reads them.
