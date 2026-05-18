-- Dear — initial schema
-- Generated from src/db/schema.ts

CREATE TABLE `users` (
  `id` text PRIMARY KEY NOT NULL,
  `username` text NOT NULL,
  `display_name` text NOT NULL,
  `password_hash` text NOT NULL,
  `password_salt` text NOT NULL,
  `avatar_url` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL
);

CREATE UNIQUE INDEX `users_username_idx` ON `users` (`username`);

CREATE TABLE `albums` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL,
  `description` text,
  `cover_media_id` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL
);

CREATE UNIQUE INDEX `albums_slug_idx` ON `albums` (`slug`);

CREATE TABLE `memories` (
  `id` text PRIMARY KEY NOT NULL,
  `author_id` text NOT NULL,
  `album_id` text,
  `caption` text DEFAULT '' NOT NULL,
  `memory_date` integer NOT NULL,
  `location` text,
  `mood` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
  FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE INDEX `memories_memory_date_idx` ON `memories` (`memory_date`);
CREATE INDEX `memories_author_idx` ON `memories` (`author_id`);
CREATE INDEX `memories_album_idx` ON `memories` (`album_id`);

CREATE TABLE `media` (
  `id` text PRIMARY KEY NOT NULL,
  `memory_id` text NOT NULL,
  `kind` text NOT NULL,
  `r2_key` text NOT NULL,
  `mime_type` text NOT NULL,
  `width` integer,
  `height` integer,
  `bytes` integer,
  `position` integer DEFAULT 0 NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`memory_id`) REFERENCES `memories`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `media_memory_idx` ON `media` (`memory_id`);

CREATE TABLE `reactions` (
  `id` text PRIMARY KEY NOT NULL,
  `memory_id` text NOT NULL,
  `user_id` text NOT NULL,
  `emoji` text NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`memory_id`) REFERENCES `memories`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX `reactions_unique` ON `reactions` (`memory_id`, `user_id`, `emoji`);
CREATE INDEX `reactions_memory_idx` ON `reactions` (`memory_id`);
