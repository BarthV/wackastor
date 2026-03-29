/**
 * UEXcorp API v2.0 Type Definitions
 * Generated from API spike probes on 2026-03-28
 * API Base: https://api.uexcorp.space/2.0/
 */

// --- Response Envelope ---

export interface UexApiResponse<T> {
	status: string;
	http_code: number;
	data: T[];
}

// --- Commodities ---

export interface UexCommodity {
	id: number;
	id_parent: number;
	name: string;
	code: string;
	kind: string;
	weight_scu: number;
	price_buy: number;
	price_sell: number;
	is_available: number;
	is_available_live: number;
	is_visible: number;
	is_extractable: number;
	is_mineral: number;
	is_raw: number;
	is_pure: number;
	is_refined: number;
	is_refinable: number;
	is_harvestable: number;
	is_buyable: number;
	is_sellable: number;
	is_temporary: number;
	is_illegal: number;
	is_volatile_qt: number;
	is_volatile_time: number;
	is_inert: number;
	is_explosive: number;
	is_fuel: number;
	is_buggy: number;
	wiki: string;
	date_added: number;
	date_modified: number;
}

// --- Items ---

export interface UexItem {
	id: number;
	id_parent: number;
	id_category: number;
	id_company: number;
	id_vehicle: number;
	name: string;
	date_added: number;
	date_modified: number;
	section: string;
	category: string;
	company_name: string | null;
	vehicle_name: string | null;
	slug: string;
	size: string | null;
	uuid: string;
	color: string | null;
	color2: string | null;
	url_store: string;
	quality: number;
	is_exclusive_pledge: number;
	is_exclusive_subscriber: number;
	is_exclusive_concierge: number;
	is_commodity: number;
	is_harvestable: number;
	screenshot: string;
	game_version: string;
	notification: string | null;
}

// --- Locations ---

export type UexLocationType = 'planet' | 'moon' | 'space_station' | 'city' | 'outpost';

export interface UexPlanet {
	id: number;
	id_star_system: number;
	id_faction: number;
	id_jurisdiction: number;
	name: string;
	name_origin: string;
	code: string;
	is_available: number;
	is_available_live: number;
	is_visible: number;
	is_default: number;
	date_added: number;
	date_modified: number;
	star_system_name: string;
	faction_name: string | null;
	jurisdiction_name: string | null;
}

export interface UexMoon {
	id: number;
	id_star_system: number;
	id_planet: number;
	id_orbit: number;
	id_faction: number;
	id_jurisdiction: number;
	name: string;
	name_origin: string;
	code: string;
	is_available: number;
	is_available_live: number;
	is_visible: number;
	is_default: number;
	date_added: number;
	date_modified: number;
	star_system_name: string;
	planet_name: string;
	orbit_name: string;
	faction_name: string | null;
	jurisdiction_name: string | null;
}

export interface UexSpaceStation {
	id: number;
	id_star_system: number;
	id_planet: number;
	id_orbit: number;
	id_moon: number;
	id_city: number;
	id_faction: number;
	id_jurisdiction: number;
	name: string;
	nickname: string;
	is_available: number;
	is_available_live: number;
	is_visible: number;
	is_default: number;
	is_monitored: number;
	is_armistice: number;
	is_landable: number;
	is_decommissioned: number;
	is_lagrange: number;
	is_jump_point: number;
	has_quantum_marker: number;
	has_trade_terminal: number;
	has_habitation: number;
	has_refinery: number;
	has_cargo_center: number;
	has_clinic: number;
	has_food: number;
	has_shops: number;
	has_refuel: number;
	has_repair: number;
	has_gravity: number;
	has_loading_dock: number;
	has_docking_port: number;
	has_freight_elevator: number;
	pad_types: string | null;
	date_added: number;
	date_modified: number;
	star_system_name: string;
	planet_name: string;
	orbit_name: string;
	moon_name: string | null;
	city_name: string | null;
	faction_name: string | null;
	jurisdiction_name: string | null;
}

export interface UexCity {
	id: number;
	id_star_system: number;
	id_planet: number;
	id_orbit: number;
	id_moon: number;
	id_faction: number;
	id_jurisdiction: number;
	name: string;
	code: string;
	is_available: number;
	is_available_live: number;
	is_visible: number;
	is_default: number;
	is_monitored: number;
	is_armistice: number;
	is_landable: number;
	is_decommissioned: number;
	has_quantum_marker: number;
	has_trade_terminal: number;
	has_habitation: number;
	has_refinery: number;
	has_cargo_center: number;
	has_clinic: number;
	has_food: number;
	has_shops: number;
	has_refuel: number;
	has_repair: number;
	has_gravity: number;
	has_loading_dock: number;
	has_docking_port: number;
	has_freight_elevator: number;
	pad_types: string | null;
	wiki: string;
	date_added: number;
	date_modified: number;
	star_system_name: string;
	planet_name: string;
	orbit_name: string;
	moon_name: string | null;
	faction_name: string | null;
	jurisdiction_name: string | null;
}

export interface UexOutpost {
	id: number;
	id_star_system: number;
	id_planet: number;
	id_orbit: number;
	id_moon: number;
	id_faction: number;
	id_jurisdiction: number;
	name: string;
	nickname: string;
	is_available: number;
	is_available_live: number;
	is_visible: number;
	is_default: number;
	is_monitored: number;
	is_armistice: number;
	is_landable: number;
	is_decommissioned: number;
	has_quantum_marker: number;
	has_trade_terminal: number;
	has_habitation: number;
	has_refinery: number;
	has_cargo_center: number;
	has_clinic: number;
	has_food: number;
	has_shops: number;
	has_refuel: number;
	has_repair: number;
	has_gravity: number;
	has_loading_dock: number;
	has_docking_port: number;
	has_freight_elevator: number;
	pad_types: string | null;
	date_added: number;
	date_modified: number;
	star_system_name: string;
	planet_name: string;
	orbit_name: string;
	moon_name: string | null;
	faction_name: string | null;
	jurisdiction_name: string | null;
}

// --- Terminals ---

export interface UexTerminal {
	id: number;
	id_star_system: number;
	id_planet: number;
	id_orbit: number;
	id_moon: number;
	id_space_station: number;
	id_outpost: number;
	id_poi: number;
	id_city: number;
	id_faction: number;
	id_company: number;
	name: string;
	fullname: string;
	nickname: string;
	displayname: string;
	code: string;
	type: string;
	contact_url: string;
	screenshot: string;
	screenshot_full: string;
	screenshot_author: string;
	mcs: number;
	is_available: number;
	is_available_live: number;
	is_visible: number;
	is_default_system: number;
	is_affinity_influenceable: number;
	is_habitation: number;
	is_refinery: number;
	is_cargo_center: number;
	is_medical: number;
	is_food: number;
	is_shop_fps: number;
	is_shop_vehicle: number;
	is_refuel: number;
	is_repair: number;
	is_nqa: number;
	is_jump_point: number;
	is_player_owned: number;
	is_auto_load: number;
	has_loading_dock: number;
	has_docking_port: number;
	has_freight_elevator: number;
	game_version: string;
	date_added: number;
	date_modified: number;
	star_system_name: string;
	planet_name: string;
	orbit_name: string;
	moon_name: string | null;
	space_station_name: string | null;
	outpost_name: string | null;
	city_name: string | null;
	faction_name: string | null;
	company_name: string | null;
	max_container_size: number;
}
