import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { orders } from '$lib/server/db/schema/index.js';
import { eq, and, isNull } from 'drizzle-orm';
import { runMatching } from '$lib/server/orders/matcher.js';
import type { RequestHandler } from './$types';

// GET: list current user's orders
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || !locals.corp) {
		return json({ error: 'Non autorise' }, { status: 401 });
	}

	const items = await db
		.select()
		.from(orders)
		.where(
			and(
				eq(orders.userId, locals.user.id),
				eq(orders.corpId, locals.corp.id),
				isNull(orders.deletedAt)
			)
		);

	return json({ data: items });
};

// POST: create a new order + run auto-matching
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !locals.corp) {
		return json({ error: 'Non autorise' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	if (!body || !body.name) {
		return json({ error: 'Nom requis' }, { status: 400 });
	}

	if (body.quantity !== undefined) {
		if (typeof body.quantity !== 'number' || !Number.isFinite(body.quantity) || body.quantity <= 0) {
			return json({ error: 'Quantite invalide' }, { status: 400 });
		}
	}

	const now = Date.now();
	const order = {
		id: crypto.randomUUID(),
		userId: locals.user.id,
		corpId: locals.corp.id,
		name: body.name,
		uexCommodityId: body.uexCommodityId ?? null,
		uexItemId: body.uexItemId ?? null,
		category: body.category ?? 'commodity',
		quantity: body.quantity ?? 1,
		unit: body.unit ?? 'SCU',
		quality: body.quality ?? 0,
		locationName: body.locationName ?? null,
		status: 'open' as const,
		matchCount: 0,
		notes: body.notes ?? null,
		createdAt: now,
		updatedAt: now,
		deletedAt: null
	};

	await db.insert(orders).values(order);

	// Auto-matching runs on order creation
	const matchResult = await runMatching(order.id);

	return json({ data: { ...order, matchCount: matchResult.matchCount } }, { status: 201 });
};
