import { isNull } from 'drizzle-orm';
import { inventoryItems } from './schema/index.js';

// Soft-delete filter: use in WHERE clause to exclude deleted records
export const activeInventory = isNull(inventoryItems.deletedAt);

// Escape LIKE metacharacters to prevent pattern injection
export function escapeLike(input: string): string {
	return input.replace(/%/g, '\\%').replace(/_/g, '\\_');
}
