import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { users, corporations, corpMembers } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { discord, getDiscordUser, getDiscordGuilds, getDiscordGuildMember } from '$lib/server/auth/discord.js';
import { lucia } from '$lib/server/auth/session.js';
import { hasRoleBindings, resolveRoleFromDiscordRoles, isSuperadmin } from '$lib/server/auth/permissions.js';
import type { RequestHandler } from './$types';

// -- Handle Discord OAuth callback
export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('discord_oauth_state');

	if (!code || !state || !storedState || state !== storedState) {
		redirect(302, '/login?error=invalid_state');
	}

	cookies.delete('discord_oauth_state', { path: '/' });

	let tokens;
	try {
		tokens = await discord.validateAuthorizationCode(code, null);
	} catch {
		redirect(302, '/login?error=token_exchange');
	}

	const accessToken = tokens.accessToken();
	const refreshToken = tokens.refreshToken();
	const tokenExpiresAt = tokens.accessTokenExpiresAt().getTime();

	// Fetch Discord user profile
	const discordUser = await getDiscordUser(accessToken);

	// Upsert user in database
	const now = Date.now();
	const existingUser = await db
		.select()
		.from(users)
		.where(eq(users.discordId, discordUser.id))
		.limit(1);

	let userId: string;
	if (existingUser.length > 0) {
		userId = existingUser[0].id;
		await db
			.update(users)
			.set({
				discordUsername: discordUser.username,
				discordAvatar: discordUser.avatar,
				updatedAt: now
			})
			.where(eq(users.id, userId));
	} else {
		userId = crypto.randomUUID();
		await db.insert(users).values({
			id: userId,
			discordId: discordUser.id,
			discordUsername: discordUser.username,
			discordAvatar: discordUser.avatar,
			createdAt: now,
			updatedAt: now
		});
	}

	// Check guild memberships and sync corp_members
	const guilds = await getDiscordGuilds(accessToken);
	const allCorps = await db.select().from(corporations);
	let hasAnyCorp = false;

	for (const corp of allCorps) {
		const guildMatch = guilds.find((g) => g.id === corp.discordServerId);
		if (!guildMatch) continue;

		// User is in this Discord server — resolve their role
		let role: 'admin' | 'member' = 'member';

		if (isSuperadmin(discordUser.id)) {
			role = 'admin';
		} else {
			const hasBindings = await hasRoleBindings(corp.id);
			if (hasBindings) {
				// Fetch guild member roles from Discord
				const guildMember = await getDiscordGuildMember(accessToken, corp.discordServerId);
				if (!guildMember) continue; // Cannot read member, skip

				const resolved = await resolveRoleFromDiscordRoles(corp.id, guildMember.roles);
				if (resolved === 'none') continue; // Bindings exist but user has no matching role
				role = resolved;
			}
			// If no bindings, all guild members get 'member' — fall through with default
		}

		// Upsert corp_member
		const existingCorpMember = await db
			.select()
			.from(corpMembers)
			.where(eq(corpMembers.userId, userId));

		const matchingMember = existingCorpMember.find((m) => m.corpId === corp.id);

		if (matchingMember) {
			await db
				.update(corpMembers)
				.set({ role })
				.where(eq(corpMembers.id, matchingMember.id));
		} else {
			await db.insert(corpMembers).values({
				id: crypto.randomUUID(),
				corpId: corp.id,
				userId,
				role,
				joinedAt: now
			});
		}

		hasAnyCorp = true;
	}

	// Create session with Discord tokens
	const session = await lucia.createSession(userId, {
		discordAccessToken: accessToken,
		discordRefreshToken: refreshToken,
		discordTokenExpiresAt: tokenExpiresAt
	});

	const sessionCookie = lucia.createSessionCookie(session.id);
	cookies.set(sessionCookie.name, sessionCookie.value, {
		path: '.',
		...sessionCookie.attributes
	});

	redirect(302, hasAnyCorp ? '/stock' : '/');
};
