import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { inventoryItems, reservations, users, commodityUnitConfigs } from '$lib/server/db/schema/index.js';
import { activeReservation } from '$lib/server/db/helpers.js';
import { eq, and, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET: list active reservations where current user is the owner
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || !locals.corp) {
		return json({ error: 'Non autorise' }, { status: 401 });
	}

	const rows = await db
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
		.where(and(eq(reservations.ownerId, locals.user.id), activeReservation));

	return json(rows);
};
