CREATE TABLE "commodity_quality_configs" (
	"uex_commodity_id" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commodity_unit_configs" (
	"uex_commodity_id" integer PRIMARY KEY NOT NULL,
	"unit" text DEFAULT 'SCU' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corp_members" (
	"id" text PRIMARY KEY NOT NULL,
	"corp_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corp_role_bindings" (
	"id" text PRIMARY KEY NOT NULL,
	"corp_id" text NOT NULL,
	"discord_role_id" text NOT NULL,
	"grants_admin" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporations" (
	"id" text PRIMARY KEY NOT NULL,
	"discord_server_id" text NOT NULL,
	"discord_server_name" text NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "corporations_discord_server_id_unique" UNIQUE("discord_server_id")
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"corp_id" text NOT NULL,
	"uex_commodity_id" integer,
	"uex_item_id" integer,
	"name" text NOT NULL,
	"custom_name" text,
	"category" text DEFAULT 'commodity' NOT NULL,
	"section" text DEFAULT '' NOT NULL,
	"quantity" real DEFAULT 1 NOT NULL,
	"unit" text DEFAULT 'SCU' NOT NULL,
	"location_id" integer,
	"location_type" text,
	"location_name" text DEFAULT '' NOT NULL,
	"quality" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"deleted_at" bigint
);
--> statement-breakpoint
CREATE TABLE "item_section_configs" (
	"section" text PRIMARY KEY NOT NULL,
	"category" text DEFAULT 'item' NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"icon" text DEFAULT 'category' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_subcategory_configs" (
	"category" text PRIMARY KEY NOT NULL,
	"wack_category" text DEFAULT 'item' NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_matches" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"inventory_item_id" text NOT NULL,
	"matched_quantity" real NOT NULL,
	"matched_location_name" text,
	"matched_user_id" text NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"corp_id" text NOT NULL,
	"name" text NOT NULL,
	"uex_commodity_id" integer,
	"uex_item_id" integer,
	"category" text DEFAULT 'commodity' NOT NULL,
	"quantity" real DEFAULT 1 NOT NULL,
	"unit" text DEFAULT 'SCU' NOT NULL,
	"quality" integer DEFAULT 0 NOT NULL,
	"location_name" text,
	"status" text DEFAULT 'open' NOT NULL,
	"match_count" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"deleted_at" bigint
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" bigint NOT NULL,
	"discord_access_token" text NOT NULL,
	"discord_refresh_token" text NOT NULL,
	"discord_token_expires_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uex_commodities" (
	"id" integer PRIMARY KEY NOT NULL,
	"id_parent" integer NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"kind" text NOT NULL,
	"weight_scu" real DEFAULT 0 NOT NULL,
	"price_buy" real DEFAULT 0 NOT NULL,
	"price_sell" real DEFAULT 0 NOT NULL,
	"is_available" integer DEFAULT 0 NOT NULL,
	"is_buyable" integer DEFAULT 0 NOT NULL,
	"is_sellable" integer DEFAULT 0 NOT NULL,
	"is_mineral" integer DEFAULT 0 NOT NULL,
	"is_raw" integer DEFAULT 0 NOT NULL,
	"is_refined" integer DEFAULT 0 NOT NULL,
	"is_illegal" integer DEFAULT 0 NOT NULL,
	"date_modified" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uex_item_categories" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"section" text NOT NULL,
	"item_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uex_items" (
	"id" integer PRIMARY KEY NOT NULL,
	"id_category" integer NOT NULL,
	"id_company" integer DEFAULT 0 NOT NULL,
	"name" text NOT NULL,
	"section" text DEFAULT '' NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"company_name" text,
	"slug" text DEFAULT '' NOT NULL,
	"size" text,
	"uuid" text DEFAULT '' NOT NULL,
	"quality" integer DEFAULT 0 NOT NULL,
	"is_commodity" integer DEFAULT 0 NOT NULL,
	"screenshot" text DEFAULT '' NOT NULL,
	"game_version" text DEFAULT '' NOT NULL,
	"date_modified" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uex_locations" (
	"id" integer NOT NULL,
	"type" text NOT NULL,
	"id_star_system" integer DEFAULT 0 NOT NULL,
	"name" text NOT NULL,
	"code" text DEFAULT '' NOT NULL,
	"star_system_name" text DEFAULT '' NOT NULL,
	"planet_name" text DEFAULT '' NOT NULL,
	"moon_name" text,
	"is_available" integer DEFAULT 0 NOT NULL,
	"date_modified" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "uex_locations_id_type_pk" PRIMARY KEY("id","type")
);
--> statement-breakpoint
CREATE TABLE "uex_sync_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource" text NOT NULL,
	"status" text NOT NULL,
	"record_count" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"synced_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uex_terminals" (
	"id" integer PRIMARY KEY NOT NULL,
	"id_star_system" integer DEFAULT 0 NOT NULL,
	"id_planet" integer DEFAULT 0 NOT NULL,
	"id_moon" integer DEFAULT 0 NOT NULL,
	"id_space_station" integer DEFAULT 0 NOT NULL,
	"id_city" integer DEFAULT 0 NOT NULL,
	"id_outpost" integer DEFAULT 0 NOT NULL,
	"name" text NOT NULL,
	"fullname" text DEFAULT '' NOT NULL,
	"nickname" text DEFAULT '' NOT NULL,
	"code" text DEFAULT '' NOT NULL,
	"type" text DEFAULT '' NOT NULL,
	"is_available" integer DEFAULT 0 NOT NULL,
	"has_trade_terminal" integer DEFAULT 0 NOT NULL,
	"has_refinery" integer DEFAULT 0 NOT NULL,
	"star_system_name" text DEFAULT '' NOT NULL,
	"planet_name" text DEFAULT '' NOT NULL,
	"moon_name" text,
	"space_station_name" text,
	"outpost_name" text,
	"city_name" text,
	"date_modified" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"discord_id" text NOT NULL,
	"discord_username" text NOT NULL,
	"discord_avatar" text,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "users_discord_id_unique" UNIQUE("discord_id")
);
--> statement-breakpoint
ALTER TABLE "corp_members" ADD CONSTRAINT "corp_members_corp_id_corporations_id_fk" FOREIGN KEY ("corp_id") REFERENCES "public"."corporations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corp_members" ADD CONSTRAINT "corp_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corp_role_bindings" ADD CONSTRAINT "corp_role_bindings_corp_id_corporations_id_fk" FOREIGN KEY ("corp_id") REFERENCES "public"."corporations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_matches" ADD CONSTRAINT "order_matches_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_matches" ADD CONSTRAINT "order_matches_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_matches" ADD CONSTRAINT "order_matches_matched_user_id_users_id_fk" FOREIGN KEY ("matched_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "corp_user_unique" ON "corp_members" USING btree ("corp_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "corp_role_unique" ON "corp_role_bindings" USING btree ("corp_id","discord_role_id");