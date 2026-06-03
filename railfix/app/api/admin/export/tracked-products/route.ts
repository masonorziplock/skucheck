import { NextResponse } from "next/server";

export async function GET() {
  const body = [
    ["sku", "title", "lastStatus", "storeCount", "availableStores", "availableSizes", "addedAt", "lastChecked"].join(","),
    "This export is generated from the browser in Settings because tracked products are stored locally on this device."
  ].join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tracked-products-export-info.csv"`,
    },
  });
}
