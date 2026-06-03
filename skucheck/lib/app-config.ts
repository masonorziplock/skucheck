export const APP_VERSION = "1.0.0";
export const SEARCH_CACHE_TTL_SECONDS = 10 * 60;
export const SEARCH_RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const SEARCH_RATE_LIMIT_MAX_REQUESTS = 20;
export const ADAPTER_TIMEOUT_MS = 8000;

export function getRateLimitLabel() {
  return `${SEARCH_RATE_LIMIT_MAX_REQUESTS} searches / ${Math.round(SEARCH_RATE_LIMIT_WINDOW_MS / 1000)} sec`;
}
