import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { corpMembers, inventoryItems, orders } from '$lib/server/db/schema/index.js';
import { eq, and, isNull } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// DELETE: remove member with cascade soft-delete of their inventory + orders
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user || !locals.corp || locals.corp.role !== 'admin') {
		return json({ error: 'Acces interdit' }, { status: 403 });
	}

	// Prevent self-deletion
	if (params.id === locals.user.id) {
		return json({ error: 'Vous ne pouvez pas vous supprimer' }, { status: 400 });
	}

	// Find the membership
	const [membership] = await db
		.select()
		.from(corpMembers)
		.where(and(eq(corpMembers.userId, params.id), eq(corpMembers.corpId, locals.corp.id)))
		.limit(1);

	if (!membership) {
		return json({ error: 'Membre introuvable' }, { status: 404 });
	}

	const now = Date.now();

	await db.transaction(async (tx) => {
		// Soft-delete all their inventory items in this corp
		await tx
			.update(inventoryItems)
			.set({ deletedAt: now })
			.where(
				and(
					eq(inventoryItems.userId, params.id),
					eq(inventoryItems.corpId, locals.corp!.id),
					isNull(inventoryItems.deletedAt)
				)
			);

		// Soft-delete all their orders in this corp
		await tx
			.update(orders)
			.set({ status: 'cancelled', deletedAt: now, updatedAt: now })
			.where(
				and(
					eq(orders.userId, params.id),
					eq(orders.corpId, locals.corp!.id),
					isNull(orders.deletedAt)
				)
			);

		// Remove corp membership
		await tx.delete(corpMembers).where(eq(corpMembers.id, membership.id));
	});

	return json({ success: true });
};
