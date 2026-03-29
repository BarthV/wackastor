import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { uexCommodities, uexItems, commodityUnitConfigs, itemSectionConfigs, commodityQualityConfigs } from '$lib/server/db/schema/index.js';
import { isSuperadmin } from '$lib/server/auth/permissions.js';
import { eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user || !isSuperadmin(locals.user.discordId)) {
		redirect(302, '/');
	}

	const q = url.searchParams.get('q')?.trim().toLowerCase() ?? '';

	const [commodities, rawSections, sectionConfigs, qualityConfigs] = await Promise.all([
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

		db.select().from(itemSectionConfigs),

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
	const sections = rawSections.map((r) => {
		const config = sectionMap.get(r.section);
		return {
			section: r.section,
			category: (config?.category ?? 'item') as 'item' | 'equipment',
			disabled: config?.disabled ?? false,
			icon: config?.icon ?? 'category'
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
