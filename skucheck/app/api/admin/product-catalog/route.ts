import { NextResponse } from "next/server";
import { productCatalog, searchCatalog, getCatalogStats } from "@/lib/product-catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const products = query ? searchCatalog(query, 12) : productCatalog;

  return NextResponse.json({
    count: products.length,
    stats: getCatalogStats(),
    products,
    generatedAt: new Date().toISOString(),
  });
}
