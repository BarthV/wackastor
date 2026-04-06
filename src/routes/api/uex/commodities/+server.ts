import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { uexCommodities, commodityUnitConfigs, commodityQualityConfigs } from '$lib/server/db/schema/index.js';
import { ilike, and, eq, or } from 'drizzle-orm';
import { escapeLike } from '$lib/server/db/helpers.js';
import type { RequestHandler } from './$types';

// Search commodities by name prefix (autocomplete)
export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim().toLowerCase();
	const kind = url.searchParams.get('kind');
	const harvestable = url.searchParams.get('harvestable') === 'true';
	const limit = Math.min(Number(url.searchParams.get('limit') ?? 20), 50);

	const conditions = [];
	if (q) {
		conditions.push(ilike(uexCommodities.name, `%${escapeLike(q)}%`));
	}
	if (kind) {
		conditions.push(eq(uexCommodities.kind, kind));
	}
	if (harvestable) {
		conditions.push(or(eq(uexCommodities.isRaw, 1), eq(uexCommodities.isMineral, 1)));
	}

	const results = await db
		.select({
			id: uexCommodities.id,
			name: uexCommodities.name,
			code: uexCommodities.code,
			kind: uexCommodities.kind,
			priceBuy: uexCommodities.priceBuy,
			priceSell: uexCommodities.priceSell,
			isAvailable: uexCommodities.isAvailable,
			unit: commodityUnitConfigs.unit,
			qualityId: commodityQualityConfigs.uexCommodityId
		})
		.from(uexCommodities)
		.leftJoin(commodityUnitConfigs, eq(uexCommodities.id, commodityUnitConfigs.uexCommodityId))
		.leftJoin(commodityQualityConfigs, eq(uexCommodities.id, commodityQualityConfigs.uexCommodityId))
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.limit(limit);

	return json({
		data: results.map((r) => ({ ...r, unit: r.unit ?? 'SCU', hasQuality: r.qualityId !== null }))
	});
};
