-- Dear — public share links

CREATE TABLE `shares` (
  `id` text PRIMARY KEY NOT NULL,
  `kind` text NOT NULL,
  `ref_id` text NOT NULL,
  `options` text DEFAULT '{}' NOT NULL,
  `view_count` integer DEFAULT 0 NOT NULL,
  `expires_at` integer,
  `created_by` text NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `shares_ref_idx` ON `shares` (`kind`, `ref_id`);
CREATE INDEX `shares_creator_idx` ON `shares` (`created_by`);
