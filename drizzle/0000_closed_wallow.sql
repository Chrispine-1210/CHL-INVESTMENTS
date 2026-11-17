CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`detail` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_target` ON `audit` (`target`,`created`);--> statement-breakpoint
CREATE TABLE `community` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`kind` text NOT NULL,
	`note` text NOT NULL,
	`status` text NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_unique_interest` ON `community` (`user_id`,`kind`);--> statement-breakpoint
CREATE TABLE `journals` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`date` text NOT NULL,
	`memo` text NOT NULL,
	`actor` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `journals_reference_unique` ON `journals` (`reference`);--> statement-breakpoint
CREATE INDEX `journal_by_date` ON `journals` (`date`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`request_key` text NOT NULL,
	`fingerprint` text NOT NULL,
	`mode` text NOT NULL,
	`status` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`address` text NOT NULL,
	`notes` text NOT NULL,
	`lines` text NOT NULL,
	`subtotal` integer NOT NULL,
	`fee` integer,
	`created` text NOT NULL,
	`updated` text NOT NULL,
	`revision` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_request_once` ON `orders` (`user_id`,`request_key`);--> statement-breakpoint
CREATE INDEX `order_history` ON `orders` (`user_id`,`created`);--> statement-breakpoint
CREATE INDEX `order_queue` ON `orders` (`status`,`created`);--> statement-breakpoint
CREATE TABLE `postings` (
	`id` text PRIMARY KEY NOT NULL,
	`journal_id` text NOT NULL,
	`account` text NOT NULL,
	`side` text NOT NULL,
	`amount` integer NOT NULL,
	FOREIGN KEY (`journal_id`) REFERENCES `journals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `postings_journal` ON `postings` (`journal_id`);--> statement-breakpoint
CREATE TABLE `receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`kind` text NOT NULL,
	`amount` integer NOT NULL,
	`channel` text NOT NULL,
	`reference` text NOT NULL,
	`created` text NOT NULL,
	`actor` text NOT NULL,
	`note` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `receipt_unique_reference` ON `receipts` (`channel`,`reference`);--> statement-breakpoint
CREATE INDEX `receipts_by_order` ON `receipts` (`order_id`);--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`party` text NOT NULL,
	`due` text NOT NULL,
	`status` text NOT NULL,
	`amount` integer NOT NULL,
	`note` text NOT NULL,
	`likelihood` integer NOT NULL,
	`impact` integer NOT NULL,
	`evidence` text NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL,
	`revision` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `records_by_kind` ON `records` (`kind`,`status`,`due`);--> statement-breakpoint
CREATE INDEX `records_by_owner` ON `records` (`party`,`kind`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`email` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`active` integer NOT NULL,
	`created` text NOT NULL
);
