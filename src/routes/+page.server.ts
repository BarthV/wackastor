import { db } from '$lib/server/db/index.js';
import { inventoryItems, orders } from '$lib/server/db/schema/index.js';
import { eq, and, isNull, desc, count, sum, avg, inArray } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || !locals.corp) {
		return { topItems: null, stats: null };
	}

	const corpId = locals.corp.id;
	const baseWhere = and(eq(inventoryItems.corpId, corpId), isNull(inventoryItems.deletedAt));

	const [topItems, itemCount, orderCount, scuResult, qualityResult] = await Promise.all([
		// Top 10 items by quantity
		db.select({
			name: inventoryItems.name,
			quantity: inventoryItems.quantity,
			unit: inventoryItems.unit,
			locationName: inventoryItems.locationName,
			quality: inventoryItems.quality,
			category: inventoryItems.category
		})
			.from(inventoryItems)
			.where(baseWhere)
			.orderBy(desc(inventoryItems.quantity))
			.limit(10),

		// Total item count
		db.select({ value: count() })
			.from(inventoryItems)
			.where(baseWhere),

		// Active orders count
		db.select({ value: count() })
			.from(orders)
			.where(and(
				eq(orders.corpId, corpId),
				isNull(orders.deletedAt),
				inArray(orders.status, ['open', 'matched'])
			)),

		// Total SCU (only SCU-unit items)
		db.select({ value: sum(inventoryItems.quantity) })
			.from(inventoryItems)
			.where(and(baseWhere, eq(inventoryItems.unit, 'SCU'))),

		// Average quality (only commodities with quality > 0)
		db.select({ value: avg(inventoryItems.quality) })
			.from(inventoryItems)
			.where(and(baseWhere, eq(inventoryItems.category, 'commodity')))
	]);

	return {
		topItems,
		stats: {
			itemCount: itemCount[0]?.value ?? 0,
			orderCount: orderCount[0]?.value ?? 0,
			totalScu: Number(scuResult[0]?.value ?? 0),
			avgQuality: qualityResult[0]?.value ? Math.round(Number(qualityResult[0].value)) : null
		}
	};
};
