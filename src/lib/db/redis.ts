import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

let isConnected = false;

export async function getRedisClient() {
  if (!isConnected) {
    await redisClient.connect();
    isConnected = true;
  }
  return redisClient;
}

export async function cacheSet(key: string, value: any, ttl: number = 3600) {
  const client = await getRedisClient();
  await client.set(key, JSON.stringify(value), { EX: ttl });
}

export async function cacheGet(key: string): Promise<any | null> {
  const client = await getRedisClient();
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
}

export async function cacheDelete(key: string) {
  const client = await getRedisClient();
  await client.del(key);
}