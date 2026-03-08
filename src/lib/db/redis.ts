// import { createClient } from 'redis';

// const redisClient = createClient({
//   url: process.env.REDIS_URL || 'redis://localhost:6379',
// });

// redisClient.on('error', (err) => console.error('Redis Client Error', err));

// let isConnected = false;

// export async function getRedisClient() {
//   if (!isConnected) {
//     await redisClient.connect();
//     isConnected = true;
//   }
//   return redisClient;
// }

// export async function cacheSet(key: string, value: any, ttl: number = 3600) {
//   const client = await getRedisClient();
//   await client.set(key, JSON.stringify(value), { EX: ttl });
// }

// export async function cacheGet(key: string): Promise<any | null> {
//   const client = await getRedisClient();
//   const data = await client.get(key);
//   return data ? JSON.parse(data) : null;
// }

// export async function cacheDelete(key: string) {
//   const client = await getRedisClient();
//   await client.del(key);
// }

// Use Upstash Redis REST API for Vercel compatibility
import { Redis } from '@upstash/redis';

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Helper functions
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data as T | null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export async function setCache(
  key: string,
  value: any,
  ttlSeconds: number = 3600
): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
}

export async function clearCachePattern(pattern: string): Promise<void> {
  try {
    // Note: Upstash Redis doesn't support SCAN in REST API
    // Use specific key deletion instead
    console.warn('Pattern clearing not supported in REST API');
  } catch (error) {
    console.error('Redis clear pattern error:', error);
  }
}

/**
 * Increment a daily API usage counter for a named service.
 * Key format: quota:<service>:<YYYY-MM-DD>  — expires after 30 days.
 * Returns the new counter value, or null on error.
 */
export async function incrementUsageCounter(service: string): Promise<number | null> {
  try {
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const key = `quota:${service}:${date}`;
    const count = await redis.incr(key);
    // Set TTL on first write (30 days)
    if (count === 1) {
      await redis.expire(key, 60 * 60 * 24 * 30);
    }
    return count;
  } catch (error) {
    console.error('Redis incrementUsageCounter error:', error);
    return null;
  }
}

/**
 * Send a quota alert email at most once per service per day.
 * Uses a Redis dedup key so repeated errors don't spam the inbox.
 */
export async function sendQuotaAlertOnce(
  service: string,
  details: string
): Promise<void> {
  try {
    const date = new Date().toISOString().slice(0, 10);
    const alertKey = `quota:alert:${service}:${date}`;
    // NX = only set if key doesn't exist (atomic dedup)
    const set = await redis.set(alertKey, '1', { nx: true, ex: 60 * 60 * 24 });
    if (set === null) {
      // Already alerted today for this service
      return;
    }
    const { sendAdminAlert } = await import('@/lib/services/email.service');
    await sendAdminAlert(
      `API quota / error: ${service}`,
      `Service: ${service}\nDate: ${date}\n\n${details}`
    );
  } catch (err) {
    console.error('sendQuotaAlertOnce failed (non-fatal):', err);
  }
}