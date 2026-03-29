import { db } from '$lib/server/db/index.js';
import { inventoryItems, orders, users } from '$lib/server/db/schema/index.js';
import { activeInventory } from '$lib/server/db/helpers.js';
import { eq, and, isNull, count, sum, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const corpId = locals.corp!.id;
	const activeItems = and(eq(inventoryItems.corpId, corpId), activeInventory);
	const activeOrders = and(eq(orders.corpId, corpId), isNull(orders.deletedAt));

	const [itemsByCategory, topLocations, itemsByMember, ordersByStatus, ordersByMember] =
		await Promise.all([
			db
				.select({
					category: inventoryItems.category,
					count: count(),
					totalQty: sum(inventoryItems.quantity)
				})
				.from(inventoryItems)
				.where(activeItems)
				.groupBy(inventoryItems.category),

			db
				.select({
					locationName: inventoryItems.locationName,
					count: count(),
					totalQty: sum(inventoryItems.quantity)
				})
				.from(inventoryItems)
				.where(and(activeItems, sql`${inventoryItems.locationName} != ''`))
				.groupBy(inventoryItems.locationName)
				.orderBy(sql`count(*) desc`)
				.limit(5),

			db
				.select({
					userId: inventoryItems.userId,
					username: users.discordUsername,
					avatar: users.discordAvatar,
					discordId: users.discordId,
					itemCount: count(),
					totalQty: sum(inventoryItems.quantity)
				})
				.from(inventoryItems)
				.innerJoin(users, eq(inventoryItems.userId, users.id))
				.where(activeItems)
				.groupBy(inventoryItems.userId)
				.orderBy(sql`count(*) desc`),

			db
				.select({ status: orders.status, count: count() })
				.from(orders)
				.where(activeOrders)
				.groupBy(orders.status),

			db
				.select({
					userId: orders.userId,
					username: users.discordUsername,
					orderCount: count()
				})
				.from(orders)
				.innerJoin(users, eq(orders.userId, users.id))
				.where(activeOrders)
				.groupBy(orders.userId)
				.orderBy(sql`count(*) desc`)
		]);

	const totalItems = itemsByCategory.reduce((acc, c) => acc + c.count, 0);
	const totalScu = itemsByCategory.reduce((acc, c) => acc + Number(c.totalQty ?? 0), 0);
	const totalOrders = ordersByStatus.reduce((acc, s) => acc + s.count, 0);

	// Merge member stats
	const memberMap = new Map<string, { username: string; avatar: string | null; discordId: string; itemCount: number; totalQty: number; orderCount: number }>();
	for (const m of itemsByMember) {
		memberMap.set(m.userId, {
			username: m.username,
			avatar: m.avatar,
			discordId: m.discordId,
			itemCount: m.itemCount,
			totalQty: Number(m.totalQty ?? 0),
			orderCount: 0
		});
	}
	for (const o of ordersByMember) {
		const existing = memberMap.get(o.userId);
		if (existing) {
			existing.orderCount = o.orderCount;
		} else {
			memberMap.set(o.userId, { username: o.username, avatar: null, discordId: o.userId, itemCount: 0, totalQty: 0, orderCount: o.orderCount });
		}
	}

	return {
		inventory: {
			totalItems,
			totalScu,
			byCategory: itemsByCategory.map((c) => ({ ...c, totalQty: Number(c.totalQty ?? 0) })),
			topLocations: topLocations.map((l) => ({ ...l, totalQty: Number(l.totalQty ?? 0) }))
		},
		orders: {
			total: totalOrders,
			byStatus: ordersByStatus
		},
		members: [...memberMap.values()].sort((a, b) => b.itemCount - a.itemCount)
	};
};
