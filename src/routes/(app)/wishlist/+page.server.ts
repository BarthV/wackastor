import { db } from '$lib/server/db/index.js';
import { inventoryItems, reservations, users, commodityUnitConfigs } from '$lib/server/db/schema/index.js';
import { eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const ownerUsers = users;

	const myReservations = await db
		.select({
			id: reservations.id,
			quantity: reservations.quantity,
			status: reservations.status,
			createdAt: reservations.createdAt,
			updatedAt: reservations.updatedAt,
			item: {
				id: inventoryItems.id,
				name: inventoryItems.name,
				locationName: inventoryItems.locationName,
				unit: sql<string>`COALESCE(${commodityUnitConfigs.unit}, ${inventoryItems.unit})`.as('unit'),
				quality: inventoryItems.quality
			},
			owner: {
				id: users.id,
				username: users.discordUsername,
				discordId: users.discordId
			}
		})
		.from(reservations)
		.innerJoin(inventoryItems, eq(reservations.inventoryItemId, inventoryItems.id))
		.innerJoin(users, eq(inventoryItems.userId, users.id))
		.leftJoin(commodityUnitConfigs, eq(inventoryItems.uexCommodityId, commodityUnitConfigs.uexCommodityId))
		.where(eq(reservations.requesterId, locals.user!.id));

	return { myReservations };
};
