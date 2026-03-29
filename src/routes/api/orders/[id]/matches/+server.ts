import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { orders } from '$lib/server/db/schema/index.js';
import { eq, and, isNull } from 'drizzle-orm';
import { getMatchesWithDetails } from '$lib/server/orders/matcher.js';
import type { RequestHandler } from './$types';

// GET: matches for an order with user details (owner or admin only, corp-scoped)
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user || !locals.corp) {
		return json({ error: 'Non autorise' }, { status: 401 });
	}

	const [order] = await db
		.select()
		.from(orders)
		.where(and(eq(orders.id, params.id), eq(orders.corpId, locals.corp.id), isNull(orders.deletedAt)))
		.limit(1);

	if (!order) {
		return json({ error: 'Commande introuvable' }, { status: 404 });
	}

	const isOwner = order.userId === locals.user.id;
	const isAdmin = locals.corp.role === 'admin';
	if (!isOwner && !isAdmin) {
		return json({ error: 'Acces interdit' }, { status: 403 });
	}

	const matches = await getMatchesWithDetails(params.id);

	return json({ data: matches });
};
