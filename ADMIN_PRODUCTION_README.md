# Make admin production-level — plan (Phase H)

**Status: H5 done. Phase H complete.**

Storefront **G1–G7 is done**. Admin ease **F1–F7 is done** (plain language). This file is the next production phase: **honest `/admin`**, not a new panel and not the customer shop.

Staff handbook: [ADMIN_README.md](./ADMIN_README.md)  
Admin ease (done): [ADMIN_EASE_README.md](./ADMIN_EASE_README.md)  
Storefront production (done): [STOREFRONT_PRODUCTION_README.md](./STOREFRONT_PRODUCTION_README.md)  
How the app runs today: [README.md](./README.md)

Same file at the monorepo root: [../ADMIN_PRODUCTION_README.md](../ADMIN_PRODUCTION_README.md)

---

## What this is

Turn staff admin into a **real shop floor**: WhatsApp that actually sends or clearly does not, refunds that match the bank, stock a Manager can fix, Home numbers that are true, coupons that can expire, returns that refund the right amount.

It is **not** a new admin. Keep current layout and Phase F words unless a gap cannot be fixed with copy and behaviour.

---

## What already works (do not rebuild)

| Area | Today |
|------|--------|
| Shell | Staff login, roles, idle logout, Ctrl+K, new-order toast, “what to do here” |
| Orders | Search, confirm / pause / cancel, tracking by hand, timeline, notes, bulk spreadsheet, packing slip, GST invoice |
| Returns | Queue: approve / reject / restock / refund (customer can request from Account) |
| Customers | 360 view, freeze, COD block, notes, export |
| Catalog | Products, collections, bulk offers (Admin+) |
| Settings | GSTIN, prepaid, COD pins, tax defaults, SEO, test send |
| Other | Reviews, auto messages on/off, staff invites (Superadmin), audit log, sales charts |

Courier booking APIs stay **out**. Staff still type courier + tracking by hand.

---

## What is wrong today (gaps)

Grouped the way staff hit them. This is the work list. Do not treat it as “redesign admin.”

### Honesty (live-site risk)

| Gap | Why it matters |
|-----|----------------|
| WhatsApp “Send to many” shows success; API only logs | Staff think customers were told |
| Prepaid refund can mark “money back” without Razorpay | Ledger says refunded; customer may get nothing |
| WhatsApp analytics/logs marked Mock or empty | Staff make decisions on fake charts |

### Stock for the people who pack

| Gap | Why it matters |
|-----|----------------|
| Managers see low stock, cannot open Products / bulk stock | Floor staff cannot restock |
| Stock page is alerts only — no quick quantity | Extra clicks; oversell while waiting |
| New product **Track stock** defaults off | Easy to oversell until someone notices |

### Numbers and discounts

| Gap | Why it matters |
|-----|----------------|
| Home revenue / “waiting to confirm” from last ~100 orders | Wrong money on a busy day |
| Discount codes: no expiry, no usage cap, no edit | Unlimited / never-ending promos |

### Returns and money clicks

| Gap | Why it matters |
|-----|----------------|
| Return refund can use full order total, not remaining | Double refund or failed refund |
| Refund from “requested” can skip restock | Money back, stock still “sold” |
| Pause / cancel / refund amount via browser `prompt` | Easy to mistype money |

### Spreadsheets and reports

| Gap | Why it matters |
|-----|----------------|
| Bulk product import rejects Excel (CSV only) | India ops live in `.xlsx` |
| Same slug on import **updates** silently | Can overwrite a live product |
| Email reports pre-fill a personal Gmail | Wrong inbox / leak ops data |

### Out of this phase (still true, not H)

| Gap | Decision |
|-----|----------|
| No Shiprocket / Delhivery | Out. Manual tracking stays |
| Homepage editor is raw `Label\|/path` text | Ugly but works; not H |
| Exchange is a type flag, not swap-SKU | Later |
| Automations: no copy editor | Later |
| Gift cards, fraud rules, Sentry, 2FA | Later / out |

---

## Rules (do not skip)

1. **This README first.** Do not start admin code until H1 is started on purpose.
2. Implement **in order**: H1 → H2 → H3 → H4 → H5. Do not skip H1.
3. **Do not redesign admin** unless a todo in that phase says the UI must change.
4. **Do not change the storefront** except where a phase must reuse storefront return/invoice behaviour already shipped in G.
5. Shipping stays **manual**: courier name, tracking number, tracking URL.
6. Never commit `.env` / `.env.local`.
7. Never show **success** for a send, refund, or restock that did not happen. Prefer a clear fail.

### Out of scope

| Item | Decision |
|------|----------|
| Courier APIs | Out |
| 2FA | Out |
| New admin theme | Out |
| Gift cards, Sentry, Hindi admin, visual menu builder | Out of H |
| Storefront G | Already done. Do not reopen |
| Admin ease F | Already done. Keep F words; fix honesty underneath |
| WhatsApp / Razorpay **keys** | Ops: put keys in Vercel. Code must **refuse fake success** when keys missing |

---

## Done when (whole of H)

- WhatsApp broadcast either **sends** or **says it cannot** — never a fake “sent to N.”
- Prepaid refund either **hits Razorpay** or staff must confirm **manual** (COD/cash) — never silent “done.”
- A Manager can **fix stock** without an Admin password.
- Home numbers match **all** orders in the period, not a 100-row sample.
- A discount code can **expire** and have a **usage cap**.
- Return refund uses **remaining** money; restock is explicit before or with refund, not skipped by accident.
- Product spreadsheet import accepts **Excel** and warns before overwriting a slug.

---

## Phase H0 — This README — **done**

- [x] Write production plan with phases and todos from the admin gap review
- [x] Do **not** change admin screens until H1 is started on purpose

**Done when:** this document is in the repo (root + `frontend/`) and `/admin` UI is unchanged.

---

## Phase H1 — Honesty (WhatsApp + refunds)

### Todos

- [x] WhatsApp **Send to many**: if no provider/keys, disable the button and say why. If keys exist, actually send (or reuse the real group-send path). **Delete or hide fake success.**
- [x] WhatsApp analytics: remove **Mock** charts or label them “not live yet” and hide fake “top queries.” Logs must use the same auth as the rest of admin.
- [x] Prepaid refund: call Razorpay when `razorpayPaymentId` + keys exist. If not, **do not** mark refunded unless staff pick **“I paid them outside Razorpay”** (manual). Show that on the order.
- [x] COD / never-paid: “refund” is a status note, not a bank transfer — copy must say so.

**Done when:** a staff member cannot believe a WhatsApp or a refund happened when it did not.

---

## Phase H2 — Stock the packers can fix

### Todos

- [x] **Manager** can change quantity: either open Stock with an inline qty, **or** a restock screen that is not behind Products-only. Do not leave “open the product” help that they cannot open.
- [x] New product: **Track stock on** by default (or force sizes + qty before save).
- [x] Stock page: one obvious way to set qty for a size without a full product edit.
- [x] Keep movement history. Do not build courier reverse-pickup.

**Done when:** a Manager can take an item from 0 to 5 without an Admin.

---

## Phase H3 — Home numbers + discount codes

### Todos

- [x] Home: today’s revenue, order count, and “waiting to confirm” from the **server** (full period), not `limit=100` in the browser.
- [x] Discount codes: **expiry date**, **total uses**, **per-customer uses** on create.
- [x] Allow **edit** of an existing code (limits, expiry, on/off) without delete+recreate.
- [x] Do not rewrite coupon math/scope (already shipped). Only the missing fields + edit.

**Done when:** Home can be trusted on a 200-order day, and a sale code can die at midnight.

---

## Phase H4 — Returns money (right amount, right stock)

### Todos

- [x] Refund amount default = **remaining** (order total minus already refunded), never blindly full total.
- [x] Cannot refund an open return without **approve**; restock is a separate, visible step (or a clear “refund without restock” confirm).
- [x] Replace `prompt`/`confirm` for refund amount, pause reason, and cancel reason with a small modal (same look as storefront return modal — no new theme).
- [x] Copy: exchange vs return — restock still allowed; do not silently rename the order in a way staff cannot explain.

**Done when:** a partial return cannot refund the whole order twice, and stock is not left “sold” after a restock they thought they did.

---

## Phase H5 — Spreadsheet import + reports hygiene

### Todos

- [x] Bulk product import: accept **.xlsx** as well as CSV (same columns as today).
- [x] If slug already exists: show **update vs skip** (or a confirm), not a silent overwrite.
- [x] Where the UI says “spreadsheet,” accept Excel **or** CSV — do not error on `.xlsx` after F promised a spreadsheet.
- [x] Email reports: default recipient = store **support email** / staff email, **not** a hardcoded personal Gmail.
- [x] Optional: hide or redirect the fake WhatsApp broadcast page if H1 already killed it — do not leave two send screens that disagree.

**Done when:** a merchandiser can upload the Excel they already use, and reports do not go to a leftover Gmail.

---

## Ops checklist (not a code phase)

Do this on Vercel when going live. Do not mix into H1–H5 code PRs.

- [ ] Razorpay live keys if you refund prepaid from admin
- [ ] WhatsApp provider only if broadcast will actually send
- [ ] Store GSTIN filled in Settings before printing invoices
- [ ] `ADMIN_EMAILS` / staff invites match who should log in
- [ ] Report email goes to a shop inbox, not a personal leftover

---

## How to start work

1. Leave this file as the source of truth. Tick boxes when a phase ships.
2. Say **“H1 start”** (same style as F1–F7 / G1–G7). Only then change code.
3. After each phase: production **build check**. Commit/push only when asked.
4. Do not open H3 while H1 still fakes WhatsApp success.

---

## File map (when a phase starts — do not edit until then)

| Phase | Main files (likely) |
|-------|---------------------|
| H1 | `src/app/admin/whatsapp/broadcast/page.tsx`, `src/app/api/bot/broadcast/route.ts`, `src/lib/order-refund.ts`, `src/app/api/orders/[id]/refund/route.ts` |
| H2 | `src/app/admin/inventory/page.tsx`, `src/lib/rbac.ts`, `src/components/admin/ProductForm.tsx` |
| H3 | `src/app/admin/page.tsx`, `src/app/admin/coupons/page.tsx`, `src/app/api/coupons/route.ts` |
| H4 | `src/app/admin/returns/page.tsx`, `src/app/api/returns/[id]/route.ts`, `src/app/admin/orders/[id]/page.tsx` |
| H5 | `src/app/api/products/bulk-import/route.ts`, `src/app/admin/products/bulk-import/`, `src/app/admin/reports/page.tsx` |
