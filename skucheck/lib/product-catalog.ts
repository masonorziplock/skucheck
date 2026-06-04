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

  {
    sku: "IB6714-100",
    title: "Air Jordan 4 Retro White Cement",
    brand: "Jordan",
    colorway: "Summit White / Fire Red / Tech Grey / Black",
    category: "Sneaker",
    msrp: "$225",
    releaseDate: "2025-05-24",
    image: "/shoe-fallback.svg",
    aliases: ["white cement 4", "jordan 4 white cement", "air jordan 4 white cement", "ib6714", "ib6714-100"],
  },
  {
    sku: "HV0823-100",
    title: "Air Jordan 1 High OG Rare Air",
    brand: "Jordan",
    colorway: "Sail / Cinnabar / Light Bone",
    category: "Sneaker",
    msrp: "$180",
    releaseDate: "2025-06-01",
    image: "/shoe-fallback.svg",
    aliases: ["rare air jordan 1", "jordan 1 rare air", "rare air 1", "hv0823", "hv0823-100"],
  },
  {
    sku: "HJ9337-106",
    title: "Air Jordan 3 Retro Seoul 2.0",
    brand: "Jordan",
    colorway: "White / Soar / Atom Red",
    category: "Sneaker",
    msrp: "$200",
    releaseDate: "2025-05-17",
    image: "/shoe-fallback.svg",
    aliases: ["seoul 3", "jordan 3 seoul", "air jordan 3 seoul", "hj9337", "hj9337-106"],
  },
  {
    sku: "HF3053-001",
    title: "Nike SB Dunk Low Pro Black / White Gum",
    brand: "Nike SB",
    colorway: "Black / White / Gum Light Brown",
    category: "Sneaker",
    msrp: "$115",
    releaseDate: "Core Style",
    image: "/shoe-fallback.svg",
    aliases: ["black gum dunk", "sb dunk black gum", "nike sb dunk gum", "hf3053", "hf3053-001"],
  },
  {
    sku: "DV1748-601",
    title: "Nike SB Dunk Low Yuto Horigome",
    brand: "Nike SB",
    colorway: "Wolf Grey / Iron Grey / Sail",
    category: "Sneaker",
    msrp: "$130",
    releaseDate: "2023-08-25",
    image: "/shoe-fallback.svg",
    aliases: ["yuto dunk", "yuto sb", "yuto horigome", "nike sb yuto", "dv1748", "dv1748-601"],
  },
  {
    sku: "CT8532-106",
    title: "Air Jordan 3 Retro White Cement Reimagined",
    brand: "Jordan",
    colorway: "Summit White / Fire Red / Black / Cement Grey",
    category: "Sneaker",
    msrp: "$210",
    releaseDate: "2023-03-11",
    image: "/shoe-fallback.svg",
    aliases: ["white cement 3", "jordan 3 white cement", "reimagined 3", "cement 3", "ct8532", "ct8532-106"],
  },
  {
    sku: "FV5029-006",
    title: "Air Jordan 4 Retro Bred Reimagined",
    brand: "Jordan",
    colorway: "Black / Fire Red / Cement Grey / Summit White",
    category: "Sneaker",
    msrp: "$215",
    releaseDate: "2024-02-17",
    image: "/shoe-fallback.svg",
    aliases: ["bred 4", "jordan 4 bred", "bred reimagined", "air jordan 4 bred reimagined", "fv5029-006"],
  },
  {
    sku: "CT8012-170",
    title: "Air Jordan 11 Retro Gratitude",
    brand: "Jordan",
    colorway: "White / Black / Metallic Gold",
    category: "Sneaker",
    msrp: "$230",
    releaseDate: "2023-12-09",
    image: "/shoe-fallback.svg",
    aliases: ["gratitude 11", "jordan 11 gratitude", "dmp 11", "jordan 11 dmp", "ct8012", "ct8012-170"],
  },
  {
    sku: "FZ8117-100",
    title: "Nike Kobe 4 Protro Girl Dad",
    brand: "Nike Basketball",
    colorway: "Bicoastal / Black / Metallic Silver",
    category: "Sneaker",
    msrp: "$190",
    releaseDate: "2024-06-07",
    image: "/shoe-fallback.svg",
    aliases: ["girl dad kobe", "kobe 4 girl dad", "kobe protro girl dad", "fz8117", "fz8117-100"],
  },
  {
    sku: "FQ3545-300",
    title: "Nike Kobe 6 Protro Reverse Grinch",
    brand: "Nike Basketball",
    colorway: "Bright Crimson / Black / Electric Green",
    category: "Sneaker",
    msrp: "$180",
    releaseDate: "2023-12-16",
    image: "/shoe-fallback.svg",
    aliases: ["reverse grinch", "kobe 6 reverse grinch", "kobe reverse grinch", "fq3545", "fq3545-300"],
  },
  {
    sku: "DD1391-100",
    title: "Nike Dunk Low Retro Panda",
    brand: "Nike",
    colorway: "White / Black",
    category: "Sneaker",
    msrp: "$115",
    releaseDate: "Core Style",
    image: "/shoe-fallback.svg",
    aliases: ["panda dunk", "dunk low panda", "black white dunk", "dd1391", "dd1391-100"],
  },
  {
    sku: "BB550PB1",
    title: "New Balance 550 White Green",
    brand: "New Balance",
    colorway: "White / Green",
    category: "Sneaker",
    msrp: "$110",
    releaseDate: "Core Style",
    image: "/shoe-fallback.svg",
    aliases: ["new balance 550", "nb 550", "550 green", "bb550", "bb550pb1"],
  },
  {
    sku: "U9060GRY",
    title: "New Balance 9060 Grey",
    brand: "New Balance",
    colorway: "Grey",
    category: "Sneaker",
    msrp: "$150",
    releaseDate: "Core Style",
    image: "/shoe-fallback.svg",
    aliases: ["new balance 9060", "nb 9060", "9060 grey", "u9060", "u9060gry"],
  },
  {
    sku: "U991GL2",
    title: "New Balance 991v2 Made in UK Grey",
    brand: "New Balance",
    colorway: "Grey",
    category: "Sneaker",
    msrp: "$250",
    releaseDate: "Core Style",
    image: "/shoe-fallback.svg",
    aliases: ["991v2", "new balance 991v2", "nb 991v2", "made in uk 991", "u991gl2"],
  },
  {
    sku: "ID2047",
    title: "adidas Samba OG Black White Gum",
    brand: "adidas",
    colorway: "Core Black / Cloud White / Gum",
    category: "Sneaker",
    msrp: "$100",
    releaseDate: "Core Style",
    image: "/shoe-fallback.svg",
    aliases: ["samba", "adidas samba", "samba og", "black samba", "id2047"],
  },
  {
    sku: "B75806",
    title: "adidas Samba OG White Black Gum",
    brand: "adidas",
    colorway: "Cloud White / Core Black / Gum",
    category: "Sneaker",
    msrp: "$100",
    releaseDate: "Core Style",
    image: "/shoe-fallback.svg",
    aliases: ["white samba", "samba white", "adidas samba white", "samba og white", "b75806"],
  },
  {
    sku: "IG6199",
    title: "adidas Gazelle Indoor Blue Bird",
    brand: "adidas",
    colorway: "Blue Bird / Cloud White / Gum",
    category: "Sneaker",
    msrp: "$120",
    releaseDate: "Core Style",
    image: "/shoe-fallback.svg",
    aliases: ["gazelle indoor", "blue gazelle", "adidas gazelle", "gazelle blue bird", "ig6199"],
  },
  {
    sku: "IF1863",
    title: "adidas Campus 00s Core Black",
    brand: "adidas",
    colorway: "Core Black / Cloud White / Off White",
    category: "Sneaker",
    msrp: "$110",
    releaseDate: "Core Style",
    image: "/shoe-fallback.svg",
    aliases: ["campus 00s", "adidas campus", "black campus", "campus core black", "if1863"],
  },
  {
    sku: "1201A019-108",
    title: "ASICS GEL-Kayano 14 Cream Black Metallic Plum",
    brand: "ASICS",
    colorway: "Cream / Black / Metallic Plum",
    category: "Sneaker",
    msrp: "$150",
    releaseDate: "Core Style",
    image: "/shoe-fallback.svg",
    aliases: ["gel kayano 14", "kayano 14", "asics kayano", "cream black kayano", "1201a019", "1201A019-108"],
  },
  {
    sku: "1203A342-020",
    title: "ASICS GEL-NYC Graphite Grey",
    brand: "ASICS",
    colorway: "Graphite Grey / Black",
    category: "Sneaker",
    msrp: "$130",
    releaseDate: "Core Style",
    image: "/shoe-fallback.svg",
    aliases: ["gel nyc", "asics gel nyc", "graphite gel nyc", "1203a342", "1203A342-020"],
  },
  {
    sku: "S70757-1",
    title: "Saucony ProGrid Omni 9 Silver Black",
    brand: "Saucony",
    colorway: "Silver / Black",
    category: "Sneaker",
    msrp: "$150",
    releaseDate: "Core Style",
    image: "/shoe-fallback.svg",
    aliases: ["progrid omni 9", "saucony omni", "omni 9", "s70757", "s70757-1"],
  },
  {
    sku: "S70811-1",
    title: "Saucony Grid Shadow 2 Cream Navy",
    brand: "Saucony",
    colorway: "Cream / Navy",
    category: "Sneaker",
    msrp: "$150",
    releaseDate: "Core Style",
    image: "/shoe-fallback.svg",
    aliases: ["grid shadow 2", "saucony grid shadow", "shadow 2 saucony", "s70811", "s70811-1"],
  },
  {
    sku: "DM7866-162",
    title: "Air Jordan 1 Low OG Howard University",
    brand: "Jordan",
    colorway: "White / Gym Red / Midnight Navy",
    category: "Sneaker",
    msrp: "$140",
    releaseDate: "2024-10-12",
    image: "/shoe-fallback.svg",
    aliases: ["howard jordan 1", "howard 1 low", "jordan 1 low howard", "dm7866", "dm7866-162"],
  },
  {
    sku: "FZ3124-200",
    title: "Air Jordan 1 Low OG Travis Scott Velvet Brown",
    brand: "Jordan",
    colorway: "Dark Mocha / Black / Velvet Brown",
    category: "Sneaker",
    msrp: "$150",
    releaseDate: "2024-12-21",
    image: "/shoe-fallback.svg",
    aliases: ["travis velvet brown", "velvet brown jordan 1", "travis scott velvet brown", "fz3124", "fz3124-200"],
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

export function getCatalogStats() {
  const byBrand = productCatalog.reduce<Record<string, number>>((acc, item) => {
    acc[item.brand] = (acc[item.brand] || 0) + 1;
    return acc;
  }, {});

  const byCategory = productCatalog.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const aliasCount = productCatalog.reduce((sum, item) => sum + item.aliases.length, 0);
  return {
    totalProducts: productCatalog.length,
    aliasCount,
    byBrand,
    byCategory,
    generatedAt: new Date().toISOString(),
  };
}
