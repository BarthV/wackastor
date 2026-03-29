import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { orders } from '$lib/server/db/schema/index.js';
import { eq, and, isNull } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// PATCH: update order (status, notes)
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user || !locals.corp) {
		return json({ error: 'Non autorise' }, { status: 401 });
	}

	const [existing] = await db
		.select()
		.from(orders)
		.where(and(eq(orders.id, params.id), eq(orders.corpId, locals.corp.id), isNull(orders.deletedAt)))
		.limit(1);

	if (!existing) {
		return json({ error: 'Commande introuvable' }, { status: 404 });
	}

	const isOwner = existing.userId === locals.user.id;
	const isAdmin = locals.corp.role === 'admin';
	if (!isOwner && !isAdmin) {
		return json({ error: 'Acces interdit' }, { status: 403 });
	}

	const body = await request.json().catch(() => null);
	if (!body) {
		return json({ error: 'Corps de requete invalide' }, { status: 400 });
	}

	// Validate status transitions: users can only set fulfilled or cancelled
	const allowedStatuses = ['fulfilled', 'cancelled'];
	if (body.status !== undefined && !allowedStatuses.includes(body.status)) {
		return json({ error: 'Transition de statut invalide' }, { status: 400 });
	}

	// Validate quantity
	if (body.quantity !== undefined) {
		if (typeof body.quantity !== 'number' || !Number.isFinite(body.quantity) || body.quantity <= 0) {
			return json({ error: 'Quantite invalide' }, { status: 400 });
		}
	}

	const updates: Record<string, unknown> = { updatedAt: Date.now() };
	if (body.status !== undefined) updates.status = body.status;
	if (body.notes !== undefined) updates.notes = body.notes;
	if (body.quantity !== undefined) updates.quantity = body.quantity;
	if (body.quality !== undefined) updates.quality = body.quality;

	await db
		.update(orders)
		.set(updates)
		.where(eq(orders.id, params.id));

	return json({ success: true });
};

// DELETE: soft-delete (cancel) order
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user || !locals.corp) {
		return json({ error: 'Non autorise' }, { status: 401 });
	}

	const [existing] = await db
		.select()
		.from(orders)
		.where(and(eq(orders.id, params.id), eq(orders.corpId, locals.corp.id), isNull(orders.deletedAt)))
		.limit(1);

	if (!existing) {
		return json({ error: 'Commande introuvable' }, { status: 404 });
	}

	const isOwner = existing.userId === locals.user.id;
	const isAdmin = locals.corp.role === 'admin';
	if (!isOwner && !isAdmin) {
		return json({ error: 'Acces interdit' }, { status: 403 });
	}

	await db
		.update(orders)
		.set({ status: 'cancelled', deletedAt: Date.now(), updatedAt: Date.now() })
		.where(eq(orders.id, params.id));

	return json({ success: true });
};
