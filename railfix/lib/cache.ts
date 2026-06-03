type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  createdAt: string;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlSeconds: number): void {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
    createdAt: new Date().toISOString(),
  });
}

export function makeCacheKey(parts: string[]): string {
  return parts.map((part) => part.trim().toLowerCase()).join(":");
}


export function getCacheStats() {
  const now = Date.now();
  let expired = 0;
  let active = 0;
  for (const [key, entry] of memoryCache.entries()) {
    if (now > entry.expiresAt) {
      expired += 1;
      memoryCache.delete(key);
    } else {
      active += 1;
    }
  }
  return {
    activeEntries: active,
    expiredEntriesRemoved: expired,
    generatedAt: new Date().toISOString(),
  };
}

export function clearCache() {
  const cleared = memoryCache.size;
  memoryCache.clear();
  return { cleared, generatedAt: new Date().toISOString() };
}
