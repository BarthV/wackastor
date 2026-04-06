import { pgTable, text, integer, bigint, real } from 'drizzle-orm/pg-core';
import { users } from './auth.js';
import { inventoryItems } from './inventory.js';

// -- Orders: resource requests from players
export const orders = pgTable('orders', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	corpId: text('corp_id').notNull(),
	// What is needed
	name: text('name').notNull(),
	uexCommodityId: integer('uex_commodity_id'),
	uexItemId: integer('uex_item_id'),
	category: text('category').notNull().default('commodity'),
	quantity: real('quantity').notNull().default(1),
	unit: text('unit').notNull().default('SCU'),
	quality: integer('quality').notNull().default(0),
	// Optional preferred location
	locationName: text('location_name'),
	// Status lifecycle: open -> matched -> fulfilled/cancelled
	status: text('status', { enum: ['open', 'matched', 'fulfilled', 'cancelled'] })
		.notNull()
		.default('open'),
	matchCount: integer('match_count').notNull().default(0),
	notes: text('notes'),
	// Timestamps + soft delete (stored as Unix ms)
	createdAt: bigint('created_at', { mode: 'number' }).notNull(),
	updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
	deletedAt: bigint('deleted_at', { mode: 'number' })
});

// -- Order matches: links orders to inventory items that can fulfill them
export const orderMatches = pgTable('order_matches', {
	id: text('id').primaryKey(),
	orderId: text('order_id')
		.notNull()
		.references(() => orders.id),
	inventoryItemId: text('inventory_item_id')
		.notNull()
		.references(() => inventoryItems.id),
	// Snapshot at match time
	matchedQuantity: real('matched_quantity').notNull(),
	matchedLocationName: text('matched_location_name'),
	// Owner of the matched inventory item
	matchedUserId: text('matched_user_id')
		.notNull()
		.references(() => users.id),
	createdAt: bigint('created_at', { mode: 'number' }).notNull()
});
