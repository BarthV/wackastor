CREATE TABLE `item_subcategory_configs` (
	`category` text PRIMARY KEY NOT NULL,
	`wack_category` text DEFAULT 'item' NOT NULL,
	`disabled` integer DEFAULT false NOT NULL
);
