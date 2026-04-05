import { db } from '$lib/server/db/index.js';
import { inventoryItems, users, itemSectionConfigs } from '$lib/server/db/schema/index.js';
import { activeInventory, escapeLike } from '$lib/server/db/helpers.js';
import { eq, and, like, gte, lte } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const corpId = locals.corp!.id;

	const q = url.searchParams.get('q')?.trim().toLowerCase();
	const category = url.searchParams.get('category');
	const location = url.searchParams.get('location')?.trim().toLowerCase();
	const player = url.searchParams.get('player');
	const qualityMin = url.searchParams.get('quality_min');
	const qualityMax = url.searchParams.get('quality_max');

	const conditions = [
		eq(inventoryItems.corpId, corpId),
		activeInventory
	];

	if (q) conditions.push(like(inventoryItems.name, `%${escapeLike(q)}%`));
	if (category) conditions.push(eq(inventoryItems.category, category));
	if (location) conditions.push(like(inventoryItems.locationName, `%${escapeLike(location)}%`));
	if (player) conditions.push(eq(inventoryItems.userId, player));
	if (qualityMin) conditions.push(gte(inventoryItems.quality, Number(qualityMin)));
	if (qualityMax) conditions.push(lte(inventoryItems.quality, Number(qualityMax)));

	const items = await db
		.select({
			id: inventoryItems.id,
			name: inventoryItems.name,
			category: inventoryItems.category,
			section: inventoryItems.section,
			quantity: inventoryItems.quantity,
			unit: inventoryItems.unit,
			locationName: inventoryItems.locationName,
			quality: inventoryItems.quality,
			userId: inventoryItems.userId,
			username: users.discordUsername,
			userAvatar: users.discordAvatar,
			userDiscordId: users.discordId,
			updatedAt: inventoryItems.updatedAt,
			sectionIcon: itemSectionConfigs.icon
		})
		.from(inventoryItems)
		.innerJoin(users, eq(inventoryItems.userId, users.id))
		.leftJoin(itemSectionConfigs, eq(inventoryItems.section, itemSectionConfigs.section))
		.where(and(...conditions));

	// Get unique players for filter dropdown
	const playerMap = new Map<string, { id: string; username: string }>();
	for (const item of items) {
		if (!playerMap.has(item.userId)) {
			playerMap.set(item.userId, { id: item.userId, username: item.username });
		}
	}

	return {
		items,
		players: [...playerMap.values()],
		filters: { q: q ?? '', category: category ?? '', location: location ?? '', player: player ?? '', qualityMin: qualityMin ?? '', qualityMax: qualityMax ?? '' }
	};
};
