import { pgTable, text, real, bigint } from 'drizzle-orm/pg-core';
import { users } from './auth.js';
import { inventoryItems } from './inventory.js';

export const reservations = pgTable('reservations', {
	id: text('id').primaryKey(),
	inventoryItemId: text('inventory_item_id').notNull().references(() => inventoryItems.id),
	requesterId: text('requester_id').notNull().references(() => users.id),
	ownerId: text('owner_id').notNull().references(() => users.id),
	corpId: text('corp_id').notNull(),
	quantity: real('quantity').notNull(),
	status: text('status', { enum: ['active', 'fulfilled', 'cancelled'] }).notNull().default('active'),
	createdAt: bigint('created_at', { mode: 'number' }).notNull(),
	updatedAt: bigint('updated_at', { mode: 'number' }).notNull()
});
