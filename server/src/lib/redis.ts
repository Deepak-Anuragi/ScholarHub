import Redis from "ioredis";

// ── Connection ─────────────────────────────────────────────────────────────
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

let redis: Redis | null = null;

/**
 * Returns a shared Redis client. The first call creates the connection; all
 * subsequent calls reuse it. Returns `null` when REDIS_URL is not set or
 * the connection failed, so callers can fall through to the database.
 */
export function getRedis(): Redis | null {
  if (redis) return redis;

  if (!process.env.REDIS_URL && process.env.NODE_ENV === "test") return null;

  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 3000,
      retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 200, 2000)),
    });

    redis.on("error", (err) => {
      console.error("[redis] connection error:", err.message);
    });

    redis.on("connect", () => {
      console.log("[redis] connected to", REDIS_URL.replace(/:\/\/.*@/, "://***@"));
    });

    void redis.connect().catch(() => {
      console.warn("[redis] initial connect failed — caching disabled.");
      redis = null;
    });

    return redis;
  } catch {
    console.warn("[redis] failed to create client — caching disabled.");
    return null;
  }
}

// ── Cache helpers ──────────────────────────────────────────────────────────

/** Default TTL for cached queries — 60 seconds. */
export const DEFAULT_TTL = 60;

/**
 * Generic cache-aside helper.
 *
 * 1. Try to return the cached value for `key`.
 * 2. On miss, call `fetcher()`, cache the result, and return it.
 * 3. On any Redis failure, silently fall through to `fetcher()`.
 */
export async function cacheQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL,
): Promise<T> {
  const client = getRedis();

  if (client) {
    try {
      const cached = await client.get(key);
      if (cached) return JSON.parse(cached) as T;
    } catch {
      // Redis read failed — fall through to DB.
    }
  }

  const fresh = await fetcher();

  if (client) {
    try {
      await client.setex(key, ttlSeconds, JSON.stringify(fresh));
    } catch {
      // Redis write failed — non-critical.
    }
  }

  return fresh;
}

/**
 * Invalidate cache entries by pattern (e.g., "libraries:*").
 * Uses SCAN to avoid blocking the server on large keyspaces.
 */
export async function invalidatePattern(pattern: string): Promise<number> {
  const client = getRedis();
  if (!client) return 0;

  let deleted = 0;
  try {
    const stream = client.scanStream({ match: pattern, count: 100 });
    for await (const keys of stream) {
      if ((keys as string[]).length > 0) {
        deleted += await client.del(...(keys as string[]));
      }
    }
  } catch {
    // Non-critical.
  }
  return deleted;
}

/**
 * Invalidate a single cache key.
 */
export async function invalidateKey(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.del(key);
  } catch {
    // Non-critical.
  }
}
