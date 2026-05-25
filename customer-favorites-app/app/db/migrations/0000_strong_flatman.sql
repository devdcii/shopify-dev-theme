CREATE TABLE `favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_title` text,
	`product_image` text,
	`created_at` integer
);
