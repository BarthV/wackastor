import { db } from '$lib/server/db/index.js';
import {
	uexSyncLog,
	uexCommodities,
	uexItems,
	uexLocations,
	uexTerminals
} from '$lib/server/db/schema/index.js';
import { desc, eq, count } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

const RESOURCES = ['commodities', 'items', 'locations', 'terminals'] as const;

export const load: PageServerLoad = async () => {
	// Get latest sync log entry per resource
	const syncStatus = await Promise.all(
		RESOURCES.map(async (resource) => {
			const [latest] = await db
				.select()
				.from(uexSyncLog)
				.where(eq(uexSyncLog.resource, resource))
				.orderBy(desc(uexSyncLog.syncedAt))
				.limit(1);
			return { resource, latest: latest ?? null };
		})
	);

	// Get record counts per table
	const [commodityCount] = await db.select({ total: count() }).from(uexCommodities);
	const [itemCount] = await db.select({ total: count() }).from(uexItems);
	const [locationCount] = await db.select({ total: count() }).from(uexLocations);
	const [terminalCount] = await db.select({ total: count() }).from(uexTerminals);

	const recordCounts: Record<string, number> = {
		commodities: commodityCount.total,
		items: itemCount.total,
		locations: locationCount.total,
		terminals: terminalCount.total
	};

	return { syncStatus, recordCounts };
};
