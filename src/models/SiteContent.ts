import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const NavLinkSchema = new Schema(
  {
    label: { type: String, required: true },
    slug: { type: String, required: true },
  },
  { _id: false }
);

const PromoBannerSchema = new Schema(
  {
    headline: { type: String, default: "" },
    subtext: { type: String, default: "" },
    buttonText: { type: String, default: "" },
  },
  { _id: false }
);

const FooterSchema = new Schema(
  {
    companyName: { type: String, default: "Duti Heritage" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    copyright: { type: String, default: "" },
  },
  { _id: false }
);

const SiteContentSchema = new Schema(
  {
    _id: { type: String, default: "global" },
    announcementText: {
      type: String,
      default: "NEW ARRIVALS UPTO 40% OFF",
    },
    headerNavLinks: { type: [NavLinkSchema], default: [] },
    homepageSlugs: {
      type: [String],
      default: [
        "new-arrivals",
        "new-western-launch",
        "on-sale",
        "duti-heritage-luxe",
        "unstitched-sale",
        "premium-night-wear",
        "unstitched",
        "velvet",
        "wedding",
        "best-sellers",
        "dresses",
        "tops-shirts",
        "popular-picks",
      ],
    },
    homepageGridOverrides: { type: Map, of: String, default: {} },
    promoBanner: {
      type: PromoBannerSchema,
      default: () => ({
        headline: "Join the Heritage Club",
        subtext: "Get early access to drops and exclusive offers.",
        buttonText: "Subscribe",
      }),
    },
    footer: {
      type: FooterSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

export type SiteContentDocument = InferSchemaType<typeof SiteContentSchema> & {
  _id: string;
};

export const SiteContent: Model<SiteContentDocument> =
  (models.SiteContent as Model<SiteContentDocument>) ||
  model<SiteContentDocument>("SiteContent", SiteContentSchema);
