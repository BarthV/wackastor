import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { itemSubcategoryConfigs } from '$lib/server/db/schema/index.js';
import { isSuperadmin } from '$lib/server/auth/permissions.js';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !isSuperadmin(locals.user.discordId)) {
		return json({ error: 'Acces refuse' }, { status: 403 });
	}

	const body = await request.json().catch(() => null);
	if (!body?.category) {
		return json({ error: 'Champ requis: category' }, { status: 400 });
	}

	const values: Record<string, unknown> = { category: body.category };
	const updates: Record<string, unknown> = {};

	if (body.wackCategory !== undefined) { values.wackCategory = body.wackCategory; updates.wackCategory = body.wackCategory; }
	if (body.disabled !== undefined) { values.disabled = body.disabled; updates.disabled = body.disabled; }

	await db
		.insert(itemSubcategoryConfigs)
		.values(values as { category: string; wackCategory: 'item' | 'equipment'; disabled: boolean })
		.onConflictDoUpdate({
			target: itemSubcategoryConfigs.category,
			set: updates
		});

	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !isSuperadmin(locals.user.discordId)) {
		return json({ error: 'Acces refuse' }, { status: 403 });
	}

	const body = await request.json().catch(() => null);
	if (!body?.category) {
		return json({ error: 'Champ requis: category' }, { status: 400 });
	}

	const { eq } = await import('drizzle-orm');
	await db.delete(itemSubcategoryConfigs).where(eq(itemSubcategoryConfigs.category, body.category));

	return json({ success: true });
};
