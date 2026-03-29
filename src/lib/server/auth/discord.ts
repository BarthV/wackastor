import { Discord } from 'arctic';
import {
	DISCORD_CLIENT_ID,
	DISCORD_CLIENT_SECRET,
	DISCORD_REDIRECT_URI
} from '$env/static/private';

// -- Discord OAuth client via Arctic
export const discord = new Discord(DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI);

const DISCORD_API = 'https://discord.com/api/v10';

// -- Discord API types
export interface DiscordUser {
	id: string;
	username: string;
	global_name: string | null;
	avatar: string | null;
}

export interface DiscordGuild {
	id: string;
	name: string;
	icon: string | null;
	owner: boolean;
	permissions: string;
}

export interface DiscordGuildMember {
	roles: string[];
	nick: string | null;
	user?: DiscordUser;
}

// -- Fetch the authenticated user's profile from Discord
export async function getDiscordUser(accessToken: string): Promise<DiscordUser> {
	const response = await fetch(`${DISCORD_API}/users/@me`, {
		headers: { Authorization: `Bearer ${accessToken}` }
	});
	if (!response.ok) {
		throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
	}
	return response.json();
}

// -- Fetch the authenticated user's guild list
export async function getDiscordGuilds(accessToken: string): Promise<DiscordGuild[]> {
	const response = await fetch(`${DISCORD_API}/users/@me/guilds`, {
		headers: { Authorization: `Bearer ${accessToken}` }
	});
	if (!response.ok) {
		throw new Error(`Discord guilds API error: ${response.status} ${response.statusText}`);
	}
	return response.json();
}

// -- Fetch the user's member record in a specific guild (requires guilds.members.read)
export async function getDiscordGuildMember(
	accessToken: string,
	guildId: string
): Promise<DiscordGuildMember | null> {
	const response = await fetch(`${DISCORD_API}/users/@me/guilds/${guildId}/member`, {
		headers: { Authorization: `Bearer ${accessToken}` }
	});
	if (response.status === 404) return null;
	if (!response.ok) {
		throw new Error(`Discord guild member API error: ${response.status} ${response.statusText}`);
	}
	return response.json();
}

// -- Refresh an expired Discord access token via Arctic
export async function refreshDiscordToken(refreshToken: string): Promise<{
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
}> {
	const tokens = await discord.refreshAccessToken(refreshToken);
	return {
		accessToken: tokens.accessToken(),
		refreshToken: tokens.refreshToken(),
		expiresAt: tokens.accessTokenExpiresAt().getTime()
	};
}
