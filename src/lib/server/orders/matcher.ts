/**
 * Order Auto-Matching Engine
 * Cross-references an order against declared inventory to find matching stock.
 * V1: runs on order creation only (not on inventory changes).
 */

import { db } from '$lib/server/db/index.js';
import { inventoryItems, orders, orderMatches, users } from '$lib/server/db/schema/index.js';
import { activeInventory } from '$lib/server/db/helpers.js';
import { eq, and, ne, isNull } from 'drizzle-orm';

interface MatchResult {
	matchCount: number;
	matches: Array<{
		inventoryItemId: string;
		matchedUserId: string;
		matchedQuantity: number;
		matchedLocationName: string | null;
	}>;
}

/**
 * Find inventory items that can fulfill an order.
 * Matching criteria:
 * - Same corp
 * - Same UEX commodity/item ID (if set), or same name (case-insensitive)
 * - Not the order creator's own items
 * - Only active (non-deleted) inventory
 */
export async function findMatches(
	orderId: string,
	corpId: string,
	orderUserId: string,
	uexCommodityId: number | null,
	uexItemId: number | null,
	name: string
): Promise<MatchResult> {
	const conditions = [
		eq(inventoryItems.corpId, corpId),
		ne(inventoryItems.userId, orderUserId),
		activeInventory
	];

	// Match by UEX ID if available, otherwise by name
	if (uexCommodityId) {
		conditions.push(eq(inventoryItems.uexCommodityId, uexCommodityId));
	} else if (uexItemId) {
		conditions.push(eq(inventoryItems.uexItemId, uexItemId));
	} else {
		// Fallback: name-based matching (SQLite LIKE is case-insensitive by default for ASCII)
		conditions.push(eq(inventoryItems.name, name));
	}

	const matchingItems = await db
		.select({
			id: inventoryItems.id,
			userId: inventoryItems.userId,
			quantity: inventoryItems.quantity,
			locationName: inventoryItems.locationName
		})
		.from(inventoryItems)
		.where(and(...conditions));

	const matches = matchingItems.map((item) => ({
		inventoryItemId: item.id,
		matchedUserId: item.userId,
		matchedQuantity: item.quantity,
		matchedLocationName: item.locationName || null
	}));

	return { matchCount: matches.length, matches };
}

/**
 * Run matching for an order and persist results.
 * Updates the order's matchCount and status.
 */
export async function runMatching(orderId: string): Promise<MatchResult> {
	// Load the order
	const [order] = await db
		.select()
		.from(orders)
		.where(and(eq(orders.id, orderId), isNull(orders.deletedAt)))
		.limit(1);

	if (!order) {
		return { matchCount: 0, matches: [] };
	}

	const result = await findMatches(
		orderId,
		order.corpId,
		order.userId,
		order.uexCommodityId,
		order.uexItemId,
		order.name
	);

	// Clear previous matches for this order
	await db.delete(orderMatches).where(eq(orderMatches.orderId, orderId));

	// Insert new matches
	if (result.matches.length > 0) {
		const now = Date.now();
		await db.insert(orderMatches).values(
			result.matches.map((m) => ({
				id: crypto.randomUUID(),
				orderId,
				inventoryItemId: m.inventoryItemId,
				matchedQuantity: m.matchedQuantity,
				matchedLocationName: m.matchedLocationName,
				matchedUserId: m.matchedUserId,
				createdAt: now
			}))
		);
	}

	// Update order status and match count
	const newStatus = result.matchCount > 0 ? 'matched' : 'open';
	await db
		.update(orders)
		.set({
			matchCount: result.matchCount,
			status: order.status === 'fulfilled' || order.status === 'cancelled' ? order.status : newStatus,
			updatedAt: Date.now()
		})
		.where(eq(orders.id, orderId));

	return result;
}

/**
 * Get matches for an order with user details (for the match sidebar).
 */
export async function getMatchesWithDetails(orderId: string) {
	return db
		.select({
			matchId: orderMatches.id,
			inventoryItemId: orderMatches.inventoryItemId,
			quantity: orderMatches.matchedQuantity,
			locationName: orderMatches.matchedLocationName,
			userId: orderMatches.matchedUserId,
			username: users.discordUsername,
			userAvatar: users.discordAvatar,
			userDiscordId: users.discordId,
			createdAt: orderMatches.createdAt
		})
		.from(orderMatches)
		.innerJoin(users, eq(orderMatches.matchedUserId, users.id))
		.where(eq(orderMatches.orderId, orderId));
}
