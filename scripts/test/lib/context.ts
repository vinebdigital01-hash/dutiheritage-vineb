/** Shared state across API case modules in one run. */
export type TestContext = {
  productId?: string;
  productSlug?: string;
  collectionId?: string;
  orderId?: string;
  orderMongoId?: string;
  adminToken?: string;
  customerToken?: string;
  createdProductId?: string;
  createdCollectionId?: string;
  createdCouponId?: string;
  createdCouponCode?: string;
  siteAnnouncementBackup?: string;
};

export const ctx: TestContext = {};
