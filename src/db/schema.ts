import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";

/** People — only two of us. */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  usernameIdx: uniqueIndex("users_username_idx").on(t.username),
}));

/** A grouping of memories — "Vacations", "Sunday mornings", etc. */
export const albums = sqliteTable("albums", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  coverMediaId: text("cover_media_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  slugIdx: uniqueIndex("albums_slug_idx").on(t.slug),
}));

/** A single memory post — caption, date, location, mood, attached media. */
export const memories = sqliteTable("memories", {
  id: text("id").primaryKey(),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  albumId: text("album_id").references(() => albums.id, {
    onDelete: "set null",
  }),
  caption: text("caption").notNull().default(""),
  // The date the memory happened (not when it was posted)
  memoryDate: integer("memory_date", { mode: "timestamp" }).notNull(),
  location: text("location"),
  mood: text("mood"), // 'love' | 'happy' | 'calm' | 'nostalgic' | 'bittersweet' | 'grateful' | 'silly' | 'cozy'
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  memoryDateIdx: index("memories_memory_date_idx").on(t.memoryDate),
  authorIdx: index("memories_author_idx").on(t.authorId),
  albumIdx: index("memories_album_idx").on(t.albumId),
}));

/** Media attached to a memory. Stored as R2 keys; served via /api/media/[key]. */
export const media = sqliteTable("media", {
  id: text("id").primaryKey(),
  memoryId: text("memory_id")
    .notNull()
    .references(() => memories.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // 'image' | 'video'
  r2Key: text("r2_key").notNull(),
  mimeType: text("mime_type").notNull(),
  width: integer("width"),
  height: integer("height"),
  bytes: integer("bytes"),
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  memoryIdx: index("media_memory_idx").on(t.memoryId),
}));

/** Reactions: 💗 😭 🫂 🌙. One per (memory, user, emoji). */
export const reactions = sqliteTable("reactions", {
  id: text("id").primaryKey(),
  memoryId: text("memory_id")
    .notNull()
    .references(() => memories.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  emoji: text("emoji").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  uniqueReact: uniqueIndex("reactions_unique").on(
    t.memoryId,
    t.userId,
    t.emoji,
  ),
  memoryIdx: index("reactions_memory_idx").on(t.memoryId),
}));

/** Conversations under a memory. */
export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  memoryId: text("memory_id")
    .notNull()
    .references(() => memories.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  memoryIdx: index("comments_memory_idx").on(t.memoryId),
}));

/** Shared notepad — letters, plans, lists. */
export const notes = sqliteTable("notes", {
  id: text("id").primaryKey(),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default(""),
  body: text("body").notNull().default(""),
  pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  updatedIdx: index("notes_updated_idx").on(t.updatedAt),
}));

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Album = typeof albums.$inferSelect;
export type NewAlbum = typeof albums.$inferInsert;
export type Memory = typeof memories.$inferSelect;
export type NewMemory = typeof memories.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type Reaction = typeof reactions.$inferSelect;
export type NewReaction = typeof reactions.$inferInsert;
