ALTER TABLE `organizations` ADD `brand_color` text DEFAULT 'lime' NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `visual_style` text DEFAULT 'prism' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `job_title` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `location` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `website` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `theme` text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `accent_color` text DEFAULT 'lime' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `interface_filter` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `color_vision_mode` text DEFAULT 'standard' NOT NULL;