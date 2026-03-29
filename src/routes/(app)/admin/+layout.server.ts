import { redirect } from '@sveltejs/kit';
import { isSuperadmin } from '$lib/server/auth/permissions.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	// Superadmins can access admin even without a corp (e.g. to initialize one)
	if (isSuperadmin(locals.user.discordId)) return;

	if (!locals.corp || locals.corp.role !== 'admin') {
		redirect(302, '/stock');
	}
};
