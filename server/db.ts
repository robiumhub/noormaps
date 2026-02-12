import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
    throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
    );
}

// For Cloud SQL on Cloud Run, we use a unix socket. 
// The DATABASE_URL should be set in Cloud Run as:
// postgresql://USER:PASSWORD@/DB_NAME?host=/cloudsql/CONNECTION_NAME
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Add small delay for connection stability in serverless environment if needed
    connectionTimeoutMillis: 5000,
});
export const db = drizzle(pool, { schema });
