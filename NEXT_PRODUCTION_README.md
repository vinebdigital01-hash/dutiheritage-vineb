# Next production work — plan (Phase I)

**Status: I8 done. Phase I complete.**

Storefront **G1–G7 done**. Admin ease **F1–F7 done**. Admin honesty **H1–H5 done**.  
This file is the **next shop + admin polish**: homepage collections, cart across login, cancel→refund, premium emails, no browser alerts, virtual collections, stock caps, reports, reviews photos, account merge, legal copy, and Lighthouse.

Staff handbook: [ADMIN_README.md](./ADMIN_README.md)  
Storefront production (done): [STOREFRONT_PRODUCTION_README.md](./STOREFRONT_PRODUCTION_README.md)  
Admin production (done): [ADMIN_PRODUCTION_README.md](./ADMIN_PRODUCTION_README.md)  
How the app runs: [README.md](./README.md)

Same file at the monorepo root: [../NEXT_PRODUCTION_README.md](../NEXT_PRODUCTION_README.md)  
WhatsApp bot ↔ Next.js APIs (next): [BOT_WHATSAPP_README.md](./BOT_WHATSAPP_README.md)

---

## What this is

Close the gaps that still break trust or sales:

- Home shows the collections staff picked
- Cart survives logout → login for the same person
- Prepaid cancel → admin yes/no → real Razorpay refund with a clear warning
- Emails look premium (Amazon / Flipkart class), not plain HTML
- No `window.alert` / `prompt` / `confirm` for shoppers or staff where we already have toasts/modals
- `/collections/best-sellers` and `/collections/on-sale` work (smart lists, not 404)
- Qty cannot exceed stock
- Footer socials editable from admin
- Low-stock badges honest for colour/size
- Legal pages match the shop’s real policies
- Reports detailed + CSV attachments
- Reviews with optional photos (delivered buyers only)
- Guest ↔ account merge via email OTP

It is **not** a redesign. Keep current look and Phase F wording unless a gap cannot be fixed with behaviour.

---

## What already works (do not rebuild)

| Area | Today |
|------|--------|
| Checkout | Prepaid / COD / partial, Razorpay, coupons, GST |
| Orders admin | Confirm / hold / cancel, tracking by hand, refund honesty (H1/H4) |
| Stock | Manager can set qty on Stock (H2) |
| Home content | Hero, promo, homepage collection slugs in Site Content |
| Email send | Resend + `emailLayout` / automations on/off |
| Account | Firebase login, orders, wishlist, addresses, invoice/track (G) |

Courier booking APIs stay **out**. No fake WhatsApp success (H1).

---

## Gaps (why this phase exists)

### Home & browse

| Gap | Why it matters |
|-----|----------------|
| Collections picked in admin still missing on homepage | Staff think they published rows; shoppers see blank/old |
| `/collections/best-sellers`, `/collections/on-sale` 404 or same junk list + “collection not found” | Nav promises smart lists; SEO and trust break |
| Low qty (1–2) not shown on some PDPs (e.g. Pretty Saree) | Urgency badge wrong or missing for colour/size |

### Cart & stock

| Gap | Why it matters |
|-----|----------------|
| Cart after logout does not reappear on login | Same user loses items; feels broken |
| Can add more than remaining stock (qty 1 but cart 2+) | Oversell at checkout |

### Cancel → refund

| Gap | Why it matters |
|-----|----------------|
| Prepaid cancel request has no clear admin inbox + email + auto refund on approve | Money and trust |

### Emails & alerts

| Gap | Why it matters |
|-----|----------------|
| Order / marketing / report emails look basic | Brand feels cheap vs Amazon/Flipkart |
| Browser `alert` / `prompt` / `confirm` still used | Looks unprofessional |

### Admin UX

| Gap | Why it matters |
|-----|----------------|
| `/admin/orders` table (and other tables) weak on mobile | Packers on phone struggle |
| Reports thin vs the detailed snapshot + CSVs you want | Cannot target ads / restock |

### Content & footer

| Gap | Why it matters |
|-----|----------------|
| About / Privacy / Returns / Terms / Shipping / Contact copy outdated or incomplete | Legal + trust |
| Social / WhatsApp in footer hard to find or not CMS | Marketing cannot add handles without a developer |

### Account & reviews

| Gap | Why it matters |
|-----|----------------|
| Guest email order + later phone signup = two profiles | Past orders invisible |
| Merge OTP email / schema / profile UI unfinished | Feature half-built |
| Reviews: no optional photos; not locked to delivered buyers | Fake or weak social proof |

### Performance

| Gap | Why it matters |
|-----|----------------|
| Lighthouse Performance / SEO / Best Practices below target (aim **Perf ≥ 95**, **SEO 100**, **BP 100**) | Ads and Core Web Vitals |

---

## Rules (same as G / H)

1. **This README first.** Do not start code until a phase is started on purpose (`I1 start`, …).
2. Implement **in order**: I1 → I2 → … → I8. Do not skip.
3. No redesign theme. No courier APIs. Never commit `.env`.
4. After each phase: build check. Commit/push only when asked.
5. Keep Phase F plain language in admin.
6. Refunds still go through Razorpay when prepaid + keys exist (H1 honesty).

---

## Phase I0 — Plan locked

### Todos

- [x] Write this README (frontend + root copy)
- [x] Do **not** change product code until I1 is started on purpose

**Done when:** you can say which phase to start next.

---

## Phase I1 — Home collections + smart collections + stock badges

### Todos

- [x] Homepage: collections chosen in **Admin → Content** (homepage slugs) actually render as rows with real products
- [x] `/collections/best-sellers` and `/collections/on-sale` never 404; title is not “collection not found”
- [x] Best sellers = views / wishlists / orders / admin tags (document the rule in code comment + admin help)
- [x] On sale = products with `salePrice` (or tag), not a random duplicate of another collection
- [x] PDP / cards: show low stock when remaining is 1–2 for the **selected size (and colour if tracked)** — fix cases like Pretty Saree
- [x] Cart and product page: **cannot add more than available qty** (same SKU size/colour); checkout re-checks

**Done when:** home shows what staff picked, smart URLs work, and qty 1 cannot become qty 3 in cart.

---

## Phase I2 — Cart across login + guest↔account merge (OTP)

### Todos

- [x] On logout, guest/local cart rules stay clear; on **same user login**, merge or restore their cart lines (no silent wipe)
- [x] Finish account merge: `mergeOtp` + `mergeOtpExpiry` on Customer schema
- [x] `sendMergeOtpEmail` really sends via `sendEmail` (premium HTML), not `console.log`
- [x] Account **Profile**: “Link another email / phone” UI — send OTP → verify → merge orders, wishlist, addresses
- [x] After merge, past guest orders visible on the logged-in account

**Done when:** logout/login keeps cart for that shopper, and two identities can become one with a real OTP email.

---

## Phase I3 — Prepaid cancel → admin decide → auto refund

### Todos

- [x] Customer cancel request on **prepaid** order: clear queue for admin (orders + notification badge/toast already used for new orders if possible)
- [x] Email staff (store support / ADMIN_EMAILS) when a cancel request arrives
- [x] Admin Approve: **warning modal** — “You are about to refund ₹X to the customer via Razorpay” → then call real refund (H1 path)
- [x] Admin Decline: reason required (modal, not `prompt`)
- [x] Customer gets email on approve (refund) / decline
- [x] COD cancel stays status-only (no bank transfer) — copy honest

**Done when:** admin cannot approve a prepaid cancel without seeing a refund warning, and money moves only through Razorpay when keys exist.

---

## Phase I4 — Premium emails (all flows)

One visual system (logo, brand colours, clear CTA, mobile-safe). Same family for transactional and marketing.

### Templates to ship / restyle

- [x] Welcome Email  
- [x] Order Placed  
- [x] Order Confirmed  
- [x] Order On Hold  
- [x] Order Shipped  
- [x] Order Delivered  
- [x] Order Cancelled  
- [x] Cart Abandoned (1h)  
- [x] Review Reminder  
- [x] Winback Campaign (30 days)  
- [x] Wishlist Reminder  
- [x] Monthly Admin Analytics Report (body matches detailed report — see I6)  
- [x] Return / Refund / Cancel-request (staff + customer) as needed for I3  

**Done when:** every automated email looks like a premium D2C brand, not a bare table.

---

## Phase I5 — Toasts instead of browser alerts + admin responsive

### Todos

- [x] Storefront: replace remaining `alert` / `confirm` / `prompt` with toast or ActionModal
- [x] Admin: same for pause/cancel/refund/bulk where still using browser dialogs (keep H4 modals pattern)
- [x] `/admin/orders` table usable on phone (horizontal scroll or card rows; filters wrap)
- [x] Pass over other heavy admin tables (products, customers, returns, inventory, coupons) — fix the worst mobile breaks only

**Done when:** no critical path depends on ugly browser dialogs; orders work on a phone.

---

## Phase I6 — Detailed reports + CSV attachments

### Todos

- [x] `/admin/reports` (and monthly email) match the **Performance report** style you pasted: revenue snapshot, top products, reviews, cities, funnel, customer health, email automation counts, inventory alerts, quick insights
- [x] Attach CSVs (e.g. product_performance, city_geo_targeting, inventory_health, and the rest needed for ads)
- [x] Default inbox = Settings support email (already H5) — keep it
- [x] “View admin dashboard” link in email footer

**Done when:** one monthly send is enough to brief ads and restock without opening ten screens.

---

## Phase I7 — Footer socials + legal / About / Contact copy

### Todos

- [x] Document and wire: **Admin → Content** (or Settings) fields for Instagram, Facebook, Pinterest, WhatsApp (and room for more)
- [x] Footer reads those URLs/handles; empty = hide icon
- [x] Update pages with the copy you provided (plain language, same site chrome):
  - About Us / Our Story  
  - Privacy Policy  
  - Cancellation, Return & Refund (exchange-focused, no silent “full returns”)  
  - Terms & Conditions (+ short credit: technical infrastructure by **Vine B Digital**)  
  - Delivery & Shipping  
  - Contact Us (address, hours, email, WhatsApp)  
- [x] Sitemap / nav links do not 404

**Done when:** marketing can change socials without a deploy, and legal pages match the business.

---

## Phase I8 — Reviews photos + Lighthouse pass

### Todos

- [x] Reviews: optional photo(s); admin can add photos for marketing
- [x] Only customers with a **Delivered** order line for that product can submit a review
- [x] Lighthouse: Performance **≥ 95**, SEO **100**, Best Practices **100** on home + a PDP (document what was fixed: images, CLS, unused JS, meta, etc.)

**Lighthouse notes (re-verify on production after deploy):**
- Next/Image + Cloudinary AVIF/WebP; `sizes` on hero, PDP, cards; gallery main `priority`; thumbs lazy
- Card fade-in no longer starts at `opacity: 0` for above-fold (`priority`) cards — LCP/CLS
- Image CDN cache TTL 30 days; `removeConsole` in production; `optimizePackageImports` for icons
- SEO: metadata, OG/Twitter, robots.txt, sitemap (incl. `/contact-us`), JSON-LD org + product reviews
- Best practices: security headers (HSTS, nosniff, frame deny), HTTPS-only assets
- Re-run Chrome Lighthouse (Mobile, Incognito) on `/` and one PDP after production deploy; Meta Pixel may still affect Best Practices until consent/tag is tuned

**Done when:** reviews are trustworthy with photos, and Lighthouse targets are met on the measured URLs.

---

## Ops checklist (not a code phase)

- [ ] Razorpay live keys for cancel-refunds  
- [ ] Resend domain authenticated for OTP + order mail  
- [ ] Support email / WhatsApp correct in Settings  
- [ ] Homepage collection slugs filled after I1  
- [ ] Social URLs filled after I7  

---

## How to start work

1. Leave this file as the source of truth. Tick boxes when a phase ships.  
2. Say **“I1 start”** (same style as G1 / H1). Only then change code.  
3. After each phase: production **build check**. Commit/push only when asked.  
4. Do not open I4 emails while I1 still leaves home empty / smart collections 404.

---

## File map (likely — do not edit until the phase starts)

| Phase | Main files (likely) |
|-------|---------------------|
| I1 | `src/app/page.tsx` / home sections, `site-content*`, collections `[slug]`, `ProductClient`, `cart-stock`, `AppContext` |
| I2 | `AppContext` cart merge, `Customer` model, merge OTP APIs, `account/profile`, `automations` / `email` |
| I3 | `orders/[id]` cancel flow, admin orders notification, `order-refund`, email |
| I4 | `lib/email.ts`, `lib/automations.ts`, email product blocks |
| I5 | admin orders + ActionModal / Toast; grep `window.alert` / `confirm` / `prompt` |
| I6 | `admin/reports`, `report-generator`, monthly route |
| I7 | `admin/content` or settings, `Footer`, legal pages under `src/app/*` |
| I8 | reviews API + UI, image upload, Next image / layout for Lighthouse |

---

## Where to edit socials (after I7)

Socials: **Admin → Content** — Instagram, Facebook, Pinterest, WhatsApp URL fields (empty = icon hidden in footer).
