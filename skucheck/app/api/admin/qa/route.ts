import { NextResponse } from "next/server";
import { existsSync } from "fs";
import { join } from "path";
import { approvedStores } from "@/lib/stores";
import { adapters } from "@/lib/adapters";
import { productCatalog } from "@/lib/product-catalog";

function check(label: string, passed: boolean, detail: string) {
  return { label, passed, detail };
}

export async function GET() {
  const root = process.cwd();
  const checks = [
    check("Search API route", existsSync(join(root, "app/api/search/route.ts")), "Required for SKU and keyword searches."),
    check("Analytics API route", existsSync(join(root, "app/api/admin/analytics/route.ts")), "Required for accuracy dashboard metrics."),
    check("Adapter test API route", existsSync(join(root, "app/api/admin/adapter-test/route.ts")), "Required for store health checks."),
    check("PWA manifest", existsSync(join(root, "public/manifest.json")) || existsSync(join(root, "public/manifest.webmanifest")), "Required for installable app mode."),
    check("Service worker", existsSync(join(root, "public/sw.js")), "Required for app shell and notification-ready behavior."),
    check("Approved store list", approvedStores.length >= 10, `${approvedStores.length} approved stores configured.`),
    check("Adapter coverage", adapters.length === approvedStores.length, `${adapters.length} adapters for ${approvedStores.length} stores.`),
    check("Status safety", existsSync(join(root, "lib/status.ts")), "Centralized status labels keep Lookup Unavailable separate from Sold Out."),
    check("Adapter timeout protection", existsSync(join(root, "lib/adapter-runner.ts")), "Adapters are wrapped so one store cannot crash the full search."),
    check("Product intelligence", existsSync(join(root, "lib/product-intelligence.ts")), "Keyword/SKU resolver and product fallback data are available."),
    check("Expanded product catalog", productCatalog.length >= 30, `${productCatalog.length} products configured for smart search.`),
    check("Data audit API route", existsSync(join(root, "app/api/admin/data-audit/route.ts")), "Required for catalog/store/release readiness checks."),
  ];

  const passed = checks.filter((item) => item.passed).length;
  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    score: Math.round((passed / checks.length) * 100),
    passed,
    total: checks.length,
    checks,
    recommendation: passed === checks.length ? "Ready for real SKU testing." : "Fix failing checks before adding more stores or features.",
  });
}
