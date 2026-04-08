import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { inventoryItems, reservations, users, commodityUnitConfigs } from '$lib/server/db/schema/index.js';
import { activeInventory, activeReservation, getReservedQuantity } from '$lib/server/db/helpers.js';
import { eq, and, sum } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// POST: create a new reservation
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !locals.corp) {
		return json({ error: 'Non autorise' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	if (!body || !body.inventoryItemId || typeof body.quantity !== 'number' || body.quantity <= 0) {
		return json({ error: 'Corps de requete invalide' }, { status: 400 });
	}

	// Validate item exists, not deleted, same corp
	const [item] = await db
		.select()
		.from(inventoryItems)
		.where(and(eq(inventoryItems.id, body.inventoryItemId), activeInventory))
		.limit(1);

	if (!item) {
		return json({ error: 'Objet introuvable' }, { status: 404 });
	}

	if (item.corpId !== locals.corp.id) {
		return json({ error: 'Objet hors corporation' }, { status: 403 });
	}

	if (item.userId === locals.user.id) {
		return json({ error: 'Impossible de reserver votre propre objet' }, { status: 400 });
	}

	// Transaction: compute available, validate, insert
	let reservation: { id: string; inventoryItemId: string; quantity: number; status: string; createdAt: number };
	try {
		reservation = await db.transaction(async (tx) => {
			const [sumResult] = await tx
				.select({ total: sum(reservations.quantity) })
				.from(reservations)
				.where(and(eq(reservations.inventoryItemId, item.id), activeReservation));

			const reserved = Number(sumResult?.total ?? 0);
			const available = item.quantity - reserved;

			if (body.quantity > available) {
				throw new Error(`Quantite indisponible. Disponible: ${available}`);
			}

			const now = Date.now();
			const id = crypto.randomUUID();

			await tx.insert(reservations).values({
				id,
				inventoryItemId: item.id,
				requesterId: locals.user!.id,
				ownerId: item.userId,
				corpId: locals.corp!.id,
				quantity: body.quantity,
				status: 'active',
				createdAt: now,
				updatedAt: now
			});

			return { id, inventoryItemId: item.id, quantity: body.quantity, status: 'active', createdAt: now };
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Erreur lors de la reservation';
		return json({ error: msg }, { status: 400 });
	}

	return json(reservation, { status: 201 });
};

// GET: list current user's reservations as requester
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || !locals.corp) {
		return json({ error: 'Non autorise' }, { status: 401 });
	}

	const requesterAlias = users;
	const ownerAlias = db.$with('owner').as(
		db.select().from(users)
	);

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
			owner: {
				id: inventoryItems.userId,
				username: users.discordUsername,
				discordId: users.discordId
			}
		})
		.from(reservations)
		.innerJoin(inventoryItems, eq(reservations.inventoryItemId, inventoryItems.id))
		.innerJoin(users, eq(inventoryItems.userId, users.id))
		.leftJoin(commodityUnitConfigs, eq(inventoryItems.uexCommodityId, commodityUnitConfigs.uexCommodityId))
		.where(eq(reservations.requesterId, locals.user.id));

	return json(rows);
};
