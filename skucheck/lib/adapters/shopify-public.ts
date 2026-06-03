import type { StoreSearchResult, StockStatus, SizeAvailability } from "@/types/search";

type ShopifySuggestionProduct = {
  title?: string;
  handle?: string;
  url?: string;
  price?: string | number;
  image?: string;
  featured_image?: { url?: string; src?: string } | string;
  variants?: Array<{
    title?: string;
    sku?: string;
    available?: boolean;
  }>;
};

type ShopifyProductJson = {
  product?: {
    title?: string;
    handle?: string;
    image?: { src?: string } | string;
    images?: Array<{ src?: string } | string>;
    variants?: Array<{
      title?: string;
      sku?: string;
      available?: boolean;
      price?: string | number;
      featured_image?: { src?: string } | string;
    }>;
  };
};

type ShopifySearchOptions = {
  storeId: string;
  baseUrl: string;
  sku: string;
  timeoutMs?: number;
};

type FetchJsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "timeout" | "blocked" | "http" | "network" | "invalid-json"; status?: number };

function cleanBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

function money(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return `$${value.toFixed(2)}`;
  const text = String(value);
  if (text.startsWith("$")) return text;
  return `$${text}`;
}

function imageUrlFrom(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const data = value as { url?: string; src?: string };
    return data.url || data.src;
  }
  return undefined;
}

function absolutizeImage(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

function normalizeSkuForCompare(input: string) {
  return String(input || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function sizeFromVariantTitle(title?: string) {
  if (!title) return "";
  const cleaned = title.replace(/^US\s*/i, "").trim();
  if (/^default title$/i.test(cleaned)) return "";
  return cleaned;
}

function deriveStatus(productFound: boolean, variants: Array<{ title?: string; sku?: string; available?: boolean }>): StockStatus {
  if (!productFound) return "No Match";
  if (!variants.length) return "Product Found";

  const availableCount = variants.filter((variant) => variant.available).length;
  if (availableCount > 0) return availableCount <= 2 ? "Low Stock" : "In Stock";

  const hasAvailabilityData = variants.some((variant) => typeof variant.available === "boolean");
  return hasAvailabilityData ? "Sold Out" : "Product Found";
}

function deriveSizeAvailability(variants: Array<{ title?: string; sku?: string; available?: boolean }>): SizeAvailability[] {
  const rows = variants
    .map((variant) => {
      const size = sizeFromVariantTitle(variant.title);
      if (!size) return null;
      if (variant.available === true) return { size, available: true, label: "Available" as const };
      if (variant.available === false) return { size, available: false, label: "Sold Out" as const };
      return { size, available: null, label: "Hidden" as const };
    })
    .filter(Boolean) as SizeAvailability[];

  const deduped = new Map<string, SizeAvailability>();
  for (const row of rows) {
    const previous = deduped.get(row.size);
    if (!previous || (previous.available !== true && row.available === true)) deduped.set(row.size, row);
  }

  return Array.from(deduped.values()).sort((a, b) => Number.parseFloat(a.size) - Number.parseFloat(b.size));
}

function unavailable(storeId: string, sku: string, baseUrl: string, checkedAt: string, note: string): StoreSearchResult {
  return {
    storeId,
    sku,
    productTitle: "Lookup unavailable",
    status: "Unavailable",
    sizes: [],
    price: "—",
    productUrl: `${baseUrl}/search?q=${encodeURIComponent(sku)}`,
    checkedAt,
    confidence: "Low",
    note,
  };
}

async function fetchJson<T>(url: string, timeoutMs: number): Promise<FetchJsonResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "application/json,text/plain,*/*",
        "user-agent": "SneakerStockFinder/1.0 public-stock-lookup",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const reason = response.status === 401 || response.status === 403 || response.status === 429 ? "blocked" : "http";
      return { ok: false, reason, status: response.status };
    }

    try {
      return { ok: true, data: (await response.json()) as T };
    } catch {
      return { ok: false, reason: "invalid-json" };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return { ok: false, reason: "timeout" };
    return { ok: false, reason: "network" };
  } finally {
    clearTimeout(timeout);
  }
}

async function findProductFromSuggest(baseUrl: string, sku: string, timeoutMs: number) {
  const url = `${baseUrl}/search/suggest.json?q=${encodeURIComponent(sku)}&resources[type]=product&resources[limit]=10`;
  const response = await fetchJson<{ resources?: { results?: { products?: ShopifySuggestionProduct[] } } }>(url, timeoutMs);

  if (!response.ok) return { product: null, lookupFailed: true, reason: response.reason, status: response.status } as const;

  const products = response.data?.resources?.results?.products || [];
  const normalizedInput = normalizeSkuForCompare(sku);

  const exactVariantMatch = products.find((product) =>
    product.variants?.some((variant) => normalizeSkuForCompare(variant.sku || "") === normalizedInput)
  );

  const titleMatch = products.find((product) => {
    const title = normalizeSkuForCompare(product.title || "");
    return Boolean(title) && (title.includes(normalizedInput) || normalizedInput.includes(title));
  });

  return { product: exactVariantMatch || titleMatch || products[0] || null, lookupFailed: false } as const;
}

async function enrichProductJson(baseUrl: string, handle: string | undefined, timeoutMs: number) {
  if (!handle) return { ok: false, data: null } as const;
  const response = await fetchJson<ShopifyProductJson>(`${baseUrl}/products/${handle}.json`, timeoutMs);
  if (!response.ok) return { ok: false, data: null } as const;
  return { ok: true, data: response.data } as const;
}

function reasonCopy(reason?: string, status?: number) {
  if (reason === "blocked") return `Store lookup did not expose public search data during this request${status ? ` (HTTP ${status})` : ""}. This is not the same as sold out.`;
  if (reason === "timeout") return "Store lookup timed out. This is not the same as sold out.";
  if (reason === "network") return "Store lookup could not be reached. This is not the same as sold out.";
  if (reason === "invalid-json") return "Store lookup returned unreadable public data. This is not the same as sold out.";
  return `Store lookup failed${status ? ` (HTTP ${status})` : ""}. This is not the same as sold out.`;
}

export async function searchPublicShopifyStore(options: ShopifySearchOptions): Promise<StoreSearchResult> {
  const { storeId, sku } = options;
  const baseUrl = cleanBaseUrl(options.baseUrl);
  const timeoutMs = options.timeoutMs || 5500;
  const checkedAt = new Date().toISOString();

  const suggestion = await findProductFromSuggest(baseUrl, sku, timeoutMs);

  if (suggestion.lookupFailed) {
    return unavailable(storeId, sku, baseUrl, checkedAt, reasonCopy(suggestion.reason, suggestion.status));
  }

  if (!suggestion.product) {
    return {
      storeId,
      sku,
      productTitle: "No public match found",
      status: "No Match",
      sizes: [],
      price: "—",
      productUrl: `${baseUrl}/search?q=${encodeURIComponent(sku)}`,
      checkedAt,
      confidence: "Low",
      note: "Public store search completed successfully and returned no matching product. This is not an inventory failure.",
    };
  }

  const productJson = await enrichProductJson(baseUrl, suggestion.product.handle, timeoutMs);
  const product = productJson.data?.product;
  const variants = product?.variants || suggestion.product.variants || [];
  const sizeAvailability = deriveSizeAvailability(variants);
  const availableSizes = sizeAvailability.filter((row) => row.available === true).map((row) => row.size);

  const normalizedInput = normalizeSkuForCompare(sku);
  const exactMatchedVariant = variants.find((variant) => normalizeSkuForCompare(variant.sku || "") === normalizedInput);
  const matchedVariant = exactMatchedVariant || variants.find((variant) => variant.sku);
  const matchedSku = matchedVariant?.sku || sku;
  const title = product?.title || suggestion.product.title || "Product match found";
  const status = deriveStatus(true, variants);
  const productUrl = suggestion.product.url?.startsWith("http")
    ? suggestion.product.url
    : `${baseUrl}${suggestion.product.url || `/products/${suggestion.product.handle || ""}`}`;
  const priceSource = product?.variants?.find((variant) => variant.price)?.price || suggestion.product.price;
  const image = absolutizeImage(
    imageUrlFrom(product?.image) ||
    imageUrlFrom(product?.images?.[0]) ||
    imageUrlFrom(suggestion.product.featured_image) ||
    suggestion.product.image
  );

  const confidence = exactMatchedVariant ? "High" : status === "Product Found" || !availableSizes.length ? "Medium" : "High";

  return {
    storeId,
    sku: matchedSku,
    matchedSku: exactMatchedVariant ? matchedSku : undefined,
    productTitle: title,
    productImage: image,
    status,
    sizes: Array.from(new Set(availableSizes)),
    sizeAvailability,
    price: money(priceSource),
    productUrl,
    checkedAt,
    confidence,
    note:
      status === "Product Found"
        ? "Product was found, but public size-level availability was not exposed. Open the product page to verify."
        : status === "Sold Out"
          ? "Product page was found and public variant data shows every exposed size as sold out."
          : "Live public Shopify lookup. Availability depends on what the store exposes publicly.",
  };
}
