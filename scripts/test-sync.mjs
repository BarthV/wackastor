/**
 * Quick integration test: sync commodities + locations to local SQLite.
 * Run: node scripts/test-sync.mjs
 */

import Database from 'better-sqlite3';

const DB_PATH = 'local.db';
const API_BASE = 'https://api.uexcorp.space/2.0';
const API_KEY = process.env.UEXCORP_API_KEY;

async function fetchJson(path) {
	const headers = {};
	if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;
	const resp = await fetch(`${API_BASE}/${path}`, { headers });
	if (!resp.ok) throw new Error(`${resp.status} for ${path}`);
	const json = await resp.json();
	return json.data || [];
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Test commodities sync
console.log('Syncing commodities...');
const commodities = await fetchJson('commodities');
console.log(`  Fetched ${commodities.length} commodities`);

db.exec('DELETE FROM uex_commodities');
const insertCommodity = db.prepare(`
	INSERT INTO uex_commodities (id, id_parent, name, code, kind, weight_scu, price_buy, price_sell, is_available, is_buyable, is_sellable, is_mineral, is_raw, is_refined, is_illegal, date_modified)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertMany = db.transaction((items) => {
	for (const c of items) {
		insertCommodity.run(c.id, c.id_parent, c.name, c.code, c.kind, c.weight_scu, c.price_buy, c.price_sell, c.is_available, c.is_buyable, c.is_sellable, c.is_mineral, c.is_raw, c.is_refined, c.is_illegal, c.date_modified);
	}
});
insertMany(commodities);

const count = db.prepare('SELECT COUNT(*) as c FROM uex_commodities').get();
console.log(`  DB has ${count.c} commodities`);

// Test locations sync (just planets for speed)
console.log('Syncing planets...');
const planets = await fetchJson('planets');
console.log(`  Fetched ${planets.length} planets`);

db.exec('DELETE FROM uex_locations');
const insertLoc = db.prepare(`
	INSERT INTO uex_locations (id, type, id_star_system, name, code, star_system_name, planet_name, moon_name, is_available, date_modified)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertLocs = db.transaction((items) => {
	for (const p of items) {
		insertLoc.run(p.id, 'planet', p.id_star_system, p.name, p.code || '', p.star_system_name, '', null, p.is_available, p.date_modified);
	}
});
insertLocs(planets);

const locCount = db.prepare('SELECT COUNT(*) as c FROM uex_locations').get();
console.log(`  DB has ${locCount.c} locations`);

// Test search
const search = db.prepare("SELECT name FROM uex_commodities WHERE name LIKE ? LIMIT 5").all('Quan%');
console.log(`  Search 'Quan%': ${search.map(r => r.name).join(', ')}`);

console.log('\nSync integration test PASSED');
db.close();
