import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { commodityUnitConfigs } from '$lib/server/db/schema/index.js';
import { isSuperadmin } from '$lib/server/auth/permissions.js';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// PUT: upsert unit for a commodity
export const PUT: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !isSuperadmin(locals.user.discordId)) {
		return json({ error: 'Acces refuse' }, { status: 403 });
	}

	const body = await request.json().catch(() => null);
	if (!body?.uexCommodityId || !body?.unit) {
		return json({ error: 'Champs requis: uexCommodityId, unit' }, { status: 400 });
	}

	await db
		.insert(commodityUnitConfigs)
		.values({ uexCommodityId: body.uexCommodityId, unit: body.unit })
		.onConflictDoUpdate({
			target: commodityUnitConfigs.uexCommodityId,
			set: { unit: body.unit }
		});

	return json({ success: true });
};
