import { isLikelySku, normalizeSku } from "@/lib/sku";
import { isAvailableStatus, isLookupUnavailable, isTrueProductMatch } from "@/lib/status";
import type { Confidence, HydratedSearchResult, ProductIntelligence, ProductMatchLevel, ProductSummary, StockStatus } from "@/types/search";
import { resolveCatalogProduct, type ProductCatalogItem } from "@/lib/product-catalog";

const FALLBACK_IMAGE = "/shoe-fallback.svg";

type KnownProduct = ProductCatalogItem;

function compact(value: string) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizedWords(value: string) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function resolveKnownProduct(query: string): KnownProduct | null {
  const normalized = normalizedWords(query);
  const compacted = compact(query);
  const sku = isLikelySku(query) ? normalizeSku(query) : "";

  const catalogMatch = resolveCatalogProduct(query);
  if (catalogMatch) return catalogMatch;

  return null;
}

export function getSearchTarget(query: string): string {
  const known = resolveKnownProduct(query);
  if (known) return known.sku;
  return query;
}

export function confidenceScore(value: Confidence): number {
  if (value === "High") return 95;
  if (value === "Medium") return 72;
  return 45;
}

export function matchLevelFromResult(item: HydratedSearchResult): ProductMatchLevel {
  if (item.status === "No Match") return "No Match";
  if (isLookupUnavailable(item.status)) return "Store Search Only";
  if (item.confidence === "High" && item.matchedSku) return "Verified Match";
  if (item.status === "Product Found" || item.confidence === "Medium") return "Product Found";
  return "Store Search Only";
}

export function deriveStatusCopy(status: StockStatus): string {
  if (status === "In Stock") return "Available now from public variant data.";
  if (status === "Low Stock") return "Limited sizes are publicly visible.";
  if (status === "Sold Out") return "Product page found, but no public available sizes.";
  if (status === "Product Found") return "Product found, but public size-level inventory is hidden.";
  if (status === "No Match") return "No matching public product page was found.";
  if (status === "Unavailable") return "Store lookup was unavailable during this search.";
  return "Manual verification recommended.";
}

function detectBrand(title: string, known?: KnownProduct | null) {
  if (known?.brand) return known.brand;
  const lower = title.toLowerCase();
  if (lower.includes("jordan")) return "Jordan";
  if (lower.includes("nike") || lower.includes("dunk") || lower.includes("air force")) return lower.includes("sb") ? "Nike SB" : "Nike";
  if (lower.includes("adidas") || lower.includes("yeezy")) return "adidas";
  if (lower.includes("new balance") || lower.includes("990")) return "New Balance";
  if (lower.includes("asics")) return "ASICS";
  if (lower.includes("puma")) return "PUMA";
  return "Unknown Brand";
}

function inferCategory(title: string, known?: KnownProduct | null) {
  if (known?.category) return known.category;
  const lower = title.toLowerCase();
  if (["hoodie", "tee", "shirt", "pant", "short", "jacket", "fleece"].some((word) => lower.includes(word))) return "Apparel";
  return "Sneaker";
}

function inferColorway(title: string, known?: KnownProduct | null) {
  if (known?.colorway) return known.colorway;
  const colors = ["Black", "White", "Grey", "Gray", "Red", "Blue", "Green", "Brown", "Pink", "Silver", "Gold", "Cream", "Sail", "Royal", "Navy"];
  const found = colors.filter((color) => title.toLowerCase().includes(color.toLowerCase()));
  return found.length ? found.join(" / ") : "Not publicly resolved";
}

function inferMsrp(title: string, known?: KnownProduct | null, price?: string) {
  if (known?.msrp) return known.msrp;
  if (price && price !== "—") return price;
  const lower = title.toLowerCase();
  if (lower.includes("jordan 1")) return "$180";
  if (lower.includes("dunk")) return "$115–$135";
  if (lower.includes("air force 1")) return "$115";
  if (lower.includes("990")) return "$185+";
  return "Not resolved";
}

function bestResult(results: HydratedSearchResult[]) {
  const scored = [...results].sort((a, b) => {
    const aLevel = matchLevelFromResult(a);
    const bLevel = matchLevelFromResult(b);
    const levelScore: Record<ProductMatchLevel, number> = {
      "Verified Match": 0,
      "Product Found": 1,
      "Store Search Only": 2,
      "No Match": 3,
    };
    if (levelScore[aLevel] !== levelScore[bLevel]) return levelScore[aLevel] - levelScore[bLevel];
    return confidenceScore(b.confidence) - confidenceScore(a.confidence);
  });
  return scored[0] || null;
}

export function buildProductIntelligence(query: string, searchTarget: string, results: HydratedSearchResult[]): { product: ProductSummary; intelligence: ProductIntelligence } {
  const known = resolveKnownProduct(query) || resolveKnownProduct(searchTarget);
  const best = bestResult(results);
  const unusableTitles = ["No public match found", "Search temporarily unavailable", "Lookup unavailable", "Potential Match Found"];
  const title = best?.productTitle && !unusableTitles.includes(best.productTitle)
    ? best.productTitle
    : known?.title || "Product not resolved yet";
  const resolvedSku = best?.matchedSku || best?.sku || known?.sku || (isLikelySku(searchTarget) ? normalizeSku(searchTarget) : searchTarget);
  const image = best?.productImage || known?.image || FALLBACK_IMAGE;
  const bestConfidence = best ? best.confidence : "Low";
  const matchLevel = best ? matchLevelFromResult(best) : "No Match";
  const storesChecked = results.length;
  const matchesFound = results.filter((item) => isTrueProductMatch(item.status)).length;
  const availableCount = results.filter((item) => isAvailableStatus(item.status)).length;
  const soldOutCount = results.filter((item) => item.status === "Sold Out").length;
  const hiddenInventoryCount = results.filter((item) => item.status === "Product Found" || isLookupUnavailable(item.status)).length;
  const unavailableCount = results.filter((item) => isLookupUnavailable(item.status)).length;

  const product: ProductSummary = {
    query,
    resolvedSku,
    title,
    image,
    price: best?.price && best.price !== "—" ? best.price : known?.msrp || "—",
    sourceStore: best?.storeName || known?.brand || "Public lookup",
    confidence: bestConfidence,
    brand: detectBrand(title, known),
    colorway: inferColorway(title, known),
    msrp: inferMsrp(title, known, best?.price),
    releaseDate: known?.releaseDate || "Not resolved",
    category: inferCategory(title, known),
    matchLevel,
    confidenceScore: confidenceScore(bestConfidence),
  };

  return {
    product,
    intelligence: {
      brand: product.brand,
      colorway: product.colorway,
      msrp: product.msrp,
      releaseDate: product.releaseDate,
      category: product.category,
      matchLevel,
      confidenceScore: product.confidenceScore,
      storesChecked,
      matchesFound,
      availableCount,
      soldOutCount,
      hiddenInventoryCount,
      recommendation:
        unavailableCount > 0
          ? `${unavailableCount} store lookup${unavailableCount === 1 ? "" : "s"} could not be verified. Those are marked as manual checks, not sold out.`
          : matchLevel === "Verified Match"
            ? "Strong public SKU match. Use the source page to verify before contacting the store."
            : matchLevel === "Product Found"
              ? "Product was found, but exact inventory may be hidden. Confirm from the source page or by phone."
              : "No reliable product match yet. Try exact SKU, vendor code, or a more specific product name.",
    },
  };
}
