import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock env
vi.mock('$env/static/private', () => ({
	SUPERADMIN_DISCORD_IDS: '',
	DISCORD_CLIENT_ID: 'test',
	DISCORD_CLIENT_SECRET: 'test',
	DISCORD_REDIRECT_URI: 'http://localhost',
	CRON_SECRET: 'test-secret'
}));

// Track inserts and deletes
let insertCount = 0;
let deleteCount = 0;
let lastInsertedValues: unknown[] = [];

vi.mock('$lib/server/db/index.js', () => ({
	db: {
		insert: () => {
			insertCount++;
			return {
				values: (vals: unknown[]) => {
					lastInsertedValues = Array.isArray(vals) ? vals : [vals];
					return Promise.resolve();
				}
			};
		},
		delete: () => {
			deleteCount++;
			return Promise.resolve();
		}
	}
}));

// Mock the UEX client functions
const mockFetchCommodities = vi.fn();
const mockFetchItemsByCategory = vi.fn();
const mockFetchTerminals = vi.fn();
const mockFetchPlanets = vi.fn();
const mockFetchMoons = vi.fn();
const mockFetchSpaceStations = vi.fn();
const mockFetchCities = vi.fn();
const mockFetchOutposts = vi.fn();

vi.mock('./client.js', () => ({
	fetchCommodities: (...args: unknown[]) => mockFetchCommodities(...args),
	fetchItemsByCategory: (...args: unknown[]) => mockFetchItemsByCategory(...args),
	fetchTerminals: (...args: unknown[]) => mockFetchTerminals(...args),
	fetchPlanets: (...args: unknown[]) => mockFetchPlanets(...args),
	fetchMoons: (...args: unknown[]) => mockFetchMoons(...args),
	fetchSpaceStations: (...args: unknown[]) => mockFetchSpaceStations(...args),
	fetchCities: (...args: unknown[]) => mockFetchCities(...args),
	fetchOutposts: (...args: unknown[]) => mockFetchOutposts(...args)
}));

import { syncCommodities, syncItems, syncLocations, syncTerminals } from './sync.js';

describe('sync engine', () => {
	beforeEach(() => {
		insertCount = 0;
		deleteCount = 0;
		lastInsertedValues = [];
		vi.clearAllMocks();
	});

	describe('syncCommodities', () => {
		it('syncs commodities and logs success', async () => {
			mockFetchCommodities.mockResolvedValue([
				{
					id: 1, id_parent: 0, name: 'Quantanium', code: 'QUAN', kind: 'Mineral',
					weight_scu: 1, price_buy: 88, price_sell: 88, is_available: 1,
					is_buyable: 0, is_sellable: 1, is_mineral: 1, is_raw: 1,
					is_refined: 0, is_illegal: 0, date_modified: 1000
				}
			]);

			const result = await syncCommodities('test-key');

			expect(result.status).toBe('success');
			expect(result.recordCount).toBe(1);
			expect(result.resource).toBe('commodities');
			expect(mockFetchCommodities).toHaveBeenCalledWith('test-key');
			expect(deleteCount).toBeGreaterThan(0);
			expect(insertCount).toBeGreaterThan(0);
		});

		it('returns error when API returns empty', async () => {
			mockFetchCommodities.mockResolvedValue([]);

			const result = await syncCommodities();

			expect(result.status).toBe('error');
			expect(result.errorMessage).toContain('0 commodities');
		});

		it('handles API errors gracefully', async () => {
			mockFetchCommodities.mockRejectedValue(new Error('Network error'));

			const result = await syncCommodities();

			expect(result.status).toBe('error');
			expect(result.errorMessage).toBe('Network error');
		});
	});

	describe('syncItems', () => {
		it('syncs items across categories', async () => {
			mockFetchItemsByCategory.mockResolvedValue([
				{
					id: 100, id_category: 1, id_company: 0, name: 'Test Armor',
					section: 'Armor', category: 'Arms', company_name: null,
					slug: 'test-armor', size: 'M', uuid: 'abc', quality: 1,
					is_commodity: 0, screenshot: '', game_version: '4.0',
					date_modified: 1000
				}
			]);

			const result = await syncItems('test-key', 10, 60000);

			expect(result.status).toBe('success');
			expect(result.recordCount).toBeGreaterThan(0);
			expect(insertCount).toBeGreaterThan(0);
			expect(deleteCount).toBeGreaterThan(0);
		});
	});

	describe('syncLocations', () => {
		it('merges all location types with composite PK', async () => {
			mockFetchPlanets.mockResolvedValue([
				{ id: 1, id_star_system: 1, name: 'Hurston', code: 'HUR', star_system_name: 'Stanton', is_available: 1, date_modified: 1000 }
			]);
			mockFetchMoons.mockResolvedValue([
				{ id: 1, id_star_system: 1, name: 'Cellin', code: 'CEL', star_system_name: 'Stanton', planet_name: 'Crusader', is_available: 1, date_modified: 1000 }
			]);
			mockFetchSpaceStations.mockResolvedValue([]);
			mockFetchCities.mockResolvedValue([]);
			mockFetchOutposts.mockResolvedValue([]);

			const result = await syncLocations('test-key');

			expect(result.status).toBe('success');
			expect(result.recordCount).toBe(2);
			// Both have id=1 but different types — no collision with composite PK
			expect(deleteCount).toBeGreaterThan(0);
		});

		it('returns error when all endpoints return empty', async () => {
			mockFetchPlanets.mockResolvedValue([]);
			mockFetchMoons.mockResolvedValue([]);
			mockFetchSpaceStations.mockResolvedValue([]);
			mockFetchCities.mockResolvedValue([]);
			mockFetchOutposts.mockResolvedValue([]);

			const result = await syncLocations();

			expect(result.status).toBe('error');
		});
	});

	describe('syncTerminals', () => {
		it('syncs terminals and logs success', async () => {
			mockFetchTerminals.mockResolvedValue([
				{
					id: 1, id_star_system: 1, id_planet: 1, id_moon: 0, id_space_station: 0,
					id_city: 1, id_outpost: 0, name: 'TDD', fullname: 'Trade & Development Division',
					nickname: 'TDD', code: 'TDD', type: 'trade', is_available: 1,
					is_shop_fps: 0, is_shop_vehicle: 0, is_refinery: 0,
					star_system_name: 'Stanton', planet_name: 'Hurston',
					moon_name: null, space_station_name: null, outpost_name: null,
					city_name: 'Lorville', date_modified: 1000
				}
			]);

			const result = await syncTerminals('test-key');

			expect(result.status).toBe('success');
			expect(result.recordCount).toBe(1);
		});
	});
});
