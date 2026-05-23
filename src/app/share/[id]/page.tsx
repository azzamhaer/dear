import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { eq, inArray, asc } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import {
  albums,
  comments,
  letters,
  media,
  memories,
  notes,
  shares,
  users,
} from "@/db/schema";
import { getTheme, parseOptions } from "@/lib/share-themes";
import { ShareView } from "./view";
import type { Metadata } from "next";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/** Build an absolute URL from the current request's host. WhatsApp / iMessage
 *  / Twitter unfurlers require absolute https URLs in og:image. */
async function absoluteUrl(path: string): Promise<string> {
  const h = await headers();
  const host =
    h.get("x-forwarded-host") ?? h.get("host") ?? "dear.web.id";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}${path}`;
}

function truncate(s: string, max: number): string {
  const t = s.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const d = db();
  const [share] = await d.select().from(shares).where(eq(shares.id, id)).limit(1);
  if (!share) {
    return {
      title: "Tidak ditemukan · Dear",
      robots: { index: false, follow: false },
    };
  }

  let title = "Sebuah kenangan dari Dear";
  let description = "Dibagikan dari Dear — kenangan kita berdua.";
  let ogImage: string | null = null;

  try {
    if (share.kind === "memory") {
      const [m] = await d
        .select()
        .from(memories)
        .where(eq(memories.id, share.refId))
        .limit(1);
      if (m?.caption) {
        title = truncate(m.caption, 70);
        description = truncate(m.caption, 180);
      }
      const [firstMedia] = await d
        .select()
        .from(media)
        .where(eq(media.memoryId, share.refId))
        .orderBy(media.position)
        .limit(1);
      if (firstMedia) {
        ogImage = await absoluteUrl(
          `/api/share-public/${share.id}/${firstMedia.r2Key}`,
        );
      }
    } else if (share.kind === "note") {
      const [n] = await d
        .select()
        .from(notes)
        .where(eq(notes.id, share.refId))
        .limit(1);
      if (n?.title) title = truncate(n.title, 70);
      if (n?.body) description = truncate(n.body, 180);
    } else if (share.kind === "album") {
      const [a] = await d
        .select()
        .from(albums)
        .where(eq(albums.id, share.refId))
        .limit(1);
      if (a?.name) title = truncate(a.name, 70);
      if (a?.description) description = truncate(a.description, 180);
      const [firstMem] = await d
        .select()
        .from(memories)
        .where(eq(memories.albumId, share.refId))
        .orderBy(asc(memories.memoryDate))
        .limit(1);
      if (firstMem) {
        const [coverMedia] = await d
          .select()
          .from(media)
          .where(eq(media.memoryId, firstMem.id))
          .orderBy(media.position)
          .limit(1);
        if (coverMedia) {
          ogImage = await absoluteUrl(
            `/api/share-public/${share.id}/${coverMedia.r2Key}`,
          );
        }
      }
    } else if (share.kind === "letter") {
      const [l] = await d
        .select()
        .from(letters)
        .where(eq(letters.id, share.refId))
        .limit(1);
      if (l?.title) title = truncate(l.title, 70);
      const unlockMs =
        l?.unlocksAt instanceof Date
          ? l.unlocksAt.getTime()
          : ((l?.unlocksAt as unknown as number) ?? 0) * 1000;
      const locked = unlockMs > Date.now();
      description = locked
        ? "Surat masa depan — masih tertutup."
        : truncate(l?.body ?? description, 180);
    }
  } catch {
    // ignore -- use defaults
  }

  const url = await absoluteUrl(`/share/${share.id}`);

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      url,
      siteName: "Dear",
      type: "article",
      locale: "id_ID",
      images: ogImage
        ? [
            {
              url: ogImage,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = db();

  const [share] = await d.select().from(shares).where(eq(shares.id, id)).limit(1);
  if (!share) notFound();

  if (share.expiresAt) {
    const exp =
      share.expiresAt instanceof Date
        ? share.expiresAt.getTime()
        : (share.expiresAt as unknown as number) * 1000;
    if (exp < Date.now()) {
      return <ExpiredPage />;
    }
  }

  await d
    .update(shares)
    .set({ viewCount: share.viewCount + 1 })
    .where(eq(shares.id, share.id))
    .catch(() => null);

  const options = parseOptions(share.options);
  const theme = getTheme(options.theme);

  let content: React.ReactNode = null;

  if (share.kind === "memory") {
    content = await renderMemory(share.refId, options);
  } else if (share.kind === "note") {
    content = await renderNote(share.refId, options);
  } else if (share.kind === "album") {
    content = await renderAlbum(share.refId, options);
  } else if (share.kind === "letter") {
    content = await renderLetter(share.refId, options);
  }

  if (!content) notFound();

  return (
    <ShareView
      theme={theme}
      kind={share.kind}
      shareId={share.id}
      options={options}
    >
      {content}
    </ShareView>
  );
}

/* ============================ renderers ============================ */

async function renderMemory(
  refId: string,
  options: ReturnType<typeof parseOptions>,
) {
  const d = db();
  const [m] = await d.select().from(memories).where(eq(memories.id, refId)).limit(1);
  if (!m) return null;
  const mediaRows = await d
    .select()
    .from(media)
    .where(eq(media.memoryId, m.id))
    .orderBy(media.position);
  const [author] = options.anonymous
    ? [null]
    : await d
        .select()
        .from(users)
        .where(eq(users.id, m.authorId))
        .limit(1);

  let commentRows: (typeof comments.$inferSelect)[] = [];
  let commenters: (typeof users.$inferSelect)[] = [];
  if (options.includeComments) {
    commentRows = await d
      .select()
      .from(comments)
      .where(eq(comments.memoryId, m.id))
      .orderBy(asc(comments.createdAt));
    if (commentRows.length > 0 && !options.anonymous) {
      const ids = Array.from(new Set(commentRows.map((c) => c.authorId)));
      commenters = await d
        .select()
        .from(users)
        .where(inArray(users.id, ids));
    }
  }

  return {
    type: "memory" as const,
    memory: m,
    media: mediaRows,
    author: author
      ? { displayName: author.displayName, avatarUrl: author.avatarUrl }
      : null,
    comments: commentRows.map((c) => {
      const commenter = commenters.find((u) => u.id === c.authorId);
      return {
        id: c.id,
        body: c.body,
        createdAt: c.createdAt,
        authorName: options.anonymous
          ? "Seseorang"
          : commenter?.displayName ?? "—",
        authorAvatar: options.anonymous ? null : commenter?.avatarUrl ?? null,
      };
    }),
  };
}

async function renderNote(
  refId: string,
  options: ReturnType<typeof parseOptions>,
) {
  const d = db();
  const [n] = await d.select().from(notes).where(eq(notes.id, refId)).limit(1);
  if (!n) return null;
  const [author] = options.anonymous
    ? [null]
    : await d.select().from(users).where(eq(users.id, n.authorId)).limit(1);
  return {
    type: "note" as const,
    note: n,
    author: author ? { displayName: author.displayName } : null,
  };
}

async function renderAlbum(
  refId: string,
  _options: ReturnType<typeof parseOptions>,
) {
  const d = db();
  const [a] = await d.select().from(albums).where(eq(albums.id, refId)).limit(1);
  if (!a) return null;
  const memRows = await d
    .select()
    .from(memories)
    .where(eq(memories.albumId, a.id))
    .orderBy(asc(memories.memoryDate));
  const memIds = memRows.map((m) => m.id);
  const mediaByMem = new Map<string, string>();
  if (memIds.length > 0) {
    const mediaRows = await d
      .select()
      .from(media)
      .where(inArray(media.memoryId, memIds))
      .orderBy(media.position);
    for (const mm of mediaRows) {
      if (!mediaByMem.has(mm.memoryId)) mediaByMem.set(mm.memoryId, mm.r2Key);
    }
  }
  return {
    type: "album" as const,
    album: a,
    memories: memRows.map((m) => ({
      id: m.id,
      caption: m.caption,
      coverKey: mediaByMem.get(m.id) ?? null,
    })),
  };
}

async function renderLetter(
  refId: string,
  options: ReturnType<typeof parseOptions>,
) {
  const d = db();
  const [l] = await d.select().from(letters).where(eq(letters.id, refId)).limit(1);
  if (!l) return null;
  const unlockMs =
    l.unlocksAt instanceof Date
      ? l.unlocksAt.getTime()
      : (l.unlocksAt as unknown as number) * 1000;
  const locked = unlockMs > Date.now();
  const [author] = options.anonymous
    ? [null]
    : await d.select().from(users).where(eq(users.id, l.authorId)).limit(1);
  return {
    type: "letter" as const,
    letter: { ...l, body: locked ? "" : l.body },
    locked,
    unlocksAt: unlockMs,
    author: author ? { displayName: author.displayName } : null,
  };
}

function ExpiredPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-cream-50 px-6">
      <div className="text-center">
        <div className="text-6xl">{"\u{1F940}"}</div>
        <h1 className="mt-4 font-display text-3xl italic">Link sudah layu.</h1>
        <p className="mt-2 text-ink-500">
          Tautan ini sudah lewat masanya. Mintalah link baru kalau perlu.
        </p>
      </div>
    </div>
  );
}
