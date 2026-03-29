import { db } from '$lib/server/db/index.js';
import { corpMembers, corpRoleBindings } from '$lib/server/db/schema/index.js';
import { eq, and, count } from 'drizzle-orm';
import { SUPERADMIN_DISCORD_IDS } from '$env/static/private';

export type CorpRole = 'admin' | 'member' | 'none';

// -- Parse the comma-separated superadmin IDs from env
function getSuperadminIds(): string[] {
	return (SUPERADMIN_DISCORD_IDS || '')
		.split(',')
		.map((id) => id.trim())
		.filter(Boolean);
}

// -- Check if a user is a member of a corporation
export async function isMember(userId: string, corpId: string): Promise<boolean> {
	const result = await db
		.select({ id: corpMembers.id })
		.from(corpMembers)
		.where(and(eq(corpMembers.userId, userId), eq(corpMembers.corpId, corpId)))
		.limit(1);
	return result.length > 0;
}

// -- Check if a user is admin of a corporation (direct role or via Discord role binding)
export async function isAdmin(userId: string, corpId: string): Promise<boolean> {
	const member = await db
		.select({ role: corpMembers.role })
		.from(corpMembers)
		.where(and(eq(corpMembers.userId, userId), eq(corpMembers.corpId, corpId)))
		.limit(1);

	if (member.length === 0) return false;
	return member[0].role === 'admin';
}

// -- Check if a user is a superadmin (by Discord user ID)
export function isSuperadmin(discordId: string): boolean {
	return getSuperadminIds().includes(discordId);
}

// -- Get the effective role for a user in a corporation
// Business rule: superadmin always gets admin; otherwise read from corp_members
export async function getEffectiveRole(
	userId: string,
	corpId: string,
	discordId: string
): Promise<CorpRole> {
	if (isSuperadmin(discordId)) return 'admin';

	const member = await db
		.select({ role: corpMembers.role })
		.from(corpMembers)
		.where(and(eq(corpMembers.userId, userId), eq(corpMembers.corpId, corpId)))
		.limit(1);

	if (member.length === 0) return 'none';
	return member[0].role as CorpRole;
}

// -- Check if a corporation has any role bindings configured
export async function hasRoleBindings(corpId: string): Promise<boolean> {
	const result = await db
		.select({ total: count() })
		.from(corpRoleBindings)
		.where(eq(corpRoleBindings.corpId, corpId));
	return result[0].total > 0;
}

// -- Resolve role from Discord roles using corp_role_bindings
// Returns 'admin' if any matching role grants admin, 'member' otherwise
export async function resolveRoleFromDiscordRoles(
	corpId: string,
	discordRoleIds: string[]
): Promise<CorpRole> {
	if (discordRoleIds.length === 0) return 'member';

	const bindings = await db
		.select({ discordRoleId: corpRoleBindings.discordRoleId, grantsAdmin: corpRoleBindings.grantsAdmin })
		.from(corpRoleBindings)
		.where(eq(corpRoleBindings.corpId, corpId));

	if (bindings.length === 0) {
		// No bindings configured: all guild members are granted membership
		return 'member';
	}

	const matchingBindings = bindings.filter((b) => discordRoleIds.includes(b.discordRoleId));
	if (matchingBindings.length === 0) return 'none';

	const hasAdmin = matchingBindings.some((b) => b.grantsAdmin === 1);
	return hasAdmin ? 'admin' : 'member';
}
