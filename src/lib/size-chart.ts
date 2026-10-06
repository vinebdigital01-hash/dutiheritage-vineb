/** Store-default size chart (garment measurements, inches). Used when a product has no custom chart. */
export const DEFAULT_SIZE_CHART = {
  title: "Size chart",
  note: "Garment measurements in inches. If you are between sizes, we suggest the larger size.",
  columns: ["Size", "Bust", "Waist", "Hip"] as const,
  rows: [
    ["XS", "34", "28", "36"],
    ["S", "36", "30", "38"],
    ["M", "38", "32", "40"],
    ["L", "40", "34", "42"],
    ["XL", "42", "36", "44"],
    ["XXL", "44", "38", "46"],
  ],
};
