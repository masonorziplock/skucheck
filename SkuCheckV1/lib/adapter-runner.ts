import type { StoreAdapter } from "@/lib/adapters/types";
import type { StoreSearchResult } from "@/types/search";

const DEFAULT_ADAPTER_TIMEOUT_MS = 7000;
const FALLBACK_IMAGE = "/shoe-fallback.svg";

export type AdapterRunResult = {
  storeId: string;
  ok: boolean;
  durationMs: number;
  result: StoreSearchResult;
};

function makeUnavailableResult(storeId: string, query: string, note: string): StoreSearchResult {
  return {
    storeId,
    sku: query,
    productTitle: "Lookup unavailable",
    status: "Unavailable",
    sizes: [],
    sizeAvailability: [],
    price: "—",
    productUrl: "",
    checkedAt: new Date().toISOString(),
    confidence: "Low",
    note,
    productImage: FALLBACK_IMAGE,
  };
}

function timeoutPromise(ms: number, storeId: string, query: string): Promise<StoreSearchResult> {
  return new Promise((resolve) => {
    windowlessSetTimeout(() => {
      resolve(makeUnavailableResult(storeId, query, `Store adapter timed out after ${ms}ms. This is not sold out.`));
    }, ms);
  });
}

function windowlessSetTimeout(callback: () => void, ms: number) {
  return setTimeout(callback, ms);
}

export async function runAdapterSafely(adapter: StoreAdapter, query: string, timeoutMs = DEFAULT_ADAPTER_TIMEOUT_MS): Promise<AdapterRunResult> {
  const startedAt = Date.now();
  try {
    const result = await Promise.race([
      adapter.search(query),
      timeoutPromise(timeoutMs, adapter.storeId, query),
    ]);
    return {
      storeId: adapter.storeId,
      ok: result.status !== "Unavailable",
      durationMs: Date.now() - startedAt,
      result,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected adapter error";
    return {
      storeId: adapter.storeId,
      ok: false,
      durationMs: Date.now() - startedAt,
      result: makeUnavailableResult(adapter.storeId, query, `Store adapter threw an error: ${message}. This is not sold out.`),
    };
  }
}
