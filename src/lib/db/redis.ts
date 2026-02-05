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