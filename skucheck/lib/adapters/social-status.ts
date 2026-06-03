import type { StoreAdapter } from "./types";
import { searchPublicShopifyStore } from "./shopify-public";

export const socialStatusAdapter: StoreAdapter = {
  storeId: "social-status",
  search: async (sku) =>
    searchPublicShopifyStore({
      storeId: "social-status",
      baseUrl: "https://www.socialstatuspgh.com",
      sku,
    }),
};
