import { adapters } from "@/lib/adapters";
import { getCached, makeCacheKey, setCached } from "@/lib/cache";
import { SEARCH_CACHE_TTL_SECONDS } from "@/lib/app-config";
import { getSearchTarget, buildProductIntelligence } from "@/lib/product-intelligence";
import { runAdapterSafely } from "@/lib/adapter-runner";
import { isLikelySku, normalizeSearchQuery, normalizeSku } from "@/lib/sku";
import { approvedStores } from "@/lib/stores";
import type { HydratedSearchResult, ProductIntelligence, ProductSummary, SearchPayload, StoreSearchResult } from "@/types/search";

const FALLBACK_IMAGE = "/shoe-fallback.svg";

type CachedSearch = {
  results: HydratedSearchResult[];
  product: ProductSummary;
  intelligence: ProductIntelligence;
  resolvedSku: string;
  normalizedSku: string;
};

function hydrateResult(data: StoreSearchResult): HydratedSearchResult {
  const store = approvedStores.find((s) => s.id === data.storeId);

  return {
    ...data,
    productImage: data.productImage || FALLBACK_IMAGE,
    storeName: store?.name || "Unknown Store",
    city: store?.city || "",
    phone: store?.phone || "",
    website: store?.website || "",
    platform: store?.platform || "Unknown",
    tier: store?.tier || "Unverified",
  };
}

function unavailableResult(storeId: string, query: string, note: string): HydratedSearchResult {
  return hydrateResult({
    storeId,
    sku: query,
    productTitle: "Search temporarily unavailable",
    status: "Unavailable",
    sizes: [],
    sizeAvailability: [],
    price: "—",
    productUrl: "",
    checkedAt: new Date().toISOString(),
    confidence: "Low",
    note,
    productImage: FALLBACK_IMAGE,
  });
}

export async function runSkuSearch(input: string, options?: { disabledStoreIds?: string[] }): Promise<SearchPayload> {
  const query = String(input || "").trim();
  const normalizedQuery = normalizeSearchQuery(query);
  const searchTarget = getSearchTarget(normalizedQuery);
  const normalizedSku = isLikelySku(searchTarget) ? normalizeSku(searchTarget) : searchTarget;
  const disabledStoreIds = new Set(options?.disabledStoreIds || []);
  const enabledSignature = Array.from(disabledStoreIds).sort().join(",") || "all";
  const cacheKey = makeCacheKey(["sku-search-v101-keyword-spaces", normalizedQuery.toUpperCase(), searchTarget.toUpperCase(), enabledSignature]);
  const cached = getCached<CachedSearch>(cacheKey);

  if (cached) {
    return {
      query,
      normalizedSku: cached.normalizedSku,
      resolvedSku: cached.resolvedSku,
      product: cached.product,
      intelligence: cached.intelligence,
      results: cached.results,
      checkedAt: new Date().toISOString(),
      cache: { hit: true, ttlSeconds: SEARCH_CACHE_TTL_SECONDS },
    };
  }

  const activeAdapters = adapters.filter((adapter) =>
    approvedStores.some((store) => store.id === adapter.storeId && store.active && store.onlineSales && !disabledStoreIds.has(store.id))
  );

  const adapterRuns = await Promise.all(activeAdapters.map((adapter) => runAdapterSafely(adapter, searchTarget)));

  const results = adapterRuns.map((run) => {
    if (!run.result.productUrl) {
      const store = approvedStores.find((item) => item.id === run.storeId);
      run.result.productUrl = store?.website ? `${store.website}/search?q=${encodeURIComponent(searchTarget)}` : "";
    }
    return hydrateResult(run.result);
  });

  const { product, intelligence } = buildProductIntelligence(query, searchTarget, results);
  const resolvedSku = product.resolvedSku;
  const payloadToCache: CachedSearch = { results, product, intelligence, resolvedSku, normalizedSku };
  setCached(cacheKey, payloadToCache, SEARCH_CACHE_TTL_SECONDS);

  return {
    query,
    normalizedSku,
    resolvedSku,
    product,
    intelligence,
    results,
    checkedAt: new Date().toISOString(),
    cache: { hit: false, ttlSeconds: SEARCH_CACHE_TTL_SECONDS },
  };
}
