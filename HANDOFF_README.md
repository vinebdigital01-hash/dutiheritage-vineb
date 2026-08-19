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
- `removeFromCart(cartItemId)`: Removes an item.
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

---

## 🎯 10. Your Final To-Do List

1. **Wire Auth (Firebase Only):** Firebase is STRICTLY used for authentication (passwords, OTP, forgot password, magic links, social logins). Firebase Config is in `src/lib/firebase.ts` and auth state is managed in `src/context/AppContext.tsx`.
   - **CRITICAL SECURITY REQUIREMENT FOR "FORGOT PASSWORD" & "MAGIC LINK":** Firebase's "Email Enumeration Protection" is enabled, meaning Firebase cannot securely tell us if an email is registered before sending a link. Once MongoDB is wired up, you MUST update `src/app/account/page.tsx` to query the MongoDB `users` collection FIRST. If the email does not exist in MongoDB, explicitly throw a "No account found with this email. Please register first" error and prevent Firebase from sending the email link.
2. **Wire the DB (MongoDB):** Update the 5 functions in `src/services/db.ts` to fetch from MongoDB instead of mock data. MongoDB is used for ALL database storage (products, users, carts, orders).
3. **Build an "In-Line / Visual" Admin Experience:** The client specifically DOES NOT want a separate `/admin` dashboard.
    - **How it should work:** When the admin logs in via Firebase Auth, they should simply be redirected back to the public website.
    - Because their session has `admin === true`, the frontend components should conditionally render "Edit" buttons (or `contentEditable` fields) directly on top of the live website elements.
    - **Full Control:** The admin must be able to click directly on the live website to edit: product titles, prices, descriptions, tags, upload replacement images/videos, and manage coupons. Clicking "Save" pushes the changes to MongoDB and immediately reflects on the deployed site.
    - **CRITICAL - SCHEMA FIELDS TO SUPPORT IN THE INLINE EDITOR:** You must ensure the inline editor allows the admin to edit these specific fields. **You must also enforce the following SEO character limits in the admin form UI:**
      - `seoDescription?: string;` -> (Must show a character counter. Reject if under 120 chars. Aim for 120-160 characters for maximum CTR).
      - `tags?: string[];` // Array of multiple tags like "Bestseller", "Sale", etc. (Replaced legacy 'badge' field)
      - `boughtLast7Days?: number;` // FOMO metric
      - `videoUrls?: string[];` // Array of UGC showcasing video URLs
      - `offers?: { title: string; description: string; code?: string; }[];`
    - **COUPON ENGINE (NEW REQUIREMENT):** Build a separate `coupons` collection in MongoDB. Admin must be able to create a coupon code (e.g., "DIWALI50") and explicitly define its scope:
      - `scope`: "ALL_PRODUCTS" | "SPECIFIC_CATEGORY" | "SPECIFIC_PRODUCTS"
      - `targetIds`: string[] (Array of specific Category IDs or Product IDs)
      - The `/checkout` API logic must strictly validate this scope before applying the discount.
4. **Checkout Page:** Create `src/app/checkout/page.tsx`. Hook it up to Razorpay, Stripe, or PhonePe.
5. **Abandoned Cart Email Triggers (Automations):**
   - When a user adds an item to their cart and inputs their email (or is logged in), sync the cart to a `carts` collection in MongoDB with a `status: "abandoned"` and a `last_updated` timestamp.
   - Set up a Vercel Cron Job (`src/app/api/cron/abandoned-carts/route.ts`) to run hourly. It should query for carts older than 2 hours and trigger an email via Resend or SendGrid API. Update status to `status: "emailed"`.
   - When they checkout, update the document to `status: "purchased"`.
6. **Inline Admin Analytics Dashboard:**
   - In addition to inline text editing, the admin must be able to view live store analytics directly on the frontend (e.g., in a sliding drawer or floating panel).
   - Show total **Views** (integrate PostHog or Google Analytics API for accurate traffic counts).
   - Show total **Purchases** (queried from MongoDB).
   - Show total **Abandoned Carts** (queried from MongoDB).

Good luck! You are stepping into a beautifully structured, heavily optimized codebase. Have fun building!
