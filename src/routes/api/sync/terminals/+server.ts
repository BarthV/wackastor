import { json } from '@sveltejs/kit';
import { validateCronSecret } from '$lib/server/uex/sync-auth.js';
import { syncTerminals } from '$lib/server/uex/sync.js';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
	if (!validateCronSecret(request)) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const result = await syncTerminals(env.UEXCORP_API_KEY || undefined);
	return json(result);
};
