import type { StockStatus } from "@/types/search";

export function isLookupUnavailable(status: StockStatus) {
  return status === "Unavailable" || status === "Unknown";
}

export function isAvailableStatus(status: StockStatus) {
  return status === "In Stock" || status === "Low Stock";
}

export function isInventoryHidden(status: StockStatus) {
  return status === "Product Found";
}

export function isConfirmedSoldOut(status: StockStatus) {
  return status === "Sold Out";
}

export function isTrueProductMatch(status: StockStatus) {
  return !["No Match", "Unavailable", "Unknown"].includes(status);
}

export function userFacingStatusLabel(status: StockStatus) {
  if (status === "In Stock") return "Verified Available";
  if (status === "Low Stock") return "Limited Availability";
  if (status === "Product Found") return "Product Found / Inventory Hidden";
  if (status === "Sold Out") return "Confirmed Sold Out";
  if (status === "No Match") return "No Product Match";
  if (status === "Unavailable") return "Lookup Unavailable";
  return "Manual Verification Needed";
}

export function statusTrustNote(status: StockStatus) {
  if (status === "In Stock") return "Public variant data confirmed available sizes.";
  if (status === "Low Stock") return "Public variant data confirmed limited available sizes.";
  if (status === "Product Found") return "The product page was found, but the store did not expose public size-level inventory.";
  if (status === "Sold Out") return "The product page was found and public variant data confirmed no available sizes.";
  if (status === "No Match") return "The store search completed successfully and returned no matching public product.";
  if (status === "Unavailable") return "The store could not be checked reliably. This is not counted as sold out.";
  return "Manual verification is recommended.";
}

export function statusSortWeight(status: StockStatus) {
  const weights: Record<StockStatus, number> = {
    "In Stock": 0,
    "Low Stock": 1,
    "Product Found": 2,
    "Sold Out": 3,
    "No Match": 4,
    "Unavailable": 5,
    "Unknown": 6,
  };
  return weights[status] ?? 99;
}
