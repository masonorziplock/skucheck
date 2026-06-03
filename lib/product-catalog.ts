import { isLikelySku, normalizeSku } from "@/lib/sku";

export type ProductCatalogItem = {
  sku: string;
  title: string;
  brand: string;
  colorway: string;
  category: string;
  msrp: string;
  releaseDate: string;
  image: string;
  aliases: string[];
};

export const productCatalog: ProductCatalogItem[] = [
  {
    sku: "HF4198-001",
    title: "Nike SB Dunk Low Pro",
    brand: "Nike SB",
    colorway: "Black / White",
    category: "Sneaker",
    msrp: "$115",
    releaseDate: "TBD",
    image: "/shoe-fallback.svg",
    aliases: ["sb dunk", "nike sb dunk", "dunk low pro", "hf4198", "hf4198-001"],
  },
  {
    sku: "DZ5485-400",
    title: "Air Jordan 1 High OG",
    brand: "Jordan",
    colorway: "Royal / Black / White",
    category: "Sneaker",
    msrp: "$180",
    releaseDate: "TBD",
    image: "/shoe-fallback.svg",
    aliases: ["jordan 1", "air jordan 1", "aj1", "high og", "dz5485", "dz5485-400"],
  },
  {
    sku: "CW2288-111",
    title: "Nike Air Force 1 '07",
    brand: "Nike",
    colorway: "White / White",
    category: "Sneaker",
    msrp: "$115",
    releaseDate: "Core Style",
    image: "/shoe-fallback.svg",
    aliases: ["air force 1", "af1", "white air force", "white af1", "cw2288", "cw2288-111"],
  },
  {
    sku: "U990GR4",
    title: "New Balance 990v4",
    brand: "New Balance",
    colorway: "Grey",
    category: "Sneaker",
    msrp: "$185",
    releaseDate: "Core Style",
    image: "/shoe-fallback.svg",
    aliases: ["new balance 990", "990v4", "nb 990", "grey 990", "u990gr4"],
  },
  {
    sku: "CU1110-010",
    title: "Air Jordan 4 Retro Black Cat",
    brand: "Jordan",
    colorway: "Black / Black / Light Graphite",
    category: "Sneaker",
    msrp: "$190",
    releaseDate: "2020-01-22",
    image: "/shoe-fallback.svg",
    aliases: ["black cat 4", "jordan 4 black cat", "air jordan 4 black cat", "cu1110", "cu1110-010"],
  },
  {
    sku: "FV5029-141",
    title: "Air Jordan 4 Retro Military Blue",
    brand: "Jordan",
    colorway: "Off-White / Military Blue / Neutral Grey",
    category: "Sneaker",
    msrp: "$215",
    releaseDate: "2024-05-04",
    image: "/shoe-fallback.svg",
    aliases: ["military blue 4", "jordan 4 military blue", "air jordan 4 military blue", "fv5029", "fv5029-141"],
  },
  {
    sku: "DZ4137-106",
    title: "Air Jordan 1 Low OG SP Travis Scott Olive",
    brand: "Jordan",
    colorway: "Sail / University Red / Black / Medium Olive",
    category: "Sneaker",
    msrp: "$150",
    releaseDate: "2023-04-26",
    image: "/shoe-fallback.svg",
    aliases: ["travis scott olive", "travis olive", "jordan 1 low olive", "travis scott jordan 1 low olive", "dz4137", "dz4137-106"],
  },
];

function compact(value: string) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizedWords(value: string) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function scoreCatalogItem(query: string, item: ProductCatalogItem) {
  const normalized = normalizedWords(query);
  const compacted = compact(query);
  const sku = isLikelySku(query) ? normalizeSku(query) : "";
  if (sku && normalizeSku(item.sku) === sku) return 100;
  if (compact(item.sku) === compacted) return 98;
  if (compact(item.title) === compacted) return 95;

  let best = 0;
  for (const alias of item.aliases) {
    const aliasWords = normalizedWords(alias);
    const aliasCompact = compact(alias);
    if (!aliasWords) continue;
    if (aliasCompact === compacted) best = Math.max(best, 92);
    else if (normalized.includes(aliasWords)) best = Math.max(best, 86);
    else if (aliasWords.includes(normalized)) best = Math.max(best, 78);
    else {
      const queryTokens = new Set(normalized.split(" ").filter(Boolean));
      const aliasTokens = aliasWords.split(" ").filter(Boolean);
      const overlap = aliasTokens.filter((token) => queryTokens.has(token)).length;
      if (overlap) best = Math.max(best, Math.round((overlap / aliasTokens.length) * 70));
    }
  }
  return best;
}

export function resolveCatalogProduct(query: string): ProductCatalogItem | null {
  const ranked = productCatalog
    .map((item) => ({ item, score: scoreCatalogItem(query, item) }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score >= 70 ? ranked[0].item : null;
}

export function searchCatalog(query: string, limit = 8) {
  return productCatalog
    .map((item) => ({ ...item, score: scoreCatalogItem(query, item) }))
    .filter((item) => item.score >= 35)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
