import type { StoreAdapter } from "./types";
import { searchPublicShopifyStore } from "./shopify-public";

export function createShopifyAdapter(storeId: string, baseUrl: string): StoreAdapter {
  return {
    storeId,
    search: async (sku) => searchPublicShopifyStore({ storeId, baseUrl, sku }),
  };
}
