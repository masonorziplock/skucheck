import { NextResponse } from "next/server";
import { adapters } from "@/lib/adapters";
import { runAdapterSafely } from "@/lib/adapter-runner";
import { approvedStores } from "@/lib/stores";
import { normalizeSearchQuery } from "@/lib/sku";
import { statusTrustNote, userFacingStatusLabel } from "@/lib/status";
import { getStoreReliabilitySummary } from "@/lib/reliability";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = normalizeSearchQuery(String(body?.query || "HF4198-001"));
    const activeAdapters = adapters.filter((adapter) =>
      approvedStores.some((store) => store.id === adapter.storeId && store.active && store.onlineSales)
    );

    const runs = await Promise.all(activeAdapters.map((adapter) => runAdapterSafely(adapter, query, 7000)));
    const results = runs.map((run) => {
      const store = approvedStores.find((item) => item.id === run.storeId);
      const reliability = getStoreReliabilitySummary(run.result.status, run.durationMs, run.result.sizeAvailability);
      return {
        storeId: run.storeId,
        storeName: store?.name || run.storeId,
        city: store?.city || "",
        durationMs: run.durationMs,
        ok: run.ok,
        status: run.result.status,
        label: userFacingStatusLabel(run.result.status),
        trustNote: statusTrustNote(run.result.status),
        productTitle: run.result.productTitle,
        note: run.result.note || "",
        productUrl: run.result.productUrl || (store?.website ? `${store.website}/search?q=${encodeURIComponent(query)}` : ""),
        checkedAt: run.result.checkedAt,
        sizeVisibility: reliability.sizeVisibility,
        inventoryConfidence: reliability.inventoryConfidence,
        healthScore: reliability.healthScore,
        healthLabel: reliability.healthLabel,
      };
    });

    return NextResponse.json({
      query,
      checkedAt: new Date().toISOString(),
      totals: {
        storesChecked: results.length,
        lookupUnavailable: results.filter((item) => item.status === "Unavailable" || item.status === "Unknown").length,
        confirmedSoldOut: results.filter((item) => item.status === "Sold Out").length,
        productMatches: results.filter((item) => !["Unavailable", "Unknown", "No Match"].includes(item.status)).length,
      },
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Adapter test failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
