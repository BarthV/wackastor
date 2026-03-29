import { redirect } from '@sveltejs/kit';
import { generateState } from 'arctic';
import { discord } from '$lib/server/auth/discord.js';
import type { RequestHandler } from './$types';

// -- Initiate Discord OAuth flow
export const GET: RequestHandler = async ({ cookies }) => {
	const state = generateState();

	cookies.set('discord_oauth_state', state, {
		path: '/',
		httpOnly: true,
		secure: import.meta.env.PROD,
		sameSite: 'lax',
		maxAge: 60 * 10 // 10 minutes
	});

	const url = discord.createAuthorizationURL(state, null, [
		'identify',
		'guilds',
		'guilds.members.read'
	]);

	redirect(302, url.toString());
};
