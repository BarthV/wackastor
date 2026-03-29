/**
 * UEXcorp Item Categories
 * Last verified: 2026-03-28
 * Probe: GET /items?id_category=N for N=1..50
 */

export const ITEM_CATEGORIES = [
	{ id: 1, name: 'Arms', section: 'Armor', itemCount: 318 },
	{ id: 2, name: 'Backpacks', section: 'Armor', itemCount: 98 },
	{ id: 3, name: 'Helmets', section: 'Armor', itemCount: 462 },
	{ id: 4, name: 'Legs', section: 'Armor', itemCount: 299 },
	{ id: 5, name: 'Torso', section: 'Armor', itemCount: 317 },
	{ id: 7, name: 'Full Set', section: 'Armor', itemCount: 12 },
	{ id: 8, name: 'Footwear', section: 'Clothing', itemCount: 268 },
	{ id: 9, name: 'Gloves', section: 'Clothing', itemCount: 86 },
	{ id: 10, name: 'Hats', section: 'Clothing', itemCount: 158 },
	{ id: 11, name: 'Jackets', section: 'Clothing', itemCount: 378 },
	{ id: 13, name: 'Legwear', section: 'Clothing', itemCount: 273 },
	{ id: 14, name: 'Shirts', section: 'Clothing', itemCount: 259 },
	{ id: 16, name: 'Consumables', section: 'Miscellaneous', itemCount: 13 },
	{ id: 17, name: 'Attachments', section: 'Personal Weapons', itemCount: 140 },
	{ id: 18, name: 'Personal Weapons', section: 'Personal Weapons', itemCount: 289 },
	{ id: 19, name: 'Coolers', section: 'Systems', itemCount: 70 },
	{ id: 20, name: 'Liveries', section: 'Liveries', itemCount: 706 },
	{ id: 21, name: 'Power Plants', section: 'Systems', itemCount: 74 },
	{ id: 22, name: 'Quantum Drives', section: 'Systems', itemCount: 56 },
	{ id: 23, name: 'Shield Generators', section: 'Systems', itemCount: 62 },
	{ id: 24, name: 'Undersuits', section: 'Undersuits', itemCount: 173 },
	{ id: 25, name: 'Docking Collars', section: 'Utility', itemCount: 3 },
	{ id: 26, name: 'External Fuel Tanks', section: 'Utility', itemCount: 3 },
	{ id: 28, name: 'Gadgets', section: 'Utility', itemCount: 6 },
	{ id: 29, name: 'Mining Laser Heads', section: 'Utility', itemCount: 17 },
	{ id: 30, name: 'Mining Modules', section: 'Utility', itemCount: 26 },
	{ id: 31, name: 'Scraper Beams', section: 'Utility', itemCount: 4 },
	{ id: 32, name: 'Guns', section: 'Vehicle Weapons', itemCount: 146 },
	{ id: 33, name: 'Missile Racks', section: 'Vehicle Weapons', itemCount: 19 },
	{ id: 34, name: 'Missiles', section: 'Vehicle Weapons', itemCount: 52 },
	{ id: 35, name: 'Turrets', section: 'Vehicle Weapons', itemCount: 21 },
	{ id: 36, name: 'Commodities', section: 'Commodities', itemCount: 1 },
	{ id: 38, name: 'Other', section: 'Other', itemCount: 39 },
	{ id: 41, name: 'Mining', section: 'General', itemCount: 1 }
] as const;

/** Total items across all categories: 4,048 */
export const TOTAL_ITEM_COUNT = 4048;

/** IDs that returned empty results: 6, 12, 15, 27, 37, 39, 40, 42-50 */
export const EMPTY_CATEGORY_IDS = [6, 12, 15, 27, 37, 39, 40, 42, 43, 44, 45, 46, 47, 48, 49, 50];
