import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { corporations, corpMembers } from '$lib/server/db/schema/index.js';
import { isSuperadmin } from '$lib/server/auth/permissions.js';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || !isSuperadmin(locals.user.discordId)) {
		redirect(302, '/');
	}

	const corps = await db.select().from(corporations);
	return { corps };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user || !isSuperadmin(locals.user.discordId)) {
			return fail(403, { error: 'Acces refuse' });
		}

		const data = await request.formData();
		const discordServerId = data.get('discordServerId')?.toString().trim();
		const discordServerName = data.get('discordServerName')?.toString().trim();

		if (!discordServerId || !discordServerName) {
			return fail(400, { error: 'Tous les champs sont requis' });
		}

		const now = Date.now();
		const corpId = crypto.randomUUID();

		try {
			await db.insert(corporations).values({
				id: corpId,
				discordServerId,
				discordServerName,
				createdAt: now
			});

			// Add the creator as admin member of the new corp
			await db.insert(corpMembers).values({
				id: crypto.randomUUID(),
				corpId,
				userId: locals.user.id,
				role: 'admin',
				joinedAt: now
			});
		} catch {
			return fail(400, { error: 'ID Discord deja utilise ou erreur de base de donnees' });
		}

		redirect(302, '/admin/corporations');
	},

	rename: async ({ request, locals }) => {
		if (!locals.user || !isSuperadmin(locals.user.discordId)) {
			return fail(403, { error: 'Acces refuse' });
		}

		const data = await request.formData();
		const id = data.get('id')?.toString().trim();
		const discordServerName = data.get('discordServerName')?.toString().trim();

		if (!id || !discordServerName) {
			return fail(400, { error: 'Champs requis manquants' });
		}

		await db.update(corporations).set({ discordServerName }).where(eq(corporations.id, id));

		redirect(302, '/admin/corporations');
	}
};
