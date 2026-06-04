"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Heart,
  HelpCircle,
  History,
  Home,
  MapPin,
  Moon,
  Phone,
  RefreshCw,
  Smartphone,
  Search,
  Settings,
  ShieldCheck,
  ListChecks,
  Layers3,
  MessageSquare,
  ShoppingBag,
  Sparkles,
  Trash2,
  Store,
  Target,
  XCircle,
  Zap,
} from "lucide-react";
import type { HydratedSearchResult, SearchPayload, StockStatus, SizeAvailability } from "@/types/search";
import QualityAssuranceCenter from "@/components/QualityAssuranceCenter";
import BetaFeedbackForm from "@/components/BetaFeedbackForm";
import BetaTestSheet from "@/components/BetaTestSheet";
import KnownLimitations from "@/components/KnownLimitations";
import PrivateBetaGuide from "@/components/PrivateBetaGuide";
import { normalizeSearchQuery } from "@/lib/sku";
import { approvedStores } from "@/lib/stores";
import { releaseCalendar, getUpcomingReleases, type ReleaseCalendarItem } from "@/lib/release-calendar";
import { buildReleaseNotification, getReleaseNotificationStatus } from "@/lib/notification-engine";
import { APP_VERSION, SEARCH_CACHE_TTL_SECONDS, getRateLimitLabel } from "@/lib/app-config";
import { isAvailableStatus, statusSortWeight, userFacingStatusLabel } from "@/lib/status";
import { getCoverageConfidenceScore } from "@/lib/reliability";

const quickSearches = ["HF4198-001", "White Cement 4", "Jordan 4", "SB Dunk", "Travis Scott", "New Balance 990"];
const navItems = [
  { label: "Search", icon: Search },
  { label: "Releases", icon: CalendarDays },
  { label: "Watchlists", icon: Layers3 },
  { label: "Alerts", icon: Bell },
  { label: "History", icon: History },
  { label: "Settings", icon: Settings },
  { label: "Admin", icon: BarChart3 },
  { label: "QA", icon: ListChecks },
  { label: "Beta", icon: MessageSquare },
] as const;

type NavView = typeof navItems[number]["label"];
type SortMode = "Relevance" | "Availability" | "Store";

type TrackedProduct = {
  sku: string;
  title: string;
  image: string;
  addedAt: string;
  lastChecked?: string;
  lastStatus: string;
  availableSizes: string[];
  storeCount: number;
  availableStores: number;
};

type SizeAlert = {
  id: string;
  sku: string;
  title: string;
  image: string;
  size: string;
  createdAt: string;
  status: "Watching" | "Triggered";
  lastSeenAt?: string;
  storeName?: string;
};

type AppNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  sku?: string;
};

type RestockEvent = {
  id: string;
  sku: string;
  title: string;
  size: string;
  storeName: string;
  status: string;
  checkedAt: string;
};

type AdapterTestSnapshot = {
  query: string;
  checkedAt: string;
  totals: {
    storesChecked: number;
    lookupUnavailable: number;
    confirmedSoldOut: number;
    productMatches: number;
  };
  results: {
    storeId: string;
    storeName: string;
    city: string;
    durationMs: number;
    ok: boolean;
    status: StockStatus;
    label: string;
    trustNote: string;
    productTitle: string;
    note: string;
    productUrl: string;
    checkedAt: string;
    sizeVisibility?: string;
    inventoryConfidence?: string;
    healthScore?: number;
    healthLabel?: string;
  }[];
};

type AnalyticsSnapshot = {
  totals: {
    totalSearches: number;
    cacheHits: number;
    cacheMisses: number;
    cacheRate: number;
    matchesFound: number;
    availableFound: number;
    soldOutCount: number;
    lookupUnavailableCount: number;
    noMatchCount: number;
    failedRequests: number;
    unavailableRate: number;
    matchRate: number;
    totalStoreLookups: number;
  };
  recentSearches: {
    id: string;
    query: string;
    resolvedSku: string;
    productTitle: string;
    checkedAt: string;
    cacheHit: boolean;
    storesChecked: number;
    matchesFound: number;
    availableCount: number;
    unavailableCount: number;
  }[];
  storeHealth: {
    storeId: string;
    storeName: string;
    city: string;
    platform: string;
    totalLookups: number;
    available: number;
    soldOut: number;
    noMatch: number;
    unavailable: number;
    productFound: number;
    lastStatus: string;
    lastChecked: string | null;
    health: "Healthy" | "Needs Review" | "Unstable" | "Not Checked";
  }[];
  generatedAt: string;
};



type MonitoringSnapshot = {
  generatedAt: string;
  stores: {
    total: number;
    healthy: number;
    needsReview: number;
    unstable: number;
    rows: {
      storeId: string;
      storeName: string;
      enabled: boolean;
      health: string;
      healthScore: number;
      totalLookups: number;
      failureRate: number;
      verificationRate: number;
      lastSuccess: string | null;
      lastStatus: string;
      expectedInventoryVisibility: string;
      notes: string;
    }[];
  };
  search: {
    totalSearches: number;
    matchRate: number;
    cacheRate: number;
    lookupUnavailableRate: number;
    failedRequests: number;
    recentSearches: AnalyticsSnapshot["recentSearches"];
  };
  alerts: { mode: string; delivery: string; status: string };
  releases: { upcomingCount: number; nextRelease: ReleaseCalendarItem | null };
  catalog: { totalProducts: number; aliasCount: number; brands: Record<string, number> };
  risk: { level: string; note: string };
};

type CacheSnapshot = {
  activeEntries: number;
  expiredEntriesRemoved: number;
  ttlSeconds: number;
  generatedAt: string;
};

type BetaReadinessSnapshot = {
  checkedAt: string;
  score: number;
  status: string;
  recommendation: string;
  nextStep: string;
  checks: { label: string; passed: boolean; detail: string; weight: number }[];
};

type StorePreference = {
  storeId: string;
  enabled: boolean;
};
function isAvailable(status: StockStatus) {
  return isAvailableStatus(status);
}

function statusLabel(status: StockStatus) {
  return userFacingStatusLabel(status);
}

function confidenceLabel(value: string) {
  if (value === "High") return "Verified Match";
  if (value === "Medium") return "Product Found";
  return "Store Search Only";
}

function matchClass(value?: string) {
  if (value === "Verified Match") return "verified";
  if (value === "Product Found") return "likely";
  if (value === "Store Search Only") return "manual";
  return "neutral";
}

function statusClass(status: StockStatus) {
  if (status === "In Stock") return "pill-green";
  if (status === "Low Stock" || status === "Product Found") return "pill-gold";
  if (status === "Sold Out" || status === "No Match") return "pill-neutral";
  if (status === "Unavailable") return "pill-blue";
  return "pill-blue";
}

function StatusPill({ status }: { status: StockStatus }) {
  const Icon = isAvailable(status) ? CheckCircle2 : status === "Sold Out" || status === "No Match" ? XCircle : ShieldCheck;
  return <span className={`pill ${statusClass(status)}`}><Icon size={13} />{statusLabel(status)}</span>;
}

function formatTime(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function StoreLogo({ name }: { name: string }) {
  const short = name === "Social Status" ? "SOCIAL\nSTATUS" : name === "A Ma Maniére" ? "A" : name.toUpperCase().slice(0, 4);
  return <div className="store-logo"><span>{short}</span></div>;
}

function KpiCard({ icon, label, value, note, tone = "default" }: { icon: ReactNode; label: string; value: string | number; note?: string; tone?: "default" | "green" | "gold" | "red" }) {
  return (
    <div className={`kpi-card kpi-${tone}`}>
      <div className="kpi-icon">{icon}</div>
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        {note && <div className="kpi-note">{note}</div>}
      </div>
    </div>
  );
}

function SizeList({ sizes, availability }: { sizes: string[]; availability?: SizeAvailability[] }) {
  const rows = availability?.length
    ? availability
    : sizes.map((size) => ({ size, available: true, label: "Available" as const }));

  if (!rows.length) return <p className="quiet">No public size-level data shown. Use the source page or phone to verify.</p>;

  return (
    <div className="size-availability-grid">
      {rows.map((row) => (
        <span key={`${row.size}-${row.label}`} className={`size-chip ${row.available === true ? "size-available" : row.available === false ? "size-sold" : "size-hidden"}`}>
          <strong>{row.size}</strong>
          <em>{row.label}</em>
        </span>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">{icon}</div>
      <strong>{title}</strong>
      <p>{body}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

function StoreStatusLegend() {
  return (
    <div className="legend-card">
      <div className="recent-title"><ShieldCheck size={16} /> Store Status Legend</div>
      <div className="legend-grid">
        <span><CheckCircle2 size={14} /> Available means public stock or sizes are visible.</span>
        <span><Clock3 size={14} /> Product Found means the page exists but inventory is unclear.</span>
        <span><XCircle size={14} /> Sold Out is only used when the store publicly shows sold out.</span>
        <span><AlertTriangle size={14} /> Lookup Unavailable means the store could not be checked, not sold out.</span>
      </div>
    </div>
  );
}

function safeReadLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteLocal<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local storage can be unavailable in private browsing. The app still works for the current session.
  }
}

function uniqueSizes(results: HydratedSearchResult[]) {
  return Array.from(new Set(results.flatMap((item) => item.sizes))).sort((a, b) => Number.parseFloat(a) - Number.parseFloat(b));
}

function getCoverageConfidence(payload: SearchPayload | null, results: HydratedSearchResult[]) {
  if (!payload) return { label: "Ready", score: 0, note: "Run a search to calculate coverage confidence." };

  return getCoverageConfidenceScore({
    storesChecked: results.length,
    matchesFound: payload.intelligence?.matchesFound || 0,
    availableCount: payload.intelligence?.availableCount || 0,
    soldOutCount: payload.intelligence?.soldOutCount || 0,
    unavailableCount: results.filter((item) => item.status === "Unavailable").length,
    productConfidenceScore: payload.product?.confidenceScore || 0,
  });
}

function getReleaseCountdown(value: string) {
  if (!value || value === "Core Style" || value === "TBD") return value || "TBD";
  const target = new Date(`${value}T12:00:00`);
  if (Number.isNaN(target.getTime())) return value;
  const diff = Math.ceil((target.getTime() - Date.now()) / 86400000);
  if (diff > 1) return `${diff} days`;
  if (diff === 1) return "Tomorrow";
  if (diff === 0) return "Today";
  return "Released";
}

function inferWatchlistGroup(item: TrackedProduct) {
  const text = `${item.title} ${item.sku}`.toLowerCase();
  if (text.includes("jordan")) return "My Jordans";
  if (text.includes("dunk") || text.includes("nike sb")) return "My Dunks";
  if (text.includes("new balance") || text.includes("990")) return "New Balance Watch";
  return "General Watchlist";
}

export default function HomePage() {
  const [sku, setSku] = useState("HF4198-001");
  const [results, setResults] = useState<HydratedSearchResult[]>([]);
  const [selected, setSelected] = useState<HydratedSearchResult | null>(null);
  const [payload, setPayload] = useState<SearchPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState<string[]>(["HF4198-001", "DZ5485-400", "Air Force 1", "Travis Scott", "Jordan 4"]);
  const [activeView, setActiveView] = useState<NavView>("Search");
  const [sortMode, setSortMode] = useState<SortMode>("Relevance");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [trackedProducts, setTrackedProducts] = useState<TrackedProduct[]>([]);
  const [alerts, setAlerts] = useState<SizeAlert[]>([]);
  const [restockHistory, setRestockHistory] = useState<RestockEvent[]>([]);
  const [inAppNotifications, setInAppNotifications] = useState<AppNotification[]>([]);
  const [notificationPermission, setNotificationPermission] = useState("unsupported");
  const [releaseRemindersEnabled, setReleaseRemindersEnabled] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [alertSize, setAlertSize] = useState("Any Size");
  const [notice, setNotice] = useState("");
  const [themeLabel, setThemeLabel] = useState("Dark");
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [monitoring, setMonitoring] = useState<MonitoringSnapshot | null>(null);
  const [monitoringLoading, setMonitoringLoading] = useState(false);
  const [adapterTest, setAdapterTest] = useState<AdapterTestSnapshot | null>(null);
  const [adapterTestLoading, setAdapterTestLoading] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [cacheSnapshot, setCacheSnapshot] = useState<CacheSnapshot | null>(null);
  const [betaReadiness, setBetaReadiness] = useState<BetaReadinessSnapshot | null>(null);
  const [betaReadinessLoading, setBetaReadinessLoading] = useState(false);
  const [storePreferences, setStorePreferences] = useState<StorePreference[]>(() => approvedStores.map((store) => ({ storeId: store.id, enabled: true })));
  const [compactMode, setCompactMode] = useState(false);
  const [autoOpenResults, setAutoOpenResults] = useState(true);
  const viewRef = useRef<HTMLDivElement | null>(null);

  const stats = useMemo(() => {
    const matches = results.filter((item) => !["No Match", "Unavailable", "Unknown"].includes(item.status)).length;
    const available = results.filter((item) => isAvailable(item.status)).length;
    const manualCheck = results.filter((item) => item.status === "Product Found" || item.status === "Unavailable").length;
    const soldOut = results.filter((item) => item.status === "Sold Out").length;
    return { checked: results.length || "—", matches: matches || "—", available: available || "—", lowStock: manualCheck || "—", soldOut: soldOut || "—" };
  }, [results]);


  const disabledStoreIds = useMemo(() => storePreferences.filter((item) => !item.enabled).map((item) => item.storeId), [storePreferences]);
  const enabledStoreCount = approvedStores.length - disabledStoreIds.length;
  const rateLimitLabel = getRateLimitLabel();

  const selectedResult = selected || results[0] || null;
  const normalized = payload?.resolvedSku || normalizeSearchQuery(sku);
  const intelligence = payload?.intelligence;
  const product = payload?.product;
  const productTitle = product?.title && product.title !== "Product not resolved yet"
    ? product.title
    : selectedResult && selectedResult.status !== "No Match" && selectedResult.productTitle !== "Potential Match Found"
      ? selectedResult.productTitle
      : payload ? "No public match found" : "Nike SB Dunk Low Pro";
  const productImage = product?.image || selectedResult?.productImage || "/shoe-fallback.svg";
  const productMatchLevel = product?.matchLevel || (selectedResult ? confidenceLabel(selectedResult.confidence) : "Ready");
  const coverageConfidence = getCoverageConfidence(payload, results);
  const upcomingReleases = useMemo(() => getUpcomingReleases(), []);

  function completeOnboarding() {
    safeWriteLocal("ssf:onboardingComplete", true);
    setOnboardingOpen(false);
    showNotice("You are ready to search");
  }

  function restartOnboarding() {
    setOnboardingOpen(true);
    showNotice("Onboarding opened");
  }

  function handleNav(label: NavView) {
    setActiveView(label);
    window.setTimeout(() => {
      if (label !== "Search") viewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }, 40);
  }

  async function fetchAnalytics() {
    setAnalyticsLoading(true);
    try {
      const response = await fetch("/api/admin/analytics", { cache: "no-store" });
      if (!response.ok) throw new Error("Dashboard failed to load");
      const data: AnalyticsSnapshot = await response.json();
      setAnalytics(data);
    } catch {
      showNotice("Accuracy dashboard could not load");
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function fetchMonitoring() {
    setMonitoringLoading(true);
    try {
      const response = await fetch("/api/admin/monitoring", { cache: "no-store" });
      if (!response.ok) throw new Error("Monitoring failed to load");
      const data: MonitoringSnapshot = await response.json();
      setMonitoring(data);
    } catch {
      showNotice("Production monitoring could not load");
    } finally {
      setMonitoringLoading(false);
    }
  }

  async function runAdapterTest(testQuery = normalized || sku) {
    setAdapterTestLoading(true);
    try {
      const response = await fetch("/api/admin/adapter-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: testQuery }),
      });
      const data: AdapterTestSnapshot & { error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error || "Adapter test failed");
      setAdapterTest(data);
      showNotice("Store adapter check complete");
    } catch {
      showNotice("Store adapter check failed");
    } finally {
      setAdapterTestLoading(false);
    }
  }

  async function fetchBetaReadiness() {
    setBetaReadinessLoading(true);
    try {
      const response = await fetch("/api/admin/beta-readiness", { cache: "no-store" });
      if (!response.ok) throw new Error("Beta readiness failed");
      const data: BetaReadinessSnapshot = await response.json();
      setBetaReadiness(data);
      showNotice("Beta readiness checked");
    } catch {
      showNotice("Beta readiness could not load");
    } finally {
      setBetaReadinessLoading(false);
    }
  }

  useEffect(() => {
    setFavorites(safeReadLocal<string[]>("ssf:favorites", []));
    setTrackedProducts(safeReadLocal<TrackedProduct[]>("ssf:trackedProducts", []));
    setAlerts(safeReadLocal<SizeAlert[]>("ssf:sizeAlerts", []));
    setRestockHistory(safeReadLocal<RestockEvent[]>("ssf:restockHistory", []));
    setInAppNotifications(safeReadLocal<AppNotification[]>("ssf:notifications", []));
    setStorePreferences(safeReadLocal<StorePreference[]>("ssf:storePreferences", approvedStores.map((store) => ({ storeId: store.id, enabled: true }))));
    setCompactMode(safeReadLocal<boolean>("ssf:compactMode", false));
    setAutoOpenResults(safeReadLocal<boolean>("ssf:autoOpenResults", true));
    setReleaseRemindersEnabled(safeReadLocal<boolean>("ssf:releaseRemindersEnabled", false));
    setNotificationPermission(typeof window !== "undefined" && "Notification" in window ? window.Notification.permission : "unsupported");
    if (!safeReadLocal<boolean>("ssf:onboardingComplete", false)) setOnboardingOpen(true);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    // hydrated in first effect; this small guard keeps the prior load behavior intact.
    if (!recent.length) return;
  }, [recent]);

  useEffect(() => {
    // no-op effect reserved for install prompt lifecycle stability.
  }, [deferredInstallPrompt]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setRecent(safeReadLocal<string[]>("ssf:recentSearches", ["HF4198-001", "DZ5485-400", "Air Force 1", "Travis Scott", "Jordan 4"]));
  }, []);

  useEffect(() => safeWriteLocal("ssf:favorites", favorites), [favorites]);
  useEffect(() => safeWriteLocal("ssf:trackedProducts", trackedProducts), [trackedProducts]);
  useEffect(() => safeWriteLocal("ssf:sizeAlerts", alerts), [alerts]);
  useEffect(() => safeWriteLocal("ssf:restockHistory", restockHistory), [restockHistory]);
  useEffect(() => safeWriteLocal("ssf:notifications", inAppNotifications), [inAppNotifications]);
  useEffect(() => safeWriteLocal("ssf:recentSearches", recent), [recent]);
  useEffect(() => safeWriteLocal("ssf:storePreferences", storePreferences), [storePreferences]);
  useEffect(() => safeWriteLocal("ssf:compactMode", compactMode), [compactMode]);
  useEffect(() => safeWriteLocal("ssf:autoOpenResults", autoOpenResults), [autoOpenResults]);
  useEffect(() => safeWriteLocal("ssf:releaseRemindersEnabled", releaseRemindersEnabled), [releaseRemindersEnabled]);

  useEffect(() => {
    if (activeView === "Admin") {
      void fetchAnalytics();
      void fetchMonitoring();
    }
    if (activeView === "Settings") void fetchCacheSnapshot();
  }, [activeView]);

  useEffect(() => {
    evaluateReleaseNotificationEngine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [releaseRemindersEnabled, trackedProducts.length]);

  async function runSearch(nextSku = sku) {
    const cleanSku = normalizeSearchQuery(nextSku);
    setSku(cleanSku);
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: cleanSku, disabledStoreIds }),
      });
      const data: SearchPayload & { error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error || "Search failed");
      const nextResults = data.results || [];
      setPayload(data);
      setResults(nextResults);
      setSelected(nextResults?.[0] || null);
      setRecent((items) => [cleanSku, ...items.filter((item) => item !== cleanSku)].slice(0, 8));
      updateTrackingFromSearch(data, nextResults);
      evaluateAlerts(data, nextResults);
      if (autoOpenResults && activeView !== "Search") handleNav("Search");
      if (activeView === "Admin") {
        void fetchAnalytics();
        void fetchMonitoring();
      }
      if (activeView === "Settings") void fetchCacheSnapshot();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void runSearch(sku);
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function addInAppNotification(title: string, body: string, skuValue?: string) {
    const item: AppNotification = { id: `${Date.now()}:${Math.random().toString(16).slice(2)}`, title, body, sku: skuValue, createdAt: new Date().toISOString() };
    setInAppNotifications((current) => [item, ...current].slice(0, 30));
  }

  async function requestNotificationPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      showNotice("Notifications are not supported in this browser");
      return;
    }
    const permission = await window.Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      addInAppNotification("Notifications enabled", "Restock alerts can now use browser notifications when this app is open.");
      showNotice("Notifications enabled");
    } else {
      showNotice("Notifications were not enabled");
    }
  }

  async function installApp() {
    if (!deferredInstallPrompt) {
      showNotice("Use your browser menu to install this app when prompted");
      return;
    }
    await deferredInstallPrompt.prompt();
    setDeferredInstallPrompt(null);
    showNotice("Install prompt opened");
  }

  function sendBrowserNotification(title: string, body: string) {
    if (typeof window === "undefined" || !("Notification" in window) || window.Notification.permission !== "granted") return;
    const options = { body, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png" };
    try {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready
          .then((registration) => registration.showNotification(title, options))
          .catch(() => new window.Notification(title, options));
        return;
      }
      new window.Notification(title, options);
    } catch {
      // Browser notifications are best-effort; in-app alerts still record the event.
    }
  }

  function clearNotifications() {
    setInAppNotifications([]);
    showNotice("Notification center cleared");
  }

  function evaluateReleaseNotificationEngine() {
    if (!releaseRemindersEnabled || !trackedProducts.length) return;
    const trackedSkus = new Set(trackedProducts.map((item) => item.sku));
    const todayKey = new Date().toISOString().slice(0, 10);
    const sent = safeReadLocal<Record<string, string>>("ssf:releaseReminderSent", {});
    const nextSent = { ...sent };
    let notificationsCreated = 0;

    for (const release of releaseCalendar) {
      if (!trackedSkus.has(release.sku)) continue;
      const status = getReleaseNotificationStatus(release.releaseDate);
      if (!status.shouldNotify) continue;
      const key = `${release.sku}:${status.kind}`;
      if (nextSent[key] === todayKey) continue;
      const notification = buildReleaseNotification(release, status);
      addInAppNotification(notification.title, notification.body, release.sku);
      sendBrowserNotification(notification.title, notification.body);
      nextSent[key] = todayKey;
      notificationsCreated += 1;
    }

    if (notificationsCreated) safeWriteLocal("ssf:releaseReminderSent", nextSent);
  }

  async function enableReleaseReminderEngine() {
    if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission !== "granted") {
      await requestNotificationPermission();
    }
    setReleaseRemindersEnabled(true);
    showNotice("Release reminders enabled");
  }

  async function scanTrackedProducts() {
    const targets = trackedProducts.slice(0, 5);
    if (!targets.length) return showNotice("Track products before running a scan");
    showNotice(`Scanning ${targets.length} tracked product${targets.length === 1 ? "" : "s"}`);
    for (const item of targets) {
      await runSearch(item.sku);
    }
    addInAppNotification("Tracked scan complete", `${targets.length} tracked product${targets.length === 1 ? "" : "s"} checked.`, targets[0]?.sku);
    showNotice("Tracked product scan complete");
  }

  function saveFavorite() {
    const item = normalized || normalizeSearchQuery(sku);
    if (!item || item === "—") return;
    setFavorites((current) => [item, ...current.filter((value) => value !== item)].slice(0, 12));
    showNotice(`${item} saved to favorites`);
  }

  function buildTrackedProduct(currentPayload = payload, currentResults = results): TrackedProduct | null {
    const resolved = currentPayload?.resolvedSku || normalized || normalizeSearchQuery(sku);
    if (!resolved || resolved === "—") return null;
    const sizes = uniqueSizes(currentResults);
    const availableStores = currentResults.filter((item) => isAvailable(item.status)).length;
    return {
      sku: resolved,
      title: productTitle,
      image: productImage,
      addedAt: new Date().toISOString(),
      lastChecked: currentPayload?.checkedAt || new Date().toISOString(),
      lastStatus: availableStores ? "Available" : currentResults.some((item) => item.status === "Unavailable") ? "Needs Manual Check" : "Watching",
      availableSizes: sizes,
      storeCount: currentResults.length,
      availableStores,
    };
  }

  function trackProduct() {
    const item = buildTrackedProduct();
    if (!item) return showNotice("Search a product before tracking");
    setTrackedProducts((current) => [item, ...current.filter((value) => value.sku !== item.sku)].slice(0, 24));
    addInAppNotification("Product tracked", `${item.title} is now saved for manual rechecks.`, item.sku);
    showNotice(`${item.sku} added to tracked products`);
  }

  function trackRelease(release: ReleaseCalendarItem) {
    const item: TrackedProduct = {
      sku: release.sku,
      title: release.title,
      image: release.image || "/shoe-fallback.svg",
      addedAt: new Date().toISOString(),
      lastChecked: new Date().toISOString(),
      lastStatus: "Release Watch",
      availableSizes: [],
      storeCount: 0,
      availableStores: 0,
    };
    setTrackedProducts((current) => [item, ...current.filter((value) => value.sku !== item.sku)].slice(0, 24));
    addInAppNotification("Release tracked", `${release.title} is now in your watchlist.`, release.sku);
    sendBrowserNotification("Release tracked", `${release.title} is now in your watchlist.`);
    showNotice(`${release.title} added to watchlist`);
  }

  function searchRelease(release: ReleaseCalendarItem) {
    void runSearch(release.sku);
    handleNav("Search");
  }

  function updateTrackingFromSearch(currentPayload: SearchPayload, currentResults: HydratedSearchResult[]) {
    const item = buildTrackedProduct(currentPayload, currentResults);
    if (!item) return;
    setTrackedProducts((current) => current.map((tracked) => tracked.sku === item.sku ? { ...tracked, ...item, addedAt: tracked.addedAt } : tracked));
  }

  function saveAlert() {
    const item = buildTrackedProduct();
    if (!item) return showNotice("Search a product before saving an alert");
    const size = alertSize || "Any Size";
    const id = `${item.sku}:${size}`;
    const newAlert: SizeAlert = {
      id,
      sku: item.sku,
      title: item.title,
      image: item.image,
      size,
      createdAt: new Date().toISOString(),
      status: "Watching",
    };
    setAlerts((current) => [newAlert, ...current.filter((value) => value.id !== id)].slice(0, 30));
    setTrackedProducts((current) => [item, ...current.filter((value) => value.sku !== item.sku)].slice(0, 24));
    addInAppNotification("Restock alert saved", `${item.title} • ${size}`, item.sku);
    showNotice(`Restock alert saved for ${item.sku} • ${size}`);
  }

  function evaluateAlerts(currentPayload: SearchPayload, currentResults: HydratedSearchResult[]) {
    const resolved = currentPayload.resolvedSku;
    if (!resolved) return;
    const availableRows = currentResults.filter((item) => isAvailable(item.status));
    if (!availableRows.length) return;

    const triggeredEvents: RestockEvent[] = [];
    setAlerts((current) => current.map((alert) => {
      if (alert.sku !== resolved || alert.status === "Triggered") return alert;
      const match = availableRows.find((row) => alert.size === "Any Size" || row.sizes.includes(alert.size));
      if (!match) return alert;
      triggeredEvents.push({
        id: `${alert.id}:${Date.now()}`,
        sku: alert.sku,
        title: alert.title,
        size: alert.size === "Any Size" ? (match.sizes[0] || "Visible Size") : alert.size,
        storeName: match.storeName,
        status: match.status,
        checkedAt: currentPayload.checkedAt,
      });
      return { ...alert, status: "Triggered", lastSeenAt: currentPayload.checkedAt, storeName: match.storeName };
    }));

    if (triggeredEvents.length) {
      setRestockHistory((current) => [...triggeredEvents, ...current].slice(0, 50));
      const first = triggeredEvents[0];
      addInAppNotification("Restock alert triggered", `${first.sku} size ${first.size} appeared at ${first.storeName}.`, first.sku);
      sendBrowserNotification("Restock alert triggered", `${first.sku} size ${first.size} appeared at ${first.storeName}.`);
      showNotice(`Restock alert triggered: ${first.sku} size ${first.size}`);
    }
  }

  function removeTrackedProduct(skuToRemove: string) {
    setTrackedProducts((current) => current.filter((item) => item.sku !== skuToRemove));
    showNotice(`${skuToRemove} removed from tracking`);
  }

  function removeAlert(id: string) {
    setAlerts((current) => current.filter((item) => item.id !== id));
    showNotice("Alert removed");
  }

  function clearRestockHistory() {
    setRestockHistory([]);
    showNotice("Restock history cleared");
  }

  function clearHistory() {
    setRecent([]);
    showNotice("Recent searches cleared");
  }

  function toggleTheme() {
    setThemeLabel((value) => value === "Dark" ? "Luxe" : "Dark");
    showNotice("Display mode updated");
  }

  function showDataPolicy() {
    addInAppNotification("Data policy", "Searches use public product pages, visible online availability, cache protection, and source links only.");
    showNotice("Data policy added to notification center");
  }

  function showHelp() {
    handleNav("Settings");
    showNotice("Tip: exact SKU searches return the strongest matches");
  }

  async function resetDashboard() {
    setAnalyticsLoading(true);
    try {
      const response = await fetch("/api/admin/analytics", { method: "DELETE" });
      if (!response.ok) throw new Error("Reset failed");
      const data: AnalyticsSnapshot = await response.json();
      setAnalytics(data);
      showNotice("Accuracy dashboard reset");
    } catch {
      showNotice("Dashboard reset failed");
    } finally {
      setAnalyticsLoading(false);
    }
  }



  async function fetchCacheSnapshot() {
    try {
      const response = await fetch("/api/admin/cache", { cache: "no-store" });
      if (!response.ok) throw new Error("Cache status failed");
      const data: CacheSnapshot = await response.json();
      setCacheSnapshot(data);
    } catch {
      showNotice("Cache status could not load");
    }
  }

  async function clearServerCache() {
    try {
      const response = await fetch("/api/admin/cache", { method: "DELETE" });
      if (!response.ok) throw new Error("Cache clear failed");
      const data: CacheSnapshot = await response.json();
      setCacheSnapshot(data);
      showNotice("Search cache cleared");
    } catch {
      showNotice("Cache could not be cleared");
    }
  }

  function toggleStorePreference(storeId: string) {
    setStorePreferences((current) => current.map((item) => item.storeId === storeId ? { ...item, enabled: !item.enabled } : item));
    showNotice("Store preference updated");
  }

  function enableAllStores() {
    setStorePreferences(approvedStores.map((store) => ({ storeId: store.id, enabled: true })));
    showNotice("All stores enabled");
  }

  function exportTrackedProductsCsv() {
    const rows = [
      ["sku", "title", "lastStatus", "storeCount", "availableStores", "availableSizes", "addedAt", "lastChecked"],
      ...trackedProducts.map((item) => [item.sku, item.title, item.lastStatus, item.storeCount, item.availableStores, item.availableSizes.join(" | "), item.addedAt, item.lastChecked || ""]),
    ];
    downloadCsv("sneaker-stock-tracked-products.csv", rows);
  }

  function exportAlertsCsv() {
    const rows = [
      ["sku", "title", "size", "status", "storeName", "createdAt", "lastSeenAt"],
      ...alerts.map((item) => [item.sku, item.title, item.size, item.status, item.storeName || "", item.createdAt, item.lastSeenAt || ""]),
    ];
    downloadCsv("sneaker-stock-alerts.csv", rows);
  }

  function downloadCsv(filename: string, rows: unknown[][]) {
    if (typeof window === "undefined") return;
    const csv = rows.map((row) => row.map((value) => {
      const text = String(value ?? "");
      return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
    }).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showNotice(`${filename} exported`);
  }

  function resetLocalAppData() {
    if (typeof window === "undefined") return;
    const ok = window.confirm("Reset local favorites, alerts, tracked products, history, notifications, and settings on this device?");
    if (!ok) return;
    ["ssf:favorites", "ssf:trackedProducts", "ssf:sizeAlerts", "ssf:restockHistory", "ssf:notifications", "ssf:recentSearches", "ssf:storePreferences", "ssf:compactMode", "ssf:autoOpenResults", "ssf:onboardingComplete", "ssf:releaseRemindersEnabled", "ssf:releaseReminderSent"].forEach((key) => window.localStorage.removeItem(key));
    setFavorites([]);
    setTrackedProducts([]);
    setAlerts([]);
    setRestockHistory([]);
    setInAppNotifications([]);
    setRecent([]);
    setStorePreferences(approvedStores.map((store) => ({ storeId: store.id, enabled: true })));
    setCompactMode(false);
    setAutoOpenResults(true);
    setReleaseRemindersEnabled(false);
    showNotice("Local app data reset");
  }

  const alertSizeOptions = useMemo(() => ["Any Size", ...uniqueSizes(results)], [results]);

  const sortedResults = useMemo(() => {
    const statusRank: Record<StockStatus, number> = {
      "In Stock": 0,
      "Low Stock": 1,
      "Product Found": 2,
      "Sold Out": 3,
      "No Match": 4,
      "Unavailable": 5,
      "Unknown": 6,
    };
    const confidenceRank: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
    return [...results].sort((a, b) => {
      if (sortMode === "Availability") return (statusRank[a.status] ?? statusSortWeight(a.status)) - (statusRank[b.status] ?? statusSortWeight(b.status));
      if (sortMode === "Store") return a.storeName.localeCompare(b.storeName);
      return (confidenceRank[a.confidence] ?? 9) - (confidenceRank[b.confidence] ?? 9);
    });
  }, [results, sortMode]);

  return (
    <main className={`app-frame ${themeLabel === "Luxe" ? "luxe-mode" : ""} ${compactMode ? "compact-mode" : ""}`}>
      <aside className="sidebar">
        <div className="side-brand">
          <div className="bolt"><Zap size={22} /></div>
          <div>
            <strong>Sneaker<br />Stock Finder</strong>
            <span>Stock Concierge</span>
          </div>
        </div>

        <nav className="side-nav">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} onClick={() => handleNav(label)} className={activeView === label ? "active" : ""}>
              <Icon size={19} />{label}
            </button>
          ))}
        </nav>

        <div className="side-bottom">
          <button onClick={toggleTheme}><Moon size={18} />{themeLabel}</button>
          <button onClick={showHelp}><HelpCircle size={18} />Help</button>
        </div>
      </aside>

      <nav className="mobile-tabbar" aria-label="Mobile navigation">
        {navItems.map(({ label, icon: Icon }) => (
          <button key={label} onClick={() => handleNav(label)} className={activeView === label ? "active" : ""} aria-label={label}>
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <section className="workspace">
        <header className="mobile-header">
          <div className="side-brand compact"><div className="bolt"><Zap size={18} /></div><strong>Sneaker Stock Finder</strong></div>
        </header>

        <div className="top-note"><ShieldCheck size={14} /> Public stock information only • v{APP_VERSION} • {enabledStoreCount}/{approvedStores.length} stores enabled</div>
        {notice && <div className="toast-notice">{notice}</div>}
        {onboardingOpen && (
          <div className="onboarding-backdrop" role="dialog" aria-modal="true" aria-label="First run guide">
            <div className="onboarding-card">
              <div className="onboarding-top"><div className="bolt"><Zap size={20} /></div><span>First Run Setup</span></div>
              <h2>Use this like a boutique stock concierge.</h2>
              <p>Search by SKU, vendor code, UPC-style code, or product keyword. Results separate true sold-out signals from lookup problems so failed store checks do not look like no stock.</p>
              <div className="onboarding-steps">
                <div><Search size={18} /><strong>Search</strong><span>Run a SKU or keyword.</span></div>
                <div><ShieldCheck size={18} /><strong>Verify</strong><span>Use confidence labels and source links.</span></div>
                <div><Bell size={18} /><strong>Track</strong><span>Save products or size alerts.</span></div>
              </div>
              <div className="onboarding-actions">
                <button onClick={() => { completeOnboarding(); void runSearch("HF4198-001"); }}>Try Demo Search</button>
                <button className="muted-button" onClick={completeOnboarding}>Start Searching</button>
              </div>
            </div>
          </div>
        )}

        <section className="hero-card">
          <div className="hero-copy-block">
            <div className="eyebrow"><ShieldCheck size={14} /> Verified boutique lookup</div>
            <h1>Find the pair <span>without calling</span> every store.</h1>
            <p>Enter a SKU or vendor code and check approved online boutiques for public product matches, visible sizes, contact details, and source links.</p>

            <form onSubmit={handleSubmit} className="search-bar">
              <div className="field"><Search size={22} /><input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="HF4198-001" autoCapitalize="characters" /></div>
              <button disabled={loading}>{loading ? <RefreshCw className="spin" size={19} /> : <Search size={19} />}{loading ? "Searching" : "Search"}</button>
            </form>
            <div className="quick-chips">{quickSearches.map((item) => <button key={item} onClick={() => void runSearch(item)}>{item}</button>)}</div>
            {error && <div className="error-banner">{error}</div>}
          </div>
          <div className="shoe-stage" aria-hidden="true"><div className="shoe-card"><img className="hero-shoe-img" src={productImage} alt="" /></div></div>
        </section>

        <section className="kpi-strip">
          <KpiCard tone="green" icon={<Store size={21} />} label="Stores Checked" value={intelligence?.storesChecked ?? stats.checked} note="Boutiques scanned" />
          <KpiCard tone="green" icon={<Target size={21} />} label="Matches Found" value={intelligence?.matchesFound ?? stats.matches} note="Products matched" />
          <KpiCard tone="green" icon={<CheckCircle2 size={21} />} label="Available" value={intelligence?.availableCount ?? stats.available} note="In stock now" />
          <KpiCard tone="gold" icon={<Clock3 size={21} />} label="Manual Checks" value={intelligence?.hiddenInventoryCount ?? stats.lowStock} note="Not counted as sold out" />
          <KpiCard tone="red" icon={<XCircle size={21} />} label="Sold Out" value={intelligence?.soldOutCount ?? stats.soldOut} note="Not available" />
          <KpiCard icon={<ShieldCheck size={21} />} label="Coverage Confidence" value={coverageConfidence.label} note={coverageConfidence.score ? `${coverageConfidence.score}% • ${payload?.cache.hit ? "Cached" : "Fresh"}` : "Ready"} />
        </section>

        <section className="content-grid">
          <div className="results-panel panel-shell">
            <div className="panel-title-row">
              <div><span className="small-label">Store Results</span><h2>Verified Boutiques</h2></div>
              <select aria-label="Sort results" value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}><option>Relevance</option><option>Availability</option><option>Store</option></select>
            </div>

            <div className="store-stack">
              {!results.length && !loading && !payload && <EmptyState icon={<Search size={30} />} title="Run a search" body="Search a SKU, vendor code, or product keyword to reveal verified boutique availability." action={<button onClick={() => void runSearch("HF4198-001")}>Try HF4198-001</button>} />}
              {!results.length && !loading && payload && <EmptyState icon={<AlertTriangle size={30} />} title="No reliable public matches" body="No approved store returned a confident product match. This is not treated as sold out unless a store explicitly says sold out." action={<button onClick={() => handleNav("Admin")}>Review store health</button>} />}
              {loading && [1,2,3,4].map((n) => <div key={n} className="store-row skeleton" />)}
              {sortedResults.map((item) => (
                <button key={item.storeId} onClick={() => setSelected(item)} className={`store-row ${selectedResult?.storeId === item.storeId ? "selected" : ""}`}>
                  <StoreLogo name={item.storeName} />
                  <div className="store-main">
                    <div className="store-head"><strong>{item.storeName}</strong><span className={`mini-badge ${item.confidence === "High" ? "verified" : item.confidence === "Medium" ? "likely" : "manual"}`}>{confidenceLabel(item.confidence)}</span></div>
                    <div className="store-location"><MapPin size={12} />{item.city}</div>
                    <p>{item.note || "Public product availability details are shown when available."}</p>
                    <div className="store-foot"><span><Clock3 size={13} /> Checked {formatTime(item.checkedAt)}</span><span>View details</span></div>
                  </div>
                  <StatusPill status={item.status} />
                </button>
              ))}
            </div>

            <StoreStatusLegend />

            <div className="recent-card">
              <div className="recent-title"><History size={16} /> Recent Searches <button onClick={clearHistory}>Clear all</button></div>
              <div className="quick-chips compact-chips">{recent.length ? recent.map((item) => <button key={item} onClick={() => void runSearch(item)}>{item}</button>) : <span className="quiet">No recent searches.</span>}</div>
            </div>

            {activeView !== "Search" && (
              <div className="view-card" ref={viewRef}>
                <div className="recent-title">
                  {activeView === "Watchlists" && <Layers3 size={16} />}
                  {activeView === "Releases" && <CalendarDays size={16} />}
                  {activeView === "Alerts" && <Bell size={16} />}
                  {activeView === "History" && <History size={16} />}
                  {activeView === "Settings" && <Settings size={16} />}
                  {activeView === "Admin" && <BarChart3 size={16} />}
                  {activeView === "QA" && <ListChecks size={16} />}
                  {activeView === "Beta" && <MessageSquare size={16} />}
                  {activeView}
                </div>
                {activeView === "Releases" && (
                  <div className="release-screen">
                    <div className="release-hero-panel">
                      <div>
                        <span className="eyebrow">Release Calendar</span>
                        <h3>Track upcoming pairs before coverage starts.</h3>
                        <p className="quiet">Use release cards to track a product, set reminders, or immediately search store coverage when release day arrives.</p>
                      </div>
                      <button onClick={() => handleNav("Watchlists")}><Layers3 size={15} /> View Watchlists</button>
                    </div>
                    <div className="release-grid">
                      {upcomingReleases.length ? upcomingReleases.map((release) => {
                        const tracked = trackedProducts.some((item) => item.sku === release.sku);
                        return (
                          <article key={release.sku} className="release-card">
                            <div className="release-image"><img src={release.image || "/shoe-fallback.svg"} alt={release.title} /></div>
                            <div className="release-copy">
                              <span className={`priority-badge priority-${release.priority.toLowerCase()}`}>{release.priority}</span>
                              <h4>{release.title}</h4>
                              <p>{release.colorway}</p>
                              <div className="release-meta">
                                <span>{release.sku}</span>
                                <span>{release.msrp}</span>
                                <span>{release.releaseDate}</span>
                                <span>{getReleaseCountdown(release.releaseDate)}</span>
                              </div>
                              <div className="release-actions">
                                <button onClick={() => trackRelease(release)}>{tracked ? "Tracked" : "Track Release"}</button>
                                <button className="muted-button" onClick={() => searchRelease(release)}>Search Coverage</button>
                              </div>
                            </div>
                          </article>
                        );
                      }) : <EmptyState icon={<CalendarDays size={28} />} title="No upcoming releases" body="Only future release dates appear here. Already-released products stay searchable from the main search screen." action={<button onClick={() => handleNav("Search")}>Search released products</button>} />}
                    </div>
                  </div>
                )}
                {activeView === "Watchlists" && (
                  <div className="tracking-list">
                    <div className="history-actions">
                      <button onClick={() => void scanTrackedProducts()}><RefreshCw size={15} /> Scan Tracked Products</button>
                      <button onClick={() => handleNav("Alerts")}><Bell size={15} /> Alert Center</button>
                    </div>
                    <div className="watchlist-collections">
                      {["My Jordans", "My Dunks", "New Balance Watch", "Upcoming Releases", "General Watchlist"].map((group) => {
                        const count = group === "Upcoming Releases"
                          ? trackedProducts.filter((item) => upcomingReleases.some((release) => release.sku === item.sku)).length
                          : trackedProducts.filter((item) => inferWatchlistGroup(item) === group).length;
                        return (
                          <button key={group} onClick={() => showNotice(`${group}: ${count} tracked product${count === 1 ? "" : "s"}`)} className="collection-card">
                            <strong>{group}</strong>
                            <span>{count} product{count === 1 ? "" : "s"}</span>
                          </button>
                        );
                      })}
                    </div>
                    {trackedProducts.length ? trackedProducts.map((item) => (
                      <div key={item.sku} className="tracked-card">
                        <img src={item.image || "/shoe-fallback.svg"} alt="" />
                        <div>
                          <strong>{item.title}</strong>
                          <span>{item.sku} • {item.availableStores}/{item.storeCount} available stores</span>
                          <span>{item.availableSizes.length ? `Sizes: ${item.availableSizes.join(", ")}` : "No public sizes visible"}</span>
                        </div>
                        <span className="tracked-timestamp">Last checked {formatTime(item.lastChecked)}</span>
                        <button onClick={() => void runSearch(item.sku)}>Recheck</button>
                        <button className="icon-danger" onClick={() => removeTrackedProduct(item.sku)} aria-label={`Remove ${item.sku}`}><Trash2 size={15} /></button>
                      </div>
                    )) : <EmptyState icon={<Heart size={28} />} title="No tracked products" body="Search a product, then tap Track Product to save it here for manual rechecks." action={<button onClick={() => handleNav("Search")}>Search now</button>} /> }
                    {favorites.length ? <div className="quick-chips compact-chips">{favorites.map((item) => <button key={item} onClick={() => void runSearch(item)}>{item}</button>)}</div> : null}
                  </div>
                )}
                {activeView === "Alerts" && (
                  <div className="tracking-list">
                    {alerts.length ? alerts.map((item) => (
                      <div key={item.id} className={`alert-card ${item.status === "Triggered" ? "triggered" : ""}`}>
                        <img src={item.image || "/shoe-fallback.svg"} alt="" />
                        <div>
                          <strong>{item.title}</strong>
                          <span>{item.sku} • Size {item.size}</span>
                          <span>{item.status === "Triggered" ? `Triggered at ${item.storeName || "store"}` : "Watching for visible availability"}</span>
                        </div>
                        <button onClick={() => void runSearch(item.sku)}>Check Now</button>
                        <button className="icon-danger" onClick={() => removeAlert(item.id)} aria-label={`Remove alert ${item.id}`}><Trash2 size={15} /></button>
                      </div>
                    )) : <EmptyState icon={<Bell size={28} />} title="No size alerts" body="Search a product, choose a size, then tap Save Size Alert. Alerts are stored locally on this device." action={<button onClick={() => handleNav("Search")}>Create alert</button>} /> }

                    <div className="history-card">
                      <div className="recent-title"><Zap size={16} /> Notification Engine</div>
                      <p className="quiet">Release reminders and restock alerts use browser notifications when permission is granted. In-app alerts always remain available.</p>
                      <div className="settings-grid compact-settings">
                        <button onClick={() => releaseRemindersEnabled ? setReleaseRemindersEnabled(false) : void enableReleaseReminderEngine()}>{releaseRemindersEnabled ? "Disable Release Reminders" : "Enable Release Reminders"}</button>
                        <button onClick={() => void scanTrackedProducts()}>Scan Tracked Products</button>
                        <button onClick={requestNotificationPermission}>Notification Permission</button>
                      </div>
                      <div className="setting-stats">
                        <span>Browser permission: <strong>{notificationPermission}</strong></span>
                        <span>Release reminders: <strong>{releaseRemindersEnabled ? "On" : "Off"}</strong></span>
                        <span>Tracked products: <strong>{trackedProducts.length}</strong></span>
                      </div>
                    </div>

                    <div className="history-card">
                      <div className="recent-title"><Bell size={16} /> Notification Center <button onClick={clearNotifications}>Clear</button></div>
                      {inAppNotifications.length ? inAppNotifications.map((note) => (
                        <button key={note.id} onClick={() => note.sku ? void runSearch(note.sku) : showNotice(note.body)}>
                          <strong>{note.title}</strong>
                          <span>{note.body} • {formatTime(note.createdAt)}</span>
                        </button>
                      )) : <p className="quiet">No notifications yet. Restock triggers, tracking actions, and helpful app messages will appear here.</p>}
                    </div>

                    <div className="history-card">
                      <div className="recent-title"><Activity size={16} /> Restock History <button onClick={clearRestockHistory}>Clear</button></div>
                      {restockHistory.length ? restockHistory.map((event) => (
                        <button key={event.id} onClick={() => void runSearch(event.sku)}>
                          <strong>{event.sku} • Size {event.size}</strong>
                          <span>{event.storeName} showed {event.status} at {formatTime(event.checkedAt)}</span>
                        </button>
                      )) : <p className="quiet">No restock triggers yet. History appears here when a watched size becomes visible.</p>}
                    </div>
                  </div>
                )}
                {activeView === "History" && (
                  <div className="history-screen">
                    <div className="history-actions">
                      <button onClick={clearHistory}><Trash2 size={15} /> Clear Search History</button>
                      <button onClick={() => handleNav("Search")}><Search size={15} /> New Search</button>
                    </div>
                    {recent.length ? recent.map((item) => (
                      <button className="history-row" key={item} onClick={() => void runSearch(item)}>
                        <History size={16} />
                        <span><strong>{item}</strong><small>Tap to run this search again</small></span>
                      </button>
                    )) : <EmptyState icon={<History size={28} />} title="History is empty" body="Recent searches will appear here after you run SKU or keyword searches." action={<button onClick={() => handleNav("Search")}>Go to search</button>} /> }
                  </div>
                )}
                {activeView === "Settings" && (
                  <>
                  <div className="install-card"><Smartphone size={18} /><div><strong>Mobile App Mode</strong><span>Install this site to your home screen. Notification permission: {notificationPermission}. Browser notifications fire when the app is open or supported by the browser.</span></div></div>
                  <div className="settings-grid">
                    <button onClick={installApp}><Smartphone size={16} /> Install App</button>
                    <button onClick={() => void requestNotificationPermission()}><Bell size={16} /> Enable Notifications</button>
                    <button onClick={toggleTheme}>Switch Display Mode</button>
                    <button onClick={() => setCompactMode((value) => !value)}>Toggle Compact Cards</button>
                    <button onClick={() => setAutoOpenResults((value) => !value)}>{autoOpenResults ? "Disable" : "Enable"} Auto-Open Results</button>
                    <button onClick={showDataPolicy}>Data Policy</button>
                    <button onClick={restartOnboarding}><Sparkles size={16} /> Replay Onboarding</button>
                    <button onClick={() => { handleNav("Admin"); void fetchAnalytics(); }}>Open Accuracy Dashboard</button>
                    <button onClick={() => handleNav("QA")}><ListChecks size={16} /> Open QA Center</button>
                    <button onClick={() => handleNav("Beta")}><MessageSquare size={16} /> Beta Launch Center</button>
                  </div>

                  <div className="settings-section">
                    <div className="recent-title"><Store size={16} /> Store Controls</div>
                    <p className="quiet">Disable a store if it is under maintenance. Disabled stores are skipped by search and do not get misread as sold out.</p>
                    <div className="store-toggle-grid">
                      {approvedStores.map((store) => {
                        const enabled = storePreferences.find((item) => item.storeId === store.id)?.enabled ?? true;
                        return <button key={store.id} className={enabled ? "store-toggle enabled" : "store-toggle disabled"} onClick={() => toggleStorePreference(store.id)}><strong>{store.name}</strong><span>{enabled ? "Enabled" : "Disabled"}</span></button>;
                      })}
                    </div>
                    <button className="muted-button" onClick={enableAllStores}>Enable All Stores</button>
                  </div>

                  <div className="settings-section">
                    <div className="recent-title"><Activity size={16} /> Performance Controls</div>
                    <div className="setting-stats">
                      <span>Rate limit: <strong>{rateLimitLabel}</strong></span>
                      <span>Cache TTL: <strong>{Math.round(SEARCH_CACHE_TTL_SECONDS / 60)} minutes</strong></span>
                      <span>Cache entries: <strong>{cacheSnapshot?.activeEntries ?? "—"}</strong></span>
                      <span>Cache checked: <strong>{cacheSnapshot ? formatTime(cacheSnapshot.generatedAt) : "—"}</strong></span>
                    </div>
                    <div className="settings-grid compact-settings">
                      <button onClick={() => void fetchCacheSnapshot()}>Refresh Cache Status</button>
                      <button onClick={() => void clearServerCache()}>Clear Server Cache</button>
                      <button onClick={clearHistory}>Clear Recent Searches</button>
                      <button onClick={resetLocalAppData}>Reset Local App Data</button>
                    </div>
                  </div>

                  <div className="settings-section">
                    <div className="recent-title"><History size={16} /> Exports</div>
                    <div className="settings-grid compact-settings">
                      <a className="settings-link-button" href="/api/admin/export/search-logs" target="_blank" rel="noreferrer">Export Search Logs CSV</a>
                      <button onClick={exportTrackedProductsCsv}>Export Tracked Products CSV</button>
                      <button onClick={exportAlertsCsv}>Export Alerts CSV</button>
                    </div>
                  </div>

                  <StoreStatusLegend />
                  <div className="qa-card">
                    <div className="recent-title"><ListChecks size={16} /> Mobile Pre-Launch QA</div>
                    <label><input type="checkbox" readOnly checked={Boolean(payload)} /> Search API returns without crashing</label>
                    <label><input type="checkbox" readOnly checked={results.length > 0} /> Store cards render after search</label>
                    <label><input type="checkbox" readOnly checked={Boolean(productImage)} /> Product image fallback is active</label>
                    <label><input type="checkbox" readOnly checked={enabledStoreCount > 0} /> At least one store is enabled</label>
                    <label><input type="checkbox" readOnly checked={notificationPermission === "granted"} /> Notifications enabled on this device</label>
                    <label><input type="checkbox" readOnly checked={trackedProducts.length > 0} /> At least one tracked product saved</label>
                    <label><input type="checkbox" readOnly checked={Boolean(cacheSnapshot)} /> Cache status has been checked</label>
                  </div>
                  </>
                )}


                {activeView === "Beta" && (
                  <div className="beta-launch-screen">
                    <div className="beta-hero">
                      <div>
                        <span className="eyebrow">Private Beta Candidate</span>
                        <h3>Hand this to testers with clear guardrails.</h3>
                        <p className="quiet">This center keeps feedback, known limitations, and real-world test searches in one place so future fixes are based on evidence instead of guessing.</p>
                      </div>
                      <button onClick={() => handleNav("Search")}><Search size={15} /> Run Search</button>
                    </div>
                    <PrivateBetaGuide />
                    <div className="beta-card">
                      <div className="beta-card-title"><ShieldCheck size={18} /> Store Expansion Readiness</div>
                      <p className="quiet">Check this before inviting testers or adding more stores. It does not change live search behavior.</p>
                      <button onClick={() => void fetchBetaReadiness()} disabled={betaReadinessLoading}>
                        <ListChecks size={15} /> {betaReadinessLoading ? "Checking…" : "Check Beta Readiness"}
                      </button>
                      {betaReadiness ? (
                        <>
                          <div className="admin-kpis compact-kpis">
                            <KpiCard tone={betaReadiness.score >= 90 ? "green" : betaReadiness.score >= 75 ? "gold" : "red"} icon={<ShieldCheck size={17} />} label="Readiness" value={`${betaReadiness.score}%`} note={betaReadiness.status} />
                            <KpiCard icon={<Store size={17} />} label="Stores Enabled" value={`${enabledStoreCount}/${approvedStores.length}`} note="Before scaling" />
                            <KpiCard icon={<CalendarDays size={17} />} label="Upcoming" value={upcomingReleases.length} note="Future releases only" />
                          </div>
                          <p className="quiet">{betaReadiness.recommendation}</p>
                          <div className="qa-card beta-checklist">
                            {betaReadiness.checks.map((check) => (
                              <label key={check.label}><input type="checkbox" readOnly checked={check.passed} /> {check.label}: {check.detail}</label>
                            ))}
                          </div>
                        </>
                      ) : <p className="quiet">Run the check to confirm store, catalog, release, packaging, and safety guardrails.</p>}
                    </div>
                    <BetaFeedbackForm currentQuery={sku} resolvedSku={payload?.resolvedSku || normalized} onSubmitted={() => showNotice("Beta feedback saved")} />
                    <KnownLimitations />
                    <BetaTestSheet onRunSearch={(query) => void runSearch(query)} />
                    <div className="beta-card">
                      <div className="beta-card-title"><ListChecks size={18} /> Deployment Checklist</div>
                      <div className="qa-card beta-checklist">
                        <label><input type="checkbox" readOnly checked={Boolean(payload)} /> Run at least one exact SKU search</label>
                        <label><input type="checkbox" readOnly checked={results.length > 0} /> Confirm store cards render</label>
                        <label><input type="checkbox" readOnly checked={enabledStoreCount > 0} /> Confirm stores are enabled</label>
                        <label><input type="checkbox" readOnly checked={Boolean(productImage)} /> Confirm image fallback works</label>
                        <label><input type="checkbox" readOnly checked={Boolean(cacheSnapshot)} /> Check cache status from Settings/Admin</label>
                        <label><input type="checkbox" readOnly checked={Boolean(adapterTest)} /> Run store health check</label>
                        <label><input type="checkbox" readOnly checked={Boolean(betaReadiness)} /> Run beta readiness check</label>
                      </div>
                    </div>
                  </div>
                )}

                {activeView === "QA" && (
                  <QualityAssuranceCenter
                    onRunSearch={(query) => void runSearch(query)}
                    onOpenAdmin={() => { handleNav("Admin"); void fetchAnalytics(); }}
                    onOpenSettings={() => handleNav("Settings")}
                  />
                )}
                {activeView === "Admin" && (
                  <div className="admin-dashboard">
                    <div className="admin-actions">
                      <button onClick={() => { void fetchAnalytics(); void fetchMonitoring(); }} disabled={analyticsLoading || monitoringLoading}>{analyticsLoading || monitoringLoading ? "Refreshing…" : "Refresh Dashboard"}</button>
                      <button onClick={() => void runAdapterTest()} disabled={adapterTestLoading}>{adapterTestLoading ? "Checking Stores…" : "Run Store Check"}</button>
                      <button onClick={() => void fetchMonitoring()} disabled={monitoringLoading}>{monitoringLoading ? "Monitoring…" : "Production Monitor"}</button>
                      <button onClick={() => void fetchCacheSnapshot()}>Cache Status</button>
                      <a className="settings-link-button" href="/api/admin/export/search-logs" target="_blank" rel="noreferrer">Export Logs CSV</a>
                      <button onClick={() => void resetDashboard()} disabled={analyticsLoading}>Reset Session Stats</button>
                    </div>

                    <div className="admin-kpis">
                      <KpiCard tone="green" icon={<Search size={19} />} label="Searches" value={analytics?.totals.totalSearches ?? 0} note="This session" />
                      <KpiCard tone="green" icon={<Target size={19} />} label="Match Rate" value={`${analytics?.totals.matchRate ?? 0}%`} note="Across store lookups" />
                      <KpiCard tone="gold" icon={<Activity size={19} />} label="Cache Rate" value={`${analytics?.totals.cacheRate ?? 0}%`} note={`${analytics?.totals.cacheHits ?? 0} hits`} />
                      <KpiCard tone="red" icon={<ShieldCheck size={19} />} label="Unavailable" value={`${analytics?.totals.unavailableRate ?? 0}%`} note="Not counted as sold out" />
                      <KpiCard icon={<Layers3 size={19} />} label="Tracked" value={trackedProducts.length} note="This device" />
                      <KpiCard icon={<Bell size={19} />} label="Alerts" value={alerts.length} note={`${restockHistory.length} triggered history`} />
                    </div>

                    <div className="health-table-wrap">
                      <div className="recent-title"><Activity size={16} /> Production Monitoring</div>
                      {monitoring ? (
                        <>
                          <div className="admin-kpis compact-kpis">
                            <KpiCard tone={monitoring.risk.level === "Stable" ? "green" : "gold"} icon={<ShieldCheck size={17} />} label="Risk" value={monitoring.risk.level} note={monitoring.risk.note} />
                            <KpiCard tone="green" icon={<Store size={17} />} label="Healthy Stores" value={`${monitoring.stores.healthy}/${monitoring.stores.total}`} note={`${monitoring.stores.needsReview} need review`} />
                            <KpiCard tone="gold" icon={<Search size={17} />} label="Lookup Unavailable" value={`${monitoring.search.lookupUnavailableRate}%`} note="Never counted as sold out" />
                            <KpiCard icon={<Bell size={17} />} label="Notification Engine" value={monitoring.alerts.status} note={monitoring.alerts.mode} />
                            <KpiCard icon={<CalendarDays size={17} />} label="Upcoming Releases" value={monitoring.releases.upcomingCount} note={monitoring.releases.nextRelease?.title || "No dated future releases"} />
                            <KpiCard icon={<Layers3 size={17} />} label="Catalog" value={monitoring.catalog.totalProducts} note={`${monitoring.catalog.aliasCount} aliases`} />
                          </div>
                          <p className="quiet">{monitoring.alerts.delivery}</p>
                        </>
                      ) : <p className="quiet">Refresh Production Monitor to see search health, store risk, catalog coverage, release readiness, and notification status.</p>}
                    </div>

                    <div className="health-table-wrap">
                      <div className="recent-title"><Store size={16} /> Store Health</div>
                      <table className="health-table">
                        <thead>
                          <tr><th>Store</th><th>Health</th><th>Lookups</th><th>Available</th><th>No Match</th><th>Unavailable</th><th>Last</th></tr>
                        </thead>
                        <tbody>
                          {(analytics?.storeHealth || []).map((store) => (
                            <tr key={store.storeId}>
                              <td><strong>{store.storeName}</strong><span>{store.city}</span></td>
                              <td><span className={`health-pill health-${store.health.toLowerCase().replaceAll(" ", "-")}`}>{store.health}</span></td>
                              <td>{store.totalLookups}</td>
                              <td>{store.available}</td>
                              <td>{store.noMatch}</td>
                              <td>{store.unavailable}</td>
                              <td>{store.lastChecked ? formatTime(store.lastChecked) : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="health-table-wrap">
                      <div className="recent-title"><ListChecks size={16} /> Live Adapter Test {adapterTest ? `• ${adapterTest.query}` : ""}</div>
                      {adapterTest ? (
                        <>
                          <div className="admin-kpis compact-kpis">
                            <KpiCard tone="green" icon={<Store size={17} />} label="Checked" value={adapterTest.totals.storesChecked} />
                            <KpiCard tone="green" icon={<ShieldCheck size={17} />} label="Matches" value={adapterTest.totals.productMatches} />
                            <KpiCard tone="red" icon={<XCircle size={17} />} label="Sold Out" value={adapterTest.totals.confirmedSoldOut} />
                            <KpiCard tone="gold" icon={<AlertTriangle size={17} />} label="Unavailable" value={adapterTest.totals.lookupUnavailable} note="Not sold out" />
                          </div>
                          <table className="health-table">
                            <thead>
                              <tr><th>Store</th><th>Result</th><th>Reliability</th><th>Sizes</th><th>Time</th><th>Product</th><th>Trust Note</th></tr>
                            </thead>
                            <tbody>
                              {adapterTest.results.map((item) => (
                                <tr key={item.storeId}>
                                  <td><strong>{item.storeName}</strong><span>{item.city}</span></td>
                                  <td><span className={`health-pill ${item.ok ? "health-healthy" : "health-needs-review"}`}>{item.label}</span></td>
                                  <td><span className={`health-pill ${item.healthLabel === "Excellent" || item.healthLabel === "Healthy" ? "health-healthy" : "health-needs-review"}`}>{item.healthScore ?? "—"}{typeof item.healthScore === "number" ? "%" : ""}</span></td>
                                  <td>{item.sizeVisibility || "—"}</td>
                                  <td>{item.durationMs}ms</td>
                                  <td>{item.productTitle}</td>
                                  <td><span>{item.trustNote}</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </>
                      ) : <p className="quiet">Run Store Check to test each live adapter without confusing lookup failures with sold out inventory.</p>}
                    </div>

                    <div className="recent-log">
                      <div className="recent-title"><History size={16} /> Recent Search Log</div>
                      {analytics?.recentSearches.length ? analytics.recentSearches.slice(0, 10).map((entry) => (
                        <button key={entry.id} onClick={() => void runSearch(entry.query)}>
                          <strong>{entry.query}</strong>
                          <span>{entry.productTitle} • {entry.matchesFound} matches • {entry.unavailableCount} unavailable • {entry.cacheHit ? "cached" : "fresh"}</span>
                        </button>
                      )) : <p className="quiet">Run searches to populate dashboard logs.</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="detail-panel panel-shell">
            <div className="detail-top">
              <div className="detail-image"><img className="product-image" src={productImage} alt={productTitle} /></div>
              <div className="detail-summary">
                <div className={`detail-badge ${matchClass(product?.matchLevel)}`}><ShieldCheck size={13} /> {productMatchLevel}</div>
                <h2>{productTitle}</h2>
                <h3>{normalized}</h3>
                <p>{selectedResult ? `${selectedResult.storeName} • ${selectedResult.city}` : "Search a SKU, vendor code, or product keyword to resolve matching product data."}</p>
                <div className="product-meta">
                  <span>Brand: {product?.brand || "—"}</span>
                  <span>Colorway: {product?.colorway || "—"}</span>
                  <span>MSRP: {product?.msrp || product?.price || selectedResult?.price || "—"}</span>
                  <span>Release: {product?.releaseDate || "—"}</span>
                  <span>Category: {product?.category || "—"}</span>
                  <span>Confidence: {product?.confidenceScore ? `${product.confidenceScore}%` : "—"}</span>
                </div>
              </div>
            </div>

            <div className="confidence-box">
              <div><ShieldCheck size={20} /><strong>{productMatchLevel}</strong></div>
              <p>{coverageConfidence.note} {intelligence?.recommendation || selectedResult?.note || "Results use public product pages and visible stock indicators only."}</p>
            </div>

            <div className="sizes-card">
              <span className="small-label">Available Sizes</span>
              <SizeList sizes={selectedResult?.sizes || []} availability={selectedResult?.sizeAvailability} />
            </div>

            <div className="alert-builder">
              <div>
                <span className="small-label">Restock Watch</span>
                <p>Choose a size to watch. Lookup unavailable results are never counted as sold out.</p>
              </div>
              <select value={alertSize} onChange={(event) => setAlertSize(event.target.value)}>
                {alertSizeOptions.map((size) => <option key={size}>{size}</option>)}
              </select>
            </div>

            <div className="action-grid">
              <a className="action muted" href={selectedResult?.phone ? `tel:${selectedResult.phone}` : "#"} onClick={(event) => { if (!selectedResult?.phone) { event.preventDefault(); showNotice("Select a store with a phone number first"); } }}><Phone size={18} />{selectedResult?.phone || "Store Phone"}</a>
              <a className="action cream" href={selectedResult?.productUrl || "#"} target="_blank" rel="noreferrer" onClick={(event) => { if (!selectedResult?.productUrl) { event.preventDefault(); showNotice("Search first to open a source page"); } }}><ExternalLink size={18} />Open Source Page</a>
              <button className="action muted" onClick={saveFavorite}><Heart size={18} />Favorite</button>
              <button className="action muted" onClick={trackProduct}><ShoppingBag size={18} />Track Product</button>
              <button className="action green" onClick={saveAlert}><Bell size={18} />Save Size Alert</button>
            </div>

            <p className="policy-note">All data is publicly available information only. We do not bypass logins, cart holds, or checkout.</p>
          </div>
        </section>
      </section>
    </main>
  );
}
