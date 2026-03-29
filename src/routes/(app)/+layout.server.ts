import { redirect } from '@sveltejs/kit';
import { isSuperadmin } from '$lib/server/auth/permissions.js';
import type { LayoutServerLoad } from './$types';

// -- Guard: redirect unauthenticated users to login
export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login?error=unauthorized');
	}

	return {
		user: locals.user,
		corp: locals.corp,
		isSuperadmin: isSuperadmin(locals.user.discordId)
	};
};
