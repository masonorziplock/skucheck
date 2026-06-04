import { NextResponse } from "next/server";
import { getUpcomingReleases } from "@/lib/release-calendar";
import { buildReleaseNotification, getReleaseNotificationStatus } from "@/lib/notification-engine";

export async function GET() {
  const previews = getUpcomingReleases()
    .map((release) => {
      const status = getReleaseNotificationStatus(release.releaseDate);
      return { release, status, notification: buildReleaseNotification(release, status) };
    })
    .filter((item) => item.status.shouldNotify);

  return NextResponse.json({ generatedAt: new Date().toISOString(), previews });
}
