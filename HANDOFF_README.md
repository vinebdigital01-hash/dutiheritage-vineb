# 🏆 Duti Heritage - The Ultimate Developer Handoff Guide

Welcome to the **Duti Heritage** codebase! This document is the ultimate master guide for this project. It contains everything you need to know about how the frontend was built, how the state is managed, how the components talk to each other, and exactly how you should connect the backend (Firebase, AWS, MongoDB) without breaking the highly optimized UI and SEO.

---

## 🛠 1. Tech Stack Overview
- **Core Framework:** Next.js 16.2.12 (App Router Paradigm)
- **UI & React:** React 19, Client & Server Components
- **Styling:** Tailwind CSS v4 (Mobile-first, fully responsive)
- **Icons:** `react-icons`
- **PWA Ready:** `@ducanh2912/next-pwa` installed

---

## 📂 2. Folder Structure Deep Dive

```text
src/
├── app/                  # Next.js App Router (Pages, Layouts, SEO)
├── components/           # Reusable UI Components
├── context/              # Global State Management (Cart, User, etc.)
├── data/                 # Current Mock Data (To be replaced by DB)
├── services/             # The Database Abstraction Layer (DAL)
└── types/                # TypeScript Interfaces
```

---

## 🧠 3. Global State Management (The Brain)

All global state is managed in **`src/context/AppContext.tsx`**. We use React Context to avoid prop-drilling.

### Variables & Functions Available in `useAppContext()`:
- `cart`: Array of items currently in the cart.
- `addToCart(product, size)`: Pushes a product to the cart. It automatically groups identical items (same ID + size) and increments the quantity.
- `updateQuantity(cartItemId, delta)`: Allows users to increment/decrement quantities using `+` and `-` buttons in the Cart Drawer and Checkout page.
- `removeFromCart(cartItemId)`: Removes an item entirely.
- `recentlyViewed`: Array of the last 6 products the user looked at.
- `isCartOpen` / `setIsCartOpen`: Controls the slide-out cart drawer.
- `user`: Currently logged-in user object `{ name, email }`.
- `login(email)` & `logout()`: Mock auth functions.

**🔗 HOW TO CONNECT BACKEND (AUTH):**
Open `AppContext.tsx`. Find the `login` and `logout` functions. Currently, they just save a fake session to the browser's `localStorage`. 
- **Action:** Delete the `localStorage` logic. Import Firebase Auth (or AWS Cognito). Inside a `useEffect`, listen to `onAuthStateChanged`. When a user logs in, call `setUser(firebaseUser)`.

---

## 🔌 4. The Database Abstraction Layer (Repository Pattern)

**CRITICAL RULE:** Do not write `firebase.firestore()...` directly inside React components or `page.tsx` files!

We have isolated all database logic into one single file:
👉 **`src/services/db.ts`**

### Functions inside `db.ts`:
- `getAllProducts()`
- `getProductBySlug(slug)`
- `getProductsByCollectionId(id)`
- `getAllCollections()`
- `getCollectionBySlug(slug)`

Currently, these functions return static arrays from `mock-products.ts`.
**🔗 HOW TO CONNECT BACKEND (DATABASE - MONGODB):**
To switch the entire website to your live database, you literally only need to modify `db.ts` and replace the mock arrays with calls to your MongoDB API.
- Because the frontend already uses `async/await` and `Promise.all` to call these functions, the moment you update `db.ts` to fetch from MongoDB, the **entire website** (Homepage, Collections, Product pages) will instantly render live database data.

---

## 🎨 5. Frontend Components Breakdown

Here is how the UI is stitched together in `src/components/`:

- **Header.tsx & MobileMenu.tsx:** The top navigation. It is fully responsive. Breakpoints are set to `xl` (1280px) so iPads gracefully fall back to the mobile hamburger menu instead of squishing text.
- **PromoBanner.tsx:** The email newsletter sign-up at the bottom of the homepage.
- **AnnouncementBar.tsx:** The top banner ("NEW ARRIVALS UPTO 40% OFF"). It handles text wrapping naturally without marquees for better mobile reading.
- **CollectionSection.tsx:** Takes a `Collection` object and an array of `Product` objects, and renders a grid title + `ProductCard`s.
- **ProductCard.tsx:** The individual product block. It calculates "Savings" automatically if a `salePrice` exists. 
- **ProductGallery.tsx:** Used on the Product Page. It handles the image slider/thumbnails for mobile and desktop.

---

## 🛣 6. Routing & Next.js Pages

### `src/app/page.tsx` (Homepage)
- Fetches 13 different collections via `Promise.all(db.getCollectionBySlug(...))`. 
- Renders 13 `CollectionSection` components stacked vertically.

### `src/app/products/[slug]/page.tsx` (Product Page)
- **Server Component (`page.tsx`):** Fetches the product from `db.ts`. Also runs `generateMetadata` to build the `<title>` and OpenGraph tags dynamically for SEO.
- **Client Component (`ProductClient.tsx`):** Handles all the interactivity: Size selection, "Add to Cart", "Buy Now", Social Sharing, and the "Write a Review" modal.

### `src/app/collections/[slug]/page.tsx` (Collection Page)
- Server-side renders a grid of products based on the category slug in the URL. If the slug is `"all"`, it renders every product in the database.

---

## 🚀 7. SEO & Performance Optimizations (DO NOT BREAK)

We have achieved perfect Google Lighthouse scores. If you break these rules, the site will suffer:

1. **Keep Pages as Server Components:** The `page.tsx` files do NOT have `"use client"` at the top. They fetch data on the server. This means Google Bots see the raw HTML of the products immediately. If you move data fetching to a client-side `useEffect`, SEO will drop to zero.
2. **Image Eager Loading (LCP):** In `ProductCard.tsx`, you will see `<Image priority={index < 4} />`. This forces the top 4 images on the screen to load instantly, preventing "Largest Contentful Paint" penalties. Do not remove this!
3. **Hydration Mismatch:** Social share links (Twitter/Pinterest) use the browser's URL. Because the server doesn't have a URL during SSR, we use a `useEffect` inside `ProductClient.tsx` to set `currentUrl` after hydration. Do not revert this to directly calling `window.location`.

---

## 🔍 8. SEO Infrastructure (ALREADY BUILT — DO NOT REMOVE)

The following SEO features are fully implemented and auto-update when products change in MongoDB:

| Feature | File | What It Does |
|---------|------|--------------|
| **Dynamic Sitemap** | `src/app/sitemap.ts` | Auto-generates XML sitemap from `db.getAllProducts()` and `db.getAllCollections()`. Google discovers new products within hours. |
| **Robots.txt** | `src/app/robots.ts` | Allows crawling of `/`, `/products/`, `/collections/`. Blocks `/checkout`, `/account`, `/api/`. Points Google to the sitemap. |
| **Product JSON-LD** | `src/app/products/[slug]/page.tsx` | Full `Product` schema (name, price, brand, currency INR, availability, condition). Enables rich snippets in Google search results. |
| **Breadcrumb JSON-LD** | Product & Collection pages | `BreadcrumbList` schema. Google shows breadcrumb trails in search results (Home → Collection → Product). |
| **Organization JSON-LD** | `src/app/layout.tsx` | Brand info for Google Knowledge Panel (name, logo, social links). |
| **WebSite JSON-LD** | `src/app/layout.tsx` | Enables Google sitelinks searchbox. |
| **Canonical URLs** | Product & Collection `generateMetadata()` | Prevents duplicate content penalties from query params or referral links. |
| **Twitter Cards** | Product `generateMetadata()` | Full `summary_large_image` Twitter cards with product image. |
| **next/font** | `src/app/layout.tsx` | Outfit font loaded via `next/font/google`. Zero layout shift (CLS), no render-blocking CSS. |
| **Image Alt Text** | `ProductGallery.tsx` | Thumbnails use `"{product name} - View {n}"` for Google Image Search rankings. |

### 🔮 Auto-SEO Strategy: When Admin Adds Products via MongoDB

When the admin adds a new product via the inline editor → MongoDB:

1. **Sitemap** auto-updates because `sitemap.ts` calls `db.getAllProducts()` on every request.
2. **JSON-LD** auto-generates because it reads from the product data already fetched by the Server Component.
3. **Metadata** auto-generates because `generateMetadata()` already reads from `db.getProductBySlug()`.
4. **No manual SEO work needed by admin** — everything is driven by the product data in MongoDB.

> **The admin just fills in the product details (name, price, description, images, `seoDescription`) and the entire SEO pipeline fires automatically.**

---

## ⚠️ 9. Important: Current Products Are DEMO/SAMPLE Only

All products currently visible on the website are **sample/demo data** stored in `src/data/mock-products.ts`. They exist purely to demonstrate the UI and layout.

- **Real products will be added by the admin** through the inline admin editor (Section 10, Item 3).
- Once MongoDB is wired up, the admin adds products → MongoDB stores them → `db.ts` fetches them → the entire site (homepage, collections, product pages, SEO, sitemap) updates automatically.
- The mock data file (`mock-products.ts`) can be deleted once MongoDB is live.

### 🚀 Migration Checklist (Demo → Live Products)

1. **Connect MongoDB** — Set up your MongoDB connection string and client.
2. **Update 5 functions in `src/services/db.ts`** — Replace the mock data returns with MongoDB queries (`getAllProducts`, `getProductBySlug`, `getProductsByCollectionId`, `getAllCollections`, `getCollectionBySlug`).
3. **Delete `src/data/mock-products.ts`** — Remove the demo data file entirely.
4. **Everything else works automatically** — SEO, sitemap, JSON-LD, metadata, pages, homepage, collections — all auto-update from the data returned by `db.ts`. Zero additional changes needed.

---

## 🎯 10. Your Final To-Do List

1. **Wire Auth (Firebase Only):** Firebase is STRICTLY used for authentication (passwords, OTP, forgot password, magic links, social logins). Firebase Config is in `src/lib/firebase.ts` and auth state is managed in `src/context/AppContext.tsx`.
   - **CRITICAL SECURITY REQUIREMENT FOR "FORGOT PASSWORD" & "MAGIC LINK":** Firebase's "Email Enumeration Protection" is enabled, meaning Firebase cannot securely tell us if an email is registered before sending a link. Once MongoDB is wired up, you MUST update `src/app/account/page.tsx` to query the MongoDB `users` collection FIRST. If the email does not exist in MongoDB, explicitly throw a "No account found with this email. Please register first" error and prevent Firebase from sending the email link.
2. **Wire the DB (MongoDB):** Update the 5 functions in `src/services/db.ts` to fetch from MongoDB instead of mock data. MongoDB is used for ALL database storage (products, users, carts, orders).
3. **Build the Admin Panel:** See Section 11 below for the complete admin architecture.
4. **Checkout Page:** Hook it up to Razorpay, Stripe, or PhonePe.
5. **Abandoned Cart Email Triggers (Automations):**
   - When a user adds an item to their cart and inputs their email (or is logged in), sync the cart to a `carts` collection in MongoDB with a `status: "abandoned"` and a `last_updated` timestamp.
   - Set up a Vercel Cron Job (`src/app/api/cron/abandoned-carts/route.ts`) to run hourly. It should query for carts older than 2 hours and trigger an email via Resend or SendGrid API. Update status to `status: "emailed"`.
   - When they checkout, update the document to `status: "purchased"`.
6. **Inline Admin Analytics Dashboard:**
   - In addition to inline text editing, the admin must be able to view live store analytics directly on the frontend (e.g., in a sliding drawer or floating panel).
   - Show total **Views** (integrate PostHog or Google Analytics API for accurate traffic counts).
   - Show total **Purchases** (queried from MongoDB).
   - Show total **Abandoned Carts** (queried from MongoDB).

---

## 🛡️ 11. Admin Panel — Complete Architecture

### 11.1 Dual-Mode Admin Experience

The admin gets **BOTH** editing modes and can toggle between them:

| Mode | Description |
|------|------------|
| **`/admin` Dashboard** | Full-featured admin panel (like Shopify). Tables, forms, bulk actions. Primary workspace for heavy management tasks. |
| **Inline Edit on Live Site** | Toggle "Edit Mode" from a floating toolbar → see ✏️ buttons on live website elements. Quick edits without leaving the site. |

- Admin logs in via Firebase Auth → their email is checked against `ADMIN_EMAILS` env variable.
- A floating "⚡ Admin" button appears on the live site (visible only to admins) with options: "Go to /admin", "Toggle Edit Mode".
- Admin can choose their preferred default mode from `/admin/settings`.

### 11.2 Admin Dashboard Pages (`/admin/*`)

```text
/admin/                    → Dashboard (stats, quick actions)
/admin/products/           → Product list table (search, filter, bulk actions)
/admin/products/new/       → Add new product form
/admin/products/[id]/edit/ → Edit existing product
/admin/products/bulk-import/ → CSV bulk import (like Meesho)
/admin/collections/        → Collection management
/admin/content/            → Site content editor (Announcement, Header, Footer, Promo, Homepage)
/admin/pages/              → Policy pages editor (Privacy, Returns, Terms, Shipping)
/admin/coupons/            → Coupon code management
/admin/cod-settings/       → COD cities/pincodes, COD charges, Prepaid discounts
/admin/orders/             → Order management
/admin/settings/           → Admin preferences
```

### 11.3 Product Management

The product form (Add/Edit) must support these fields:

| Field | Type | Notes |
|-------|------|-------|
| Name | Text | Required |
| Slug | Auto-generated | From name, editable |
| Price (₹) | Number | Required |
| Sale Price (₹) | Number | Optional |
| Description | Textarea | Optional |
| Collection | Dropdown | From existing collections |
| Main Image | Upload / URL | Drag & drop supported |
| Gallery Images | Multi-upload | Up to 6 images |
| Sizes | Checkboxes | XS, S, M, L, XL, XXL, Free Size |
| Colors | Tag input | Add/remove color names |
| Tags | Multi-select | Best Seller, Sale, New, Trending, Premium |
| SEO Description | Textarea | **Character counter enforced: 120-160 chars** |
| Bought Last 7 Days | Number | FOMO metric |
| Video URLs | Multi-input | UGC showcasing video URLs |
| Offers | Repeater | Title + Description + Optional Code |
| COD Available | Toggle | Enable/disable COD for this specific product |

### 11.4 Bulk Import (Like Meesho)

Admin can mass-import products via CSV:

1. **Download Template** → CSV with all column headers pre-filled
2. **Upload CSV** → Drag & drop or file picker
3. **Preview & Validate** → Table showing parsed rows with error highlighting (missing fields, invalid prices, slug conflicts)
4. **Confirm Import** → Inserts all valid products into MongoDB
5. **Import Report** → Success count, error count, skipped rows with reasons

CSV columns: `name, price, salePrice, description, collection, image, sizes, colors, tags, seoDescription, codAvailable`

### 11.5 COD & Payment Configuration

Admin can configure from `/admin/cod-settings/`:

| Setting | Description |
|---------|------------|
| **COD Available Cities/Pincodes** | Add/remove cities or pincodes where COD is accepted. Can upload CSV of pincodes. Modes: `ALL_INDIA`, `CITY_LIST`, `PINCODE_LIST`. |
| **COD Extra Charge (₹)** | Extra amount added if customer chooses COD (e.g., ₹50) |
| **Prepaid Discount** | Discount for online payment — flat ₹ or % (e.g., ₹100 off or 5% off) |
| **Partial COD Advance** | Amount customer pays online to confirm COD order (e.g., ₹199). The rest is paid on delivery. Reduces RTO. |
| **COD Per-Product Toggle** | Enable/disable COD at the individual product level |
| **Free Shipping Threshold** | Order amount above which shipping is free (e.g., ₹999+) |
| **Flat Shipping Fee** | Default shipping fee if below free shipping threshold |

**Checkout Flow:**
- Customer enters pincode → system checks COD availability via `/api/settings/cod/check-pincode`
- If COD available → show 3 options: "Pay Online (₹X discount)", "Cash on Delivery (+₹Y charge)", and "Partial Advance (Pay ₹Z now, rest on delivery)"
- If COD NOT available → show only prepaid with message "COD not available for your area"

### 11.6 Coupon Engine

Admin can create and manage coupon codes from `/admin/coupons/`:

| Field | Description |
|-------|------------|
| Code | e.g. "DIWALI50" |
| Discount Type | PERCENT or FLAT |
| Discount Value | e.g. 50 (means 50% or ₹50) |
| Scope | `ALL_PRODUCTS`, `SPECIFIC_CATEGORY`, `SPECIFIC_PRODUCTS` |
| Target IDs | Multi-select categories or products (if scoped) |
| Usage Limit | Max total uses across all customers |
| Per-User Limit | Max uses per individual customer |
| Min Order Amount | Minimum cart value to apply coupon |
| Expiry Date | Auto-deactivates after this date |
| Active Toggle | Enable/disable |

The `/checkout` page validates coupons via `/api/coupons/validate` which checks scope, expiry, usage limits, and min order amount before applying.

### 11.7 Site Content Management

All hardcoded website text becomes admin-editable. Stored in MongoDB `siteContent` collection:

| Section | Editable Fields | Currently Hardcoded In |
|---------|----------------|----------------------|
| Announcement Bar | Text message | `AnnouncementBar.tsx` |
| Header Navigation | List of {label, slug} links | `Header.tsx` |
| Homepage Layout | Ordered list of collection slugs, grid config | `page.tsx` |
| Promo Banner | Headline, subtext, button text | `PromoBanner.tsx` |
| Footer | Company name, phone, email, address, copyright | `Footer.tsx` |

### 11.8 MongoDB Schema (Complete)

```text
MongoDB Database: dutiheritage
│
├── products              # One document per product
│   └── { name, slug, price, salePrice, image, images[],
│          description, sizes[], colors[], collectionId,
│          tags[], videoUrls[], offers[], seoTitle,
│          seoDescription, boughtLast7Days,
│          codAvailable: true/false,
│          createdAt, updatedAt }
│
├── collections           # One document per collection
│   └── { name, slug, productCount, createdAt }
│
├── siteContent           # Single document for all site-wide content
│   └── { _id: "global",
│          announcementText,
│          headerNavLinks: [{label, slug}],
│          homepageSlugs: ["new-arrivals", ...],
│          homepageGridOverrides: {"slug": "grid-5"},
│          promoBanner: {headline, subtext, buttonText},
│          footer: {companyName, phone, email, address, copyright} }
│
├── pages                 # One document per policy page
│   └── { slug, title, content, updatedAt }
│
├── coupons               # Coupon codes with scoped discounts
│   └── { code, discountType, discountValue, scope,
│          targetIds[], usageLimit, perUserLimit,
│          minOrderAmount, usedCount, active, expiresAt }
│
├── settings              # Store-wide settings
│   └── { _id: "cod",
│          codEnabled, codCities[], codPincodes[],
│          codMode: "ALL_INDIA|CITY_LIST|PINCODE_LIST",
│          codExtraCharge, prepaidDiscount: {type, value},
│          freeShippingAbove, flatShippingFee }
│
└── orders                # Customer orders
    └── { orderId, customer: {name, email, phone, address},
           items[], subtotal, discount, shipping,
           codCharge, total, paymentMethod, couponCode,
           status, createdAt }
│
└── reviews               # Product reviews
    └── { productId, userId, userName, rating, comment,
           images[], status: "approved|pending",
           isVerifiedPurchase: true/false, createdAt }
```

### 11.9 API Routes Summary

```text
# Products
GET/POST    /api/products              → List / Create
PUT/DELETE  /api/products/[id]         → Update / Delete
POST        /api/products/bulk-import  → CSV bulk import
GET         /api/products/bulk-template → Download CSV template

# Collections
GET/POST    /api/collections           → List / Create
PUT/DELETE  /api/collections/[id]      → Update / Delete

# Site Content
GET/PUT     /api/site-content          → Fetch / Update global content

# Pages
GET/PUT     /api/pages/[slug]          → Fetch / Update policy page

# Coupons
GET/POST    /api/coupons               → List / Create
PUT/DELETE  /api/coupons/[id]          → Update / Delete
POST        /api/coupons/validate      → Validate code at checkout

# COD & Settings
GET/PUT     /api/settings/cod          → Fetch / Update COD config
POST        /api/settings/cod/check-pincode → Check pincode eligibility

# Orders
GET/POST    /api/orders                → List / Create
PUT         /api/orders/[id]           → Update status

# Admin
GET         /api/admin/check           → Verify admin auth

# Upload
POST        /api/upload                → Upload image, return URL
```

### 11.10 Checkout & Order Tracking UI

- **Dynamic Cart Quantity Editing:** The Cart Drawer and Checkout Page both include interactive `+` and `-` quantity adjusters that update the central `AppContext` instantly, recalculating prices, shipping, and FOMO triggers in real-time.
- **Guest Checkout Supported:** Users do NOT need to create an account to buy products. They can checkout freely just by providing their email or phone number on the `/checkout` page.
- **Order Tracking (Frontend):** To check the status of their orders, the user simply logs in (using the same email or phone number they provided at checkout) on the `/account` page.
- **Order Timeline UI:** The `/account` page features an order tracking timeline UI showing the status of each order.
- **Admin Order Sync:** The admin manages orders from `/admin/orders/`. When the admin updates an order's status (e.g., from `Confirmation Pending` → `Confirmed` → `Packed` → `Shipped` → `In Transit` → `Delivered`), it must sync with the MongoDB `orders` collection so that the user's frontend `/account` page reflects the new status instantly.

### 11.11 Advanced User Behavior & Analytics Tracking

To provide maximum insights for marketing and cross-selling, the admin panel must track deep user behavior (stored in a MongoDB `analytics` or `events` collection, or integrated via PostHog). 

The Admin Dashboard should have a **"User Insights"** tab that tracks:
- **Product Views & Frequency:** Which specific user (or guest session) clicked on which products, and exactly *how many times* they viewed it. (e.g., "User +91-9876543210 viewed 'Midnight Velvet Gown' 4 times this week").
- **Cart Abandonment & Funnel Drop-offs:** Track users who added items to the cart but didn't checkout. Show exactly *where* they dropped off (e.g., viewed cart, entered shipping, but abandoned at payment).
- **User Journey Path:** How the user navigated the site (e.g., Homepage → Collection → Product A → Product B → Cart → Drop off).
- **Time on Product:** How long a user stayed looking at a specific product page.
- **Smart Retargeting Lists:** Group users by behavior to send highly targeted WhatsApp or Email campaigns (e.g., "Send 10% discount to all users who viewed the 'Wedding Collection' more than 3 times but never bought").

*Developer Note: Implement this by sending custom tracking events from the frontend React components to an `/api/track` endpoint connected to MongoDB, OR integrate PostHog/Mixpanel and pull those insights via API into the custom Admin dashboard.*

### 11.12 Verified Reviews Architecture

To maintain high trust and eliminate fake reviews, the review system is strictly gated:
- **Verified Buyers Only:** A user can ONLY write a review if two conditions are met:
  1. They have purchased that specific product.
  2. The order status in MongoDB has reached `Delivered`.
- **Review Form Check:** When a user clicks "Write a review" on a product page, the frontend calls an API (e.g., `/api/reviews/eligibility?productId=XYZ&userId=123`). If the backend cannot find a `Delivered` order containing that product for that user, it throws an error: "Only customers who have received this product can write a review."
- **Admin Bypass:** The admin is exempt from this rule. Admins can freely create, edit, or delete any reviews from the `/admin/reviews/` dashboard for marketing and moderation purposes.

### 11.13 Customer Intelligence & Communication Hub

The admin panel must have a dedicated **"Customers"** section that aggregates ALL customer data from every source into a single, powerful dashboard.

#### 11.13.1 Customer Data Aggregation

Pull and merge customer data from these sources into a unified `customers` MongoDB collection:

| Source | Data Pulled | How |
|--------|------------|-----|
| **Meta Pixel (Facebook)** | Website visitors, page views, add-to-carts, purchases, custom audiences | Use [Meta Marketing API](https://developers.facebook.com/docs/marketing-api/) or [Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api/) to pull audience insights. Store `fbclid` and `fbp` cookies from the frontend to link anonymous visitors to Meta profiles. |
| **Firebase Auth** | Logged-in users: email, phone, display name, UID, login method (Google/Phone/Email) | Already implemented in `AppContext.tsx`. Sync to MongoDB `customers` collection on every login via `/api/auth/sync`. |
| **Checkout Data** | Guest buyers: name, email, phone, address, pincode, city, state | Captured on `/checkout` page. Store in MongoDB `customers` collection keyed by email or phone. |
| **On-Site Tracking** | Product views, cart additions, wishlist, time on page, session paths | Frontend sends events to `/api/track` endpoint. Stored in MongoDB `events` collection, linked to customer by `userId` or `sessionId`. |
| **Order History** | All orders, total spend, avg order value, last purchase date, lifetime value (LTV) | Aggregated from MongoDB `orders` collection per customer. |

#### 11.13.2 Unified Customer Profile

Each customer in the admin panel shows a **360° profile card**:

```text
┌─────────────────────────────────────────────────┐
│ 👤 Priya Sharma                                 │
│ 📧 priya@gmail.com  |  📱 +91-98765-43210       │
│ 🏠 Sector 22, Gurugram, Haryana - 122015        │
│─────────────────────────────────────────────────│
│ Source: Meta Pixel + Google Login                │
│ First Visit: 12 Aug 2026  |  Last Visit: Today  │
│ Total Orders: 4  |  Total Spent: ₹12,400        │
│ Avg Order: ₹3,100  |  LTV Score: HIGH           │
│─────────────────────────────────────────────────│
│ Recent Activity:                                │
│  • Viewed 'Midnight Velvet Gown' 6x this week   │
│  • Added 'Pearl Clutch' to cart (abandoned)      │
│  • Purchased 'Silk Saree Set' on 20 Aug          │
│─────────────────────────────────────────────────│
│ Tags: [Repeat Buyer] [Wedding] [High LTV]       │
│ Groups: VIP Customers, Wedding Collection Fans   │
└─────────────────────────────────────────────────┘
```

#### 11.13.3 Customer Grouping & Segmentation

The admin can create **Smart Groups** (auto-populated) and **Manual Groups** (hand-picked):

**Smart Groups (Auto-Filters):**
| Group Rule | Example |
|-----------|---------|
| Viewed product X more than N times | "Viewed 'Midnight Velvet Gown' > 3 times" |
| Added to cart but never purchased | "Cart abandoners in last 7 days" |
| Purchased from collection X | "All Wedding Collection buyers" |
| Total spend above ₹X | "High spenders (₹10,000+)" |
| Haven't purchased in X days | "Dormant customers (30+ days)" |
| Came from Meta Pixel campaign | "Instagram Ad - Diwali Sale clickers" |
| Located in city/state X | "All Mumbai customers" |
| Signed up but never purchased | "Window shoppers" |

**Manual Groups:**
- Admin can hand-pick specific customers and add them to a named group (e.g., "VIP Influencers", "Wholesale Buyers")
- Admin can tag individual customers with custom labels

#### 11.13.4 Communication Tools

Once a group is created, the admin can **bulk communicate** via:

**📧 Email Campaigns:**
- Admin selects a group → clicks "Send Email" → writes subject + body (rich text editor with product image embeds)
- Backend sends via **Resend**, **SendGrid**, or **AWS SES** API
- Track open rate, click rate per campaign
- API: `POST /api/admin/campaigns/email` with `{ groupId, subject, body, scheduledAt? }`

**📱 WhatsApp Campaigns:**
- Admin selects a group → clicks "Send WhatsApp" → picks a pre-approved template or writes a message
- Backend sends via **WhatsApp Business API** (through providers like Interakt, Wati, AiSensy, or direct Meta Cloud API)
- Track delivery status, read receipts
- API: `POST /api/admin/campaigns/whatsapp` with `{ groupId, templateName, parameters[] }`

**Campaign History Dashboard:**
- Show all past campaigns with metrics: sent count, delivered, opened, clicked, unsubscribed
- Stored in MongoDB `campaigns` collection

#### 11.13.5 MongoDB Schema Additions

```text
├── customers              # Unified customer profiles
│   └── { email, phone, name, address, city, state, pincode,
│          firebaseUid, metaPixelId, fbclid,
│          source: "meta_pixel|firebase|checkout|manual",
│          tags: ["VIP", "Wedding"],
│          groupIds: [ObjectId],
│          totalOrders, totalSpent, avgOrderValue, ltvScore,
│          firstVisit, lastVisit, lastPurchase,
│          createdAt, updatedAt }
│
├── customerGroups          # Smart & manual groups
│   └── { name, type: "smart|manual",
│          filters: { field, operator, value }[],  // for smart groups
│          memberIds: [ObjectId],                   // for manual groups
│          memberCount, createdAt, updatedAt }
│
├── campaigns               # Email & WhatsApp campaigns
│   └── { name, channel: "email|whatsapp",
│          groupId, subject, body, templateName,
│          status: "draft|scheduled|sent|failed",
│          scheduledAt, sentAt,
│          stats: { sent, delivered, opened, clicked, failed },
│          createdAt }
│
├── events                  # Raw tracking events
│   └── { customerId, sessionId, event, productId,
│          metadata: {}, timestamp }
```

#### 11.13.6 API Routes

```text
GET    /api/admin/customers              → List all customers (paginated, searchable)
GET    /api/admin/customers/:id          → Single customer 360° profile
PATCH  /api/admin/customers/:id/tags     → Add/remove tags
POST   /api/admin/groups                 → Create smart or manual group
GET    /api/admin/groups                 → List all groups with member counts
GET    /api/admin/groups/:id/members     → List members of a group
POST   /api/admin/campaigns/email        → Send email to a group
POST   /api/admin/campaigns/whatsapp     → Send WhatsApp to a group
GET    /api/admin/campaigns              → Campaign history with stats
POST   /api/track                        → Frontend event tracking endpoint
GET    /api/admin/meta/audiences         → Pull Meta Pixel custom audiences
```

*Developer Note: For Meta Pixel data, use the [Meta Marketing API](https://developers.facebook.com/docs/marketing-api/audiences/) with a System User access token. The frontend already fires Meta Pixel events via `src/lib/meta-pixel.ts` — these events are visible in Meta Events Manager. To pull this data INTO the admin panel, query the Marketing API for Custom Audiences and match by email/phone using hashed identifiers. For WhatsApp, use Interakt or Wati as the provider for easiest integration — they handle template approval and provide simple REST APIs.*

### 11.14 Automated Communication Flows (Email + WhatsApp)

The system must send **automatic triggered messages** (no manual admin action needed) based on user actions. These run via **Vercel Cron Jobs** that check MongoDB every hour for pending triggers.

#### 11.14.1 Flow Triggers

| # | Trigger Event | Delay | Channel | Message |
|---|--------------|-------|---------|---------|
| 1 | **New Signup** | Instant | Email + WhatsApp | "Welcome to Duti Heritage! 🎉 Here's 10% off your first order — use code WELCOME10" |
| 2 | **Order Placed** | Instant | Email + WhatsApp | "Your order #DH-1234 is confirmed! ✅ We're preparing it with love. Track it anytime from your account." |
| 3 | **Order Shipped** | Instant | Email + WhatsApp | "Your order #DH-1234 has been shipped! 📦 Track it here: [tracking link]" |
| 4 | **Order Delivered** | Instant + 3 days | Email | Instant: "Your order has been delivered! 🎁" — After 3 days: "How was your experience? Leave a review and get ₹100 off your next order." |
| 5 | **Cart Abandoned** | 1 hour, 24 hours, 72 hours | Email + WhatsApp | **1hr:** "You left something behind! Your cart is waiting 🛒" — **24hr:** "Still thinking? Your items are selling fast ⚡" — **72hr:** "Last chance! Here's 5% off to complete your order — use code COMEBACK5" |
| 6 | **Wishlist Reminder** | 3 days, 7 days | Email | **3 days:** "Still eyeing [Product Name]? It's waiting for you 💫" — **7 days:** "Your wishlisted [Product Name] is back in stock / running low — grab it before it's gone!" |
| 7 | **Browse Abandonment** | 24 hours | Email | "You were checking out [Product Name] yesterday — still interested? Here's a closer look 👀" (only if user viewed a product 3+ times but never added to cart) |
| 8 | **Post-Purchase Upsell** | 5 days after delivery | Email | "Customers who bought [Product A] also loved [Product B] — check it out!" |
| 9 | **Win-Back (Dormant)** | 30 days, 60 days | Email + WhatsApp | **30 days:** "We miss you! Here's what's new at Duti Heritage 🌟" — **60 days:** "It's been a while! Come back with 15% off everything — code MISSYOU15" |
| 10 | **Birthday/Anniversary** | On date | Email + WhatsApp | "Happy Birthday! 🎂 Enjoy 20% off as our gift to you — code BDAY20" (if user has provided DOB in profile) |

#### 11.14.2 Event-Driven Triggers (Real-time)

Certain flows execute **instantly** without waiting for cron jobs. These are hooked directly into API actions.

**Example: Admin Shipping Notification Hook**
When the admin fulfills an order in the dashboard:
1. Admin enters AWB (Tracking ID) and Courier Name on the order page.
2. Admin clicks **"Save & Mark as Shipped"**.
3. Frontend calls `PATCH /api/admin/orders/:id` with `status: "Shipped"` and `trackingInfo`.
4. **Backend Hook:** Before returning the `200 OK` response, the backend *instantly* fires the Email and WhatsApp APIs.
5. Customer's phone immediately buzzes: *"Your order #DH-1234 has been shipped via BlueDart! Track here: [link]"*

Other Event-Driven Hooks include:
- **New Signup:** Hooked into `/api/auth/sync` (Instant Welcome Email)
- **Order Placed:** Hooked into the Payment Gateway Webhook (`/api/webhooks/payment-success`)

#### 11.14.3 Implementation Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
│  Events fired on: signup, add-to-cart, wishlist,        │
│  product view, checkout start, checkout complete        │
│         │                                               │
│         ▼                                               │
│   POST /api/track  { event, userId, productId, meta }   │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  MongoDB Collections                    │
│                                                         │
│  events     → Raw event log (userId, event, timestamp)  │
│  carts      → Active carts with status & last_updated   │
│  wishlists  → Wishlisted products per user              │
│  automations → Automation rules & templates             │
│  automationLogs → Sent messages log (prevents dupes)    │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│            Vercel Cron Jobs (run every hour)             │
│                                                         │
│  /api/cron/abandoned-carts   → Check carts older than   │
│                                 1hr/24hr/72hr, send msg │
│  /api/cron/wishlist-reminders → Check wishlists with no │
│                                  purchase after 3/7 days│
│  /api/cron/browse-abandonment → Check 3+ views with no │
│                                  cart add after 24hrs   │
│  /api/cron/post-purchase     → Check delivered orders   │
│                                 older than 5 days       │
│  /api/cron/winback           → Check customers dormant  │
│                                 for 30/60 days          │
│         │                                               │
│         ▼                                               │
│  Send via: Resend (email) + Interakt/Wati (WhatsApp)    │
│  Log to: automationLogs (prevents duplicate sends)      │
└─────────────────────────────────────────────────────────┘
```

#### 11.14.4 MongoDB Schema Additions

```text
├── wishlists               # User wishlists
│   └── { userId, productId, addedAt }
│
├── automations             # Automation rules (admin-editable)
│   └── { trigger, delayMinutes, channel,
│          subject, body, whatsappTemplate,
│          enabled: true/false, createdAt }
│
├── automationLogs          # Prevents duplicate sends
│   └── { automationId, customerId, trigger,
│          channel, sentAt, status }
```

#### 11.14.5 Admin Controls

The admin panel must have an **"Automations"** section where the admin can:
- **Toggle ON/OFF** each automation flow independently
- **Edit message templates** (subject, body, WhatsApp template name)
- **Change delays** (e.g., change cart abandonment from 1hr to 2hr)
- **View logs** — see exactly which messages were sent to whom and when
- **View stats** — open rate, click rate, conversion rate per automation

#### 11.14.6 Cron Job Config (vercel.json)

```json
{
  "crons": [
    { "path": "/api/cron/abandoned-carts", "schedule": "0 * * * *" },
    { "path": "/api/cron/wishlist-reminders", "schedule": "0 */6 * * *" },
    { "path": "/api/cron/browse-abandonment", "schedule": "0 */4 * * *" },
    { "path": "/api/cron/post-purchase", "schedule": "0 9 * * *" },
    { "path": "/api/cron/winback", "schedule": "0 10 * * *" },
    { "path": "/api/cron/welcome", "schedule": "*/5 * * * *" }
  ]
}
```

*Developer Note: Each cron job MUST check `automationLogs` before sending to prevent duplicate messages. Use a compound index on `{ automationId, customerId, trigger }` to efficiently check if a message was already sent. For the welcome email, fire it immediately on signup via the `/api/auth/sync` endpoint rather than waiting for a cron — the cron is a fallback only. All WhatsApp templates must be pre-approved by Meta before sending — use Interakt/Wati dashboard for template management.*

---

Good luck! You are stepping into a beautifully structured, heavily optimized codebase. Have fun building!
