import { Pool, types } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

// The schema uses PostgreSQL `timestamp without time zone` and stores UTC values.
// pg's default parser interprets those values in the Node process timezone,
// which shifts them by six hours on this machine. Parse them explicitly as UTC;
// the presentation layer then formats them as Asia/Dhaka.
types.setTypeParser(1114, (value: string) => {
  if (!value) return null;
  const normalized = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(value) ? value : `${value}Z`;
  return new Date(normalized);
});

// Prefer DATABASE_URL (Neon) if set; otherwise fall back to SQL_* vars
// Neon requires SSL; local dev does not
const databaseUrl = process.env.DATABASE_URL?.trim();

const poolConfig: any = {
  // Keep timestamp-without-time-zone writes canonicalized in UTC.
  options: "-c timezone=UTC",
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

if (databaseUrl) {
  poolConfig.connectionString = databaseUrl;
  poolConfig.ssl = { rejectUnauthorized: false };
} else {
  const isSocket = Boolean(process.env.SQL_HOST && process.env.SQL_HOST.startsWith("/"));
  poolConfig.user = process.env.SQL_USER || "postgres";
  poolConfig.password = String(process.env.SQL_PASSWORD || "postgres");
  poolConfig.database = process.env.SQL_DB_NAME || "postgres";

  if (isSocket) {
    poolConfig.host = process.env.SQL_HOST;
  } else {
    poolConfig.host = process.env.SQL_HOST || "localhost";
    poolConfig.port = Number(process.env.SQL_PORT) || 5432;
  }

  // Enable SSL for Neon hosts
  if (poolConfig.host && String(poolConfig.host).includes("neon.tech")) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
}

export const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("PostgreSQL Pool background client error:", err.message);
});

export const db = drizzle(pool, { schema });
