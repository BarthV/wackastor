import postgres from 'postgres';

const url = process.env.POSTGRES_URL_NON_POOLING;
if (!url) throw new Error('POSTGRES_URL_NON_POOLING manquant');

const sql = postgres(url, { ssl: 'require', prepare: false });

async function main() {
	const [{ max }] = await sql<[{ max: number }]>`SELECT MAX(id) as max FROM uex_sync_log`;
	console.log('Max id actuel:', max);
	await sql`SELECT setval('uex_sync_log_id_seq', ${max})`;
	console.log('Séquence réinitialisée à', max);
	await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
