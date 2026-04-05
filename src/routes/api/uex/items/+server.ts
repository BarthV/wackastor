import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { uexItems, itemSectionConfigs } from '$lib/server/db/schema/index.js';
import { like, and, eq, or, isNull } from 'drizzle-orm';
import { escapeLike } from '$lib/server/db/helpers.js';
import type { RequestHandler } from './$types';

// Search items by name prefix (autocomplete), excluding disabled sections
export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim().toLowerCase();
	const category = url.searchParams.get('category');
	const section = url.searchParams.get('section');
	const limit = Math.min(Number(url.searchParams.get('limit') ?? 20), 50);

	const conditions = [];
	if (q) {
		conditions.push(like(uexItems.name, `%${escapeLike(q)}%`));
	}
	if (category) {
		conditions.push(eq(uexItems.category, category));
	}
	if (section) {
		conditions.push(eq(uexItems.section, section));
	}

	// Exclude items whose section is explicitly disabled
	conditions.push(
		or(
			isNull(itemSectionConfigs.disabled),
			eq(itemSectionConfigs.disabled, false)
		)
	);

	const results = await db
		.select({
			id: uexItems.id,
			name: uexItems.name,
			category: uexItems.category,
			section: uexItems.section,
			companyName: uexItems.companyName,
			size: uexItems.size,
			quality: uexItems.quality
		})
		.from(uexItems)
		.leftJoin(itemSectionConfigs, eq(uexItems.section, itemSectionConfigs.section))
		.where(and(...conditions))
		.limit(limit);

	return json({ data: results });
};
