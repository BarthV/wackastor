import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzleTurso } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema/index.js';

const DATABASE_URL = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'file:local.db';
const DATABASE_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;

function createDb(): BetterSQLite3Database<typeof schema> {
	const isLocal = DATABASE_URL.startsWith('file:') || !DATABASE_AUTH_TOKEN;

	if (isLocal) {
		const path = DATABASE_URL.replace(/^file:/, '');
		const sqlite = new Database(path);
		sqlite.pragma('journal_mode = WAL');
		return drizzle(sqlite, { schema });
	}

	const client = createClient({
		url: DATABASE_URL,
		authToken: DATABASE_AUTH_TOKEN
	});
	// LibSQL and BetterSQLite3 share the same query API surface
	return drizzleTurso(client, { schema }) as unknown as BetterSQLite3Database<typeof schema>;
}

export const db = createDb();
