import { Pool, QueryResult } from "pg";
import { config } from "./env";
import { logger } from "../utils/logger";

const pool = new Pool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  ssl: config.DB_SSL ? { rejectUnauthorized: false } : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  logger.error("Unexpected error on idle client", err);
});

export const db = {
  query: async <T = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
    const start = Date.now();
    try {
      const result = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      if (duration > 1000) {
        logger.warn(`Slow query detected (${duration}ms):`, { text, params });
      }
      return result;
    } catch (error) {
      logger.error("Database query error", { text, params, error });
      throw error;
    }
  },
  
  getOne: async <T = any>(text: string, params?: any[]): Promise<T | null> => {
    const result = await db.query<T>(text, params);
    return result.rows[0] || null;
  },
  
  getAll: async <T = any>(text: string, params?: any[]): Promise<T[]> => {
    const result = await db.query<T>(text, params);
    return result.rows;
  },
  
  run: async (text: string, params?: any[]) => {
    return db.query(text, params);
  },
};

export const initDatabase = async () => {
  try {
    logger.info("Initializing database connection...");
    
    // Test connection
    const result = await pool.query("SELECT NOW()");
    logger.info("Database connected successfully", { timestamp: result.rows[0] });
    
    // Run migrations automatically
    await runMigrations();
  } catch (error) {
    logger.error("Failed to connect to database", error);
    process.exit(1);
  }
};

const runMigrations = async () => {
  const fs = await import("fs");
  const path = await import("path");
  
  const migrationsDir = path.join(process.cwd(), "server", "migrations");
  
  if (!fs.existsSync(migrationsDir)) {
    logger.warn("Migrations directory not found");
    return;
  }
  
  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const files = fs.readdirSync(migrationsDir).sort();
    
    for (const file of files) {
      const migrationName = file.replace(".sql", "");
      const executed = await db.getOne(
        "SELECT * FROM migrations WHERE name = $1",
        [migrationName]
      );
      
      if (!executed) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
        await db.run(sql);
        await db.run(
          "INSERT INTO migrations (name) VALUES ($1)",
          [migrationName]
        );
        logger.info(`Migration executed: ${migrationName}`);
      }
    }
  } catch (error) {
    logger.error("Migration error", error);
  }
};

export const closeDatabase = async () => {
  await pool.end();
  logger.info("Database connection closed");
};
