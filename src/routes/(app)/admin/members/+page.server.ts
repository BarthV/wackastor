import { db } from '$lib/server/db/index.js';
import { corpMembers, users, corpRoleBindings, corporations } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const corpId = locals.corp!.id;

	const [members, bindings, corpRows] = await Promise.all([
		db.select({
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
		.where(eq(corpMembers.corpId, corpId)),

		db.select()
		.from(corpRoleBindings)
		.where(eq(corpRoleBindings.corpId, corpId)),

		db.select()
		.from(corporations)
		.where(eq(corporations.id, corpId))
		.limit(1)
	]);

	return { members, bindings, corp: corpRows[0] };
};
