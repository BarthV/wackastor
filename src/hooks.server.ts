import type { Handle } from '@sveltejs/kit';
import { lucia } from '$lib/server/auth/session.js';
import { db } from '$lib/server/db/index.js';
import { corpMembers, corporations } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';

// -- Session validation middleware: runs on every request
export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(lucia.sessionCookieName);

	event.locals.user = null;
	event.locals.session = null;
	event.locals.corp = null;

	if (!sessionId) {
		return resolve(event);
	}

	const { session, user } = await lucia.validateSession(sessionId);

	if (!session) {
		// Session expired or invalid — clear cookie
		const blankCookie = lucia.createBlankSessionCookie();
		event.cookies.set(blankCookie.name, blankCookie.value, {
			path: '.',
			...blankCookie.attributes
		});
		return resolve(event);
	}

	if (session.fresh) {
		// Session was refreshed — update cookie
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}

	event.locals.user = {
		id: user.id,
		discordId: user.discordId,
		username: user.discordUsername,
		avatar: user.discordAvatar
	};

	event.locals.session = {
		id: session.id,
		expiresAt: session.expiresAt.getTime()
	};

	// Load first corp membership (V1 single-corp assumption)
	const membership = await db
		.select({
			corpId: corpMembers.corpId,
			role: corpMembers.role,
			discordServerId: corporations.discordServerId,
			corpName: corporations.discordServerName
		})
		.from(corpMembers)
		.innerJoin(corporations, eq(corpMembers.corpId, corporations.id))
		.where(eq(corpMembers.userId, user.id))
		.limit(1);

	if (membership.length > 0) {
		const m = membership[0];
		event.locals.corp = {
			id: m.corpId,
			discordServerId: m.discordServerId,
			name: m.corpName,
			role: m.role
		};
	}

	return resolve(event);
};
