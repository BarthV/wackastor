import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { itemSectionConfigs } from '$lib/server/db/schema/index.js';
import { isSuperadmin } from '$lib/server/auth/permissions.js';
import type { RequestHandler } from './$types';

// PUT: upsert category, disabled, and/or icon for a UEX item section
export const PUT: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !isSuperadmin(locals.user.discordId)) {
		return json({ error: 'Acces refuse' }, { status: 403 });
	}

	const body = await request.json().catch(() => null);
	if (!body?.section) {
		return json({ error: 'Champ requis: section' }, { status: 400 });
	}

	const values: {
		section: string;
		category?: 'item' | 'equipment';
		disabled?: boolean;
		icon?: string;
	} = { section: body.section };
	const updates: Record<string, unknown> = {};

	if (body.category !== undefined) { values.category = body.category; updates.category = body.category; }
	if (body.disabled !== undefined) { values.disabled = body.disabled; updates.disabled = body.disabled; }
	if (body.icon !== undefined) { values.icon = body.icon; updates.icon = body.icon; }

	await db
		.insert(itemSectionConfigs)
		.values({ section: body.section, ...values })
		.onConflictDoUpdate({
			target: itemSectionConfigs.section,
			set: updates
		});

	return json({ success: true });
};
