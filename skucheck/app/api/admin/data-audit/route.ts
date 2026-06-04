import { NextResponse } from "next/server";
import { getDataAuditSnapshot } from "@/lib/data-audit";

export async function GET() {
  return NextResponse.json(getDataAuditSnapshot());
}
