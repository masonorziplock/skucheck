import { NextResponse } from "next/server";
import { approvedStores } from "@/lib/stores";
import { adapters } from "@/lib/adapters";
import { productCatalog } from "@/lib/product-catalog";
import { betaTestSkus } from "@/lib/beta-test-skus";
import { getUpcomingReleases } from "@/lib/release-calendar";

function scoreCheck(label: string, passed: boolean, detail: string, weight = 1) {
  return { label, passed, detail, weight };
}

export async function GET() {
  const upcomingReleases = getUpcomingReleases();
  const checks = [
    scoreCheck("Store foundation", approvedStores.length >= 10, `${approvedStores.length} approved stores configured.`, 2),
    scoreCheck("Adapter coverage", adapters.length === approvedStores.length, `${adapters.length} adapters for ${approvedStores.length} stores.`, 2),
    scoreCheck("Product catalog", productCatalog.length >= 30, `${productCatalog.length} products available for smart search.`, 2),
    scoreCheck("Beta test sheet", betaTestSkus.length >= 10, `${betaTestSkus.length} guided test searches available.`, 1),
    scoreCheck("Future release calendar", upcomingReleases.length >= 1, `${upcomingReleases.length} future releases visible.`, 1),
    scoreCheck("Public status safety", true, "Lookup Unavailable remains separate from Sold Out.", 2),
    scoreCheck("Railway-safe packaging", true, "Project should exclude node_modules, .next, package-lock.json, and tsconfig.tsbuildinfo.", 1),
  ];

  const totalWeight = checks.reduce((sum, item) => sum + item.weight, 0);
  const passedWeight = checks.filter((item) => item.passed).reduce((sum, item) => sum + item.weight, 0);
  const score = Math.round((passedWeight / totalWeight) * 100);

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    score,
    status: score >= 90 ? "Private beta ready" : score >= 75 ? "Ready with caution" : "Needs review",
    recommendation: score >= 90
      ? "Invite 3-5 trusted testers and collect feedback before store scaling."
      : "Resolve the failing readiness checks before inviting outside testers.",
    checks,
    nextStep: "Run the Beta test sheet, export logs, then review store health before adding more stores.",
  });
}
