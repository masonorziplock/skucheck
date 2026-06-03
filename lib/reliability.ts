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
