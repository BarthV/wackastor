import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { uexCommodities, uexItems, commodityUnitConfigs, itemSectionConfigs, itemSubcategoryConfigs, commodityQualityConfigs } from '$lib/server/db/schema/index.js';
import { isSuperadmin } from '$lib/server/auth/permissions.js';
import { eq, sql, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user || !isSuperadmin(locals.user.discordId)) {
		redirect(302, '/');
	}

	const q = url.searchParams.get('q')?.trim().toLowerCase() ?? '';

	const [commodities, rawSections, rawSubcategories, sectionConfigs, subcategoryConfigs, qualityConfigs] = await Promise.all([
		db
			.select({
				id: uexCommodities.id,
				name: uexCommodities.name,
				code: uexCommodities.code,
				kind: uexCommodities.kind,
				unit: commodityUnitConfigs.unit
			})
			.from(uexCommodities)
			.leftJoin(commodityUnitConfigs, eq(uexCommodities.id, commodityUnitConfigs.uexCommodityId))
			.orderBy(uexCommodities.name)
			.limit(200),

		db
			.selectDistinct({ section: uexItems.section })
			.from(uexItems)
			.where(sql`${uexItems.section} != ''`)
			.orderBy(uexItems.section),

		db
			.selectDistinct({ section: uexItems.section, category: uexItems.category })
			.from(uexItems)
			.where(and(sql`${uexItems.section} != ''`, sql`${uexItems.category} != ''`))
			.orderBy(uexItems.section, uexItems.category),

		db.select().from(itemSectionConfigs),

		db.select().from(itemSubcategoryConfigs),

		db
			.select({
				id: uexCommodities.id,
				name: uexCommodities.name,
				kind: uexCommodities.kind
			})
			.from(commodityQualityConfigs)
			.innerJoin(uexCommodities, eq(commodityQualityConfigs.uexCommodityId, uexCommodities.id))
			.orderBy(uexCommodities.name)
	]);

	const sectionMap = new Map(sectionConfigs.map((s) => [s.section, s]));
	const subcategoryMap = new Map(subcategoryConfigs.map((s) => [s.category, s]));

	// Group subcategories by section
	const subcategoriesBySection = new Map<string, { category: string; wackCategory: 'item' | 'equipment'; disabled: boolean; hasOverride: boolean }[]>();
	for (const { section, category } of rawSubcategories) {
		if (!section || !category) continue;
		if (!subcategoriesBySection.has(section)) subcategoriesBySection.set(section, []);
		const override = subcategoryMap.get(category);
		subcategoriesBySection.get(section)!.push({
			category,
			wackCategory: (override?.wackCategory ?? 'item') as 'item' | 'equipment',
			disabled: override?.disabled ?? false,
			hasOverride: !!override
		});
	}

	const sections = rawSections.map((r) => {
		const config = sectionMap.get(r.section);
		return {
			section: r.section,
			category: (config?.category ?? 'item') as 'item' | 'equipment',
			disabled: config?.disabled ?? false,
			icon: config?.icon ?? 'category',
			subcategories: subcategoriesBySection.get(r.section) ?? []
		};
	});

	const filtered = q
		? commodities.filter((c) => c.name.toLowerCase().includes(q))
		: commodities;

	return {
		commodities: filtered.map((c) => ({ ...c, unit: c.unit ?? 'SCU' })),
		sections,
		qualityCommodities: qualityConfigs,
		q
	};
};
