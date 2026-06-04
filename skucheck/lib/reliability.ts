import type { SizeAvailability, StockStatus } from "@/types/search";
import { isAvailableStatus, isLookupUnavailable } from "@/lib/status";

export type StoreReliabilitySummary = {
  healthScore: number;
  healthLabel: "Excellent" | "Healthy" | "Needs Review" | "Unstable";
  sizeVisibility: "Visible" | "Hidden" | "Unavailable";
  inventoryConfidence: "High" | "Medium" | "Low";
};

export function getSizeVisibility(status: StockStatus, sizeAvailability?: SizeAvailability[]): StoreReliabilitySummary["sizeVisibility"] {
  if (isLookupUnavailable(status)) return "Unavailable";
  if (sizeAvailability?.length) return "Visible";
  return "Hidden";
}

export function getInventoryConfidence(status: StockStatus, sizeAvailability?: SizeAvailability[]): StoreReliabilitySummary["inventoryConfidence"] {
  if (isAvailableStatus(status) && sizeAvailability?.some((item) => item.available === true)) return "High";
  if (status === "Sold Out" && sizeAvailability?.some((item) => item.available === false)) return "High";
  if (status === "Product Found") return "Medium";
  if (status === "No Match") return "Medium";
  return "Low";
}

export function getStoreReliabilitySummary(status: StockStatus, durationMs: number, sizeAvailability?: SizeAvailability[]): StoreReliabilitySummary {
  const sizeVisibility = getSizeVisibility(status, sizeAvailability);
  const inventoryConfidence = getInventoryConfidence(status, sizeAvailability);
  let healthScore = 50;

  if (isLookupUnavailable(status)) healthScore = 25;
  else if (status === "No Match") healthScore = 70;
  else if (sizeVisibility === "Visible") healthScore = 95;
  else if (status === "Product Found") healthScore = 78;
  else healthScore = 65;

  if (durationMs > 6000) healthScore -= 12;
  else if (durationMs > 3500) healthScore -= 6;
  healthScore = Math.max(0, Math.min(100, healthScore));

  const healthLabel = healthScore >= 90 ? "Excellent" : healthScore >= 72 ? "Healthy" : healthScore >= 45 ? "Needs Review" : "Unstable";
  return { healthScore, healthLabel, sizeVisibility, inventoryConfidence };
}

export type StoreReliabilityBaseline = {
  storeId: string;
  expectedPlatform: "Shopify" | "Custom" | "Other";
  expectedInventoryVisibility: "High" | "Medium" | "Low";
  notes: string;
};

export const storeReliabilityBaselines: StoreReliabilityBaseline[] = [
  { storeId: "apb", expectedPlatform: "Shopify", expectedInventoryVisibility: "Medium", notes: "Core TWG boutique. Public product data can expose variants when available." },
  { storeId: "social-status", expectedPlatform: "Shopify", expectedInventoryVisibility: "Medium", notes: "Core TWG boutique. Size visibility depends on public product JSON." },
  { storeId: "amm", expectedPlatform: "Shopify", expectedInventoryVisibility: "Medium", notes: "Core TWG boutique. Treat hidden inventory as manual verification." },
  { storeId: "kith", expectedPlatform: "Shopify", expectedInventoryVisibility: "Low", notes: "Strong product discovery, but inventory visibility can be limited." },
  { storeId: "undefeated", expectedPlatform: "Shopify", expectedInventoryVisibility: "Low", notes: "May require source-page verification when product data is hidden." },
  { storeId: "concepts", expectedPlatform: "Shopify", expectedInventoryVisibility: "Medium", notes: "Product matching is usually stronger than exact stock quantity." },
  { storeId: "bodega", expectedPlatform: "Shopify", expectedInventoryVisibility: "Medium", notes: "Public variant data should be used when exposed; otherwise mark inventory hidden." },
  { storeId: "extra-butter", expectedPlatform: "Shopify", expectedInventoryVisibility: "Medium", notes: "Use public search/product pages only." },
  { storeId: "sneaker-politics", expectedPlatform: "Shopify", expectedInventoryVisibility: "Medium", notes: "Size visibility can vary by product template." },
  { storeId: "notre", expectedPlatform: "Shopify", expectedInventoryVisibility: "Low", notes: "Manual verification may be needed more often." },
];

export function getStoreReliabilityBaseline(storeId: string): StoreReliabilityBaseline | undefined {
  return storeReliabilityBaselines.find((item) => item.storeId === storeId);
}

export function getCoverageConfidenceScore(input: {
  storesChecked: number;
  matchesFound: number;
  availableCount: number;
  soldOutCount: number;
  unavailableCount: number;
  productConfidenceScore: number;
}) {
  const storesChecked = Math.max(1, input.storesChecked);
  const matchRate = input.matchesFound / storesChecked;
  const availabilityRate = input.availableCount / storesChecked;
  const unavailableRate = input.unavailableCount / storesChecked;
  const soldOutRate = input.soldOutCount / storesChecked;

  const score = Math.round(
    input.productConfidenceScore * 0.45 +
    matchRate * 25 +
    availabilityRate * 18 +
    soldOutRate * 5 -
    unavailableRate * 28
  );

  const bounded = Math.max(0, Math.min(100, score));
  const label = bounded >= 80 ? "High" : bounded >= 58 ? "Medium" : "Needs Verification";
  const note = label === "High"
    ? "Strong product match with healthy store coverage."
    : label === "Medium"
      ? "Useful lead, but verify hidden sizes or source links."
      : "Use as a starting point only; store availability needs manual confirmation.";

  return { score: bounded, label, note };
}
