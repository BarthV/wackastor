import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { inventoryItems, reservations } from '$lib/server/db/schema/index.js';
import { activeInventory, activeReservation } from '$lib/server/db/helpers.js';
import { eq, and, sum } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// PATCH: update inventory item (quantity, location, notes, move)
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user || !locals.corp) {
		return json({ error: 'Non autorise' }, { status: 401 });
	}

	const [existing] = await db
		.select()
		.from(inventoryItems)
		.where(and(eq(inventoryItems.id, params.id), activeInventory))
		.limit(1);

	if (!existing) {
		return json({ error: 'Objet introuvable' }, { status: 404 });
	}

	// Only owner or admin can edit
	const isOwner = existing.userId === locals.user.id;
	const isAdmin = locals.corp.role === 'admin';
	if (!isOwner && !isAdmin) {
		return json({ error: 'Acces interdit' }, { status: 403 });
	}

	const body = await request.json().catch(() => null);
	if (!body) {
		return json({ error: 'Corps de requete invalide' }, { status: 400 });
	}

	const updates: Record<string, unknown> = { updatedAt: Date.now() };
	if (body.quantity !== undefined) updates.quantity = body.quantity;
	if (body.locationId !== undefined) updates.locationId = body.locationId;
	if (body.locationType !== undefined) updates.locationType = body.locationType;
	if (body.locationName !== undefined) updates.locationName = body.locationName;
	if (body.notes !== undefined) updates.notes = body.notes;
	if (body.name !== undefined) updates.name = body.name;
	if (body.quality !== undefined) updates.quality = body.quality;

	await db
		.update(inventoryItems)
		.set(updates)
		.where(eq(inventoryItems.id, params.id));

	// If quantity was updated, check if active reservations exceed new quantity
	if (body.quantity !== undefined) {
		const [sumResult] = await db
			.select({ total: sum(reservations.quantity) })
			.from(reservations)
			.where(and(eq(reservations.inventoryItemId, params.id), activeReservation));
		const totalReserved = Number(sumResult?.total ?? 0);
		if (body.quantity < totalReserved) {
			// Cancel all active reservations on this item
			await db
				.update(reservations)
				.set({ status: 'cancelled', updatedAt: Date.now() })
				.where(and(eq(reservations.inventoryItemId, params.id), activeReservation));
		}
	}

	return json({ success: true });
};

// DELETE: soft-delete inventory item
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user || !locals.corp) {
		return json({ error: 'Non autorise' }, { status: 401 });
	}

	const [existing] = await db
		.select()
		.from(inventoryItems)
		.where(and(eq(inventoryItems.id, params.id), activeInventory))
		.limit(1);

	if (!existing) {
		return json({ error: 'Objet introuvable' }, { status: 404 });
	}

	const isOwner = existing.userId === locals.user.id;
	const isAdmin = locals.corp.role === 'admin';
	if (!isOwner && !isAdmin) {
		return json({ error: 'Acces interdit' }, { status: 403 });
	}

	await db
		.update(inventoryItems)
		.set({ deletedAt: Date.now() })
		.where(eq(inventoryItems.id, params.id));

	// Cancel all active reservations on this item
	await db
		.update(reservations)
		.set({ status: 'cancelled', updatedAt: Date.now() })
		.where(and(eq(reservations.inventoryItemId, params.id), activeReservation));

	return json({ success: true });
};
