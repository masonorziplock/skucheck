import type { StoreAdapter } from "./types";

export const kithAdapter: StoreAdapter = {
  storeId: "kith",
  search: async (sku) => ({
    storeId: "kith",
    sku,
    productTitle: "Potential Match Found",
    status: "Unknown",
    sizes: [],
    price: "—",
    productUrl: `https://kith.com/search?q=${encodeURIComponent(sku)}`,
    checkedAt: new Date().toISOString(),
    confidence: "Low",
    note: "Store requires manual confirmation from the product/search page.",
  }),
};
