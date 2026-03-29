import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { corpRoleBindings } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET: list role bindings for the current corp
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || !locals.corp || locals.corp.role !== 'admin') {
		return json({ error: 'Acces interdit' }, { status: 403 });
	}

	const bindings = await db
		.select()
		.from(corpRoleBindings)
		.where(eq(corpRoleBindings.corpId, locals.corp.id));

	return json({ data: bindings });
};

// POST: add a role binding
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !locals.corp || locals.corp.role !== 'admin') {
		return json({ error: 'Acces interdit' }, { status: 403 });
	}

	const body = await request.json().catch(() => null);
	if (!body?.discordRoleId) {
		return json({ error: 'ID du role Discord requis' }, { status: 400 });
	}

	// Check for duplicate
	const [existing] = await db
		.select()
		.from(corpRoleBindings)
		.where(
			and(
				eq(corpRoleBindings.corpId, locals.corp.id),
				eq(corpRoleBindings.discordRoleId, body.discordRoleId)
			)
		)
		.limit(1);

	if (existing) {
		return json({ error: 'Cette liaison existe deja' }, { status: 409 });
	}

	await db.insert(corpRoleBindings).values({
		id: crypto.randomUUID(),
		corpId: locals.corp.id,
		discordRoleId: body.discordRoleId,
		grantsAdmin: body.grantsAdmin ? 1 : 0
	});

	return json({ success: true });
};

// DELETE: remove a role binding
export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !locals.corp || locals.corp.role !== 'admin') {
		return json({ error: 'Acces interdit' }, { status: 403 });
	}

	const body = await request.json().catch(() => null);
	if (!body?.id) {
		return json({ error: 'ID de liaison requis' }, { status: 400 });
	}

	// Verify the binding belongs to this corp
	const [binding] = await db
		.select()
		.from(corpRoleBindings)
		.where(
			and(eq(corpRoleBindings.id, body.id), eq(corpRoleBindings.corpId, locals.corp.id))
		)
		.limit(1);

	if (!binding) {
		return json({ error: 'Liaison introuvable' }, { status: 404 });
	}

	await db.delete(corpRoleBindings).where(eq(corpRoleBindings.id, body.id));

	return json({ success: true });
};
