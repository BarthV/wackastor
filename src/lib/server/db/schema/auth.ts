import { pgTable, text, integer, bigint, uniqueIndex } from 'drizzle-orm/pg-core';

// -- Users table: stores Discord-authenticated users
export const users = pgTable('users', {
	id: text('id').primaryKey(),
	discordId: text('discord_id').notNull().unique(),
	discordUsername: text('discord_username').notNull(),
	discordAvatar: text('discord_avatar'),
	createdAt: bigint('created_at', { mode: 'number' }).notNull(),
	updatedAt: bigint('updated_at', { mode: 'number' }).notNull()
});

// -- Sessions table: Lucia-managed sessions with Discord tokens for API calls
export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
	discordAccessToken: text('discord_access_token').notNull(),
	discordRefreshToken: text('discord_refresh_token').notNull(),
	discordTokenExpiresAt: bigint('discord_token_expires_at', { mode: 'number' }).notNull()
});

// -- Corporations table: linked to a Discord server
export const corporations = pgTable('corporations', {
	id: text('id').primaryKey(),
	discordServerId: text('discord_server_id').notNull().unique(),
	discordServerName: text('discord_server_name').notNull(),
	createdAt: bigint('created_at', { mode: 'number' }).notNull()
});

// -- Corp members table: links users to corporations with a role
export const corpMembers = pgTable(
	'corp_members',
	{
		id: text('id').primaryKey(),
		corpId: text('corp_id')
			.notNull()
			.references(() => corporations.id),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		role: text('role', { enum: ['member', 'admin'] })
			.notNull()
			.default('member'),
		joinedAt: bigint('joined_at', { mode: 'number' }).notNull()
	},
	(table) => [uniqueIndex('corp_user_unique').on(table.corpId, table.userId)]
);

// -- Corp role bindings table: maps Discord roles to corp permissions
export const corpRoleBindings = pgTable(
	'corp_role_bindings',
	{
		id: text('id').primaryKey(),
		corpId: text('corp_id')
			.notNull()
			.references(() => corporations.id),
		discordRoleId: text('discord_role_id').notNull(),
		grantsAdmin: integer('grants_admin').notNull().default(0)
	},
	(table) => [uniqueIndex('corp_role_unique').on(table.corpId, table.discordRoleId)]
);
