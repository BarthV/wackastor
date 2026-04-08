import { db } from '$lib/server/db/index.js';
import { inventoryItems, users, itemSectionConfigs, commodityUnitConfigs, reservations } from '$lib/server/db/schema/index.js';
import { activeInventory, activeReservation, escapeLike, getReservedQuantities } from '$lib/server/db/helpers.js';
import { eq, and, ilike, gte, lte, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const corpId = locals.corp!.id;

	const q = url.searchParams.get('q')?.trim().toLowerCase();
	const category = url.searchParams.get('category');
	const location = url.searchParams.get('location')?.trim().toLowerCase();
	const player = url.searchParams.get('player');
	const qualityMin = url.searchParams.get('quality_min');
	const qualityMax = url.searchParams.get('quality_max');

	const conditions = [
		eq(inventoryItems.corpId, corpId),
		activeInventory
	];

	if (q) conditions.push(ilike(inventoryItems.name, `%${escapeLike(q)}%`));
	if (category) conditions.push(eq(inventoryItems.category, category));
	if (location) conditions.push(ilike(inventoryItems.locationName, `%${escapeLike(location)}%`));
	if (player) conditions.push(eq(inventoryItems.userId, player));
	if (qualityMin) conditions.push(gte(inventoryItems.quality, Number(qualityMin)));
	if (qualityMax) conditions.push(lte(inventoryItems.quality, Number(qualityMax)));

	const items = await db
		.select({
			id: inventoryItems.id,
			name: inventoryItems.name,
			category: inventoryItems.category,
			section: inventoryItems.section,
			quantity: inventoryItems.quantity,
			unit: sql<string>`COALESCE(${commodityUnitConfigs.unit}, ${inventoryItems.unit})`.as('unit'),
			locationName: inventoryItems.locationName,
			quality: inventoryItems.quality,
			userId: inventoryItems.userId,
			username: users.discordUsername,
			userAvatar: users.discordAvatar,
			userDiscordId: users.discordId,
			updatedAt: inventoryItems.updatedAt,
			sectionIcon: itemSectionConfigs.icon
		})
		.from(inventoryItems)
		.innerJoin(users, eq(inventoryItems.userId, users.id))
		.leftJoin(itemSectionConfigs, eq(inventoryItems.section, itemSectionConfigs.section))
		.leftJoin(commodityUnitConfigs, eq(inventoryItems.uexCommodityId, commodityUnitConfigs.uexCommodityId))
		.where(and(...conditions));

	// Get unique players for filter dropdown
	const playerMap = new Map<string, { id: string; username: string }>();
	for (const item of items) {
		if (!playerMap.has(item.userId)) {
			playerMap.set(item.userId, { id: item.userId, username: item.username });
		}
	}

	// Batch fetch reserved quantities for all items
	const itemIds = items.map((i) => i.id);
	const reservedMap = await getReservedQuantities(itemIds);

	// All active reservations in the corp for the RESERVATIONS tab
	const requesterUsers = alias(users, 'requester_users');
	const ownerUsers = alias(users, 'owner_users');

	const allReservations = await db
		.select({
			id: reservations.id,
			quantity: reservations.quantity,
			status: reservations.status,
			createdAt: reservations.createdAt,
			itemName: inventoryItems.name,
			locationName: inventoryItems.locationName,
			unit: sql<string>`COALESCE(${commodityUnitConfigs.unit}, ${inventoryItems.unit})`.as('res_unit'),
			requesterUsername: requesterUsers.discordUsername,
			ownerUsername: ownerUsers.discordUsername
		})
		.from(reservations)
		.innerJoin(inventoryItems, eq(reservations.inventoryItemId, inventoryItems.id))
		.leftJoin(commodityUnitConfigs, eq(inventoryItems.uexCommodityId, commodityUnitConfigs.uexCommodityId))
		.leftJoin(requesterUsers, eq(requesterUsers.id, reservations.requesterId))
		.leftJoin(ownerUsers, eq(ownerUsers.id, reservations.ownerId))
		.where(and(eq(reservations.corpId, corpId), activeReservation));

	const itemsWithReserved = items.map((item) => ({
		...item,
		reservedQuantity: reservedMap.get(item.id) ?? 0
	}));

	return {
		items: itemsWithReserved,
		players: [...playerMap.values()],
		allReservations,
		filters: { q: q ?? '', category: category ?? '', location: location ?? '', player: player ?? '', qualityMin: qualityMin ?? '', qualityMax: qualityMax ?? '' }
	};
};
