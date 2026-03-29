import { json } from '@sveltejs/kit';
import { syncCommodities, syncItems, syncLocations, syncTerminals } from '$lib/server/uex/sync.js';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const SYNC_FUNCTIONS: Record<string, (apiKey?: string) => Promise<unknown>> = {
	commodities: syncCommodities,
	items: syncItems,
	locations: syncLocations,
	terminals: syncTerminals
};

// Admin-only on-demand sync trigger
export const POST: RequestHandler = async ({ request, locals }) => {
	// Require authenticated admin
	if (!locals.user || !locals.corp || locals.corp.role !== 'admin') {
		return json({ error: 'Admin access required' }, { status: 403 });
	}

	const body = await request.json().catch(() => null);
	const resource = body?.resource as string;

	if (!resource || !SYNC_FUNCTIONS[resource]) {
		return json(
			{ error: `Invalid resource. Valid: ${Object.keys(SYNC_FUNCTIONS).join(', ')}` },
			{ status: 400 }
		);
	}

	const result = await SYNC_FUNCTIONS[resource](env.UEXCORP_API_KEY || undefined);
	return json(result);
};
