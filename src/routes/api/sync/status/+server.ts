import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { uexSyncLog, uexCommodities, uexItems, uexLocations, uexTerminals } from '$lib/server/db/schema/index.js';
import { desc, count } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	// Latest sync per resource
	const recentLogs = await db
		.select()
		.from(uexSyncLog)
		.orderBy(desc(uexSyncLog.syncedAt))
		.limit(20);

	// Record counts per table
	const [commodityCount] = await db.select({ total: count() }).from(uexCommodities);
	const [itemCount] = await db.select({ total: count() }).from(uexItems);
	const [locationCount] = await db.select({ total: count() }).from(uexLocations);
	const [terminalCount] = await db.select({ total: count() }).from(uexTerminals);

	// Group latest sync per resource
	const latestByResource: Record<string, typeof recentLogs[0]> = {};
	for (const log of recentLogs) {
		if (!latestByResource[log.resource]) {
			latestByResource[log.resource] = log;
		}
	}

	return json({
		counts: {
			commodities: commodityCount.total,
			items: itemCount.total,
			locations: locationCount.total,
			terminals: terminalCount.total
		},
		lastSync: latestByResource,
		recentLogs: recentLogs.slice(0, 10)
	});
};
