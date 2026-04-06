import { pgTable, text, integer, bigint, real } from 'drizzle-orm/pg-core';
import { users } from './auth.js';

// -- Inventory declarations: items/commodities owned by players
export const inventoryItems = pgTable('inventory_items', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	corpId: text('corp_id').notNull(),
	// Reference to UEX catalog (nullable for custom freetext items)
	uexCommodityId: integer('uex_commodity_id'),
	uexItemId: integer('uex_item_id'),
	// Display name (from UEX catalog or custom freetext)
	name: text('name').notNull(),
	customName: text('custom_name'),
	// Categorization
	category: text('category').notNull().default('commodity'),
	section: text('section').notNull().default(''),
	// Quantity and location
	quantity: real('quantity').notNull().default(1),
	unit: text('unit').notNull().default('SCU'),
	// Location reference (type + id for composite PK, or freetext)
	locationId: integer('location_id'),
	locationType: text('location_type'),
	locationName: text('location_name').notNull().default(''),
	// Quality (0-1000, applies to commodities)
	quality: integer('quality').notNull().default(0),
	// Optional notes
	notes: text('notes'),
	// Timestamps + soft delete (stored as Unix ms)
	createdAt: bigint('created_at', { mode: 'number' }).notNull(),
	updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
	deletedAt: bigint('deleted_at', { mode: 'number' })
});
