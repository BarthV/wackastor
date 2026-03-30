import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { isSuperadmin } from '$lib/server/auth/permissions.js';
import type { RequestHandler } from './$types';

const UEX_URL = 'https://api.uexcorp.space/2.0/star_systems';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !isSuperadmin(locals.user.discordId)) {
		return json({ error: 'Acces interdit' }, { status: 403 });
	}

	const body = await request.json().catch(() => null);
	const mode = body?.mode as 'anonymous' | 'bearer';

	const headers: Record<string, string> = { Accept: 'application/json' };
	let keyPresent = false;
	let keyPrefix: string | null = null;

	if (mode === 'bearer') {
		keyPresent = !!env.UEXCORP_API_KEY;
		keyPrefix = env.UEXCORP_API_KEY ? env.UEXCORP_API_KEY.slice(0, 8) + '...' : null;
		if (env.UEXCORP_API_KEY) {
			headers['Authorization'] = `Bearer ${env.UEXCORP_API_KEY}`;
		}
	}

	const start = Date.now();
	try {
		const resp = await fetch(UEX_URL, { headers });
		const elapsed = Date.now() - start;
		let responseBody: unknown = null;
		try {
			responseBody = await resp.json();
		} catch {
			responseBody = await resp.text();
		}
		return json({ httpStatus: resp.status, httpStatusText: resp.statusText, elapsed, body: responseBody, keyPresent, keyPrefix });
	} catch (err) {
		return json({ error: String(err), elapsed: Date.now() - start, keyPresent, keyPrefix });
	}
};
