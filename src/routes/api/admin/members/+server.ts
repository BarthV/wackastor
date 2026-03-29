import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { corpMembers, users } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET: list all corp members with user details
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || !locals.corp || locals.corp.role !== 'admin') {
		return json({ error: 'Acces interdit' }, { status: 403 });
	}

	const members = await db
		.select({
			memberId: corpMembers.id,
			userId: corpMembers.userId,
			role: corpMembers.role,
			joinedAt: corpMembers.joinedAt,
			username: users.discordUsername,
			discordId: users.discordId,
			avatar: users.discordAvatar
		})
		.from(corpMembers)
		.innerJoin(users, eq(corpMembers.userId, users.id))
		.where(eq(corpMembers.corpId, locals.corp.id));

	return json({ data: members });
};
