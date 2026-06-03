import { NextResponse } from "next/server";
import { getAnalyticsSnapshot } from "@/lib/analytics";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export async function GET() {
  const analytics = getAnalyticsSnapshot();
  const rows = [
    ["query", "resolvedSku", "productTitle", "checkedAt", "cacheHit", "storesChecked", "matchesFound", "availableCount", "unavailableCount"],
    ...analytics.recentSearches.map((entry) => [entry.query, entry.resolvedSku, entry.productTitle, entry.checkedAt, entry.cacheHit, entry.storesChecked, entry.matchesFound, entry.availableCount, entry.unavailableCount]),
  ];
  const body = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sneaker-stock-search-logs.csv"`,
    },
  });
}
