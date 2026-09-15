# Implementation Plan: Bonus Features (8a-8e)

This plan covers the 5 additional client improvements.

## 8a. Product Activity Log (Audit Trail)
- **Model**: Add `lastEditedBy` (String) to `ProductSchema`. Mongoose already handles `updatedAt`.
- **API**: In `PUT /api/products/[id]`, capture the `authUser.email` or `name` and save it to `lastEditedBy`.
- **UI**: In `ProductForm.tsx`, read `product.updatedAt` and `product.lastEditedBy` to display a small info banner: *"Last edited by [Name] on [Date]"*.

## 8b. Low Stock Email Alerts
- **Service**: Update `src/services/inventory.ts` (`adjustInventory`). After decrementing stock, if the new stock is `<= lowStockThreshold` AND the previous stock was `> lowStockThreshold` (to avoid spamming), trigger an email alert.
- **Email**: Use `sendEmail` to notify `SUPER_ADMIN_EMAIL` about the low stock item.

## 8c. Bulk Inventory Update via CSV
- **UI**: In `src/app/admin/products/page.tsx`, add a "Bulk Inventory" dropdown with "Download Template" and "Upload CSV".
- **API**: Create `GET /api/products/bulk-inventory` to generate a CSV with `productId, name, size, sku, stock`.
- **API**: Create `POST /api/products/bulk-inventory` to accept the CSV and perform bulk `$set` operations on `inventory.$.stock`.

## 8d. Collection-Level Discount Banner
- **Model**: Add `discountBanner` (String) to `CollectionSchema`.
- **UI (Admin)**: Add a text input in `CollectionForm.tsx` for the banner text.
- **UI (Frontend)**: In `src/app/collections/[slug]/page.tsx`, if `discountBanner` exists, display a full-width announcement bar below the collection header.

## 8e. Order Export Improvements
- **API**: Update `GET /api/orders/export` to accept `startDate`, `endDate`, `status`, and `paymentMethod` query params. Ensure `customer.phone` is mapped into the final CSV columns.
- **UI**: In `src/app/admin/orders/page.tsx`, update the "Export CSV" button to open a small modal where the admin can select the date range and filters before downloading.

## User Review Required
Please review this plan. If you approve, I will begin executing these features sequentially!
