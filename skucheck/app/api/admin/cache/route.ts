import { NextResponse } from "next/server";
import { clearCache, getCacheStats } from "@/lib/cache";
import { SEARCH_CACHE_TTL_SECONDS } from "@/lib/app-config";

export async function GET() {
  return NextResponse.json({ ...getCacheStats(), ttlSeconds: SEARCH_CACHE_TTL_SECONDS });
}

export async function DELETE() {
  return NextResponse.json({ ...clearCache(), ttlSeconds: SEARCH_CACHE_TTL_SECONDS });
}
