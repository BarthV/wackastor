import { db } from '$lib/server/db/index.js';
import { inventoryItems } from '$lib/server/db/schema/index.js';
import { activeInventory, escapeLike } from '$lib/server/db/helpers.js';
import { eq, and, like, gte, lte } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const q = url.searchParams.get('q')?.trim().toLowerCase();
	const location = url.searchParams.get('location')?.trim().toLowerCase();
	const category = url.searchParams.get('category');
	const qualityMin = url.searchParams.get('quality_min');
	const qualityMax = url.searchParams.get('quality_max');

	const conditions = [
		eq(inventoryItems.userId, locals.user!.id),
		eq(inventoryItems.corpId, locals.corp!.id),
		activeInventory
	];

	if (q) conditions.push(like(inventoryItems.name, `%${escapeLike(q)}%`));
	if (location) conditions.push(like(inventoryItems.locationName, `%${escapeLike(location)}%`));
	if (category) conditions.push(eq(inventoryItems.category, category));
	if (qualityMin) conditions.push(gte(inventoryItems.quality, Number(qualityMin)));
	if (qualityMax) conditions.push(lte(inventoryItems.quality, Number(qualityMax)));

	const items = await db
		.select()
		.from(inventoryItems)
		.where(and(...conditions));

	return {
		items,
		filters: {
			q: q ?? '',
			location: location ?? '',
			category: category ?? '',
			qualityMin: qualityMin ?? '',
			qualityMax: qualityMax ?? ''
		}
	};
};
