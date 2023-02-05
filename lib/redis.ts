import Redis, { RedisOptions } from "ioredis";

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var, no-unused-vars
  var redis: Redis | undefined;
}

function getRedisConfiguration() {
  return {
    host: process.env.REDIS_HOST || "localhost",
    port: +(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD,
  };
}

function getRedis(config = getRedisConfiguration()) {
  try {
    const options: RedisOptions = {
      host: config.host,
      lazyConnect: true,
      showFriendlyErrorStack: true,
      enableAutoPipelining: true,
      maxRetriesPerRequest: 0,
      retryStrategy: (times: number) => {
        if (times > 3) {
          throw new Error(`[Redis] Could not connect after ${times} attempts`);
        }

        return Math.min(times * 200, 1000);
      },
    };

    if (config.port) {
      options.port = config.port;
    }

    if (config.password) {
      options.password = config.password;
    }

    const redis = new Redis(options);

    redis.on("error", (error: unknown) => {
      console.warn("[Redis] Error connecting", error);
    });

    return redis;
  } catch (e) {
    // throw new Error(`[Redis] Could not create a Redis instance`);
    console.error("[Redis] Could not create a Redis instance : ", e);
  }
}

export const redis = global.redis || getRedis();

if (process.env.NODE_ENV !== "production") global.redis = redis;

export async function getIfCached<T>({
  key,
  realtimeDataCb,
  ttl,
}: {
  realtimeDataCb: () => Promise<T>;
  key: string;
  ttl: number;
}): Promise<T> {
  if (!redis) return realtimeDataCb();
  const fetchAndStoreNewData = async () => {
    const data = (await realtimeDataCb()) as T;
    redis.set(key, JSON.stringify(data), "PX", ttl * 1000);
    return data;
  };
  const cachedData = await redis.get(key).catch(() => null);
  if (!cachedData) return fetchAndStoreNewData();
  try {
    return JSON.parse(cachedData) as T;
  } catch (error) {
    return fetchAndStoreNewData();
  }
}
