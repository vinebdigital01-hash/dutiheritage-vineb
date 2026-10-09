# WhatsApp bot ↔ Next.js API — plan (Phase W)

**Status: W6 done. Phase W complete.**

**Scope:** Next.js website APIs and admin UI only.  
**Out of scope:** the Express bot (`dutiheritage-bot`). Do not edit that codebase here.

The bot talks to this app over HTTP with header `x-bot-api-key` (= `process.env.BOT_API_KEY`).  
When Next.js needs to text a shopper, it POSTs to the bot notify URL (see Env).

Same file at the monorepo root: [../BOT_WHATSAPP_README.md](../BOT_WHATSAPP_README.md)

Related: [NEXT_PRODUCTION_README.md](./NEXT_PRODUCTION_README.md) (Phase I shop polish — done).

---

## What this is

Make the **Next.js side** reliable for the live WhatsApp bot:

- Stop offline QR claim from 500ing on `Order.create`
- Finish missing bot routes the Express app already expects (or will call next)
- Keep admin QR tooling and loyalty / negotiation / waitlist on the website DB

It is **not** a bot rewrite and **not** a storefront redesign.

---

## What already works (do not rebuild)

Audited against the current tree. Leave these alone unless a phase says otherwise.

| Area | Today |
|------|--------|
| Bot auth helper | `src/lib/bot-auth.ts` → `validateBotApiKey` (`x-bot-api-key` **or** Firebase admin session) |
| Catalog | `GET /api/bot/products` (`?category=` / `?search=`) → `{ products: [...] }` |
| Product by slug | `GET /api/bot/products/[slug]` |
| Orders by phone | `GET /api/bot/orders?phone=` → `{ orders: [...] }` (wrapped object — keep unless bot needs a bare array) |
| Order by id | `GET /api/bot/orders/[id]` → `{ order: {...} }` |
| Customer lookup | `GET/POST /api/bot/customers/verify` (no VIP yet — W4) |
| Personalized coupon create | `POST /api/bot/coupons` (percent + product + expiry) — reuse for negotiation approve; do not duplicate blindly |
| Chat / categories / settings / auth | Present under `/api/bot/*` with bot key (settings has a tiny typo — W1) |
| Shipped email / Interakt-Wati | Admin status → Shipped already runs `sendOrderShipped` — **not** the bot `/api/notify` webhook yet (W6) |
| Abandoned cart email cron | Hourly `/api/cron/abandoned-carts` — **not** the 30‑minute WhatsApp bot check-in (W6) |
| Email restock waitlist | `StockNotify` for storefront email — **not** phone waitlist for WhatsApp (W5) |

**Not required as a “fix”:** rewriting products/orders contracts that already return clean JSON.

---

## Gaps (only what is still required)

### Crash / trust blockers

| Gap | Why it matters |
|-----|----------------|
| No `OfflineClaim` model / admin create / bot claim | QR offline flow cannot complete |
| Offline `Order.create` missing required shipping fields | Order schema requires `customer.address/city/state/pinCode` → **500** without placeholders |
| No `walletBalance` / loyalty on claim | Bot cannot promise ₹100 wallet text |
| Some `/api/bot/*` admin routes skip `validateBotApiKey` | `broadcast`, `analytics`, `logs`, `canned` use Firebase only — inconsistent with “all bot routes” rule |
| Env docs missing `BOT_API_KEY` / `BOT_SERVER_URL` / `BOT_PHONE` | Ops and QR URLs break silently |

### Missing bot UX APIs

| Gap | Why it matters |
|-----|----------------|
| No admin offline-sales QR page | Staff cannot print Claim-Order QR |
| No `POST /api/bot/returns` + `ReturnRequest.imageUrl` | Bot cannot open a return ticket with defect photo |
| Verify has no `isVIP` | Bot cannot auto-offer VIP 5% |
| No `negotiation/request` + `negotiation/approve` | Admin WhatsApp “Give 10%” has nowhere to land (coupons route alone is not the full flow) |
| No `POST /api/bot/waitlist` + restock → bot notify | OOS subscribers never get WhatsApp restock |
| No bot abandoned checkout tracker (30 min) | Payment-link drop-offs not nudged on WhatsApp |
| Shipped does not POST bot `/api/notify` | Tracking text never hits the WhatsApp channel the bot owns |

### Explicitly skipped (not required from audit)

- Rebuilding Express bot UI / Razorpay link generation  
- Replacing Interakt/Wati templates already used for email/SMS-style WA  
- Changing `{ orders: [...] }` → bare array unless the bot crashes on the wrap  
- Chat handoff schema fields (`needsHumanReview` etc.) — only if the bot already depends on them and flags are lost (track separately if needed)

---

## Env (document in W1 — never commit secrets)

| Variable | Used for |
|----------|----------|
| `BOT_API_KEY` | Incoming `x-bot-api-key` from Express bot |
| `BOT_SERVER_URL` | Base URL of Express bot (e.g. `http://localhost:4000` or production) |
| `BOT_PHONE` | Digits for admin QR: `https://wa.me/<BOT_PHONE>?text=Claim-Order-XXXXXX` |
| Notify path | `POST {BOT_SERVER_URL}/api/notify` body `{ phone, message }` |

Also align other code that still reads `WHATSAPP_BOT_API_KEY` (merge OTP / profile) so one key name is canonical — prefer `BOT_API_KEY`, fallback only if needed.

---

## Phases

### W0 — This README

- [x] Audit `/api/bot/*`, models, admin pages, crons, env example  
- [x] Write this README (frontend + root copy)  
- [x] Do **not** change product code until W1 is started on purpose  

---

### W1 — Bot API hardening (security + env + tiny bugs)

**Todos**

- [x] Ensure every route under `src/app/api/bot/*` uses `validateBotApiKey` (bot key **or** admin session) — including `broadcast`, `analytics`, `logs`, `canned`  
- [x] Document `BOT_API_KEY`, `BOT_SERVER_URL`, `BOT_PHONE` in `.env.example` (no real secrets)  
- [x] Fix `await await validateBotApiKey` typo in `api/bot/settings`  
- [x] Phone matching on bot order/customer routes: normalize last-10 digits so `91…` / `+91…` / bare mobile all hit the same customer  

**Done when:** bot and admin panel both auth cleanly; env is documented; no double-await.

---

### W2 — Offline claim (stop the 500) + loyalty wallet

**Todos**

- [x] Model `OfflineClaim`: `claimId` (string), `productId`, `size`, `isClaimed` (default false), `claimedByPhone`; export from `models/index.ts`  
- [x] `Customer.walletBalance` Number default `0`  
- [x] `POST /api/admin/offline-claims` `{ productId, size }` → 6-char `claimId`, save, return `{ claimId }`  
- [x] `POST /api/bot/offline-claims/claim` `{ claimId, phone }`:  
  - 400 if already claimed  
  - mark claimed + phone  
  - find/create Customer; add **100** to `walletBalance`  
  - `Order.create` with offline placeholders so validation never 500s:  
    - `customer.address: "Offline Store Purchase"`  
    - `city: "Offline"`, `state: "Offline"`, `pinCode: "000000"`  
    - `paymentMethod: "prepaid"`, `paymentStatus: "paid"`  
    - `status: "Delivered"`  
    - `timeline: [{ status: "Delivered", action: "placed", message: "Offline purchase", date: new Date() }]`  
    - plus all other Order required fields (`orderId`, items, totals, customer name/phone, etc.)  
  - return `{ …, loyaltyEarned: 100 }`  

**Done when:** claim succeeds end-to-end without Mongoose validation errors; wallet increments once.

---

### W3 — Admin offline QR UI

**Todos**

- [x] `src/app/admin/offline-sales/page.tsx` — pick product + size → call admin create claim  
- [x] Show large QR via `qrcode.react` for  
  `https://wa.me/<BOT_PHONE>?text=Claim-Order-${claimId}`  
- [x] Add nav link under admin (same pattern as other ops pages)  
- [x] Install `qrcode.react` only if missing  

**Done when:** staff can generate a printable claim QR without leaving admin.

---

### W4 — Smart WhatsApp returns + VIP flag

**Todos**

- [x] `ReturnRequest.imageUrl` optional string  
- [x] `POST /api/bot/returns` `{ phone, orderId, reason, imageUrl }` → create admin return ticket (`source` e.g. `whatsapp` or keep enum honest)  
- [x] `GET /api/bot/customers/verify`: if customer has **> 3** completed/delivered orders → `isVIP: true` in JSON (keep existing `customer` payload)  

**Done when:** bot can open a photo return ticket; VIP JSON is truthful.

---

### W5 — Admin-approved negotiation + waitlist / restock

**Todos**

- [x] `POST /api/bot/negotiation/request` `{ customerPhone, productId }` → customer “story” (e.g. first-time vs loyal with N past orders) for admin WhatsApp prompt  
- [x] `POST /api/bot/negotiation/approve` → create **24h** personalized coupon restricted to that phone (reuse Coupon model; code like `NEERAJ10` / product-scoped as needed); return coupon details to bot  
- [x] Prefer extending/clarifying vs duplicating `POST /api/bot/coupons`  
- [x] `POST /api/bot/waitlist` — phone + product (+ size if tracked)  
- [x] On inventory update to **> 0**, notify waitlist via `POST {BOT_SERVER_URL}/api/notify` once each; mark notified  

**Done when:** admin can approve a one-shot phone coupon from WhatsApp; restock texts fire from Next.js.

---

### W6 — Abandoned WhatsApp checkout + shipped → bot

**Todos**

- [x] `POST /api/bot/tracking/abandoned` — log phone (+ optional product/cart meta) when checkout/payment link starts  
- [x] Cron (or scheduled route) ~every 10–15 min: if **30 minutes** passed and **no Order** for that phone/session → `POST …/api/notify` with the check-in message; mark so it does not spam  
- [x] When admin marks order **Shipped** and tracking is set (`/api/orders/[id]` and bulk-update paths), also notify bot:  
  `{ phone, message: "… shipped … Track: [link]" }`  
  Keep existing `sendOrderShipped` email/provider flow — **add** bot notify, do not remove it  

**Done when:** payment drop-offs get one WhatsApp nudge; shipped orders text tracking on the bot channel.

---

## How to start work

1. This file is the source of truth. Tick boxes when a phase ships.  
2. Say **“W1 start”** (same style as I1 / G1). Only then change code.  
3. After each phase: smoke the bot routes with `x-bot-api-key` (and admin UI where relevant). Commit/push only when asked.  
4. Do not open W5–W6 while offline claim (W2) still 500s.

---

## File map (likely — do not edit until the phase starts)

| Phase | Main files (likely) |
|-------|---------------------|
| W1 | `lib/bot-auth.ts`, `api/bot/*`, `.env.example` |
| W2 | `models/OfflineClaim.ts`, `models/Customer.ts`, `api/admin/offline-claims`, `api/bot/offline-claims/claim` |
| W3 | `admin/offline-sales/page.tsx`, package.json (`qrcode.react`) |
| W4 | `models/ReturnRequest.ts`, `api/bot/returns`, `api/bot/customers/verify` |
| W5 | `api/bot/negotiation/*`, waitlist model/route, inventory update hooks |
| W6 | `api/bot/tracking/abandoned`, cron route + `vercel.json`, `api/orders/[id]` + bulk-update |

---

## Contract notes for the bot developer (Next.js will keep)

| Endpoint | Method | Auth | Notes |
|----------|--------|------|--------|
| `/api/bot/products` | GET | bot key | Already live |
| `/api/bot/orders?phone=` | GET | bot key | Returns `{ orders: [...] }` |
| `/api/bot/orders/[id]` | GET | bot key | Returns `{ order: ... }` |
| `/api/bot/offline-claims/claim` | POST | bot key | W2 |
| `/api/bot/returns` | POST | bot key | W4 |
| `/api/bot/customers/verify` | GET | bot key | W4 adds `isVIP` |
| `/api/bot/negotiation/request` | POST | bot key | W5 |
| `/api/bot/negotiation/approve` | POST | bot key | W5 |
| `/api/bot/waitlist` | POST | bot key | W5 |
| `/api/bot/tracking/abandoned` | POST | bot key | W6 |

Notify (Next.js → bot): `POST {BOT_SERVER_URL}/api/notify` `{ phone, message }`.
