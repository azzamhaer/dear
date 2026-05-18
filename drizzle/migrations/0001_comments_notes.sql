-- Dear — comments + notes

CREATE TABLE `comments` (
  `id` text PRIMARY KEY NOT NULL,
  `memory_id` text NOT NULL,
  `author_id` text NOT NULL,
  `body` text NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`memory_id`) REFERENCES `memories`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `comments_memory_idx` ON `comments` (`memory_id`);

CREATE TABLE `notes` (
  `id` text PRIMARY KEY NOT NULL,
  `author_id` text NOT NULL,
  `title` text DEFAULT '' NOT NULL,
  `body` text DEFAULT '' NOT NULL,
  `pinned` integer DEFAULT 0 NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `notes_updated_idx` ON `notes` (`updated_at`);
