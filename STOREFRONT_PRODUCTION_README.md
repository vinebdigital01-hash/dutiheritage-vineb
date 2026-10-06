# Make the storefront production-level — plan (Phase G)

**Status: G7 done. Phase G complete. Ops checklist is separate (not a code phase).** Admin production next: [ADMIN_PRODUCTION_README.md](./ADMIN_PRODUCTION_README.md) (Phase H).

Admin ease **F1–F7 is done**. This file is the next production phase: the **customer shop**, not `/admin`.

Staff handbook: [ADMIN_README.md](./ADMIN_README.md)  
Admin ease (done): [ADMIN_EASE_README.md](./ADMIN_EASE_README.md)  
How the app runs today: [README.md](./README.md)

Same file at the monorepo root: [../STOREFRONT_PRODUCTION_README.md](../STOREFRONT_PRODUCTION_README.md)

---

## What this is

Turn the public store (`/`, collections, product, cart, checkout, account) into a **real Indian D2C shop**: money is correct, stock is honest, checkout is not fake, browse can grow, customers can track and return without calling staff.

It is **not** a new theme. Keep the current look unless a gap cannot be fixed with copy and behaviour.

---

## What already works (do not rebuild)

| Area | Today |
|------|--------|
| Home | Hero from site content, collection rows, promo |
| Browse | Header nav (CMS), search drawer (Mongo text, 12 results), collection pages, `/collections/all` |
| Product | Gallery, size/colour, inventory sold-out, offers, add to cart / buy now, reviews, share, sticky bar |
| Cart | LocalStorage + server sync for abandoned cart, free-shipping bar, cross-sell |
| Checkout | Guest or login, coupons, pincode COD check, prepaid / COD / partial, Razorpay, phone OTP for COD |
| Account | Firebase login, orders, cancel/return request, AWB if staff typed it, one address, wishlist (logged in), coupons |
| Legal | Shipping, returns, privacy, terms |
| SEO | Sitemap, robots, JSON-LD, Meta pixel |

Courier booking APIs stay **out**. Staff still type courier + tracking by hand in admin.

---

## What is wrong today (gaps)

Grouped the way a shopper hits them. This is the work list. Do not treat it as “redesign the homepage.”

### Money and stock (live-site risk)

| Gap | Why it matters |
|-----|----------------|
| Cart is a LocalStorage snapshot | Price and stock can be stale until pay |
| `verify-cart` runs once on checkout load | Changing the cart after that is not re-checked |
| Cart quantity has no stock cap | Customer can add 20 of an item with 2 left |
| Checkout sends `item.colors[0]`, not the colour they picked | Wrong colour on the order |
| If Razorpay keys are missing, unpaid prepaid/partial still places (`allowUnpaidDev`) | Must never happen on dutiheritage.co.in |
| Product JSON-LD always says InStock | Google shows in stock when it is not |

### Checkout trust

| Gap | Why it matters |
|-----|----------------|
| 10-minute countdown + hardcoded “14 viewers” | Looks like a scam site |
| Success page is only “thanks + order id” | No items, address, or what happens next |
| Guest told to “view account” | They may have no account |
| No guest track (order id + phone) | Lose login = lose the order on the site |
| Phone OTP only for COD | Fine if we keep it; document it, do not fake extra security |

### Browse and find

| Gap | Why it matters |
|-----|----------------|
| No sort, no filters, no pagination | Breaks as soon as the catalog grows |
| Collection grid is not `ProductCard` | No sold-out, no wishlist, weak Cloudinary handling |
| Empty `product.image` can crash collection `next/image` | Listing dies for placeholder products |
| Search is drawer-only; Google schema uses `/collections/all?q=` | That URL does nothing |
| Sitemap lists `/about` | Page does not exist (404) |
| Related products = first 5 other SKUs | Not same collection / similar |
| Cart/checkout load **all** products for cross-sell | Will not scale |
| Only 50 product slugs prebuilt | Rest are on-demand |

### Product page

| Gap | Why it matters |
|-----|----------------|
| No size chart (returns policy mentions one) | Size returns and angry messages |
| No pincode / COD check on PDP | Customer only finds out at checkout |
| No “GST included” line | Prices are GST-inclusive in the backend |
| No notify-me when a size is sold out | Lost demand |
| Add to cart ignores qty already in cart vs stock | Oversell until place-order |

### After the order

| Gap | Why it matters |
|-----|----------------|
| Customer cannot download GST invoice | Invoice exists only in admin |
| Return request has no item picker, photos, or “my returns” list | Staff get vague requests |
| Tracking is AWB + link only if staff filled it | No obvious guest tracking page |
| No reorder | Repeat buyers start from zero |
| Success / WhatsApp / email still need live keys | Not a code phase; ops checklist |

### Account and chrome

| Gap | Why it matters |
|-----|----------------|
| Wishlist requires login (`alert`) | Guests bounce |
| One address only | No home vs office |
| Address save says “refresh the page” | Feels unfinished |
| Recently viewed is device-only (6 items) | Not on the account |
| No data download / delete account | DPDP expectation |
| Account icon hidden on mobile (menu only) | Easy to miss |
| Footer newsletter: Web3forms key in client JS | Secret in the browser |
| GSTIN hardcoded in footer | Should follow store settings |
| Organization schema `sameAs` empty | No Instagram/Facebook for Google |
| Hero uses raw `<img>` | Weaker LCP than Next/Cloudinary image |
| Copyright fallback `"copy " + year` | Looks like a bug |

---

## Rules (do not skip)

1. **This README first.** Do not start storefront code until G1 is started on purpose.
2. Implement **in order**: G1 → G2 → G3 → G4 → G5 → G6 → G7. Do not skip G1.
3. **Do not redesign the shop** unless a todo in that phase says the UI must change.
4. **Do not change admin** except where a phase says customers need something admin already has (invoice, tracking fields).
5. Shipping stays **manual**: courier name, tracking number, tracking URL. No Shiprocket/Delhivery APIs.
6. Never commit `.env` / `.env.local`.
7. Do not add fake urgency, fake stock, or fake viewer counts.

### Out of scope

| Item | Decision |
|------|----------|
| Courier APIs | Out. Staff type tracking by hand |
| 2FA | Out |
| New theme / luxury redesign | Out unless a gap cannot be fixed otherwise |
| Gift cards, compare, Hindi site, subscriptions | Out of G |
| Admin ease (F) | Already done. Do not reopen |
| WhatsApp / Razorpay **keys** | Ops: put keys in Vercel. Code must **refuse** unpaid prepaid when keys missing |

---

## Done when (whole of G)

- A shopper cannot oversell or pay the wrong colour/price.
- Live checkout never places an unpaid “prepaid” order because keys are missing.
- Checkout has no fake timer/viewers. Success page shows the real order.
- Guest can find the order with **order number + phone**.
- Collections can be sorted/filtered and do not crash on missing images.
- Product page has a size chart and a pincode check.
- Customer can download an invoice and see tracking/return status without guessing.
- Secrets are not in footer JavaScript.

---

## Phase G0 — This README — **done**

- [x] Write production plan with phases and todos from the storefront code review
- [x] Do **not** change storefront screens until G1 is started on purpose

**Done when:** this document is in the repo (root + `frontend/`) and the shop UI is unchanged.

---

## Phase G1 — Money, stock, colour (fix live risk) — **done**

Highest priority. No visual redesign.

### Todos

- [x] **Kill `allowUnpaidDev` on production.** If Razorpay is not configured, prepaid/partial must fail with a clear message. COD still works if enabled.
- [x] Re-run **cart verify** whenever checkout cart or qty changes (not only on first load). Show which line is out of stock / price-changed; do not only dump “clear cart.”
- [x] **Stock cap** in cart: cannot set qty above remaining stock for that size. Respect qty already in cart on add-to-cart.
- [x] Send **selected colour** (and size) to `place-order` / Razorpay create, not `colors[0]`.
- [x] Product JSON-LD `availability`: InStock vs OutOfStock from real inventory.
- [x] Do not load the full catalog into checkout/cart if a smaller related/wishlist query can replace `getCatalogProducts()` — at least stop sending every SKU to the browser.

**Done when:** you cannot place a live unpaid prepaid order; you cannot checkout a sold-out size; the order colour matches the PDP.

---

## Phase G2 — Honest checkout and guest order — **done**

### Todos

- [x] Remove fake **10-minute timer** and fake **live viewers**.
- [x] Success page: order id, items, totals, payment method, address, “what happens next,” link to account **if** logged in.
- [x] **Guest track page** (e.g. `/track`): order number + phone → status, AWB, tracking link (same fields staff already type). No Firebase required.
- [x] Guest success: “Save this order number” + track link, not only “View Account.”
- [x] Keep COD OTP as today. Do not add fake extra OTP on prepaid unless we decide later.

**Done when:** a guest can pay, see a real confirmation, and check status without creating an account.

---

## Phase G3 — Browse (collections + search) — **done**

### Todos

- [x] Collection and `/collections/all` use the same **ProductCard** as home (sold-out, sale, wishlist, Cloudinary, no-image placeholder — never crash).
- [x] **Sort:** newest, price low–high, price high–low, discount.
- [x] **Filters:** in stock, on sale, size (from catalog). Keep it simple; no new merchandising engine.
- [x] **Pagination** or “load more” (do not dump 500 products on one page).
- [x] Search: results page **or** honour `?q=` on `/collections/all` so the Google SearchAction URL works. Empty state: “No products match.”
- [x] Add a real **About** page (or remove `/about` from the sitemap). Do not leave a 404 in the sitemap.
- [x] Related on PDP: same collection first, then others — not “first 5 in the database.”

**Done when:** a new collection with many SKUs is usable on mobile, and search/sitemap URLs do not 404.

---

## Phase G4 — Product page (decide and buy)

### Todos

- [x] **Size chart** on PDP (from product or a store default). Returns copy already promises this.
- [x] **Pincode check** on PDP (reuse COD/pincode API). Show deliverable / COD yes-no, not a fake ETA.
- [x] One line: **prices include GST**.
- [x] Add to cart uses G1 stock rules (size + colour + qty already in cart).
- [x] Sold-out size: **Notify me** (email or WhatsApp later). If WhatsApp is not configured, email/account only — do not fake a send.
- [x] Optional: dispatch line from shipping policy (“prepaid in 48 hours” only if that is still true in `/shipping`).

**Done when:** a first-time buyer can pick size with a chart, check their pin, and not oversell.

---

## Phase G5 — After the order (invoice, track, return)

### Todos

- [x] Customer **download / print GST invoice** (same numbers admin uses). Guest via track page if we can prove order + phone.
- [x] Order list: tracking number + Track link always visible when staff saved them (already partial — make it obvious).
- [x] Return request: pick **items + qty**, reason, optional photo later; show request **status** on the order (requested / approved / rejected).
- [x] Do not build courier pickup APIs. Staff still handle reverse in admin Returns.
- [x] **Reorder** button (add those lines to cart with size/colour).

**Done when:** a delivered order can be invoiced, tracked, returned, or bought again without calling the shop.

---

## Phase G6 — Account

### Todos

- [x] Guest **wishlist** in LocalStorage; merge on login. No `alert('Please login')`.
- [x] **Address book**: at least two addresses (e.g. home / other), pick at checkout.
- [x] Save address updates the UI without “please refresh.”
- [x] Recently viewed: keep device list; also show on account when logged in.
- [x] Mobile header: account reachable without hunting the hamburger (icon or clear menu row — keep the current look).
- [x] Simple **download my data** / **delete my account** request (even if staff finish delete by hand).

**Done when:** a repeat customer can save two addresses and a wishlist without fighting login.

---

## Phase G7 — Chrome, SEO, secrets (cleanup)

### Todos

- [x] Remove Web3forms **access key** from client code (server route or drop newsletter until a real list).
- [x] Footer GSTIN / phone / email from **store settings / site content**, not hardcoded.
- [x] Fix copyright fallback (`copy 2026` → proper ©).
- [x] Organization JSON-LD `sameAs`: real Instagram/Facebook when URLs exist in site content.
- [x] Hero: Next/Cloudinary image where the banner URL allows it.
- [x] ISR/stock: product page should not advertise stock that place-order will reject for long stretches (revalidate or live stock on the buy box).

**Done when:** no payment/newsletter secrets in the browser, footer matches the live shop, sitemap/schema match real pages.

---

## Ops checklist (not a code phase)

Do this on Vercel / DNS when going live. Do not mix into G1–G7 code PRs.

- [ ] `NEXT_PUBLIC_SITE_URL=https://dutiheritage.co.in` (not localhost)
- [ ] Razorpay live keys if prepaid is on; otherwise hide prepaid in settings
- [ ] Resend (or email) so order emails are not undefined / localhost
- [ ] WhatsApp provider only if you will actually send
- [ ] Mongo Atlas size for real traffic (10k concurrent is a **plan**, not a code switch)
- [ ] Firebase phone/Google/Facebook providers that you show on `/account`

---

## How to start work

1. Leave this file as the source of truth. Tick boxes when a phase ships.
2. Say **“G1 start”** (same style as F1–F7). Only then change code.
3. After each phase: production **build check**. Commit/push only when asked.
4. Do not open G3 while G1 still lets unpaid prepaid through.

---

## File map (when a phase starts — do not edit until then)

| Phase | Main files (likely) |
|-------|---------------------|
| G1 | `src/app/checkout/page.tsx`, `src/app/api/checkout/place-order/route.ts`, `src/app/api/checkout/verify-cart/route.ts`, `src/context/AppContext.tsx`, `src/app/products/[slug]/page.tsx`, `src/app/actions.ts` |
| G2 | `src/app/checkout/page.tsx`, `src/app/checkout/success/page.tsx`, new track page |
| G3 | `src/app/collections/[slug]/page.tsx`, `src/components/ProductCard/ProductCard.tsx`, `src/components/SearchDrawer/SearchDrawer.tsx`, `src/app/sitemap.ts` |
| G4 | `src/app/products/[slug]/ProductClient.tsx` |
| G5 | `src/components/AccountOrders.tsx`, invoice reuse from `src/lib/gst-invoice.ts`, returns API |
| G6 | `src/context/AppContext.tsx`, `src/app/account/addresses/page.tsx`, `src/app/account/wishlist/page.tsx`, `src/components/Header/` |
| G7 | `src/components/Footer/Footer.tsx`, `src/app/layout.tsx`, `src/components/HomepageHero/HomepageHero.tsx` |
