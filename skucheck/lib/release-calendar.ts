export type ReleaseCalendarItem = {
  sku: string;
  title: string;
  brand: string;
  colorway: string;
  msrp: string;
  releaseDate: string;
  category: string;
  image: string;
  priority: "High" | "Medium" | "Watch";
  aliases: string[];
};

export const releaseCalendar: ReleaseCalendarItem[] = [
  {
    sku: "IB6714-100",
    title: "Air Jordan 4 Retro White Cement",
    brand: "Jordan",
    colorway: "Summit White / Fire Red / Tech Grey / Black",
    msrp: "$225",
    releaseDate: "2025-05-24",
    category: "Sneaker",
    image: "/shoe-fallback.svg",
    priority: "High",
    aliases: ["white cement 4", "jordan 4 white cement", "air jordan 4 white cement"],
  },
  {
    sku: "HV0823-100",
    title: "Air Jordan 1 High OG Rare Air",
    brand: "Jordan",
    colorway: "Sail / Cinnabar / Light Bone",
    msrp: "$180",
    releaseDate: "2025-06-01",
    category: "Sneaker",
    image: "/shoe-fallback.svg",
    priority: "Medium",
    aliases: ["rare air jordan 1", "jordan 1 rare air", "rare air 1"],
  },
  {
    sku: "HJ9337-106",
    title: "Air Jordan 3 Retro Seoul 2.0",
    brand: "Jordan",
    colorway: "White / Soar / Atom Red",
    msrp: "$200",
    releaseDate: "2025-05-17",
    category: "Sneaker",
    image: "/shoe-fallback.svg",
    priority: "Watch",
    aliases: ["seoul 3", "jordan 3 seoul", "air jordan 3 seoul"],
  },
  {
    sku: "HF3053-001",
    title: "Nike SB Dunk Low Pro Black / White Gum",
    brand: "Nike SB",
    colorway: "Black / White / Gum Light Brown",
    msrp: "$115",
    releaseDate: "Core Style",
    category: "Sneaker",
    image: "/shoe-fallback.svg",
    priority: "Watch",
    aliases: ["black gum dunk", "sb dunk black gum", "nike sb dunk gum"],
  },
  {
    sku: "U990GR4",
    title: "New Balance 990v4 Grey",
    brand: "New Balance",
    colorway: "Grey",
    msrp: "$185",
    releaseDate: "Core Style",
    category: "Sneaker",
    image: "/shoe-fallback.svg",
    priority: "Watch",
    aliases: ["new balance 990", "990v4 grey", "nb 990 grey"],
  },
];

function startOfToday(referenceDate = new Date()) {
  return new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
}

export function parseReleaseDate(value: string): Date | null {
  if (!value || value === "Core Style" || value === "TBD") return null;
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isFutureRelease(release: ReleaseCalendarItem, referenceDate = new Date()): boolean {
  const parsed = parseReleaseDate(release.releaseDate);
  if (!parsed) return false;
  return parsed.getTime() > startOfToday(referenceDate).getTime();
}

export function getUpcomingReleases(referenceDate = new Date()): ReleaseCalendarItem[] {
  return releaseCalendar
    .filter((release) => isFutureRelease(release, referenceDate))
    .sort((a, b) => {
      const aDate = parseReleaseDate(a.releaseDate)?.getTime() || Number.MAX_SAFE_INTEGER;
      const bDate = parseReleaseDate(b.releaseDate)?.getTime() || Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    });
}

export function wasReleasedToday(release: ReleaseCalendarItem, referenceDate = new Date()): boolean {
  const parsed = parseReleaseDate(release.releaseDate);
  if (!parsed) return false;
  return parsed.getTime() === startOfToday(referenceDate).getTime();
}
