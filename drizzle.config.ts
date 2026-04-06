import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/lib/server/db/schema/index.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		// Non-pooling URL required for migrations (PgBouncer ne supporte pas les DDL)
		url:
			process.env.POSTGRES_URL_NON_POOLING ||
			process.env.DATABASE_URL ||
			'postgresql://postgres:postgres@localhost:5432/wackastor'
	}
});
