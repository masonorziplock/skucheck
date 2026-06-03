import type { StoreSearchResult } from "@/types/search";

export type StoreAdapter = {
  storeId: string;
  search: (sku: string) => Promise<StoreSearchResult>;
};
