# Duti Heritage — Production README

Indian fashion ecommerce: **storefront + Next.js API + MongoDB + Firebase Auth + Razorpay + Cloudinary**.

This is the source of truth for how the app runs today and what we will build next to make **`/admin` production-grade**.

---

## Product map (do not mix these up)

| Surface | URL | Who |
|---------|-----|-----|
| Storefront | `/` | Customers |
| Customer account | `/account` | Logged-in shoppers (orders, wishlist, addresses) |
| Admin panel | `/admin` | Staff only |

The black **ADMIN** pill on the store is a shortcut. It is **not** the customer dashboard. Production work happens in `/admin`.

---

## Stack

- **App:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **DB:** MongoDB (Mongoose)
- **Auth:** Firebase Auth (client) + Firebase Admin (API ID tokens)
- **Payments:** Razorpay prepaid + COD / partial COD
- **Media:** Cloudinary (client compresses, then upload)
- **Email:** Resend
- **WhatsApp:** optional provider (Interakt / Wati / none)
- **Jobs:** cron routes + `CRON_SECRET`

---

## Local setup

```bash
cd frontend
cp .env.example .env.local   # then fill real secrets (or use existing .env)
npm install
npm run seed                 # catalog + default coupons / COD settings
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Admin: sign in at `/admin/login` with an email listed in `ADMIN_EMAILS` (or Staff collection). Shoppers use `/account`. Full page-by-page staff guide: **[ADMIN_README.md](./ADMIN_README.md)**.

**Never commit** `.env` / `.env.local`. Templates only: `.env.example`, `.env.test.example`.

Required env (see `.env.example`): `MONGODB_URI`, Firebase public + Admin, `ADMIN_EMAILS`, `CRON_SECRET`. Optional: Razorpay, Cloudinary, Resend, WhatsApp, Meta Pixel.

---

## Scripts

```bash
npm run dev          # development
npm run build        # production build
npm run start        # serve production build
npm run seed         # upsert catalog
npm run seed:wipe    # wipe then seed (destructive)
npm run test:smoke   # health
npm run test:api     # API suite
npm run test:e2e     # Playwright
npm run test:all     # all of the above
```

Testing details: [TESTING.md](./TESTING.md).

---

## Admin today vs production target

### Already in `/admin`

Dashboard, products (CRUD + bulk), collections, orders (status, CSV update, invoices), customers, insights, reports, reviews, groups, coupons, automations, site content, COD settings, staff roles, WhatsApp pages, system logs.

This is an **ops starter**, not a full production commerce admin.

### Explicitly out of scope

| Item | Decision |
|------|----------|
| Courier APIs (Shiprocket, Delhivery, etc.) | **Out.** Staff ships **manually** (type courier + AWB + tracking URL). |
| 2FA | **Out** for this roadmap. |

---

## Production admin roadmap

Implement in order. Do not skip A.

### Phase A — Order workspace — **done**

The store runs on orders. Live at `/admin/orders` and `/admin/orders/[orderId]`.

- Search: order ID, phone, email, name, AWB
- Filters: status, date, COD vs prepaid, city
- Pagination (25 per page, server `total` / `page`)
- Confirm / Hold / Cancel with **reason** (required for hold/cancel) + customer email/WhatsApp
- Manual shipping fields: courier name, AWB, tracking URL (no courier API)
- Internal **notes**, tags, **timeline** (who changed what, when)
- Packing slip: `/admin/orders/[orderId]/pack`

**Done when:** a packer can find an order, confirm it, add AWB by hand, and see a full history.

### Phase B — Inventory + GST — **done**

Live at `/admin/inventory`, product edit (HSN / GST / stock), checkout, and `/admin/orders/[orderId]/invoice`.

- Size/SKU stock on the product; checkout **atomically** decrements (`$elemMatch` + `$inc`) and **blocks oversell**
- Failed stock decrement **rolls back** the order (does not swallow the error)
- Low / out-of-stock **alerts** on the dashboard and `/admin/inventory`
- Bulk stock CSV (`/admin/products/bulk-inventory`) with movement log
- **Stock history** (order / cancel / return / admin / CSV)
- Product **HSN** + **GST %** (prices are GST-inclusive)
- **GST tax invoice**: GSTIN, HSN, taxable split, CGST/SGST vs IGST from buyer state
- Store identity via `STORE_*` / `NEXT_PUBLIC_STORE_*` env (see `.env.example`)

**Done when:** stock cannot go negative in checkout, and invoices are GST-usable.

### Phase C — Customers + settings hub — **done**

Live at `/admin/customers`, `/admin/customers/[id]`, and `/admin/settings`.

- Customer 360: orders (with payment method), LTV, full address, carts, reviews, notes
- Filters: new / repeat / high LTV / COD / frozen-or-blocked
- **Freeze** (no checkout) and **block COD** (online still allowed) with a reason
- CSV: customers export on the list; orders export stays on `/admin/orders`; ads audience on customers + insights
- **Settings hub**: GSTIN / legal entity, prepaid on/off, tax defaults (HSN/GST for new products), SEO title/description, feature flags, email/WhatsApp test send
- COD pincode/charges moved into Settings (old `/admin/settings/cod` redirects)

**Done when:** support can open one customer and see everything; store config is not scattered.

### Phase D — Access control — **done**

Live at `/admin/login` and `/admin/audit`. Storefront **Admin** pill shows only for staff emails (`ADMIN_EMAILS` and invited staff), never for shoppers.

- Dedicated **staff login** at `/admin/login` (email/password). Non-staff accounts are signed out.
- **Roles with real permissions:**
  - **Manager** — orders, inventory, customers, reviews, WhatsApp. Cannot change products/prices, coupons, settings, or staff.
  - **Admin** — catalog + settings. Cannot manage Superadmin staff list.
  - **Superadmin** — everything, including staff invites.
- **Audit log** of order status, product create/edit/delete, customer freeze/COD block, settings, and staff changes
- **Idle session timeout** (30 minutes) on `/admin`

**Done when:** a manager cannot do Superadmin actions, and every sensitive change is logged.

### Phase E — Speed + returns + content + inbox — **done**

- Global search **Cmd/Ctrl+K** (orders, customers, products) from any `/admin` page
- **New-order toast** while staff are in the dashboard
- **Returns / exchanges** queue at `/admin/returns` (customer request from `/account/orders` or staff file from the order) → approve / reject / restock / refund
- **Refunds**: full or partial on the order. Razorpay refund when a prepaid payment id exists; COD is marked refunded
- Homepage **banner builder** on `/admin/content` (image, link, headline, start/end schedule)
- WhatsApp inbox: unread filter, assign to me, canned replies, latest order card in the thread

**Done when:** daily work is search-first; returns/refunds have a queue; marketing can change homepage without a deploy.

### Phase F — Make complete admin easy — **done (F1–F7)**

Plan + todos: **[ADMIN_EASE_README.md](./ADMIN_EASE_README.md)**.

Same features as A–E. Staff-facing words are now plain language on every `/admin` page.

**Done when:** a new Manager understands every `/admin` screen in seconds. Same buttons/features; plain language only. Courier APIs and 2FA stay out.

---

## Later (after F, not this roadmap)

- Duplicate-order / COD fraud rules
- DPDP data download + delete queue
- Store credit / gift cards
- Google Merchant / Meta catalog export
- Sentry, staging DB, Mongo backups, uptime checks
- Customer cancel/return request from `/account`
- Maintenance mode

---

## Architecture notes

- Storefront catalog: `src/services/db.ts` + server actions (SEO). Do not call Mongo from client components.
- Admin writes: `Authorization: Bearer <Firebase ID token>` via `src/lib/admin-api.ts`.
- Checkout totals are recalculated on the server (`/api/checkout/place-order`).
- After seed, clear the browser cart (IDs become Mongo ObjectIds).

---

## URLs (local)

- Store: http://localhost:3000
- Account: http://localhost:3000/account
- Admin: http://localhost:3000/admin

---

## Docs

| File | Purpose |
|------|---------|
| This README | Production overview + admin phases A–E (done) and F (planned) |
| [ADMIN_README.md](./ADMIN_README.md) | **How to use every `/admin` page** (staff handbook) |
| [ADMIN_EASE_README.md](./ADMIN_EASE_README.md) | **Phase F:** F1–F7 done |
| [TESTING.md](./TESTING.md) | Test suite status and requirements |
| [HANDOFF_README.md](./HANDOFF_README.md) | Historical frontend handoff (older; prefer this README for current ops) |
| `.env.example` | Env template |
