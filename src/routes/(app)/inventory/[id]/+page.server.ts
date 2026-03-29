import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { inventoryItems, commodityQualityConfigs } from '$lib/server/db/schema/index.js';
import { activeInventory } from '$lib/server/db/helpers.js';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const [item] = await db
		.select()
		.from(inventoryItems)
		.where(and(eq(inventoryItems.id, params.id), activeInventory))
		.limit(1);

	if (!item) {
		error(404, 'Objet introuvable');
	}

	// Only owner or admin can view edit page
	const isOwner = item.userId === locals.user!.id;
	const isAdmin = locals.corp!.role === 'admin';
	if (!isOwner && !isAdmin) {
		error(403, 'Acces interdit');
	}

	// Check if this commodity has quality tracking enabled
	let hasQuality = false;
	if (item.uexCommodityId) {
		const [qRow] = await db
			.select()
			.from(commodityQualityConfigs)
			.where(eq(commodityQualityConfigs.uexCommodityId, item.uexCommodityId))
			.limit(1);
		hasQuality = !!qRow;
	}

	const back = url.searchParams.get('back');
	const backUrl = back ? `/inventory${decodeURIComponent(back)}` : '/inventory';

	return { item, hasQuality, backUrl };
};
