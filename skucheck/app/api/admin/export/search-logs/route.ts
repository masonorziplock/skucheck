import { NextResponse } from "next/server";
import { getAnalyticsSnapshot } from "@/lib/analytics";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function GET() {
  const snapshot = getAnalyticsSnapshot();
  const rows = [
    ["query", "resolvedSku", "productTitle", "checkedAt", "cacheHit", "storesChecked", "matchesFound", "availableCount", "unavailableCount"],
    ...snapshot.recentSearches.map((item) => [item.query, item.resolvedSku, item.productTitle, item.checkedAt, item.cacheHit, item.storesChecked, item.matchesFound, item.availableCount, item.unavailableCount]),
  ];
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=skucheck-search-logs.csv",
    },
  });
}
