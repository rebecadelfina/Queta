import redis, { RedisClient } from "redis";
import { config } from "./env";
import { logger } from "../utils/logger";

let client: RedisClient;

export const initRedis = async () => {
  try {
    client = redis.createClient({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD,
      retry_strategy: (options) => {
        if (options.error && options.error.code === "ECONNREFUSED") {
          logger.warn("Redis connection refused, retrying...");
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error("Redis retry time exhausted");
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      },
    });

    client.on("error", (err) => {
      logger.error("Redis error", err);
    });

    client.on("connect", () => {
      logger.info("Redis connected successfully");
    });

    await new Promise<void>((resolve, reject) => {
      client.ping((err, reply) => {
        if (err) {
          logger.warn("Redis not available, continuing without cache", err);
          resolve();
        } else {
          logger.info("Redis PONG", { reply });
          resolve();
        }
      });
    });
  } catch (error) {
    logger.warn("Failed to initialize Redis, continuing without cache", error);
  }
};

export const cacheService = {
  get: (key: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!client) return resolve(null);
      client.get(key, (err, data) => {
        if (err) {
          logger.error("Cache get error", { key, error: err });
          return resolve(null);
        }
        resolve(data);
      });
    });
  },

  set: (key: string, value: string, ttl: number = 3600) => {
    return new Promise<void>((resolve) => {
      if (!client) return resolve();
      client.setex(key, ttl, value, (err) => {
        if (err) {
          logger.error("Cache set error", { key, error: err });
        }
        resolve();
      });
    });
  },

  del: (key: string) => {
    return new Promise<void>((resolve) => {
      if (!client) return resolve();
      client.del(key, (err) => {
        if (err) {
          logger.error("Cache del error", { key, error: err });
        }
        resolve();
      });
    });
  },

  getJson: async <T = any>(key: string): Promise<T | null> => {
    const data = await cacheService.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (error) {
      logger.error("Cache JSON parse error", { key, error });
      return null;
    }
  },

  setJson: (key: string, value: any, ttl: number = 3600) => {
    return cacheService.set(key, JSON.stringify(value), ttl);
  },

  clear: () => {
    return new Promise<void>((resolve) => {
      if (!client) return resolve();
      client.flushdb((err) => {
        if (err) {
          logger.error("Cache flush error", err);
        }
        resolve();
      });
    });
  },
};

export const closeRedis = () => {
  if (client) {
    client.quit();
    logger.info("Redis connection closed");
  }
};
