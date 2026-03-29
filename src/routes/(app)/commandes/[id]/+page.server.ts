import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { orders } from '$lib/server/db/schema/index.js';
import { eq, and, isNull } from 'drizzle-orm';
import { getMatchesWithDetails } from '$lib/server/orders/matcher.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const [order] = await db
		.select()
		.from(orders)
		.where(and(eq(orders.id, params.id), eq(orders.corpId, locals.corp!.id), isNull(orders.deletedAt)))
		.limit(1);

	if (!order) {
		error(404, 'Commande introuvable');
	}

	// Only owner or admin can view
	const isOwner = order.userId === locals.user!.id;
	const isAdmin = locals.corp!.role === 'admin';
	if (!isOwner && !isAdmin) {
		error(403, 'Acces interdit');
	}

	const matches = await getMatchesWithDetails(params.id);

	return { order, matches };
};
