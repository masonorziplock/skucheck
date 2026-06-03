export type BetaTestSku = {
  query: string;
  expected: string;
  purpose: string;
};

export const betaTestSkus: BetaTestSku[] = [
  { query: "HF4198-001", expected: "Product metadata or verified no-match state", purpose: "Exact Nike/Jordan-style SKU" },
  { query: "hf4198001", expected: "Normalizes to HF4198-001", purpose: "SKU normalization" },
  { query: "DZ5485-400", expected: "Jordan 1 product family or no-match with store visibility", purpose: "Known Jordan SKU pattern" },
  { query: "Black Cat 4", expected: "Smart search should resolve to an Air Jordan 4 Black Cat SKU candidate", purpose: "Alias search" },
  { query: "Military Blue 4", expected: "Smart search should resolve to an Air Jordan 4 Military Blue SKU candidate", purpose: "Keyword-to-product matching" },
  { query: "Travis Scott Olive", expected: "Smart search should resolve to a Travis Scott Jordan product candidate", purpose: "Collaboration alias search" },
  { query: "SB Dunk", expected: "Returns a product candidate or store search-only results", purpose: "Broad keyword behavior" },
  { query: "New Balance 990", expected: "Returns product candidate or clean no-match states", purpose: "Non-Nike keyword behavior" },
  { query: "BRICKAFTERBRICK", expected: "No Match or Lookup Unavailable only, never Sold Out unless confirmed", purpose: "Bad query handling" },
  { query: "ABC123XYZ", expected: "No Match or Lookup Unavailable only, never Sold Out unless confirmed", purpose: "Invalid SKU handling" },
];
