# Testing guide — Duti Heritage storefront / admin / APIs

## Overall status (last full run)

| Suite | Command | Result | Notes |
|-------|---------|--------|--------|
| Smoke | `npm run test:smoke` | **PASS** | Health + Mongo + Firebase Admin flags |
| API | `npm run test:api` | **PASS** (partial) | Public/checkout/security pass; admin & customer auth cases **skipped** without `TEST_ADMIN_*` |
| E2E | `npm run test:e2e` | **PASS** (partial) | Storefront + logged-out admin redirect pass; admin login UI **skipped** without `TEST_ADMIN_*` |
| All | `npm run test:all` | **PASS** | Smoke → API → E2E |

**Typical counts without admin test credentials:** ~26 API passed / ~28 skipped / 0 failed · ~5 E2E passed / 1 skipped.

**To get full green (no auth skips):** add `TEST_ADMIN_EMAIL` + `TEST_ADMIN_PASSWORD` (email must be in `ADMIN_EMAILS`). Optional: `TEST_CUSTOMER_*` for non-admin 403 tests.

---

## Requirements needed

### Must have (for any test run)

| Requirement | Why |
|-------------|-----|
| App running on `TEST_BASE_URL` (default `http://localhost:3000`) | Suite hits live Next.js — start with `npm run dev` |
| `MONGODB_URI` in `.env` / `.env.local` | Catalog, checkout, health |
| Firebase Admin (`FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_ADMIN_*`) | Auth APIs + health flag |
| `ADMIN_EMAILS` set | Admin gate + health check |
| `CRON_SECRET` set | Cron auth tests |
| Catalog seeded (`npm run seed`) | Products/collections/coupons for checkout cases |
| Node deps installed (`npm install`) | `tsx`, Playwright |

### Required for full admin / customer / admin E2E coverage

| Requirement | Why |
|-------------|-----|
| `TEST_ADMIN_EMAIL` + `TEST_ADMIN_PASSWORD` | Firebase email/password user; email **must** be listed in `ADMIN_EMAILS` |
| `TEST_CUSTOMER_EMAIL` + `TEST_CUSTOMER_PASSWORD` (optional) | Non-admin user for **403** security case |
| System Chrome (or `npx playwright install chromium`) | E2E browser (config defaults to `channel: chrome`) |

Copy template from [`.env.test.example`](.env.test.example) into `.env` / `.env.local`:

```env
TEST_BASE_URL=http://localhost:3000
TEST_ADMIN_EMAIL=your-admin@example.com
TEST_ADMIN_PASSWORD=your-admin-password
# optional:
TEST_CUSTOMER_EMAIL=
TEST_CUSTOMER_PASSWORD=
```

### Not required for the current suite

- Live Razorpay payment (tests use **COD**)
- Resend / WhatsApp / Cloudinary delivery asserts
- `PW_WEB_SERVER=1` (only if you want Playwright to start the server itself)

---

## Commands

```bash
npm run test:smoke   # GET /api/health readiness
npm run test:api     # Full API integration suite (scripts/test)
npm run test:e2e     # Playwright storefront + admin UI
npm run test:all     # smoke → api → e2e
```

First-time Playwright browsers (if not using system Chrome):

```bash
npx playwright install chromium
```

---

## What is covered

| Layer | Cases |
|-------|--------|
| Smoke | Health, Mongo connected, admin emails + Firebase Admin flags |
| Catalog | Products, collections, site-content, policy pages |
| Checkout | Config, pincode, coupon validate, guest COD place-order, validation errors |
| Customer | Auth sync, cart sync, track, orders, review eligibility |
| Admin | Product/collection/coupon CRUD, order status, site content, customers/groups/analytics/campaigns/reviews, COD settings |
| Security | 401 without token, bad cron secret, valid cron, non-admin 403 |
| E2E | Collection/product pages, add to cart, checkout form, account form, admin login + dashboard |

---

## Notes

- Prepaid Razorpay capture is out of scope; tests use **COD**.
- Disposable admin entities use a timestamp slug and are cleaned up (`?hard=1` where supported).
- Playwright defaults to system **Chrome**. Set `PW_CHANNEL=` for bundled Chromium, or `PW_CHANNEL=msedge` for Edge.
- Do not commit real passwords.
- API test env loader skips **empty** overrides in `.env.local` so blank placeholders do not wipe `.env` values.
