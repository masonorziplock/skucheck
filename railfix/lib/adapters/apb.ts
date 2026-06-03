import type { StoreAdapter } from "./types";
import { searchPublicShopifyStore } from "./shopify-public";

export const apbAdapter: StoreAdapter = {
  storeId: "apb",
  search: async (sku) =>
    searchPublicShopifyStore({
      storeId: "apb",
      baseUrl: "https://www.apbstore.com",
      sku,
    }),
};
