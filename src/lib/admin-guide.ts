export type AdminGuide = {
  title: string;
  inOneLine: string;
  steps: string[];
};

function g(title: string, inOneLine: string, steps: string[]): AdminGuide {
  return { title, inOneLine, steps };
}

const BY_PATH: Record<string, AdminGuide> = {
  "/admin": g("Home", "Today’s snapshot — you pack parcels from Orders, not here.", [
    "If orders wait for confirm, open Orders.",
    "If stock is low, open Stock.",
    "Click a recent order number to work on that order.",
    "Download complete analysis saves a real Excel file for the 7 / 30 / 90 days you picked.",
  ]),
  "/admin/orders": g("Orders", "Find the order, confirm it, then add tracking when you ship.", [
    "Search by order number, phone, or name.",
    "Confirm a new order, or open it for full details.",
    "When the parcel leaves, type courier name and tracking number on the order.",
  ]),
  "/admin/returns": g("Returns", "Customer wants the item back. Approve, put stock back, then refund if needed.", [
    "Approve or reject the request.",
    "After approve, restock so that size can sell again.",
    "Refund if money should go back.",
  ]),
  "/admin/inventory": g("Stock", "Which sizes are running out or already sold out.", [
    "Open the product to add quantity, or use the spreadsheet tool.",
    "Out of stock means that size cannot be bought until you add stock.",
  ]),
  "/admin/customers": g("Customers", "Every shopper. Open one person to see their orders.", [
    "Search by name, phone, or email.",
    "Freeze = they cannot place new orders. Block COD = online pay still OK.",
  ]),
  "/admin/reviews": g("Reviews", "New reviews wait here until you allow them on the product page.", [
    "Read the review.",
    "Approve to show it on the site, or reject to hide it.",
  ]),
  "/admin/whatsapp": g("WhatsApp chats", "Chats with customers. The order card opens that order.", [
    "Turn on Unread only to see who is waiting.",
    "Click a chat, assign it to you, then type a reply.",
  ]),
  "/admin/products": g("Products", "What you sell — photos, price, sizes, stock.", [
    "Add a product to create one item.",
    "Click a product to change price or stock.",
    "Prices include GST.",
  ]),
  "/admin/collections": g("Collections", "Folders on the store, like Sale or Wedding.", [
    "Create a collection.",
    "Put products into it when you add or edit a product.",
  ]),
  "/admin/coupons": g("Discount codes", "Codes customers type at checkout.", [
    "Create a code and the discount (₹ or %).",
    "If the code is only for some categories or products, search and tick them — no Ctrl needed.",
    "Turn Active off to stop the code.",
  ]),
  "/admin/analytics": g("Sales charts", "What sold and who bought. Not for packing parcels.", [
    "Pick a date range.",
    "Use this to decide what to restock or advertise.",
  ]),
  "/admin/reports": g("Email reports", "Send a monthly summary to the store inbox.", [
    "Generate or send the report.",
    "Day-to-day packing is still on Orders.",
  ]),
  "/admin/groups": g("Customer lists", "Groups of people you can message together.", [
    "Create a list.",
    "Send email or WhatsApp from this page.",
  ]),
  "/admin/automations": g("Auto messages", "On/off for order placed, shipped, cart left unpaid, and similar.", [
    "Turn a message on only after a test send in Store settings works.",
    "The log below shows if a message failed.",
  ]),
  "/admin/content": g("Homepage", "Banners, top menu, and policy pages — no developer needed.", [
    "Add a banner image and save.",
    "Announcement bar is the thin strip at the top of the shop.",
    "Policy pages are further down this screen.",
  ]),
  "/admin/settings": g("Store settings", "GSTIN, online pay, COD pincodes, and a test message.", [
    "Fill legal name and GSTIN so invoices are correct.",
    "Set where COD is allowed.",
    "Use test send before you rely on email or WhatsApp.",
  ]),
  "/admin/audit": g("Who changed what", "History of staff actions. Not the customer’s parcel tracking.", [
    "Search by person or order number.",
  ]),
  "/admin/staff": g("Staff", "Invite people to this admin. Superadmin only.", [
    "Add email, name, and role (Manager = orders; Admin = catalog too).",
    "They set a password from the email, then use Staff login.",
  ]),
  "/admin/logs": g("Error log", "Technical errors. Not “what happened to this order”.", [
    "Open this if a page is broken.",
    "For an order’s history, open the order instead.",
  ]),
};

export function getAdminGuide(pathname: string | null | undefined): AdminGuide | null {
  if (!pathname || pathname === "/admin/login") return null;
  if (["/pack", "/invoice", "/bulk-invoice"].some((s) => pathname.includes(s))) return null;

  if (pathname.startsWith("/admin/orders/") && pathname.split("/").filter(Boolean).length >= 3) {
    return g("This order", "Confirm → pack → type tracking → ship. Refunds and returns are on the right.", [
      "Confirm the order (or pause / cancel with a reason).",
      "Print packing slip. Type courier + tracking number. Set Shipped.",
      "Refund = money back. File return = send to the Returns list.",
    ]);
  }
  if (pathname.startsWith("/admin/customers/") && pathname !== "/admin/customers") {
    return g("This customer", "Orders, address, and whether they can still shop.", [
      "Open an order from their list if you need to pack or refund.",
      "Freeze only if they must not place new orders.",
    ]);
  }
  if (pathname.includes("/products/") && pathname.includes("/edit")) {
    return g("Edit product", "Change photos, price, and size stock, then Save.", [
      "Prices include GST.",
      "Each size needs a stock number if you track inventory.",
    ]);
  }
  if (pathname === "/admin/products/new") {
    return g("New product", "One item for the shop.", [
      "Pick a collection, add a photo and a price, add sizes, then create.",
    ]);
  }
  if (pathname.startsWith("/admin/products/bulk")) {
    return g("Spreadsheet tools", "Change many products or stock numbers at once.", [
      "Download the file, edit it, then upload it back.",
      "This cannot be easily undone — check the rows first.",
    ]);
  }
  if (pathname.startsWith("/admin/groups/")) {
    return g("This list", "People in this group.", [
      "Go back to Customer lists to send them a message.",
    ]);
  }
  if (pathname.startsWith("/admin/settings/")) {
    return g("COD pincodes", "Where cash on delivery is allowed.", [
      "Add or remove pincodes, then save.",
      "A blocked customer still cannot use COD even if the pincode is allowed.",
    ]);
  }
  if (pathname.startsWith("/admin/whatsapp/")) {
    return g("WhatsApp extras", "Broadcast, logs, or chat numbers — not packing parcels.", [
      "Day-to-day replies are on WhatsApp chats.",
    ]);
  }
  if (BY_PATH[pathname]) return BY_PATH[pathname]!;
  const ranked = Object.keys(BY_PATH)
    .filter((p) => p !== "/admin" && pathname.startsWith(p + "/"))
    .sort((a, b) => b.length - a.length);
  return ranked[0] ? BY_PATH[ranked[0]!]! : null;
}
