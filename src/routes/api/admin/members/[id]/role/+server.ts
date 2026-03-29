import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { corpMembers } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// POST: change a member's role
export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user || !locals.corp || locals.corp.role !== 'admin') {
		return json({ error: 'Acces interdit' }, { status: 403 });
	}

	const body = await request.json().catch(() => null);
	if (!body || !['admin', 'member'].includes(body.role)) {
		return json({ error: 'Role invalide' }, { status: 400 });
	}

	// Find the membership for this user in the current corp
	const [membership] = await db
		.select()
		.from(corpMembers)
		.where(and(eq(corpMembers.userId, params.id), eq(corpMembers.corpId, locals.corp.id)))
		.limit(1);

	if (!membership) {
		return json({ error: 'Membre introuvable' }, { status: 404 });
	}

	// Prevent self-demotion
	if (params.id === locals.user.id && body.role !== 'admin') {
		return json({ error: 'Vous ne pouvez pas vous retrograder' }, { status: 400 });
	}

	await db
		.update(corpMembers)
		.set({ role: body.role })
		.where(eq(corpMembers.id, membership.id));

	return json({ success: true });
};
