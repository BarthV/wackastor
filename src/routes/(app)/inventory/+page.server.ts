import { db } from '$lib/server/db/index.js';
import { inventoryItems, commodityUnitConfigs, reservations, users } from '$lib/server/db/schema/index.js';
import { activeInventory, activeReservation, escapeLike } from '$lib/server/db/helpers.js';
import { eq, and, ilike, gte, lte, sql } from 'drizzle-orm';
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

	if (q) conditions.push(ilike(inventoryItems.name, `%${escapeLike(q)}%`));
	if (location) conditions.push(ilike(inventoryItems.locationName, `%${escapeLike(location)}%`));
	if (category) conditions.push(eq(inventoryItems.category, category));
	if (qualityMin) conditions.push(gte(inventoryItems.quality, Number(qualityMin)));
	if (qualityMax) conditions.push(lte(inventoryItems.quality, Number(qualityMax)));

	const items = await db
		.select({
			id: inventoryItems.id,
			userId: inventoryItems.userId,
			corpId: inventoryItems.corpId,
			uexCommodityId: inventoryItems.uexCommodityId,
			uexItemId: inventoryItems.uexItemId,
			name: inventoryItems.name,
			customName: inventoryItems.customName,
			category: inventoryItems.category,
			section: inventoryItems.section,
			quantity: inventoryItems.quantity,
			unit: sql<string>`COALESCE(${commodityUnitConfigs.unit}, ${inventoryItems.unit})`.as('unit'),
			locationId: inventoryItems.locationId,
			locationType: inventoryItems.locationType,
			locationName: inventoryItems.locationName,
			quality: inventoryItems.quality,
			notes: inventoryItems.notes,
			createdAt: inventoryItems.createdAt,
			updatedAt: inventoryItems.updatedAt,
			deletedAt: inventoryItems.deletedAt
		})
		.from(inventoryItems)
		.leftJoin(commodityUnitConfigs, eq(inventoryItems.uexCommodityId, commodityUnitConfigs.uexCommodityId))
		.where(and(...conditions));

	// Active reservations where current user is the owner
	const attributions = await db
		.select({
			id: reservations.id,
			quantity: reservations.quantity,
			status: reservations.status,
			createdAt: reservations.createdAt,
			item: {
				id: inventoryItems.id,
				name: inventoryItems.name,
				locationName: inventoryItems.locationName,
				unit: sql<string>`COALESCE(${commodityUnitConfigs.unit}, ${inventoryItems.unit})`.as('attr_unit')
			},
			requester: {
				id: users.id,
				username: users.discordUsername,
				discordId: users.discordId
			}
		})
		.from(reservations)
		.innerJoin(inventoryItems, eq(reservations.inventoryItemId, inventoryItems.id))
		.innerJoin(users, eq(reservations.requesterId, users.id))
		.leftJoin(commodityUnitConfigs, eq(inventoryItems.uexCommodityId, commodityUnitConfigs.uexCommodityId))
		.where(and(eq(reservations.ownerId, locals.user!.id), activeReservation));

	return {
		items,
		attributions,
		filters: {
			q: q ?? '',
			location: location ?? '',
			category: category ?? '',
			qualityMin: qualityMin ?? '',
			qualityMax: qualityMax ?? ''
		}
	};
};
