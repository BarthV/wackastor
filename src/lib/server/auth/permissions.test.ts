import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock $env/static/private before importing the module under test
vi.mock('$env/static/private', () => ({
	SUPERADMIN_DISCORD_IDS: 'superadmin1,superadmin2',
	DISCORD_CLIENT_ID: 'test',
	DISCORD_CLIENT_SECRET: 'test',
	DISCORD_REDIRECT_URI: 'http://localhost'
}));

// We need a reference to mock return values
let selectResult: unknown[] = [];
let selectAllResult: unknown[] = [];

vi.mock('$lib/server/db/index.js', () => {
	return {
		db: {
			select: () => ({
				from: () => ({
					where: () => {
						const result = selectAllResult.length > 0 ? selectAllResult : selectResult;
						return {
							limit: () => selectResult,
							then: (resolve: (v: unknown[]) => void) => resolve(result)
						};
					}
				})
			})
		}
	};
});

import { isMember, isAdmin, isSuperadmin, getEffectiveRole, hasRoleBindings, resolveRoleFromDiscordRoles } from './permissions.js';

describe('permissions', () => {
	beforeEach(() => {
		selectResult = [];
		selectAllResult = [];
	});

	describe('isSuperadmin', () => {
		it('returns true for configured superadmin Discord IDs', () => {
			expect(isSuperadmin('superadmin1')).toBe(true);
			expect(isSuperadmin('superadmin2')).toBe(true);
		});

		it('returns false for non-superadmin Discord IDs', () => {
			expect(isSuperadmin('regular_user')).toBe(false);
			expect(isSuperadmin('')).toBe(false);
		});
	});

	describe('isMember', () => {
		it('returns true when user has a corp_members record', async () => {
			selectResult = [{ id: 'member-1' }];
			const result = await isMember('user-1', 'corp-1');
			expect(result).toBe(true);
		});

		it('returns false when user has no corp_members record', async () => {
			selectResult = [];
			const result = await isMember('user-1', 'corp-1');
			expect(result).toBe(false);
		});
	});

	describe('isAdmin', () => {
		it('returns true when user has admin role in corp_members', async () => {
			selectResult = [{ role: 'admin' }];
			const result = await isAdmin('user-1', 'corp-1');
			expect(result).toBe(true);
		});

		it('returns false when user has member role', async () => {
			selectResult = [{ role: 'member' }];
			const result = await isAdmin('user-1', 'corp-1');
			expect(result).toBe(false);
		});

		it('returns false when user is not a member', async () => {
			selectResult = [];
			const result = await isAdmin('user-1', 'corp-1');
			expect(result).toBe(false);
		});
	});

	describe('getEffectiveRole', () => {
		it('returns admin for superadmin regardless of membership', async () => {
			selectResult = [];
			const result = await getEffectiveRole('user-1', 'corp-1', 'superadmin1');
			expect(result).toBe('admin');
		});

		it('returns role from corp_members for regular users', async () => {
			selectResult = [{ role: 'member' }];
			const result = await getEffectiveRole('user-1', 'corp-1', 'regular_user');
			expect(result).toBe('member');
		});

		it('returns none when user is not a member', async () => {
			selectResult = [];
			const result = await getEffectiveRole('user-1', 'corp-1', 'regular_user');
			expect(result).toBe('none');
		});
	});

	describe('hasRoleBindings', () => {
		it('returns true when bindings exist', async () => {
			selectAllResult = [{ total: 2 }];
			const result = await hasRoleBindings('corp-1');
			expect(result).toBe(true);
		});

		it('returns false when no bindings exist', async () => {
			selectAllResult = [{ total: 0 }];
			const result = await hasRoleBindings('corp-1');
			expect(result).toBe(false);
		});
	});

	describe('resolveRoleFromDiscordRoles', () => {
		it('returns member when no Discord role IDs provided', async () => {
			const result = await resolveRoleFromDiscordRoles('corp-1', []);
			expect(result).toBe('member');
		});

		it('returns member when no bindings exist (zero bindings rule)', async () => {
			selectAllResult = [];
			const result = await resolveRoleFromDiscordRoles('corp-1', ['role-1']);
			expect(result).toBe('member');
		});

		it('returns admin when a matching binding grants admin', async () => {
			selectAllResult = [
				{ discordRoleId: 'role-1', grantsAdmin: 0 },
				{ discordRoleId: 'role-2', grantsAdmin: 1 }
			];
			const result = await resolveRoleFromDiscordRoles('corp-1', ['role-2']);
			expect(result).toBe('admin');
		});

		it('returns member when matching binding does not grant admin', async () => {
			selectAllResult = [
				{ discordRoleId: 'role-1', grantsAdmin: 0 },
				{ discordRoleId: 'role-2', grantsAdmin: 1 }
			];
			const result = await resolveRoleFromDiscordRoles('corp-1', ['role-1']);
			expect(result).toBe('member');
		});

		it('returns none when bindings exist but user has no matching role', async () => {
			selectAllResult = [{ discordRoleId: 'role-1', grantsAdmin: 0 }];
			const result = await resolveRoleFromDiscordRoles('corp-1', ['role-999']);
			expect(result).toBe('none');
		});
	});
});
