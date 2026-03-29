/**
 * UEXcorp Sync Engine
 * Fetches data from UEXcorp API and upserts into DB.
 * Each resource has its own sync function to run within separate cron endpoints.
 */

import { db } from '$lib/server/db/index.js';
import {
	uexCommodities,
	uexItemCategories,
	uexItems,
	uexLocations,
	uexTerminals,
	uexSyncLog
} from '$lib/server/db/schema/index.js';
import {
	fetchCommodities,
	fetchItemsByCategory,
	fetchTerminals,
	fetchPlanets,
	fetchMoons,
	fetchSpaceStations,
	fetchCities,
	fetchOutposts
} from './client.js';
import { ITEM_CATEGORIES } from './categories.js';
import type { UexLocationType } from './types.js';

interface SyncResult {
	resource: string;
	status: 'success' | 'partial' | 'error';
	recordCount: number;
	durationMs: number;
	errorMessage?: string;
}

async function logSync(result: SyncResult): Promise<void> {
	await db.insert(uexSyncLog).values({
		resource: result.resource,
		status: result.status,
		recordCount: result.recordCount,
		durationMs: result.durationMs,
		errorMessage: result.errorMessage ?? null,
		syncedAt: Date.now()
	});
}

// -- Sync commodities: single API call, full replace
export async function syncCommodities(apiKey?: string): Promise<SyncResult> {
	const start = Date.now();
	try {
		const commodities = await fetchCommodities(apiKey);
		if (commodities.length === 0) {
			const result: SyncResult = {
				resource: 'commodities',
				status: 'error',
				recordCount: 0,
				durationMs: Date.now() - start,
				errorMessage: 'API returned 0 commodities'
			};
			await logSync(result);
			return result;
		}

		// Delete and re-insert (simple full-replace strategy for reference data)
		await db.delete(uexCommodities);
		const rows = commodities.map((c) => ({
			id: c.id,
			idParent: c.id_parent,
			name: c.name,
			code: c.code,
			kind: c.kind,
			weightScu: c.weight_scu,
			priceBuy: c.price_buy,
			priceSell: c.price_sell,
			isAvailable: c.is_available,
			isBuyable: c.is_buyable,
			isSellable: c.is_sellable,
			isMineral: c.is_mineral,
			isRaw: c.is_raw,
			isRefined: c.is_refined,
			isIllegal: c.is_illegal,
			dateModified: c.date_modified
		}));

		// Batch insert in chunks of 100
		for (let i = 0; i < rows.length; i += 100) {
			await db.insert(uexCommodities).values(rows.slice(i, i + 100));
		}

		const result: SyncResult = {
			resource: 'commodities',
			status: 'success',
			recordCount: rows.length,
			durationMs: Date.now() - start
		};
		await logSync(result);
		return result;
	} catch (err) {
		const result: SyncResult = {
			resource: 'commodities',
			status: 'error',
			recordCount: 0,
			durationMs: Date.now() - start,
			errorMessage: err instanceof Error ? err.message : String(err)
		};
		await logSync(result);
		return result;
	}
}

// -- Sync items: iterates categories in parallel batches of 5
export async function syncItems(apiKey?: string, batchSize = 5, timeoutMs = 50000): Promise<SyncResult> {
	const start = Date.now();
	let totalItems = 0;
	const failedCategories: number[] = [];

	try {
		// Sync categories metadata first
		await db.delete(uexItemCategories);
		await db.insert(uexItemCategories).values(
			ITEM_CATEGORIES.map((c) => ({
				id: c.id,
				name: c.name,
				section: c.section,
				itemCount: c.itemCount
			}))
		);

		// Clear items table for full replace
		await db.delete(uexItems);

		for (let i = 0; i < ITEM_CATEGORIES.length; i += batchSize) {
			// Check timeout budget
			if (Date.now() - start > timeoutMs) {
				const remaining = ITEM_CATEGORIES.slice(i).map((c) => c.id);
				failedCategories.push(...remaining);
				break;
			}

			const batch = ITEM_CATEGORIES.slice(i, i + batchSize);
			const results = await Promise.all(
				batch.map((cat) => fetchItemsByCategory(cat.id, apiKey).catch(() => []))
			);

			for (let j = 0; j < batch.length; j++) {
				const items = results[j];
				if (items.length === 0) {
					failedCategories.push(batch[j].id);
					continue;
				}

				const rows = items.map((item) => ({
					id: item.id,
					idCategory: item.id_category,
					idCompany: item.id_company ?? 0,
					name: item.name,
					section: item.section ?? '',
					category: item.category ?? '',
					companyName: item.company_name,
					slug: item.slug ?? '',
					size: item.size,
					uuid: item.uuid ?? '',
					quality: item.quality ?? 0,
					isCommodity: item.is_commodity ?? 0,
					screenshot: item.screenshot ?? '',
					gameVersion: item.game_version ?? '',
					dateModified: item.date_modified ?? 0
				}));

				for (let k = 0; k < rows.length; k += 100) {
					await db.insert(uexItems).values(rows.slice(k, k + 100));
				}
				totalItems += rows.length;
			}

			// Small delay between batches to respect rate limits
			if (i + batchSize < ITEM_CATEGORIES.length) {
				await new Promise((resolve) => setTimeout(resolve, 500));
			}
		}

		const status = failedCategories.length > 0 ? 'partial' : 'success';
		const result: SyncResult = {
			resource: 'items',
			status,
			recordCount: totalItems,
			durationMs: Date.now() - start,
			errorMessage:
				failedCategories.length > 0
					? `Failed/skipped categories: ${failedCategories.join(', ')}`
					: undefined
		};
		await logSync(result);
		return result;
	} catch (err) {
		const result: SyncResult = {
			resource: 'items',
			status: 'error',
			recordCount: totalItems,
			durationMs: Date.now() - start,
			errorMessage: err instanceof Error ? err.message : String(err)
		};
		await logSync(result);
		return result;
	}
}

// -- Sync locations: fetches all 5 types in parallel, merges into composite PK table
export async function syncLocations(apiKey?: string): Promise<SyncResult> {
	const start = Date.now();
	try {
		const [planets, moons, stations, cities, outposts] = await Promise.all([
			fetchPlanets(apiKey),
			fetchMoons(apiKey),
			fetchSpaceStations(apiKey),
			fetchCities(apiKey),
			fetchOutposts(apiKey)
		]);

		const mapLocation = (
			items: Array<{ id: number; id_star_system: number; name: string; code?: string; name_origin?: string; star_system_name: string; planet_name?: string; moon_name?: string | null; is_available: number; date_modified: number }>,
			type: UexLocationType
		) =>
			items.map((loc) => ({
				id: loc.id,
				type,
				idStarSystem: loc.id_star_system,
				name: loc.name,
				code: 'code' in loc ? (loc.code as string) : '',
				starSystemName: loc.star_system_name,
				planetName: 'planet_name' in loc ? (loc.planet_name ?? '') : '',
				moonName: ('moon_name' in loc ? loc.moon_name : null) as string | null,
				isAvailable: loc.is_available,
				dateModified: loc.date_modified
			}));

		const allLocations = [
			...mapLocation(planets, 'planet'),
			...mapLocation(moons, 'moon'),
			...mapLocation(stations as Array<{ id: number; id_star_system: number; name: string; star_system_name: string; planet_name: string; moon_name: string | null; is_available: number; date_modified: number }>, 'space_station'),
			...mapLocation(cities, 'city'),
			...mapLocation(outposts as Array<{ id: number; id_star_system: number; name: string; star_system_name: string; planet_name: string; moon_name: string | null; is_available: number; date_modified: number }>, 'outpost')
		];

		if (allLocations.length === 0) {
			const result: SyncResult = {
				resource: 'locations',
				status: 'error',
				recordCount: 0,
				durationMs: Date.now() - start,
				errorMessage: 'All location endpoints returned 0 records'
			};
			await logSync(result);
			return result;
		}

		await db.delete(uexLocations);
		for (let i = 0; i < allLocations.length; i += 100) {
			await db.insert(uexLocations).values(allLocations.slice(i, i + 100));
		}

		const result: SyncResult = {
			resource: 'locations',
			status: 'success',
			recordCount: allLocations.length,
			durationMs: Date.now() - start
		};
		await logSync(result);
		return result;
	} catch (err) {
		const result: SyncResult = {
			resource: 'locations',
			status: 'error',
			recordCount: 0,
			durationMs: Date.now() - start,
			errorMessage: err instanceof Error ? err.message : String(err)
		};
		await logSync(result);
		return result;
	}
}

// -- Sync terminals: single API call, full replace
export async function syncTerminals(apiKey?: string): Promise<SyncResult> {
	const start = Date.now();
	try {
		const terminals = await fetchTerminals(apiKey);
		if (terminals.length === 0) {
			const result: SyncResult = {
				resource: 'terminals',
				status: 'error',
				recordCount: 0,
				durationMs: Date.now() - start,
				errorMessage: 'API returned 0 terminals'
			};
			await logSync(result);
			return result;
		}

		await db.delete(uexTerminals);
		const rows = terminals.map((t) => ({
			id: t.id,
			idStarSystem: t.id_star_system,
			idPlanet: t.id_planet,
			idMoon: t.id_moon,
			idSpaceStation: t.id_space_station,
			idCity: t.id_city,
			idOutpost: t.id_outpost,
			name: t.name,
			fullname: t.fullname,
			nickname: t.nickname,
			code: t.code,
			type: t.type,
			isAvailable: t.is_available,
			hasTradeTerminal: t.is_shop_fps || t.is_shop_vehicle ? 1 : 0,
			hasRefinery: t.is_refinery,
			starSystemName: t.star_system_name,
			planetName: t.planet_name ?? '',
			moonName: t.moon_name,
			spaceStationName: t.space_station_name,
			outpostName: t.outpost_name,
			cityName: t.city_name,
			dateModified: t.date_modified
		}));

		for (let i = 0; i < rows.length; i += 100) {
			await db.insert(uexTerminals).values(rows.slice(i, i + 100));
		}

		const result: SyncResult = {
			resource: 'terminals',
			status: 'success',
			recordCount: rows.length,
			durationMs: Date.now() - start
		};
		await logSync(result);
		return result;
	} catch (err) {
		const result: SyncResult = {
			resource: 'terminals',
			status: 'error',
			recordCount: 0,
			durationMs: Date.now() - start,
			errorMessage: err instanceof Error ? err.message : String(err)
		};
		await logSync(result);
		return result;
	}
}
