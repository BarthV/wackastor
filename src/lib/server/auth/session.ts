import { Lucia, TimeSpan } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { dev } from '$app/environment';
import { db } from '$lib/server/db/index.js';
import { users, sessions } from '$lib/server/db/schema/index.js';

// -- Lucia adapter for Drizzle PostgreSQL
const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

// -- Lucia instance with Discord token attributes on sessions
export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: !dev
		}
	},
	sessionExpiresIn: new TimeSpan(30, 'd'),
	getSessionAttributes(attributes) {
		return {
			discordAccessToken: attributes.discordAccessToken,
			discordRefreshToken: attributes.discordRefreshToken,
			discordTokenExpiresAt: attributes.discordTokenExpiresAt
		};
	},
	getUserAttributes(attributes) {
		return {
			discordId: attributes.discordId,
			discordUsername: attributes.discordUsername,
			discordAvatar: attributes.discordAvatar
		};
	}
});

// -- Type registration for Lucia
declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			discordId: string;
			discordUsername: string;
			discordAvatar: string | null;
		};
		DatabaseSessionAttributes: {
			discordAccessToken: string;
			discordRefreshToken: string;
			discordTokenExpiresAt: number;
		};
	}
}
