import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';

// -- UEXcorp commodities: synced from /commodities endpoint
export const uexCommodities = sqliteTable('uex_commodities', {
	id: integer('id').primaryKey(),
	idParent: integer('id_parent').notNull(),
	name: text('name').notNull(),
	code: text('code').notNull(),
	kind: text('kind').notNull(),
	weightScu: real('weight_scu').notNull().default(0),
	priceBuy: real('price_buy').notNull().default(0),
	priceSell: real('price_sell').notNull().default(0),
	isAvailable: integer('is_available').notNull().default(0),
	isBuyable: integer('is_buyable').notNull().default(0),
	isSellable: integer('is_sellable').notNull().default(0),
	isMineral: integer('is_mineral').notNull().default(0),
	isRaw: integer('is_raw').notNull().default(0),
	isRefined: integer('is_refined').notNull().default(0),
	isIllegal: integer('is_illegal').notNull().default(0),
	dateModified: integer('date_modified').notNull().default(0)
});

// -- UEXcorp item categories: derived from items sync
export const uexItemCategories = sqliteTable('uex_item_categories', {
	id: integer('id').primaryKey(),
	name: text('name').notNull(),
	section: text('section').notNull(),
	itemCount: integer('item_count').notNull().default(0)
});

// -- UEXcorp items: synced per category from /items?id_category=N
export const uexItems = sqliteTable('uex_items', {
	id: integer('id').primaryKey(),
	idCategory: integer('id_category').notNull(),
	idCompany: integer('id_company').notNull().default(0),
	name: text('name').notNull(),
	section: text('section').notNull().default(''),
	category: text('category').notNull().default(''),
	companyName: text('company_name'),
	slug: text('slug').notNull().default(''),
	size: text('size'),
	uuid: text('uuid').notNull().default(''),
	quality: integer('quality').notNull().default(0),
	isCommodity: integer('is_commodity').notNull().default(0),
	screenshot: text('screenshot').notNull().default(''),
	gameVersion: text('game_version').notNull().default(''),
	dateModified: integer('date_modified').notNull().default(0)
});

// -- UEXcorp locations: merged from /planets, /moons, /space_stations, /cities, /outposts
// Composite PK (id, type) to handle potential ID collisions across endpoints
export const uexLocations = sqliteTable(
	'uex_locations',
	{
		id: integer('id').notNull(),
		type: text('type', {
			enum: ['planet', 'moon', 'space_station', 'city', 'outpost']
		}).notNull(),
		idStarSystem: integer('id_star_system').notNull().default(0),
		name: text('name').notNull(),
		code: text('code').notNull().default(''),
		starSystemName: text('star_system_name').notNull().default(''),
		planetName: text('planet_name').notNull().default(''),
		moonName: text('moon_name'),
		isAvailable: integer('is_available').notNull().default(0),
		dateModified: integer('date_modified').notNull().default(0)
	},
	(table) => [primaryKey({ columns: [table.id, table.type] })]
);

// -- UEXcorp terminals: synced from /terminals endpoint
export const uexTerminals = sqliteTable('uex_terminals', {
	id: integer('id').primaryKey(),
	idStarSystem: integer('id_star_system').notNull().default(0),
	idPlanet: integer('id_planet').notNull().default(0),
	idMoon: integer('id_moon').notNull().default(0),
	idSpaceStation: integer('id_space_station').notNull().default(0),
	idCity: integer('id_city').notNull().default(0),
	idOutpost: integer('id_outpost').notNull().default(0),
	name: text('name').notNull(),
	fullname: text('fullname').notNull().default(''),
	nickname: text('nickname').notNull().default(''),
	code: text('code').notNull().default(''),
	type: text('type').notNull().default(''),
	isAvailable: integer('is_available').notNull().default(0),
	hasTradeTerminal: integer('has_trade_terminal').notNull().default(0),
	hasRefinery: integer('has_refinery').notNull().default(0),
	starSystemName: text('star_system_name').notNull().default(''),
	planetName: text('planet_name').notNull().default(''),
	moonName: text('moon_name'),
	spaceStationName: text('space_station_name'),
	outpostName: text('outpost_name'),
	cityName: text('city_name'),
	dateModified: integer('date_modified').notNull().default(0)
});

// -- Item section config: superadmin-defined category mapping for UEX item sections
export const itemSectionConfigs = sqliteTable('item_section_configs', {
	section: text('section').primaryKey(),
	category: text('category', { enum: ['item', 'equipment'] }).notNull().default('item'),
	disabled: integer('disabled', { mode: 'boolean' }).notNull().default(false),
	icon: text('icon').notNull().default('category')
});

// -- Item subcategory config: per-UEX-category overrides within a section
export const itemSubcategoryConfigs = sqliteTable('item_subcategory_configs', {
	category: text('category').primaryKey(), // UEX category name (e.g. "Gadgets")
	wackCategory: text('wack_category', { enum: ['item', 'equipment'] }).notNull().default('item'),
	disabled: integer('disabled', { mode: 'boolean' }).notNull().default(false)
});

// -- Commodity quality config: superadmin-defined list of commodities that have a quality level
export const commodityQualityConfigs = sqliteTable('commodity_quality_configs', {
	uexCommodityId: integer('uex_commodity_id').primaryKey()
});

// -- Commodity unit config: superadmin-defined unit per UEX commodity (not overwritten by sync)
export const commodityUnitConfigs = sqliteTable('commodity_unit_configs', {
	uexCommodityId: integer('uex_commodity_id').primaryKey(),
	unit: text('unit', { enum: ['SCU', 'cSCU', 'unit'] }).notNull().default('SCU')
});

// -- Sync log: tracks each sync run for monitoring
export const uexSyncLog = sqliteTable('uex_sync_log', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	resource: text('resource').notNull(),
	status: text('status', { enum: ['success', 'partial', 'error'] }).notNull(),
	recordCount: integer('record_count').notNull().default(0),
	durationMs: integer('duration_ms').notNull().default(0),
	errorMessage: text('error_message'),
	syncedAt: integer('synced_at', { mode: 'number' }).notNull()
});
