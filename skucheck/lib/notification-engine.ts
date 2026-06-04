import type { ReleaseCalendarItem } from "@/lib/release-calendar";
import { parseReleaseDate } from "@/lib/release-calendar";

export type ReleaseNotificationKind = "upcoming" | "soon" | "today" | "past" | "unknown";

export type ReleaseNotificationStatus = {
  kind: ReleaseNotificationKind;
  daysUntil: number | null;
  label: string;
  shouldNotify: boolean;
};

export function getReleaseNotificationStatus(releaseDate: string, referenceDate = new Date()): ReleaseNotificationStatus {
  const parsed = parseReleaseDate(releaseDate);
  if (!parsed) return { kind: "unknown", daysUntil: null, label: "No dated release", shouldNotify: false };

  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const releaseDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const daysUntil = Math.ceil((releaseDay.getTime() - today.getTime()) / 86400000);

  if (daysUntil < 0) return { kind: "past", daysUntil, label: "Released", shouldNotify: false };
  if (daysUntil === 0) return { kind: "today", daysUntil, label: "Release day", shouldNotify: true };
  if (daysUntil <= 3) return { kind: "soon", daysUntil, label: `${daysUntil} day${daysUntil === 1 ? "" : "s"} away`, shouldNotify: true };
  return { kind: "upcoming", daysUntil, label: `${daysUntil} days away`, shouldNotify: false };
}

export function buildReleaseNotification(release: ReleaseCalendarItem, status = getReleaseNotificationStatus(release.releaseDate)) {
  const title = status.kind === "today" ? "Coverage starts today" : "Release coming soon";
  const body = status.kind === "today"
    ? `${release.title} releases today. Open coverage and check stores.`
    : `${release.title} releases in ${status.daysUntil} day${status.daysUntil === 1 ? "" : "s"}.`;

  return { title, body, sku: release.sku, releaseDate: release.releaseDate };
}
