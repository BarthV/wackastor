#!/usr/bin/env npx tsx
/**
 * Migration script: Turso (SQLite/libsql) → Supabase (PostgreSQL)
 *
 * Prérequis : tables déjà créées dans Supabase via `pnpm drizzle-kit push`
 *
 * Usage :
 *   export $(grep -v '^#' .env.prod.local | xargs) && npx tsx scripts/migrate-turso-to-supabase.ts
 */

import { createClient } from '@libsql/client';
import postgres from 'postgres';

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
const PG_URL = process.env.POSTGRES_URL_NON_POOLING;

if (!TURSO_URL || !TURSO_TOKEN || !PG_URL) {
	console.error(
		'Variables manquantes : TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, POSTGRES_URL_NON_POOLING'
	);
	process.exit(1);
}

const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
const pg = postgres(PG_URL, { ssl: 'require', prepare: false });

// Ordre d'insertion respectant les contraintes FK
const TABLES = [
	'users',
	'corporations',
	'sessions',
	'corp_members',
	'corp_role_bindings',
	'uex_commodities',
	'uex_item_categories',
	'uex_items',
	'uex_locations',
	'uex_terminals',
	'item_section_configs',
	'item_subcategory_configs',
	'commodity_quality_configs',
	'commodity_unit_configs',
	'uex_sync_log',
	'inventory_items',
	'orders',
	'order_matches'
];

// Colonnes stockées en 0/1 dans SQLite mais boolean dans PG
const BOOLEAN_COLUMNS: Record<string, string[]> = {
	item_section_configs: ['disabled'],
	item_subcategory_configs: ['disabled']
};

async function migrateTable(tableName: string): Promise<void> {
	const result = await turso.execute(`SELECT * FROM ${tableName}`);

	if (result.rows.length === 0) {
		console.log(`  ${tableName}: vide, ignoré`);
		return;
	}

	const boolCols = BOOLEAN_COLUMNS[tableName] ?? [];

	const rows = result.rows.map((row) => {
		const obj: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(row)) {
			obj[key] = boolCols.includes(key) ? Boolean(val) : val;
		}
		return obj;
	});

	// Insertion par lots de 200
	const BATCH_SIZE = 200;
	for (let i = 0; i < rows.length; i += BATCH_SIZE) {
		const batch = rows.slice(i, i + BATCH_SIZE);
		await pg`INSERT INTO ${pg(tableName)} ${pg(batch)} ON CONFLICT DO NOTHING`;
	}

	console.log(`  ${tableName}: ${rows.length} lignes migrées`);
}

async function main() {
	console.log('Migration Turso → Supabase démarrée...\n');

	for (const table of TABLES) {
		try {
			await migrateTable(table);
		} catch (err) {
			console.error(`  ${table}: ERREUR — ${err}`);
		}
	}

	// Réinitialiser les séquences des colonnes serial après import de données avec IDs explicites
	await pg`SELECT setval('uex_sync_log_id_seq', (SELECT COALESCE(MAX(id), 0) FROM uex_sync_log))`;
	console.log('\nSéquences réinitialisées.');

	console.log('Migration terminée.');
	await pg.end();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
