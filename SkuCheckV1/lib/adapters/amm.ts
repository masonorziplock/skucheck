import type { StoreAdapter } from "./types";
import { searchPublicShopifyStore } from "./shopify-public";

export const ammAdapter: StoreAdapter = {
  storeId: "amm",
  search: async (sku) =>
    searchPublicShopifyStore({
      storeId: "amm",
      baseUrl: "https://www.a-ma-maniere.com",
      sku,
    }),
};
