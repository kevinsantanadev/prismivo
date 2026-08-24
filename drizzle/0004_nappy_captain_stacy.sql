ALTER TABLE `users` ADD `sidebar_mode` text DEFAULT 'adaptive' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `interface_density` text DEFAULT 'comfortable' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `content_width` text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `corner_style` text DEFAULT 'rounded' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `text_scale` text DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `motion_mode` text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `primary_navigation` text DEFAULT 'dashboard,tasks,projects,clients' NOT NULL;