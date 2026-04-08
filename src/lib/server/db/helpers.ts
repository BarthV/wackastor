import { isNull, eq, and, sum, inArray } from 'drizzle-orm';
import { inventoryItems, reservations } from './schema/index.js';
import { db } from './index.js';

// Soft-delete filter: use in WHERE clause to exclude deleted records
export const activeInventory = isNull(inventoryItems.deletedAt);

// Active reservation filter: use in WHERE clause to select only active reservations
export const activeReservation = eq(reservations.status, 'active');

// Escape LIKE metacharacters to prevent pattern injection
export function escapeLike(input: string): string {
	return input.replace(/%/g, '\\%').replace(/_/g, '\\_');
}

// Get total reserved quantity for a single inventory item
export async function getReservedQuantity(itemId: string): Promise<number> {
	const [result] = await db
		.select({ total: sum(reservations.quantity) })
		.from(reservations)
		.where(and(eq(reservations.inventoryItemId, itemId), activeReservation));
	return Number(result?.total ?? 0);
}

// Batch version: get reserved quantities for multiple inventory items
export async function getReservedQuantities(itemIds: string[]): Promise<Map<string, number>> {
	if (itemIds.length === 0) return new Map();
	const rows = await db
		.select({ itemId: reservations.inventoryItemId, total: sum(reservations.quantity) })
		.from(reservations)
		.where(and(eq(reservations.status, 'active'), inArray(reservations.inventoryItemId, itemIds)))
		.groupBy(reservations.inventoryItemId);
	const map = new Map<string, number>();
	for (const row of rows) {
		map.set(row.itemId, Number(row.total ?? 0));
	}
	return map;
}
