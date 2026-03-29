import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { commodityQualityConfigs, uexCommodities } from '$lib/server/db/schema/index.js';
import { isSuperadmin } from '$lib/server/auth/permissions.js';
import { eq, or } from 'drizzle-orm';
import type { RequestHandler } from './$types';

function guard(locals: App.Locals) {
	return !locals.user || !isSuperadmin(locals.user.discordId);
}

// GET: list all quality-enabled commodity IDs
export const GET: RequestHandler = async ({ locals }) => {
	if (guard(locals)) return json({ error: 'Acces refuse' }, { status: 403 });

	const rows = await db
		.select({
			id: uexCommodities.id,
			name: uexCommodities.name,
			kind: uexCommodities.kind
		})
		.from(commodityQualityConfigs)
		.innerJoin(uexCommodities, eq(commodityQualityConfigs.uexCommodityId, uexCommodities.id))
		.orderBy(uexCommodities.name);

	return json({ data: rows });
};

// PUT: add a commodity to the quality list
export const PUT: RequestHandler = async ({ request, locals }) => {
	if (guard(locals)) return json({ error: 'Acces refuse' }, { status: 403 });

	const body = await request.json().catch(() => null);
	if (!body?.uexCommodityId) return json({ error: 'uexCommodityId requis' }, { status: 400 });

	await db
		.insert(commodityQualityConfigs)
		.values({ uexCommodityId: body.uexCommodityId })
		.onConflictDoNothing();

	return json({ success: true });
};

// DELETE: remove a commodity from the quality list
export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (guard(locals)) return json({ error: 'Acces refuse' }, { status: 403 });

	const body = await request.json().catch(() => null);
	if (!body?.uexCommodityId) return json({ error: 'uexCommodityId requis' }, { status: 400 });

	await db
		.delete(commodityQualityConfigs)
		.where(eq(commodityQualityConfigs.uexCommodityId, body.uexCommodityId));

	return json({ success: true });
};

// POST /init: bulk-insert commodities where is_raw|is_mineral|is_refined = 1
export const POST: RequestHandler = async ({ locals }) => {
	if (guard(locals)) return json({ error: 'Acces refuse' }, { status: 403 });

	const candidates = await db
		.select({ id: uexCommodities.id })
		.from(uexCommodities)
		.where(or(
			eq(uexCommodities.isRaw, 1),
			eq(uexCommodities.isMineral, 1),
			eq(uexCommodities.isRefined, 1)
		));

	if (candidates.length > 0) {
		await db
			.insert(commodityQualityConfigs)
			.values(candidates.map((c) => ({ uexCommodityId: c.id })))
			.onConflictDoNothing();
	}

	return json({ success: true, count: candidates.length });
};
