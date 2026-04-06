import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

// Pooled URL for runtime (PgBouncer), non-pooling URL fallback for local dev
const DATABASE_URL =
	process.env.POSTGRES_URL ||
	process.env.DATABASE_URL ||
	'postgresql://postgres:postgres@localhost:5432/wackastor';

// prepare: false required when connecting through PgBouncer (pooled Supabase URL)
const client = postgres(DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema });
