import type { LayoutServerLoad } from './$types';

// -- Root layout data: expose user and corp to all pages
export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user,
		corp: locals.corp
	};
};
