import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { inventoryItems, users } from '$lib/server/db/schema/index.js';
import { activeInventory, escapeLike } from '$lib/server/db/helpers.js';
import { eq, and, like } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET: aggregated corp stock with filters
export const GET: RequestHandler = async ({ params, url, locals }) => {
	if (!locals.user || !locals.corp) {
		return json({ error: 'Non autorise' }, { status: 401 });
	}

	// Verify user belongs to this corp
	if (locals.corp.id !== params.corpId) {
		return json({ error: 'Acces interdit' }, { status: 403 });
	}

	// Filter params
	const q = url.searchParams.get('q')?.trim().toLowerCase();
	const category = url.searchParams.get('category');
	const location = url.searchParams.get('location');
	const player = url.searchParams.get('player');

	const conditions = [
		eq(inventoryItems.corpId, params.corpId),
		activeInventory
	];

	if (q) {
		conditions.push(like(inventoryItems.name, `%${escapeLike(q)}%`));
	}
	if (category) {
		conditions.push(eq(inventoryItems.category, category));
	}
	if (location) {
		conditions.push(like(inventoryItems.locationName, `%${escapeLike(location)}%`));
	}
	if (player) {
		conditions.push(eq(inventoryItems.userId, player));
	}

	const items = await db
		.select({
			id: inventoryItems.id,
			name: inventoryItems.name,
			category: inventoryItems.category,
			section: inventoryItems.section,
			quantity: inventoryItems.quantity,
			unit: inventoryItems.unit,
			locationName: inventoryItems.locationName,
			notes: inventoryItems.notes,
			userId: inventoryItems.userId,
			username: users.discordUsername,
			userAvatar: users.discordAvatar,
			userDiscordId: users.discordId,
			updatedAt: inventoryItems.updatedAt
		})
		.from(inventoryItems)
		.innerJoin(users, eq(inventoryItems.userId, users.id))
		.where(and(...conditions));

	return json({ data: items });
};
