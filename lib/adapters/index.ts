import type { StoreAdapter } from "./types";
import { createShopifyAdapter } from "./generic-shopify";

export const adapters: StoreAdapter[] = [
  createShopifyAdapter("apb", "https://www.apbstore.com"),
  createShopifyAdapter("social-status", "https://www.socialstatuspgh.com"),
  createShopifyAdapter("amm", "https://www.a-ma-maniere.com"),
  createShopifyAdapter("kith", "https://kith.com"),
  createShopifyAdapter("undefeated", "https://undefeated.com"),
  createShopifyAdapter("concepts", "https://cncpts.com"),
  createShopifyAdapter("bodega", "https://bdgastore.com"),
  createShopifyAdapter("extra-butter", "https://extrabutterny.com"),
  createShopifyAdapter("sneaker-politics", "https://sneakerpolitics.com"),
  createShopifyAdapter("notre", "https://www.notre-shop.com"),
];
