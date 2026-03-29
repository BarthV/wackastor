import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { inventoryItems } from '$lib/server/db/schema/index.js';
import { activeInventory } from '$lib/server/db/helpers.js';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET: list current user's inventory
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || !locals.corp) {
		return json({ error: 'Non autorise' }, { status: 401 });
	}

	const items = await db
		.select()
		.from(inventoryItems)
		.where(
			and(
				eq(inventoryItems.userId, locals.user.id),
				eq(inventoryItems.corpId, locals.corp.id),
				activeInventory
			)
		);

	return json({ data: items });
};

// POST: create a new inventory item
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !locals.corp) {
		return json({ error: 'Non autorise' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	if (!body || !body.name) {
		return json({ error: 'Nom requis' }, { status: 400 });
	}

	const now = Date.now();
	const item = {
		id: crypto.randomUUID(),
		userId: locals.user.id,
		corpId: locals.corp.id,
		uexCommodityId: body.uexCommodityId ?? null,
		uexItemId: body.uexItemId ?? null,
		name: body.name,
		customName: body.customName ?? null,
		category: body.category ?? 'commodity',
		section: body.section ?? '',
		quantity: body.quantity ?? 1,
		unit: body.unit ?? 'SCU',
		locationId: body.locationId ?? null,
		locationType: body.locationType ?? null,
		locationName: body.locationName ?? '',
		quality: body.quality ?? 0,
		notes: body.notes ?? null,
		createdAt: now,
		updatedAt: now,
		deletedAt: null
	};

	await db.insert(inventoryItems).values(item);

	return json({ data: item }, { status: 201 });
};
