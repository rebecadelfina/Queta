import dotenv from "dotenv";

dotenv.config();

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  
  // Database
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: parseInt(process.env.DB_PORT || "5432", 10),
  DB_NAME: process.env.DB_NAME || "bet_prognostic",
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD || "postgres",
  DB_SSL: process.env.DB_SSL === "true",
  
  // Redis
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: parseInt(process.env.REDIS_PORT || "6379", 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  
  // Football API
  FOOTBALL_API_KEY: process.env.FOOTBALL_API_KEY || "5bdac23e79514c9aac67cf28e95d3ae3",
  FOOTBALL_API_BASE_URL: "https://api.football-data.org/v4",
  
  // Sync Schedule (Cron)
  SYNC_SCHEDULE: process.env.SYNC_SCHEDULE || "0 0 * * *", // 00:00 daily
  CLEANUP_SCHEDULE: process.env.CLEANUP_SCHEDULE || "0 2 * * *", // 02:00 daily
  
  // Admin API Key
  ADMIN_API_KEY: process.env.ADMIN_API_KEY || "admin-secret-key-change-in-production",
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  DEBUG: process.env.DEBUG === "true",
};

// Validate required configs
const requiredConfigs = ["FOOTBALL_API_KEY"];
requiredConfigs.forEach((key) => {
  if (!config[key as keyof typeof config]) {
    console.warn(`Warning: ${key} is not set`);
  }
});
