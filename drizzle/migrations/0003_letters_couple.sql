-- Dear — couple anchor dates + future letters

ALTER TABLE `users` ADD COLUMN `birthdate` text;
ALTER TABLE `users` ADD COLUMN `couple_start_date` text;

CREATE TABLE `letters` (
  `id` text PRIMARY KEY NOT NULL,
  `author_id` text NOT NULL,
  `title` text DEFAULT '' NOT NULL,
  `body` text DEFAULT '' NOT NULL,
  `unlocks_at` integer NOT NULL,
  `opened_at` integer,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `letters_unlocks_idx` ON `letters` (`unlocks_at`);
CREATE INDEX `letters_author_idx` ON `letters` (`author_id`);
