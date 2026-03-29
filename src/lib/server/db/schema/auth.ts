import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

// -- Users table: stores Discord-authenticated users
export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	discordId: text('discord_id').notNull().unique(),
	discordUsername: text('discord_username').notNull(),
	discordAvatar: text('discord_avatar'),
	createdAt: integer('created_at', { mode: 'number' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'number' }).notNull()
});

// -- Sessions table: Lucia-managed sessions with Discord tokens for API calls
export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	expiresAt: integer('expires_at', { mode: 'number' }).notNull(),
	discordAccessToken: text('discord_access_token').notNull(),
	discordRefreshToken: text('discord_refresh_token').notNull(),
	discordTokenExpiresAt: integer('discord_token_expires_at', { mode: 'number' }).notNull()
});

// -- Corporations table: linked to a Discord server
export const corporations = sqliteTable('corporations', {
	id: text('id').primaryKey(),
	discordServerId: text('discord_server_id').notNull().unique(),
	discordServerName: text('discord_server_name').notNull(),
	createdAt: integer('created_at', { mode: 'number' }).notNull()
});

// -- Corp members table: links users to corporations with a role
export const corpMembers = sqliteTable(
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
		joinedAt: integer('joined_at', { mode: 'number' }).notNull()
	},
	(table) => [uniqueIndex('corp_user_unique').on(table.corpId, table.userId)]
);

// -- Corp role bindings table: maps Discord roles to corp permissions
export const corpRoleBindings = sqliteTable(
	'corp_role_bindings',
	{
		id: text('id').primaryKey(),
		corpId: text('corp_id')
			.notNull()
			.references(() => corporations.id),
		discordRoleId: text('discord_role_id').notNull(),
		grantsAdmin: integer('grants_admin', { mode: 'number' }).notNull().default(0)
	},
	(table) => [uniqueIndex('corp_role_unique').on(table.corpId, table.discordRoleId)]
);
