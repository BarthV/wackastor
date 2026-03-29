// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				id: string;
				discordId: string;
				username: string;
				avatar: string | null;
			} | null;
			session: {
				id: string;
				expiresAt: number;
			} | null;
			corp: {
				id: string;
				discordServerId: string;
				name: string;
				role: string;
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
