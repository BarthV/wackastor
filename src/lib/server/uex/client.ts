/**
 * UEXcorp API v2.0 Client
 * Rate limit: 120 req/min
 */

import type {
	UexApiResponse,
	UexCommodity,
	UexItem,
	UexTerminal,
	UexPlanet,
	UexMoon,
	UexSpaceStation,
	UexCity,
	UexOutpost
} from './types.js';

const API_BASE = 'https://api.uexcorp.space/2.0';

async function fetchEndpoint<T>(path: string, apiKey?: string): Promise<T[]> {
	const url = `${API_BASE}/${path}`;
	try {
		const headers: Record<string, string> = {};
		if (apiKey) {
			headers['Accept'] = 'application/json';
			headers['Authorization'] = `Bearer ${apiKey}`;
			headers['Content-Type'] = 'application/json';
			headers['User-Agent'] = 'curl/8.18.0';
		}
		const resp = await fetch(url, { headers });
		if (!resp.ok) {
			console.error(`UEX API error: ${resp.status} ${resp.statusText} for ${url}`);
			return [];
		}
		const json = (await resp.json()) as UexApiResponse<T>;
		if (json.status !== 'ok') {
			console.error(`UEX API returned status "${json.status}" for ${url}`);
			return [];
		}
		return json.data ?? [];
	} catch (err) {
		console.error(`UEX API fetch failed for ${url}:`, err);
		return [];
	}
}

export async function fetchCommodities(apiKey?: string): Promise<UexCommodity[]> {
	return fetchEndpoint<UexCommodity>('commodities', apiKey);
}

export async function fetchItemsByCategory(categoryId: number, apiKey?: string): Promise<UexItem[]> {
	return fetchEndpoint<UexItem>(`items?id_category=${categoryId}`, apiKey);
}

export async function fetchTerminals(apiKey?: string): Promise<UexTerminal[]> {
	return fetchEndpoint<UexTerminal>('terminals', apiKey);
}

export async function fetchPlanets(apiKey?: string): Promise<UexPlanet[]> {
	return fetchEndpoint<UexPlanet>('planets', apiKey);
}

export async function fetchMoons(apiKey?: string): Promise<UexMoon[]> {
	return fetchEndpoint<UexMoon>('moons', apiKey);
}

export async function fetchSpaceStations(apiKey?: string): Promise<UexSpaceStation[]> {
	return fetchEndpoint<UexSpaceStation>('space_stations', apiKey);
}

export async function fetchCities(apiKey?: string): Promise<UexCity[]> {
	return fetchEndpoint<UexCity>('cities', apiKey);
}

export async function fetchOutposts(apiKey?: string): Promise<UexOutpost[]> {
	return fetchEndpoint<UexOutpost>('outposts', apiKey);
}

/**
 * Fetch all items across all known categories.
 * Uses parallel batches to stay within timeout budget.
 */
export async function fetchAllItems(apiKey?: string, batchSize = 5, delayMs = 600): Promise<UexItem[]> {
	const { ITEM_CATEGORIES } = await import('./categories.js');
	const allItems: UexItem[] = [];

	for (let i = 0; i < ITEM_CATEGORIES.length; i += batchSize) {
		const batch = ITEM_CATEGORIES.slice(i, i + batchSize);
		const results = await Promise.all(
			batch.map((cat) => fetchItemsByCategory(cat.id, apiKey))
		);
		for (const items of results) {
			allItems.push(...items);
		}
		if (i + batchSize < ITEM_CATEGORIES.length && delayMs > 0) {
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
	}

	return allItems;
}
