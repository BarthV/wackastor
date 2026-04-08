import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { inventoryItems, reservations } from '$lib/server/db/schema/index.js';
import { eq, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// POST: bulk fulfill reservations (owner only)
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !locals.corp) {
		return json({ error: 'Non autorise' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	if (!body || !Array.isArray(body.ids) || body.ids.length === 0) {
		return json({ error: 'Corps de requete invalide' }, { status: 400 });
	}

	const ids: string[] = body.ids;

	// Verify all reservations belong to this owner and are active
	const rows = await db
		.select()
		.from(reservations)
		.where(inArray(reservations.id, ids));

	if (rows.length !== ids.length) {
		return json({ error: 'Certaines reservations sont introuvables' }, { status: 404 });
	}

	for (const r of rows) {
		if (r.ownerId !== locals.user.id) {
			return json({ error: 'Acces interdit: vous n\'etes pas proprietaire de toutes les reservations' }, { status: 403 });
		}
		if (r.status !== 'active') {
			return json({ error: 'Certaines reservations ne sont plus actives' }, { status: 400 });
		}
	}

	// Transaction: for each reservation, set fulfilled + decrement item quantity
	await db.transaction(async (tx) => {
		for (const r of rows) {
			const [item] = await tx
				.select()
				.from(inventoryItems)
				.where(eq(inventoryItems.id, r.inventoryItemId))
				.limit(1);

			if (!item) throw new Error(`Objet ${r.inventoryItemId} introuvable`);

			const newQty = item.quantity - r.quantity;
			if (newQty < 0) throw new Error(`Quantite insuffisante pour la reservation ${r.id}`);

			await tx.update(inventoryItems)
				.set({ quantity: newQty, updatedAt: Date.now() })
				.where(eq(inventoryItems.id, item.id));

			await tx.update(reservations)
				.set({ status: 'fulfilled', updatedAt: Date.now() })
				.where(eq(reservations.id, r.id));
		}
	});

	return json({ success: true, count: ids.length });
};
