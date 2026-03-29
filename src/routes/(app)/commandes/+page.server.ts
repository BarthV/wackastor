import { db } from '$lib/server/db/index.js';
import { orders } from '$lib/server/db/schema/index.js';
import { eq, and, isNull } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const items = await db
		.select()
		.from(orders)
		.where(
			and(
				eq(orders.userId, locals.user!.id),
				eq(orders.corpId, locals.corp!.id),
				isNull(orders.deletedAt)
			)
		);

	return { orders: items };
};
