import { NextResponse } from "next/server";
import { runSkuSearch } from "@/lib/search";
import { recordFailedSearch, recordSuccessfulSearch } from "@/lib/analytics";
import { SEARCH_RATE_LIMIT_MAX_REQUESTS, SEARCH_RATE_LIMIT_WINDOW_MS } from "@/lib/app-config";

const globalForRateLimit = globalThis as typeof globalThis & { __ssfRateLimit?: Map<string, number[]> };
function isRateLimited(key: string) {
  if (!globalForRateLimit.__ssfRateLimit) globalForRateLimit.__ssfRateLimit = new Map();
  const now = Date.now();
  const existing = (globalForRateLimit.__ssfRateLimit.get(key) || []).filter((time) => now - time < SEARCH_RATE_LIMIT_WINDOW_MS);
  if (existing.length >= SEARCH_RATE_LIMIT_MAX_REQUESTS) {
    globalForRateLimit.__ssfRateLimit.set(key, existing);
    return true;
  }
  globalForRateLimit.__ssfRateLimit.set(key, [...existing, now]);
  return false;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sku = String(body?.sku || "").trim();
    const disabledStoreIds = Array.isArray(body?.disabledStoreIds) ? body.disabledStoreIds.map(String) : [];

    const rateKey = request.headers.get("x-forwarded-for") || "local-dev";
    if (isRateLimited(rateKey)) {
      return NextResponse.json({ error: "Too many searches. Wait a moment, then try again." }, { status: 429 });
    }

    if (!sku) {
      return NextResponse.json({ error: "SKU is required" }, { status: 400 });
    }

    const payload = await runSkuSearch(sku, { disabledStoreIds });
    recordSuccessfulSearch(payload);
    return NextResponse.json(payload);
  } catch (error) {
    recordFailedSearch();
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
