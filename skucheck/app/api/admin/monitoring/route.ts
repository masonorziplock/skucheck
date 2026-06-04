import { NextResponse } from "next/server";
import { getProductionMonitoringSnapshot } from "@/lib/monitoring";

export async function GET() {
  return NextResponse.json(getProductionMonitoringSnapshot());
}
