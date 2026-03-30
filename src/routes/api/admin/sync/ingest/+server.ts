/**
 * Client-side sync ingest endpoint.
 * Accepts raw UEX data fetched by the browser (bypasses Cloudflare bot detection)
 * and persists it to DB using the same logic as server-side sync.
 */
import { json } from '@sveltejs/kit';
import { isSuperadmin } from '$lib/server/auth/permissions.js';
import { db } from '$lib/server/db/index.js';
import {
	uexCommodities,
	uexItemCategories,
	uexItems,
	uexLocations,
	uexTerminals,
	uexSyncLog
} from '$lib/server/db/schema/index.js';
import { ITEM_CATEGORIES } from '$lib/server/uex/categories.js';
import type { UexLocationType } from '$lib/server/uex/types.js';
import type { RequestHandler } from './$types';

type SyncStatus = 'success' | 'partial' | 'error';

async function logSync(resource: string, status: SyncStatus, recordCount: number, durationMs: number, errorMessage?: string) {
	await db.insert(uexSyncLog).values({
		resource,
		status,
		recordCount,
		durationMs,
		errorMessage: errorMessage ?? null,
		syncedAt: Date.now()
	});
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !isSuperadmin(locals.user.discordId)) {
		return json({ error: 'Acces interdit' }, { status: 403 });
	}

	const body = await request.json().catch(() => null);
	if (!body?.resource || !body?.data) {
		return json({ error: 'resource et data requis' }, { status: 400 });
	}

	const { resource, data } = body;
	const start = Date.now();

	try {
		if (resource === 'commodities') {
			const commodities = data as Array<Record<string, unknown>>;
			if (!commodities.length) return json({ error: 'Aucune donnee recue' }, { status: 400 });

			await db.delete(uexCommodities);
			const rows = commodities.map((c) => ({
				id: c.id as number,
				idParent: c.id_parent as number,
				name: c.name as string,
				code: c.code as string,
				kind: c.kind as string,
				weightScu: c.weight_scu as number,
				priceBuy: c.price_buy as number,
				priceSell: c.price_sell as number,
				isAvailable: c.is_available as number,
				isBuyable: c.is_buyable as number,
				isSellable: c.is_sellable as number,
				isMineral: c.is_mineral as number,
				isRaw: c.is_raw as number,
				isRefined: c.is_refined as number,
				isIllegal: c.is_illegal as number,
				dateModified: c.date_modified as number
			}));
			for (let i = 0; i < rows.length; i += 100) await db.insert(uexCommodities).values(rows.slice(i, i + 100));
			await logSync('commodities', 'success', rows.length, Date.now() - start);
			return json({ status: 'success', recordCount: rows.length, durationMs: Date.now() - start });
		}

		if (resource === 'items') {
			const items = data as Array<Record<string, unknown>>;
			if (!items.length) return json({ error: 'Aucune donnee recue' }, { status: 400 });

			await db.delete(uexItemCategories);
			await db.insert(uexItemCategories).values(
				ITEM_CATEGORIES.map((c) => ({ id: c.id, name: c.name, section: c.section, itemCount: c.itemCount }))
			);

			await db.delete(uexItems);
			const rows = items.map((item) => ({
				id: item.id as number,
				idCategory: item.id_category as number,
				idCompany: (item.id_company as number) ?? 0,
				name: item.name as string,
				section: (item.section as string) ?? '',
				category: (item.category as string) ?? '',
				companyName: item.company_name as string | null,
				slug: (item.slug as string) ?? '',
				size: item.size as string | null,
				uuid: (item.uuid as string) ?? '',
				quality: (item.quality as number) ?? 0,
				isCommodity: (item.is_commodity as number) ?? 0,
				screenshot: (item.screenshot as string) ?? '',
				gameVersion: (item.game_version as string) ?? '',
				dateModified: (item.date_modified as number) ?? 0
			}));
			for (let i = 0; i < rows.length; i += 100) await db.insert(uexItems).values(rows.slice(i, i + 100));
			await logSync('items', 'success', rows.length, Date.now() - start);
			return json({ status: 'success', recordCount: rows.length, durationMs: Date.now() - start });
		}

		if (resource === 'locations') {
			const { planets = [], moons = [], space_stations = [], cities = [], outposts = [] } = data as Record<string, Array<Record<string, unknown>>>;

			const mapLocation = (items: Array<Record<string, unknown>>, type: UexLocationType) =>
				items.map((loc) => ({
					id: loc.id as number,
					type,
					idStarSystem: loc.id_star_system as number,
					name: loc.name as string,
					code: (loc.code as string) ?? '',
					starSystemName: loc.star_system_name as string,
					planetName: (loc.planet_name as string) ?? '',
					moonName: (loc.moon_name as string | null) ?? null,
					isAvailable: loc.is_available as number,
					dateModified: loc.date_modified as number
				}));

			const allLocations = [
				...mapLocation(planets, 'planet'),
				...mapLocation(moons, 'moon'),
				...mapLocation(space_stations, 'space_station'),
				...mapLocation(cities, 'city'),
				...mapLocation(outposts, 'outpost')
			];

			if (!allLocations.length) return json({ error: 'Aucune donnee recue' }, { status: 400 });

			await db.delete(uexLocations);
			for (let i = 0; i < allLocations.length; i += 100) await db.insert(uexLocations).values(allLocations.slice(i, i + 100));
			await logSync('locations', 'success', allLocations.length, Date.now() - start);
			return json({ status: 'success', recordCount: allLocations.length, durationMs: Date.now() - start });
		}

		if (resource === 'terminals') {
			const terminals = data as Array<Record<string, unknown>>;
			if (!terminals.length) return json({ error: 'Aucune donnee recue' }, { status: 400 });

			await db.delete(uexTerminals);
			const rows = terminals.map((t) => ({
				id: t.id as number,
				idStarSystem: t.id_star_system as number,
				idPlanet: t.id_planet as number,
				idMoon: t.id_moon as number,
				idSpaceStation: t.id_space_station as number,
				idCity: t.id_city as number,
				idOutpost: t.id_outpost as number,
				name: t.name as string,
				fullname: t.fullname as string,
				nickname: t.nickname as string,
				code: t.code as string,
				type: t.type as string,
				isAvailable: t.is_available as number,
				hasTradeTerminal: ((t.is_shop_fps as number) || (t.is_shop_vehicle as number)) ? 1 : 0,
				hasRefinery: t.is_refinery as number,
				starSystemName: t.star_system_name as string,
				planetName: (t.planet_name as string) ?? '',
				moonName: t.moon_name as string | null,
				spaceStationName: t.space_station_name as string | null,
				outpostName: t.outpost_name as string | null,
				cityName: t.city_name as string | null,
				dateModified: t.date_modified as number
			}));
			for (let i = 0; i < rows.length; i += 100) await db.insert(uexTerminals).values(rows.slice(i, i + 100));
			await logSync('terminals', 'success', rows.length, Date.now() - start);
			return json({ status: 'success', recordCount: rows.length, durationMs: Date.now() - start });
		}

		return json({ error: 'Ressource inconnue' }, { status: 400 });

	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		await logSync(resource, 'error', 0, Date.now() - start, msg).catch(() => {});
		return json({ error: msg }, { status: 500 });
	}
};
