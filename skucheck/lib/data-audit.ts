import { productCatalog, getCatalogStats } from "@/lib/product-catalog";
import { releaseCalendar, getUpcomingReleases } from "@/lib/release-calendar";
import { approvedStores } from "@/lib/stores";
import { storeReliabilityBaselines } from "@/lib/reliability";
import { adapters } from "@/lib/adapters";

export function getDataAuditSnapshot() {
  const catalogStats = getCatalogStats();
  const upcomingReleases = getUpcomingReleases();
  const storesWithAdapters = new Set(adapters.map((adapter) => adapter.storeId));
  const storesWithoutAdapters = approvedStores.filter((store) => !storesWithAdapters.has(store.id));
  const baselineStoreIds = new Set(storeReliabilityBaselines.map((item) => item.storeId));
  const storesWithoutBaselines = approvedStores.filter((store) => !baselineStoreIds.has(store.id));

  return {
    generatedAt: new Date().toISOString(),
    catalog: {
      ...catalogStats,
      sampleProducts: productCatalog.slice(0, 12).map((item) => ({ sku: item.sku, title: item.title, brand: item.brand, aliases: item.aliases.length })),
    },
    releases: {
      totalConfigured: releaseCalendar.length,
      upcomingCount: upcomingReleases.length,
      upcoming: upcomingReleases.map((item) => ({ sku: item.sku, title: item.title, releaseDate: item.releaseDate, priority: item.priority })),
      rule: "Release calendar only returns items with future release dates.",
    },
    stores: {
      totalApproved: approvedStores.length,
      activeOnline: approvedStores.filter((store) => store.active && store.onlineSales).length,
      adapterCount: adapters.length,
      storesWithoutAdapters: storesWithoutAdapters.map((store) => store.name),
      storesWithoutBaselines: storesWithoutBaselines.map((store) => store.name),
    },
    rules: [
      "Lookup Unavailable is never counted as Sold Out.",
      "Multi-word keyword searches preserve spaces and word boundaries.",
      "SKU-shaped spaced input can still normalize to a style code.",
      "Public size data is shown only when a store exposes it.",
    ],
  };
}
