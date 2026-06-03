import { approvedStores } from "@/lib/stores";
import { isAvailableStatus, isLookupUnavailable, isTrueProductMatch } from "@/lib/status";
import type { SearchPayload, StockStatus } from "@/types/search";

type StoreHealth = {
  storeId: string;
  storeName: string;
  city: string;
  platform: string;
  totalLookups: number;
  available: number;
  soldOut: number;
  noMatch: number;
  unavailable: number;
  productFound: number;
  lastStatus: StockStatus | "Not Checked";
  lastChecked: string | null;
  health: "Healthy" | "Needs Review" | "Unstable" | "Not Checked";
};

type RecentSearchLog = {
  id: string;
  query: string;
  resolvedSku: string;
  productTitle: string;
  checkedAt: string;
  cacheHit: boolean;
  storesChecked: number;
  matchesFound: number;
  availableCount: number;
  unavailableCount: number;
};

type AnalyticsState = {
  totalSearches: number;
  cacheHits: number;
  cacheMisses: number;
  matchesFound: number;
  availableFound: number;
  soldOutCount: number;
  lookupUnavailableCount: number;
  noMatchCount: number;
  failedRequests: number;
  recentSearches: RecentSearchLog[];
  storeHealth: Record<string, StoreHealth>;
};

const globalForAnalytics = globalThis as typeof globalThis & { __ssfAnalytics?: AnalyticsState };

function makeInitialStoreHealth(): Record<string, StoreHealth> {
  return Object.fromEntries(
    approvedStores.map((store) => [
      store.id,
      {
        storeId: store.id,
        storeName: store.name,
        city: store.city,
        platform: store.platform,
        totalLookups: 0,
        available: 0,
        soldOut: 0,
        noMatch: 0,
        unavailable: 0,
        productFound: 0,
        lastStatus: "Not Checked",
        lastChecked: null,
        health: "Not Checked",
      },
    ])
  );
}

function getState(): AnalyticsState {
  if (!globalForAnalytics.__ssfAnalytics) {
    globalForAnalytics.__ssfAnalytics = {
      totalSearches: 0,
      cacheHits: 0,
      cacheMisses: 0,
      matchesFound: 0,
      availableFound: 0,
      soldOutCount: 0,
      lookupUnavailableCount: 0,
      noMatchCount: 0,
      failedRequests: 0,
      recentSearches: [],
      storeHealth: makeInitialStoreHealth(),
    };
  }

  for (const store of approvedStores) {
    if (!globalForAnalytics.__ssfAnalytics.storeHealth[store.id]) {
      globalForAnalytics.__ssfAnalytics.storeHealth[store.id] = makeInitialStoreHealth()[store.id];
    }
  }

  return globalForAnalytics.__ssfAnalytics;
}

function isMatch(status: StockStatus) {
  return isTrueProductMatch(status);
}

function isAvailable(status: StockStatus) {
  return isAvailableStatus(status);
}

function calculateHealth(store: StoreHealth): StoreHealth["health"] {
  if (store.totalLookups === 0) return "Not Checked";
  const unavailableRate = store.unavailable / store.totalLookups;
  if (unavailableRate >= 0.45) return "Unstable";
  if (unavailableRate >= 0.18) return "Needs Review";
  return "Healthy";
}

export function recordSuccessfulSearch(payload: SearchPayload) {
  const state = getState();
  state.totalSearches += 1;
  if (payload.cache.hit) state.cacheHits += 1;
  else state.cacheMisses += 1;

  const unavailableCount = payload.results.filter((item) => isLookupUnavailable(item.status)).length;
  const noMatchCount = payload.results.filter((item) => item.status === "No Match").length;
  const availableCount = payload.results.filter((item) => isAvailable(item.status)).length;
  const soldOutCount = payload.results.filter((item) => item.status === "Sold Out").length;
  const matchesFound = payload.results.filter((item) => isMatch(item.status)).length;

  state.matchesFound += matchesFound;
  state.availableFound += availableCount;
  state.soldOutCount += soldOutCount;
  state.lookupUnavailableCount += unavailableCount;
  state.noMatchCount += noMatchCount;

  for (const item of payload.results) {
    const store = state.storeHealth[item.storeId];
    if (!store) continue;
    store.totalLookups += 1;
    store.lastStatus = item.status;
    store.lastChecked = item.checkedAt || payload.checkedAt;
    if (isAvailable(item.status)) store.available += 1;
    if (item.status === "Sold Out") store.soldOut += 1;
    if (item.status === "No Match") store.noMatch += 1;
    if (isLookupUnavailable(item.status)) store.unavailable += 1;
    if (item.status === "Product Found") store.productFound += 1;
    store.health = calculateHealth(store);
  }

  state.recentSearches = [
    {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      query: payload.query,
      resolvedSku: payload.resolvedSku,
      productTitle: payload.product.title,
      checkedAt: payload.checkedAt,
      cacheHit: payload.cache.hit,
      storesChecked: payload.results.length,
      matchesFound,
      availableCount,
      unavailableCount,
    },
    ...state.recentSearches,
  ].slice(0, 30);
}

export function recordFailedSearch() {
  const state = getState();
  state.failedRequests += 1;
}

export function getAnalyticsSnapshot() {
  const state = getState();
  const totalStoreLookups = Object.values(state.storeHealth).reduce((sum, store) => sum + store.totalLookups, 0);
  const unavailableRate = totalStoreLookups ? Math.round((state.lookupUnavailableCount / totalStoreLookups) * 100) : 0;
  const matchRate = totalStoreLookups ? Math.round((state.matchesFound / totalStoreLookups) * 100) : 0;
  const cacheRate = state.totalSearches ? Math.round((state.cacheHits / state.totalSearches) * 100) : 0;

  return {
    totals: {
      totalSearches: state.totalSearches,
      cacheHits: state.cacheHits,
      cacheMisses: state.cacheMisses,
      cacheRate,
      matchesFound: state.matchesFound,
      availableFound: state.availableFound,
      soldOutCount: state.soldOutCount,
      lookupUnavailableCount: state.lookupUnavailableCount,
      noMatchCount: state.noMatchCount,
      failedRequests: state.failedRequests,
      unavailableRate,
      matchRate,
      totalStoreLookups,
    },
    recentSearches: state.recentSearches,
    storeHealth: Object.values(state.storeHealth),
    generatedAt: new Date().toISOString(),
  };
}

export function resetAnalytics() {
  globalForAnalytics.__ssfAnalytics = undefined;
  return getAnalyticsSnapshot();
}
