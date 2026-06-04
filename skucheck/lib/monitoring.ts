import { getAnalyticsSnapshot } from "@/lib/analytics";
import { approvedStores } from "@/lib/stores";
import { getCatalogStats } from "@/lib/product-catalog";
import { getUpcomingReleases } from "@/lib/release-calendar";
import { storeReliabilityBaselines } from "@/lib/reliability";

function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function getProductionMonitoringSnapshot() {
  const analytics = getAnalyticsSnapshot();
  const catalog = getCatalogStats();
  const upcomingReleases = getUpcomingReleases();

  const storeRows = approvedStores.map((store) => {
    const current = analytics.storeHealth.find((item) => item.storeId === store.id);
    const baseline = storeReliabilityBaselines.find((item) => item.storeId === store.id);
    const lookups = current?.totalLookups || 0;
    const unavailable = current?.unavailable || 0;
    const matches = (current?.available || 0) + (current?.soldOut || 0) + (current?.productFound || 0);
    const failureRate = pct(unavailable, lookups);
    const verificationRate = pct(matches, lookups);
    const healthScore = lookups ? Math.max(0, Math.min(100, 100 - failureRate + Math.round(verificationRate * 0.15))) : 0;

    return {
      storeId: store.id,
      storeName: store.name,
      enabled: store.active && store.onlineSales,
      health: current?.health || "Not Checked",
      healthScore,
      totalLookups: lookups,
      failureRate,
      verificationRate,
      lastSuccess: current?.lastChecked || null,
      lastStatus: current?.lastStatus || "Not Checked",
      expectedInventoryVisibility: baseline?.expectedInventoryVisibility || "Medium",
      notes: baseline?.notes || "Public product/search page verification only.",
    };
  });

  const unstableStores = storeRows.filter((item) => item.health === "Unstable" || item.failureRate >= 45);
  const needsReviewStores = storeRows.filter((item) => item.health === "Needs Review" || (item.failureRate >= 18 && item.failureRate < 45));
  const healthyStores = storeRows.filter((item) => item.health === "Healthy" || item.healthScore >= 75);

  return {
    generatedAt: new Date().toISOString(),
    stores: {
      total: approvedStores.length,
      healthy: healthyStores.length,
      needsReview: needsReviewStores.length,
      unstable: unstableStores.length,
      rows: storeRows,
    },
    search: {
      totalSearches: analytics.totals.totalSearches,
      matchRate: analytics.totals.matchRate,
      cacheRate: analytics.totals.cacheRate,
      lookupUnavailableRate: analytics.totals.unavailableRate,
      failedRequests: analytics.totals.failedRequests,
      recentSearches: analytics.recentSearches.slice(0, 12),
    },
    alerts: {
      mode: "Local device notifications",
      delivery: "Browser Notification API when permission is granted; in-app notification center always remains active.",
      status: "Ready",
    },
    releases: {
      upcomingCount: upcomingReleases.length,
      nextRelease: upcomingReleases[0] || null,
    },
    catalog: {
      totalProducts: catalog.totalProducts,
      aliasCount: catalog.aliasCount,
      brands: catalog.byBrand,
    },
    risk: {
      level: unstableStores.length ? "Review Required" : needsReviewStores.length ? "Monitor" : "Stable",
      note: unstableStores.length
        ? "Some stores are frequently unavailable. Disable unstable stores before widening access."
        : needsReviewStores.length
          ? "Some stores need monitoring, but core search can continue."
          : "No critical monitoring issues detected in this session.",
    },
  };
}
