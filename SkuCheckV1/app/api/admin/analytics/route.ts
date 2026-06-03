import { NextResponse } from "next/server";
import { getAnalyticsSnapshot, resetAnalytics } from "@/lib/analytics";

export async function GET() {
  return NextResponse.json(getAnalyticsSnapshot());
}

export async function DELETE() {
  return NextResponse.json(resetAnalytics());
}
