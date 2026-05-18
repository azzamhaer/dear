# Dear

A private memories app for two people. Quiet, warm, and built to last.

Next.js on Cloudflare Pages · D1 for data · R2 for photos & videos · Drizzle ORM.

---

## What's inside

- **Two-person auth** — named accounts with passwords, signed-cookie sessions.
- **Memory posts** — caption, date, location, mood. Multiple photos or videos per memory.
- **Timeline feed** — chronological, with a warm, cinematic feel.
- **Albums** — group memories ("Sundays", "Kyoto", "the long drive").
- **Calendar view** — every day you've kept; darker shading where you have more.
- **On This Day** — anything from past years that matches today.
- **Reactions** — 💗 😭 🫂 🌙.
- **Edit & delete** memories; deletes cascade media out of R2 too.
- **Mobile-first** — bottom-pill nav on small screens.
- **Glassmorphism, film grain, fading rose gradients** — small touches that add up.

---

## First-time setup

You'll need:
- Node 20+
- A Cloudflare account
- `wrangler` (installed automatically as a dev dependency)

### 1. Install

```bash
npm install
```

### 2. Create your Cloudflare resources

```bash
# D1 database
npx wrangler d1 create dear-db
# -> copy the `database_id` it prints into wrangler.toml

# R2 bucket
npx wrangler r2 bucket create dear-media
```

Update `wrangler.toml` with the `database_id`.

### 3. Run migrations

```bash
# Local (creates a local SQLite shadow of D1)
npm run db:migrate:local

# Production
npm run db:migrate:remote
```

### 4. Seed the two of you

Copy `.env.example` to `.env` and fill in your usernames and passwords.

```bash
cp .env.example .env
# edit .env

# Local
npm run db:seed-users -- --local

# Production
npm run db:seed-users -- --remote
```

> Sign in uses the **username** field (lowercased) and the password. Display name
> is shown in the UI.

### 5. Set the session secret

```bash
# Local dev — put it in .dev.vars
cp .dev.vars.example .dev.vars
# edit and set SESSION_SECRET (use `openssl rand -hex 32`)

# Production
npx wrangler pages secret put SESSION_SECRET --project-name dear
```

### 6. Dev

```bash
# Pure Next.js dev (no D1/R2 — useful for UI tweaks)
npm run dev

# Full Cloudflare Pages dev with local D1 + R2
npm run pages:dev
```

### 7. Deploy

```bash
# First time: create the Pages project linked to this repo,
# or run a direct upload:
npm run pages:deploy
```

Then point a domain at it from the Cloudflare dashboard. Done.

---

## Project shape

```
src/
  app/
    api/                 # Edge route handlers
      auth/              # login, logout, me
      memories/          # CRUD + reactions
      albums/            # CRUD
      upload/            # R2 multipart upload
      media/[...key]/    # Auth-gated R2 streaming
      calendar/          # Per-month counts
      on-this-day/       # Today-in-history feed
    login/               # Login page (public)
    upload/              # New memory composer
    memory/[id]/         # Memory detail + edit
    albums/              # Album list + detail
    calendar/            # Calendar + per-day pages
    on-this-day/         # On-this-day page
    layout.tsx           # Root layout + nav
    globals.css          # Warm palette, glass, grain
    page.tsx             # Timeline feed
  components/            # Cards, feed, reactions, calendar, picker, etc.
  db/
    schema.ts            # Drizzle tables
    index.ts             # makeDb(d1)
  lib/
    cloudflare.ts        # env() / db() / bucket() bindings
    crypto.ts            # PBKDF2 + HMAC (Web Crypto, edge-safe)
    session.ts           # signed-cookie session
    queries.ts           # listMemories / getMemory / counts
    r2.ts                # upload / fetch / mediaUrl
    utils.ts             # moods, reactions, date helpers
  middleware.ts          # Routes that require a session
drizzle/
  migrations/0000_initial.sql
scripts/
  seed-users.ts
wrangler.toml
drizzle.config.ts
```

---

## A few design notes

- **Auth on the edge.** Sessions are HMAC-signed cookies (no JWT lib needed),
  and the middleware only checks for the cookie's presence — actual verification
  happens in handlers, where we can hit D1.
- **R2 is private.** Media is served through `/api/media/...`, which gates on
  the same session, so unsigned-in eyes can't see anything by guessing URLs.
- **Image loading.** We rely on the browser's native lazy-loading, with
  immutable cache headers (the keys include a content hash). For larger
  libraries you can drop Cloudflare Image Resizing in front of `/api/media/*`.
- **Edge runtime everywhere.** Every route handler and page sets
  `runtime = "edge"` so it deploys to Cloudflare Pages cleanly.

---

## License

Yours. Make it home.
