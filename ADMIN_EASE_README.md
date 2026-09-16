# Make complete admin easy — production plan (Phase F)

**Status: F1–F7 done. Complete admin ease pass is finished.**

Phases **A–E are already built** (orders, stock, GST, customers, roles, returns, search, WhatsApp). Staff still cannot tell what the screens *mean*. This file is the next production phase: **same admin, plain language**.

Staff handbook (how each page works today): [ADMIN_README.md](./ADMIN_README.md)  
Build + A–E: [README.md](./README.md)

---

## What this is

A packer or manager should understand **every** `/admin` screen in a few seconds: what this page is for, which button to press, what happens next.

It is **not** a new admin. It is **not** a visual redesign. Features, roles, APIs, order statuses, and manual shipping (type courier + tracking) stay the same.

---

## What is wrong today

From the live **Orders** screen:

| Staff sees | Why it is hard |
|------------|----------------|
| CSV Template | Looks like a tech file, not “download a spreadsheet to fill” |
| Bulk Update | Does not say “upload that spreadsheet to change many orders” |
| AWB | Courier jargon. Staff mean **tracking number** |
| Confirm / Hold / Cancel / Open | Four one-word actions. Hold sounds like “wait on the phone” |
| Search “Order ID, phone, email, name, AWB” | Too many terms in one box |
| Subtitle “search, confirm, hold, cancel, then pack” | Written for developers |

The same problem is on **every** other page: Insights, Groups, Automations, Audit log, System Logs, Site content — staff names vs shop-floor names.

---

## Rules (do not skip)

1. **This README first.** Do not start code until F1 is approved.
2. Implement **in order**: F1 → F2 → F3 → F4 → F5 → F6 → F7. Do not skip F1.
3. **Words only** unless a label is missing. No new APIs, no new roles, no courier APIs, no 2FA.
4. Order statuses in the database stay: Confirmation Pending, Confirmed, Packed, Shipped, In Transit, Delivered, On Hold, Cancelled, Returned.
5. Buttons can say **Confirm order** while the saved status stays **Confirmed**.
6. Never commit `.env` / `.env.local`.

### Out of scope (same as A–E)

| Item | Decision |
|------|----------|
| Courier APIs (Shiprocket, Delhivery, etc.) | Out. Staff type courier + tracking by hand |
| 2FA | Out |
| New features (fraud rules, gift cards, Sentry, etc.) | Not this phase |
| Redesign / new theme | Out. Keep current layout |

---

## Done when (whole of F)

- A new Manager can open admin and know **where to go first** (orders waiting, then stock).
- On Orders they can **search, confirm, pause, cancel, open, print invoices, download/upload spreadsheet** without asking what CSV/AWB means.
- Every `/admin` page has a one-line “what to do here” plus the old features still working.
- Roles still hide the same menus (Manager still cannot open Products/Settings/Staff).
- Print packing slip / invoice still print clean (no help box on paper).

---

## Copy map (words that change; functions do not)

Use these labels in code when F starts. Status values in Mongo stay English as today.

| Today on screen | Show instead |
|-----------------|--------------|
| Dashboard | Home |
| Inventory | Stock |
| Insights | Sales charts |
| Reports | Email reports |
| Groups | Customer lists |
| Coupons | Discount codes |
| Automations | Auto messages |
| Site content | Homepage |
| Settings | Store settings |
| Audit log | Who changed what |
| System Logs | Error log |
| WhatsApp | WhatsApp chats |
| CSV Template | Download spreadsheet template |
| Export | Download orders (Excel/CSV) |
| Bulk Update | Upload spreadsheet |
| AWB | Tracking number |
| Confirm | Confirm order |
| Hold | Pause order |
| Cancel | Cancel order |
| Open | Open order |
| Search placeholder | Order number, phone, or name |
| Top search bar | Find an order, phone, or name |
| Abandoned Carts | Carts left unpaid |
| Needs Confirmation | Orders waiting to confirm |
| Fulfillment (manual shipping) | Shipping (you type tracking) |
| Tracking URL | Link to track parcel |

Sidebar groups (F1):

| Group | Pages |
|-------|--------|
| Everyday | Home, Orders, Returns, Stock, Customers, Reviews, WhatsApp chats |
| What you sell | Products, Collections, Discount codes |
| Marketing | Sales charts, Email reports, Customer lists, Auto messages, Homepage |
| Store setup | Store settings |
| Team | Who changed what, Staff, Error log |

---

## Phase F0 — This README — **done**

This file exists. Staff handbook already exists (`ADMIN_README.md`). A–E already shipped.

- [x] Write production plan with phases and todos
- [x] Do **not** change admin screens until F1 is started on purpose
- [x] Revert any half-started ease-of-use UI so the shop admin stays as A–E left it

**Done when:** this document is in the repo and admin UI is unchanged.

---

## Phase F1 — Shell (every page) — **done**

Global chrome only. If the menu and “what to do here” are clear, every later page is easier.

### Todos

- [x] Group the left menu into Everyday / What you sell / Marketing / Store setup / Team
- [x] Rename menu items using the copy map (Home, Stock, Sales charts, …)
- [x] Add a collapsible **What to do here** box on every `/admin` page (plain steps, 1 line + 2–3 bullets)
- [x] Hide that box on login, packing slip, invoice, bulk invoice (print)
- [x] Top search: “Find an order, phone, or name”
- [x] One line under the Admin logo: run the shop — orders, stock, customers
- [x] Staff login: one line that this is **staff only**, shoppers use Account

**Done when:** a Manager can read the menu without asking what Insights / Groups / Automations are.

---

## Phase F2 — Orders list (`/admin/orders`) — **done**

This is the screen in the screenshot. Highest traffic. Do this right after F1.

### Todos

- [x] Title stays **Orders**. Subtitle: how many orders, then “Find → confirm → when you ship, add tracking”
- [x] **Download spreadsheet template** (was CSV Template)
- [x] **Download orders (Excel/CSV)** (was Export) — modal: status, from date, to date, download
- [x] **Upload spreadsheet** (was Bulk Update) — confirm text: “This will change many orders. Cannot undo.”
- [x] Tick boxes + **Print invoices** stay (already clear)
- [x] Search label/placeholder: order number, phone, email, name, or tracking number
- [x] Column **Tracking number** (was AWB)
- [x] Row actions: **Confirm order** / **Pause order** / **Cancel order** / **Open order**
- [x] Pause and Cancel still **require a reason** (customer can be notified) — prompt in plain English
- [x] Empty state: “No orders match. New checkouts will show here.”

**Done when:** someone who has never seen “AWB” or “CSV” can confirm an order and open it.

---

## Phase F3 — One order + print — **done**

Pages: `/admin/orders/[id]`, pack slip, invoice, bulk invoice.

### Todos

- [x] Buttons: **Confirm order** / **Pause order** / **Cancel order** (same as list)
- [x] Right panel title: **Shipping (you type tracking)**
- [x] Fields: courier name, tracking number, link to track parcel
- [x] Save: **Save status, tracking, and notes**
- [x] Reason: required for pause or cancel
- [x] Return / refund block: “Send to Returns list” vs “Give money back”
- [x] Packing slip / invoice: no help box; print as today
- [x] Timeline stays; “internal note” stays staff-only

**Done when:** staff can confirm → print pack → type courier + tracking → set Shipped without decoding AWB.

---

## Phase F4 — Everyday pages — **done**

### Home — `/admin`

- [x] Title **Home**. Subtitle: today’s snapshot — you pack from Orders, not here
- [x] Three start cards: orders waiting to confirm → Orders; low/out of stock → Stock; recent order IDs clickable
- [x] “Abandoned Carts” → **Carts left unpaid**
- [x] “Needs Confirmation” → **Orders waiting to confirm**
- [x] **Download complete analysis** — real Excel (`.xlsx`) for the 7 / 30 / 90 days on Home: summary, daily, status, payments, products, collections, cities, customers, discount codes, funnel, stock, unpaid carts, returns, orders, order items

### Returns — `/admin/returns`

- [x] Subtitle: customer wants the item back — approve, put stock back, then refund if needed
- [x] Buttons stay Approve / Reject / Restock / Refund — add one-line hint if the label is short

### Stock — `/admin/inventory`

- [x] Title **Stock**. Subtitle: which sizes are running out or sold out
- [x] Link to spreadsheet stock tool in plain words

### Customers — `/admin/customers` + one customer

- [x] Subtitle: search a person, open them, see their orders
- [x] Freeze / Block COD: one-line what each does (cannot order vs online pay still OK)

### Reviews — `/admin/reviews`

- [x] Subtitle: new reviews wait here until you allow them on the product page

### WhatsApp chats — `/admin/whatsapp` (+ logs / broadcast / analytics)

- [x] Subtitle: chats with customers; order card opens that order
- [x] Unread / Assign to me / canned replies: keep; short hint if needed

**Done when:** daily ops pages match the handbook in [ADMIN_README.md](./ADMIN_README.md) in *on-screen* language.

---

## Phase F5 — What you sell — **done**

### Products — `/admin/products`, new, edit, bulk import / offers / inventory

- [x] Subtitle: photos, price (GST included), sizes, stock
- [x] Bulk inventory page: “Download stock → edit numbers → upload again”
- [x] Bulk import / offers: one-line what the spreadsheet does

### Collections — `/admin/collections`

- [x] Subtitle: folders on the store (Sale, Wedding)

### Discount codes — `/admin/coupons`

- [x] Title **Discount codes**. Subtitle: codes typed at checkout. Active off = stop the code
- [x] Collection / product picker: search + tick (no Ctrl/Cmd list). Coupon Scope labels stay All Products / Specific Categories / Specific Products

**Done when:** catalog staff do not need to know the word “SKU” to change price or stock (SKU can stay on the form as a field name if needed).

---

## Phase F6 — Marketing — **done**

### Sales charts — `/admin/analytics`

- [x] Title **Sales charts**. Subtitle: what sold and who bought — not for packing parcels

### Email reports — `/admin/reports`

- [x] Title **Email reports**. Subtitle: send a monthly summary to the store inbox

### Customer lists — `/admin/groups`

- [x] Title **Customer lists**. Subtitle: groups of people you can email or WhatsApp together

### Auto messages — `/admin/automations`

- [x] Title **Auto messages**. Subtitle: on/off for order placed, shipped, cart left unpaid
- [x] Note: turn on only after Settings test send works

### Homepage — `/admin/content`

- [x] Title **Homepage**. Subtitle: banners, top menu, announcement bar, policy pages — no developer

**Done when:** marketing can change a banner without asking what “Site content” means.

---

## Phase F7 — Store setup + team — **done**

### Store settings — `/admin/settings`

- [x] Title **Store settings**. Subtitle: GSTIN, online pay, COD pincodes, test email/WhatsApp
- [x] COD pincodes page: where cash-on-delivery is allowed

### Who changed what — `/admin/audit`

- [x] Title **Who changed what**. Subtitle: staff history — not the customer’s parcel tracking

### Staff — `/admin/staff`

- [x] Subtitle: invite people. Manager = orders; Admin = catalog too. Superadmin only

### Error log — `/admin/logs`

- [x] Title **Error log**. Subtitle: technical errors. For an order, open the order instead

**Done when:** Superadmin and Admin are not mixing “system logs” with “what happened to this order”.

---

## After F (not this plan)

Same as [README.md](./README.md) “Later”:

- Duplicate-order / COD fraud rules
- DPDP download + delete
- Store credit / gift cards
- Google Merchant / Meta catalog
- Sentry, staging DB, backups
- Maintenance mode

Do **not** start these while F is open.

---

## How work ran

F1 → F7 were implemented in order. Same clicks as before still work (confirm, refund, restock, save settings).

If a label is still unclear, **change this README first**, then the screen.

---

## Docs map

| File | Purpose |
|------|---------|
| [README.md](./README.md) | Product, stack, **phases A–F done** |
| [ADMIN_README.md](./ADMIN_README.md) | How staff use every page |
| **This file** | Phase F plan (F1–F7 **done**) |
| [TESTING.md](./TESTING.md) | Tests |

Never commit `.env` / `.env.local`.
