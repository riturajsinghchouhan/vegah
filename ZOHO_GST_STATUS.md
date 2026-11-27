# Zoho Books / GST Integration — Status

Last updated: 2026-11-21

## What this is

Two things were built together, and it matters that they are separate:

1. **A GST document system that lives in vegah.** Tax invoices and credit notes
   with gapless per-financial-year numbering, CGST/SGST/IGST split, SAC codes
   and input tax credit on expenses. This works on its own and does not need
   Zoho.
2. **A Zoho Books mirror of it.** The documents above are pushed to Zoho so the
   CA can file GSTR-1 / GSTR-3B from a real accounting system.

The existing double-entry ledger (`Backend/src/modules/ledger/`) stays the
source of truth for internal reporting. Zoho is downstream of it, not a
replacement.

Source spec: `Vega Media _ India.docx` — a field mapping for four Zoho
endpoints (`/contacts`, `/invoices`, `/customerpayments`, `/expenses`). It does
not contain credentials; every id in its samples is a Zoho documentation
placeholder.

---

## Why this was needed

The accounting as it stood was not filable by a CA:

| Problem | Status |
|---|---|
| Invoices derived on the fly, no real number series | Fixed |
| Invoices could be deleted (bin / purge) | Fixed — credit notes instead |
| No CGST/SGST/IGST split, only a flat `taxAmount` | Fixed |
| No place of supply, so intra vs inter-state undecidable | Fixed |
| No HSN/SAC codes on line items | Fixed |
| Expenses had no vendor GSTIN, so ITC was being lost | Fixed |
| Deposit treated as income in one place, liability in another | Fixed |
| No GSTR-1 / GSTR-3B output | Fixed (summary endpoint + Zoho) |

---

## Done

### New files

**Backend**

| File | Purpose |
|---|---|
| `src/utils/gst.js` | GSTIN validation, 36 state codes, CGST/SGST vs IGST split, inclusive-tax split |
| `src/models/TaxInvoice.js` | The GST document of record. Invoices and credit notes, immutable |
| `src/models/ZohoSync.js` | One row per local record pushed to Zoho. Unique on `(entity, localId)` |
| `src/modules/finance/taxInvoice.service.js` | Issuing, numbering, credit notes, GST summary |
| `src/integrations/zoho/zoho.client.js` | OAuth refresh with Redis cache, 401 re-auth, 429/5xx backoff |
| `src/integrations/zoho/zoho.config.js` | Account / tax / SAC id mapping, held in settings |
| `src/integrations/zoho/zoho.lookups.js` | Reads accounts and taxes out of the connected Zoho org |
| `src/integrations/zoho/zoho.customers.js` | Riders → Zoho contacts |
| `src/integrations/zoho/zoho.invoices.js` | Tax invoices and credit notes → Zoho |
| `src/integrations/zoho/zoho.payments.js` | Payments, deposits (as advances), deposit refunds |
| `src/integrations/zoho/zoho.expenses.js` | Expenses and vendors |
| `src/integrations/zoho/zoho.hooks.js` | Non-blocking event wiring |
| `src/integrations/zoho/zoho.controller.js`, `zoho.routes.js` | Admin API |

**Frontend**

| File | Purpose |
|---|---|
| `pages/accounting/AdminGstDocuments.jsx` | Invoice/credit-note register, period summary, credit note dialog |
| `pages/accounting/AdminZohoSync.jsx` | Connection health, id mapping, push, retry |

### Modified files

**Backend** — `config/env.js` and `.env.example` (ZOHO\_\* vars), `app.js`
(route mount), `models/User.js` (`billing` block: GSTIN, company, state,
address), `models/Expense.js` (vendor, GSTIN, tax rate, taxable value, input
tax, ITC eligibility, SAC, reference), `finance/accounting.service.js` (ITC
derivation + claimable/lost totals), `finance/finance.controller.js` and
`finance.routes.js` (GST endpoints), `bookings/bookings.service.js` (hook on
COMPLETED / CANCELLED), `wallet/wallet.service.js` (deposit refund hook).

**Frontend** — `services/adminService.js`, `AdminRoutes.jsx`,
`utils/adminSidebarMenu.js`, `pages/AdminAccounting.jsx` (vendor/GSTIN/GST-rate
fields plus a live "ITC claimable" indicator).

### API endpoints

```
GET    /api/admin/finance/gst/documents
GET    /api/admin/finance/gst/documents/:id
GET    /api/admin/finance/gst/summary
POST   /api/admin/finance/gst/invoices/booking/:bookingId   (SUPER_ADMIN)
POST   /api/admin/finance/gst/documents/:id/credit-note     (SUPER_ADMIN)

GET    /api/admin/zoho/status
GET    /api/admin/zoho/config
GET    /api/admin/zoho/lookups
GET    /api/admin/zoho/sync
PUT    /api/admin/zoho/config                               (SUPER_ADMIN)
POST   /api/admin/zoho/customers/sync                       (SUPER_ADMIN)
POST   /api/admin/zoho/push/:kind                           (SUPER_ADMIN)
POST   /api/admin/zoho/sync/:id/retry                       (SUPER_ADMIN)
```

There is deliberately no update or delete route for a tax invoice.

---

## Design rules

These are load-bearing. Breaking any of them breaks filing.

- **Invoices are issued on booking `COMPLETED`, not `CONFIRMED`.** By then late
  fees and damage are known and the amount is final. Invoicing earlier would
  mean voiding a document every time a booking was cancelled, and a void leaves
  a gap in the filed series that the CA has to explain.
- **An issued invoice is immutable.** Corrections are credit notes. The
  original stays exactly as filed.
- **Numbering is atomic and gapless per financial year** (`VG/2026-27/00001`,
  credit notes `CN/...`), from a `LedgerSequence` counter. 16 characters, which
  is the GST ceiling.
- **Every push is idempotent**, keyed on `ZohoSync (entity, localId)`. A retry
  after a timeout must never produce a second filed invoice.
- **Security deposits go to Zoho as advances** (`is_advance_payment: true`, no
  `invoices[]`). They are a liability, not a supply, and attract no GST.
- **Late fees are tax-inclusive** and sit outside both `booking.totalAmount`
  and `booking.taxAmount`. The ledger (E11) and the invoice builder must agree
  on this.
- **Issuing a GST document does not depend on Zoho.** It is a legal obligation
  whether or not anyone connected an accounting tool. Only the push is gated on
  `ZOHO_ENABLED`.
- **Zoho ids are never hard-coded.** They are per-organisation and live in
  settings, edited from the Mapping tab.

---

## Tested

All against the `indianbitebackup` test cluster with real booking data, on
2026-11-21. Test documents and counters were deleted afterwards; the cluster
was left as found.

**Pure logic — 28 assertions.** GSTIN validation, state code extraction from
GSTIN, intra vs inter-state split, odd-paise rounding, inclusive split,
financial year boundaries (31 Mar vs 1 Apr), tax apportionment across line
items, late fee handling.

**End to end — 29 assertions.**

- Booking EVR-40073 (rental ₹1,670, tax ₹84, deposit ₹1,750) → `VG/2026-27/00001`,
  CGST ₹42 + SGST ₹42, deposit excluded, total ₹1,754 = ₹3,504 − ₹1,750
- Re-issuing returned the same invoice and did not advance the counter
- Booking EVR-48412 (late fee ₹3,623) → late fee line net ₹3,450.48 + own GST
  ₹172.52; invoice tax ₹256.52 against a booking `taxAmount` of ₹84
- Partial credit note left the invoice `ISSUED`; crediting the balance moved it
  to `CANCELLED`; over-crediting and a missing reason were both refused
- GST summary netted credit notes off and reconciled

### A real bug this caught

The first version treated the late fee as a net amount and apportioned only
`booking.taxAmount` across all lines. That silently dropped the GST on the late
fee — ₹172.52 on one real booking — and under-taxed the other lines as well.
Fixed by splitting the late fee as tax-inclusive, matching ledger event E11.

---

## Not done

1. **No Zoho credentials, so nothing has been pushed to Zoho.** The entire push
   half is unverified against the live API. Everything above was tested without
   it.
2. **The admin screens have not been opened in a browser.** They compile and
   the production build passes, but no one has clicked through them.
3. **Nothing is committed.** 15 modified and 7 new files are sitting in the
   working tree.
4. **`npm install` is needed** — `xlsx` is in `package.json` but not installed.
   Pre-existing, unrelated to this work, but it stops `app.js` importing.
5. **Expense category → Zoho account mapping is unset.** The UI is there; the
   values need picking once an org is connected.
6. **Existing bookings have no tax invoices.** Only new completions are
   invoiced automatically. A backfill decision is needed: whether to issue
   documents for past bookings at all, and if so from which date — issuing them
   now would date them today, which is wrong for a period already filed.

---

## To go live

1. Create a Zoho Books organisation (India region).
2. At `api-console.zoho.in`, create a **Self Client**. Note the Client ID and
   Client Secret.
3. On the Generate Code tab, scope `ZohoBooks.fullaccess.all`, 10 minutes.
   Exchange the grant code for a refresh token:

   ```
   curl -X POST "https://accounts.zoho.in/oauth/v2/token" \
     -d "grant_type=authorization_code" \
     -d "client_id=..." -d "client_secret=..." -d "code=..."
   ```

4. Zoho Books → Organisation Profile → Organisation ID.
5. Fill `Backend/.env`:

   ```
   ZOHO_ENABLED=true
   ZOHO_ACCOUNTS_URL=https://accounts.zoho.in
   ZOHO_API_BASE_URL=https://www.zohoapis.in/books/v3
   ZOHO_CLIENT_ID=
   ZOHO_CLIENT_SECRET=
   ZOHO_REFRESH_TOKEN=
   ZOHO_ORGANIZATION_ID=
   ```

   Use the `.com` hosts for a US-region org. A token from the wrong data centre
   is accepted at creation but fails every API call with 401.

6. Restart. Open **Accounting → Zoho Books**. The Connection tab should show
   the organisation name.
7. Mapping tab → **Load from Zoho** → pick the bank account, cash account, GST
   tax ids and expense accounts → set the supplier state → Save.
8. Complete one test booking and confirm the invoice appears in Zoho.

Only the `.env` values are secrets. Everything else is configuration held in
the database and edited from the Mapping tab.
