# Admin handbook — Duti Heritage

How to use **every** `/admin` screen. This is for staff. Shoppers use **Account**, not admin.

Nothing in this file changes the store. The store only changes when you click **Save** (or Confirm / Refund) on a page.

---

## How to open admin

1. Go to **`/admin/login`** (example: `http://localhost:3000/admin/login`).
2. Sign in with a **staff email** (listed in `ADMIN_EMAILS`, or invited under Staff).
3. Or, on the store, sign in with that same staff email — a black **Admin** button appears bottom-right. Shoppers never see it.

**Do not** use the customer **Account** page to run the shop. That is only for buyers (orders, wishlist, addresses).

If you sit idle for **30 minutes**, you are signed out. Sign in again.

**Find anything fast:** press **Ctrl+K** (Windows) or **⌘K** (Mac). Type order ID (`DH-…`), phone, name, or product.

A **new order** toast may appear while you are in admin. Click it to open that order.

---

## Who can do what

| Role | Can use | Cannot |
|------|---------|--------|
| **Manager** | Dashboard, Orders, Returns, Inventory, Customers, Reviews, WhatsApp | Products, prices, coupons, settings, staff |
| **Admin** | Catalog + settings + everything a Manager can | Invite / remove Superadmin staff |
| **Superadmin** | Everything | — |

If a menu item is missing, your role does not include it. That is normal.

---

## Typical day (do this in order)

1. **Dashboard** — see if orders wait for confirm, or stock is low.
2. **Orders** — Confirm new ones. When you ship, type courier + AWB.
3. **Inventory** — if something is out of stock, add quantity.
4. **Returns** — approve / restock / refund if a customer sent something back.
5. **WhatsApp** — reply to unread chats.

Shipping is **manual**. There is no Shiprocket/Delhivery button. You type courier name, AWB, and tracking URL yourself.

---

## Menu map

### Daily work

| Menu | URL | In one sentence |
|------|-----|-----------------|
| Dashboard | `/admin` | Today’s numbers and recent orders |
| Orders | `/admin/orders` | Find, confirm, ship (AWB), invoice |
| Returns | `/admin/returns` | Return/exchange queue |
| Inventory | `/admin/inventory` | Low / out of stock |
| Customers | `/admin/customers` | One person: orders, freeze, COD block |
| Reviews | `/admin/reviews` | Approve reviews before they show on the site |
| WhatsApp | `/admin/whatsapp` | Live chats |

### Catalog

| Menu | URL | In one sentence |
|------|-----|-----------------|
| Products | `/admin/products` | What you sell (price, photos, stock) |
| Collections | `/admin/collections` | Folders on the store (Sale, Wedding…) |
| Coupons | `/admin/coupons` | Discount codes at checkout |

### Grow / marketing

| Menu | URL | In one sentence |
|------|-----|-----------------|
| Insights | `/admin/analytics` | Charts: what sold, who buys |
| Reports | `/admin/reports` | Email a monthly summary |
| Groups | `/admin/groups` | Lists of customers to message |
| Automations | `/admin/automations` | Auto emails / WhatsApp (order placed, shipped…) |
| Site content | `/admin/content` | Homepage banners, menu, policy pages |

### Store & team

| Menu | URL | In one sentence |
|------|-----|-----------------|
| Settings | `/admin/settings` | GSTIN, prepaid, COD pincodes, test send |
| Audit log | `/admin/audit` | Who changed what |
| Staff | `/admin/staff` | Invite people (Superadmin only) |
| System Logs | `/admin/logs` | Technical errors (not order history) |

---

## Page by page

### Staff login — `/admin/login`

**What:** Door into admin. Not the customer login.

**How:**
1. Staff email + password.
2. Forgot password sends a reset email.
3. If it says you are not staff, that email is only a shopper. Sign out and use a staff email.

---

### Home — `/admin`

**What:** Snapshot: revenue, order count, orders waiting to confirm, low stock.

**How:**
1. Start here: if confirmation count is not zero → open **Orders** and Confirm order.
2. If low / sold out is not zero → open **Stock**.
3. Click a recent order number to open that order.
4. **Download complete analysis** saves a real Excel file for Last 7 / 30 / 90 days (pick the range first). Open it in Excel — each sheet is a part of the report (summary, daily, products, cities, orders, stock, unpaid carts, …).

You do **not** pack parcels from here.

---

### Orders list — `/admin/orders`

**What:** All orders. Search and filter, then open one.

**How:**
1. Search: order number, phone, email, name, or tracking number.
2. Filter by status, COD vs prepaid, city, dates.
3. **Confirm order**, **Pause order**, **Cancel order**, or **Open order**.
4. **Download orders** = save a spreadsheet. **Upload spreadsheet** = change many orders (status / tracking). **Download spreadsheet template** = empty file to fill. Tick orders → **Print invoices**.

Status flow (simple): Confirmation Pending → Confirmed → Packed → Shipped → In Transit → Delivered.  
Pause / Cancel need a **reason** (customer can be notified). Returned is after a return.

---

### One order — `/admin/orders/[orderId]`

**What:** Work on a single order.

**How (left to right):**
1. **Confirm order** when the order is real. **Pause order** or **Cancel order** only with a reason.
2. **Packing slip** — print for the box.
3. Type **courier name**, **tracking number**, **link to track parcel**. Set status **Shipped**. Save.
4. **Invoice** — GST tax invoice (print or save as PDF).
5. **Send to Returns list** if the item is coming back.
6. **Give money back** — prepaid uses Razorpay when a payment id exists. COD is marked as given back. You can give back part of the amount.

Timeline = history of this order (who did what). Internal notes stay inside admin.

---

### Packing slip — `/admin/orders/[id]/pack`

**What:** Printable slip for the parcel. No extra settings.

**How:** Open → print (browser print).

---

### Invoice — `/admin/orders/[id]/invoice`

**What:** GST invoice (HSN, tax split, GSTIN). Needs store GSTIN in Settings.

**How:** Open → print or save as PDF.

---

### Bulk invoices — `/admin/orders/bulk-invoice`

**What:** Print several invoices you ticked on the orders list.

**How:** On Orders, tick rows → Print invoices.

---

### Returns & exchanges — `/admin/returns`

**What:** Queue of return requests (customer asked from **My Orders**, or staff filed from the order).

**How:**
1. Filter: requested / approved / rejected / restocked.
2. **Approve** or **Reject** (reject needs a reason).
3. After approve: **Restock** (sizes go back to inventory; order can move to Returned).
4. **Refund** if money should go back.

Do not restock before you approve. Do not refund twice without checking the remaining amount on the order.

---

### Stock — `/admin/inventory`

**What:** Sizes that are low or sold out, and a log of stock changes.

**How:**
1. See what is low / sold out.
2. Fix stock on the **product edit** page, or **Download stock spreadsheet**.
3. Movement list: order, cancel, return, admin, spreadsheet.

Checkout **cannot** sell more than you have. If a size is 0, customers cannot buy that size.

---

### Update stock spreadsheet — `/admin/products/bulk-inventory`

**What:** Download stock, change numbers in Excel, upload again.

**How:** Download → edit **stock** column → upload. Check Stock movements after.

---

### Customers list — `/admin/customers`

**What:** Every shopper in one list.

**How:**
1. Search name / phone / email.
2. Filters: new, repeat, high spend, COD, frozen.
3. Open a person for the full profile.
4. Export CSV / ads audience if you run ads.

---

### One customer — `/admin/customers/[id]`

**What:** Orders, spend (LTV), address, carts, reviews, notes.

**How:**
1. Read their orders (click through to the order).
2. **Freeze** = they cannot checkout at all.
3. **Block COD** = they can still pay online, not cash on delivery.
4. Always add a reason when you freeze or block.

Use freeze for abuse/fraud. Use COD block for serial COD refusals.

---

### Reviews — `/admin/reviews`

**What:** Customer reviews wait here until you approve them.

**How:** Read → Approve (shows on product page) or reject (hidden).

---

### WhatsApp chats — `/admin/whatsapp`

**What:** Chats with customers.

**How:**
1. **Unread only (who is waiting)** to see unread chats.
2. Click a chat. **Assign to me**. Pause bot if you are talking as a human.
3. **Saved replies** are the chips above the text box.
4. The **order card** in the thread opens that order.

If send fails, WhatsApp may not be configured (Settings / env).

---

### WhatsApp — Send to many — `/admin/whatsapp/broadcast`

**What:** Send one message to many numbers.

**How:** Follow the form on the page. Use groups if you already built a customer list.

---

### WhatsApp — Send log — `/admin/whatsapp/logs`

**What:** Delivery / activity history. Not the live chat.

---

### WhatsApp — Numbers — `/admin/whatsapp/analytics`

**What:** Volume / inbox stats. Not for packing orders.

---

### Products list — `/admin/products`

**What:** Catalog. Price, photos, sizes, active/inactive.

**How:**
1. **Add product**.
2. Click a product to **edit**.
3. Extra tools: add many products, offers on many, update stock spreadsheet.

Prices are **GST-inclusive**. HSN and GST % are used on invoices.

---

### New product — `/admin/products/new`

**How:** Collection + name + at least one image + price + sizes/stock → create.

---

### Edit product — `/admin/products/[id]/edit`

**How:** Change photos, price, sizes/stock, HSN, GST, offers. **Save**. The live product page updates.

Turning a product inactive hides it from the store without deleting it.

---

### Add many products — `/admin/products/bulk-import`

**What:** Create many products from a spreadsheet.

**How:** Use the template on the page. Collection name is required per row. Check the catalog after upload.

---

### Offers on many products — `/admin/products/bulk-offers`

**What:** Attach offer/discount text to many products at once.

**How:** Template spreadsheet → upload. Discount codes may be auto-created from offer codes.

---

### Collections — `/admin/collections`

**What:** Folders on the store (Sale, Wedding…). Each product belongs to a collection.

**How:** Create collection → assign products when you add/edit a product. Which collections appear on the homepage is set in **Homepage**.

---

### Discount codes — `/admin/coupons`

**What:** Codes customers type at checkout (flat ₹ or %).

**How:** Create code, discount, min order, optional product limit. Search and tick categories/products if the code is not for all products. **Stop code** turns it off.

---

### Sales charts — `/admin/analytics`

**What:** What sold and who bought. For planning, not packing.

**How:** Pick date range. Export audience if you need ads lists.

---

### Email reports — `/admin/reports`

**What:** Send a monthly summary to the store inbox.

**How:** Run send. Check the configured admin inbox. Daily packing is still **Orders**.

---

### Customer lists — `/admin/groups`

**What:** Groups of people you can email or WhatsApp together.

**How:**
1. Create a list (rules, or pick people).
2. Open a list to see who is in it.
3. Send a message from this page.

---

### Auto messages — `/admin/automations`

**What:** On/off for automatic messages (welcome, order placed, shipped, cart left unpaid…).

**How:** Turn a flow on only after Email/WhatsApp work. Use **Store settings → test send** first. The log on this page shows what was sent or failed.

---

### Homepage — `/admin/content`

**What:** Homepage and policies without a developer.

**How:**
1. **Homepage banners** — upload image, optional link, headline, start/end dates. Inactive = hidden. Empty dates = always on (if Active).
2. Announcement bar = the strip at the very top of the store.
3. Header nav = one line per item: `Label|/collections/slug`.
4. Homepage collection slugs = which collections stack on `/` (one slug per line).
5. Promo box + footer text.
6. Policy pages (privacy, return, shipping, terms) at the bottom. **Save** each.

---

### Store settings — `/admin/settings`

**What:** One place for GSTIN, online pay, COD pincodes, and a test message.

**How:**
1. Legal name, GSTIN, address, state — needed for **invoices**.
2. Prepaid on/off (Razorpay).
3. Default HSN / GST for **new** products.
4. SEO title/description, feature flags (reviews, wishlist, WhatsApp widget).
5. **Where COD is allowed** — pincodes/cities, extra charge, shipping. Old URL `/admin/settings/cod` opens this.
6. **Test send** — prove email or WhatsApp before you depend on it.

---

### Who changed what — `/admin/audit`

**What:** Staff history of orders, products, customers, settings, staff. Not the customer’s parcel tracking.

**How:** Search person / action / order number. Managers may not see this page.

---

### Staff — `/admin/staff`

**What:** Invite Admin or Manager. Superadmin only. Env Superadmins (from `ADMIN_EMAILS`) cannot be deleted here.

**How:** Add email + name + role. They get a password email, then sign in at `/admin/login`.

- **Manager** = orders / customers / stock.
- **Admin** = catalog + settings too.

---

### Error log — `/admin/logs`

**What:** Technical errors. **Not** “what happened to order DH-123”.

**How:** Open if a page is broken. Mark fixed when handled. For order history use the order **Timeline** or **Who changed what**.

---

## Money: refunds vs returns

| You want | Where |
|----------|--------|
| Customer sent the item back | **Returns** queue (or File return on the order) |
| Give money back, item may stay | Order page **Refund** |
| Put size back in stock | Returns → **Restock** after approve |

Prepaid refund talks to **Razorpay** when a payment id exists. COD refund is marked in admin (you still pay the customer however you do today — cash/UPI).

---

## If something looks wrong

| Problem | Check |
|---------|--------|
| Cannot see Products / Settings | You are a Manager |
| Cannot see Staff | You are not Superadmin |
| Admin button missing on store | That email is not staff |
| Invoice missing GSTIN | Settings → legal / GSTIN |
| Oversell / stock wrong | Inventory + product sizes |
| Customer cannot checkout | Customer profile → Frozen |
| Customer cannot use COD | Customer → COD blocked, or Settings COD pincodes |
| No WhatsApp send | Settings test send / WhatsApp provider env |
| Signed out suddenly | 30-minute idle timeout |

---

## Related docs

| File | What it is |
|------|------------|
| [README.md](./README.md) | How the app is built + phases A–E (done), F planned |
| [ADMIN_EASE_README.md](./ADMIN_EASE_README.md) | Phase F: F1–F7 done (plain-language admin) |
| [TESTING.md](./TESTING.md) | Automated tests |
| This file | How **people** use every `/admin` page today |

Never commit `.env` / `.env.local`.
