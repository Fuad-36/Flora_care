import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.SQL_HOST || "localhost",
    user: process.env.SQL_USER || "ai_studio_app_user",
    password: process.env.SQL_PASSWORD || "",
    database: process.env.SQL_DB_NAME || "cloud_sql_development_database",
  },
});
