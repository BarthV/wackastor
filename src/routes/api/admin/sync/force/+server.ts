import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { syncCommodities, syncItems, syncLocations, syncTerminals } from '$lib/server/uex/sync.js';
import type { RequestHandler } from './$types';

const syncFunctions: Record<string, (apiKey?: string) => Promise<unknown>> = {
	commodities: syncCommodities,
	items: syncItems,
	locations: syncLocations,
	terminals: syncTerminals
};

// POST: force sync a specific resource (admin only)
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !locals.corp || locals.corp.role !== 'admin') {
		return json({ error: 'Acces interdit' }, { status: 403 });
	}

	const body = await request.json().catch(() => null);
	if (!body?.resource || !(body.resource in syncFunctions)) {
		return json({ error: 'Ressource invalide' }, { status: 400 });
	}

	if (!env.UEXCORP_API_KEY) {
		return json({ error: 'UEXCORP_API_KEY non configuree' }, { status: 500 });
	}

	const syncFn = syncFunctions[body.resource];
	const result = await syncFn(env.UEXCORP_API_KEY);

	return json({ data: result });
};
