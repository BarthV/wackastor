import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { uexLocations, uexTerminals } from '$lib/server/db/schema/index.js';
import { ilike, and, eq, or } from 'drizzle-orm';
import { escapeLike } from '$lib/server/db/helpers.js';
import type { RequestHandler } from './$types';

// Search locations and terminals by name prefix (autocomplete)
export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim().toLowerCase();
	const type = url.searchParams.get('type');
	const includeTerminals = url.searchParams.get('terminals') !== 'false';
	const limit = Math.min(Number(url.searchParams.get('limit') ?? 20), 50);

	// Search locations
	const locationConditions = [];
	if (q) {
		locationConditions.push(ilike(uexLocations.name, `${escapeLike(q)}%`));
	}
	if (type) {
		locationConditions.push(eq(uexLocations.type, type as 'planet' | 'moon' | 'space_station' | 'city' | 'outpost'));
	}

	const locations = await db
		.select({
			id: uexLocations.id,
			type: uexLocations.type,
			name: uexLocations.name,
			starSystemName: uexLocations.starSystemName,
			planetName: uexLocations.planetName,
			moonName: uexLocations.moonName
		})
		.from(uexLocations)
		.where(locationConditions.length > 0 ? and(...locationConditions) : undefined)
		.limit(limit);

	// Optionally search terminals too
	let terminals: Array<{ id: number; name: string; fullname: string; type: string; starSystemName: string; planetName: string }> = [];
	if (includeTerminals && q) {
		terminals = await db
			.select({
				id: uexTerminals.id,
				name: uexTerminals.name,
				fullname: uexTerminals.fullname,
				type: uexTerminals.type,
				starSystemName: uexTerminals.starSystemName,
				planetName: uexTerminals.planetName
			})
			.from(uexTerminals)
			.where(or(ilike(uexTerminals.name, `${escapeLike(q)}%`), ilike(uexTerminals.fullname, `${escapeLike(q)}%`)))
			.limit(limit);
	}

	return json({
		data: [
			...locations.map((l) => ({ ...l, _kind: 'location' as const })),
			...terminals.map((t) => ({ ...t, _kind: 'terminal' as const }))
		]
	});
};
