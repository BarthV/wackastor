import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { inventoryItems, reservations } from '$lib/server/db/schema/index.js';
import { activeReservation } from '$lib/server/db/helpers.js';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// PATCH: update reservation status (fulfilled or cancelled)
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user || !locals.corp) {
		return json({ error: 'Non autorise' }, { status: 401 });
	}

	const [reservation] = await db
		.select()
		.from(reservations)
		.where(eq(reservations.id, params.id))
		.limit(1);

	if (!reservation) {
		return json({ error: 'Reservation introuvable' }, { status: 404 });
	}

	if (reservation.corpId !== locals.corp.id) {
		return json({ error: 'Acces interdit' }, { status: 403 });
	}

	const body = await request.json().catch(() => null);
	if (!body || !body.status || !['fulfilled', 'cancelled'].includes(body.status)) {
		return json({ error: 'Statut invalide' }, { status: 400 });
	}

	const isRequester = reservation.requesterId === locals.user.id;
	const isOwner = reservation.ownerId === locals.user.id;
	const isAdmin = locals.corp.role === 'admin';

	if (body.status === 'fulfilled' && !isOwner && !isAdmin) {
		return json({ error: 'Seul le proprietaire peut valider une reservation' }, { status: 403 });
	}
	if (body.status === 'cancelled' && !isRequester && !isAdmin) {
		return json({ error: 'Seul le demandeur peut annuler une reservation' }, { status: 403 });
	}

	if (reservation.status !== 'active') {
		return json({ error: 'Reservation deja traitee' }, { status: 400 });
	}

	if (body.status === 'fulfilled') {
		// Transaction: set fulfilled + decrement item quantity
		await db.transaction(async (tx) => {
			const [item] = await tx
				.select()
				.from(inventoryItems)
				.where(eq(inventoryItems.id, reservation.inventoryItemId))
				.limit(1);

			if (!item) throw new Error('Objet introuvable');

			const newQty = item.quantity - reservation.quantity;
			if (newQty < 0) throw new Error('Quantite insuffisante pour valider la reservation');

			await tx.update(inventoryItems)
				.set({ quantity: newQty, updatedAt: Date.now() })
				.where(eq(inventoryItems.id, item.id));

			await tx.update(reservations)
				.set({ status: 'fulfilled', updatedAt: Date.now() })
				.where(eq(reservations.id, params.id));
		});
	} else {
		await db.update(reservations)
			.set({ status: 'cancelled', updatedAt: Date.now() })
			.where(eq(reservations.id, params.id));
	}

	return json({ success: true });
};

// DELETE: cancel reservation (requester or admin only)
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user || !locals.corp) {
		return json({ error: 'Non autorise' }, { status: 401 });
	}

	const [reservation] = await db
		.select()
		.from(reservations)
		.where(eq(reservations.id, params.id))
		.limit(1);

	if (!reservation) {
		return json({ error: 'Reservation introuvable' }, { status: 404 });
	}

	if (reservation.corpId !== locals.corp.id) {
		return json({ error: 'Acces interdit' }, { status: 403 });
	}

	const isRequester = reservation.requesterId === locals.user.id;
	const isAdmin = locals.corp.role === 'admin';

	if (!isRequester && !isAdmin) {
		return json({ error: 'Acces interdit' }, { status: 403 });
	}

	await db.update(reservations)
		.set({ status: 'cancelled', updatedAt: Date.now() })
		.where(eq(reservations.id, params.id));

	return json({ success: true });
};
