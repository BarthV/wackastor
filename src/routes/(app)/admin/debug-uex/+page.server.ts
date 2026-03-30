import { redirect } from '@sveltejs/kit';
import { isSuperadmin } from '$lib/server/auth/permissions.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || !isSuperadmin(locals.user.discordId)) {
		redirect(302, '/admin');
	}
};
