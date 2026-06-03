export type StockStatus =
  | "In Stock"
  | "Low Stock"
  | "Sold Out"
  | "Product Found"
  | "No Match"
  | "Unavailable"
  | "Unknown";

export type Confidence = "High" | "Medium" | "Low";
export type ProductMatchLevel = "Verified Match" | "Product Found" | "Store Search Only" | "No Match";

export type ProductCandidate = {
  title: string;
  sku: string;
  image?: string;
  productUrl?: string;
  price?: string;
  sourceStore?: string;
  confidence: Confidence;
};

export type ProductSummary = {
  query: string;
  resolvedSku: string;
  title: string;
  image: string;
  price: string;
  sourceStore: string;
  confidence: Confidence;
  brand: string;
  colorway: string;
  msrp: string;
  releaseDate: string;
  category: string;
  matchLevel: ProductMatchLevel;
  confidenceScore: number;
};

export type ProductIntelligence = {
  brand: string;
  colorway: string;
  msrp: string;
  releaseDate: string;
  category: string;
  matchLevel: ProductMatchLevel;
  confidenceScore: number;
  storesChecked: number;
  matchesFound: number;
  availableCount: number;
  soldOutCount: number;
  hiddenInventoryCount: number;
  recommendation: string;
};

export type ApprovedStore = {
  id: string;
  name: string;
  city: string;
  phone: string;
  website: string;
  platform: "Shopify" | "Custom" | "Other";
  tier: string;
  onlineSales: boolean;
  active: boolean;
};

export type SizeAvailability = {
  size: string;
  available: boolean | null;
  label: "Available" | "Sold Out" | "Hidden" | "Unknown";
};

export type StoreSearchResult = {
  storeId: string;
  sku: string;
  productTitle: string;
  status: StockStatus;
  sizes: string[];
  sizeAvailability?: SizeAvailability[];
  price: string;
  productUrl: string;
  checkedAt: string;
  confidence: Confidence;
  note?: string;
  productImage?: string;
  matchedSku?: string;
};

export type HydratedSearchResult = StoreSearchResult & {
  storeName: string;
  city: string;
  phone: string;
  website: string;
  platform: string;
  tier: string;
};

export type SearchPayload = {
  query: string;
  normalizedSku: string;
  resolvedSku: string;
  product: ProductSummary;
  intelligence: ProductIntelligence;
  results: HydratedSearchResult[];
  checkedAt: string;
  cache: {
    hit: boolean;
    ttlSeconds: number;
  };
};
