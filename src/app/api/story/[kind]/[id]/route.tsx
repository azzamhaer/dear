import { ImageResponse } from "next/og";
import { eq, inArray, asc } from "drizzle-orm";
import { bucket, db } from "@/lib/cloudflare";
import { albums, letters, media, memories, notes, users } from "@/db/schema";
import {
  generateEmojiPlacements,
  getTheme,
  type EmojiPattern,
  type ShareTheme,
} from "@/lib/share-themes";

export const runtime = "edge";

/**
 * Fetch a media object from R2 and return it as a data URL so it can be
 * embedded inside an ImageResponse without going through the auth-gated
 * /api/media/[key] route (which would 401 on a server-to-server fetch).
 */
async function fetchMediaAsDataUrl(r2Key: string): Promise<string | null> {
  try {
    const obj = await bucket().get(r2Key);
    if (!obj) return null;
    const buf = await obj.arrayBuffer();
    const bytes = new Uint8Array(buf);
    // Simple loop — reliable across runtime sizes, safe up to ~10MB
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);
    const ct = obj.httpMetadata?.contentType ?? "image/jpeg";
    return `data:${ct};base64,${b64}`;
  } catch (e) {
    console.error("[story] fetchMedia error", e);
    return null;
  }
}

function parseEmojisParam(raw: string | null, fallback: string[]): string[] {
  if (!raw) return fallback;
  // Split into grapheme-aware chunks. Modern emojis can be 2-4 code units;
  // use Intl.Segmenter if available, else fall back to splitting by `,`.
  try {
    const seg = new Intl.Segmenter("id", { granularity: "grapheme" });
    const out: string[] = [];
    for (const s of seg.segment(raw)) {
      const g = s.segment.trim();
      if (g) out.push(g);
    }
    return out.length > 0 ? out.slice(0, 6) : fallback;
  } catch {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    return parts.length > 0 ? parts.slice(0, 6) : fallback;
  }
}

function parsePattern(raw: string | null): EmojiPattern {
  const valid: EmojiPattern[] = [
    "scattered",
    "dense",
    "diagonal",
    "spiral",
    "rain",
    "edges",
  ];
  return valid.includes(raw as EmojiPattern) ? (raw as EmojiPattern) : "dense";
}

const W = 1080;
const H = 1920;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  try {
    const { kind, id } = await params;
    const url = new URL(req.url);
    const themeId = url.searchParams.get("theme") ?? "dove-rose";
    const anonymous = url.searchParams.get("anonymous") === "1";
    const theme = getTheme(themeId);
    const emojis = parseEmojisParam(
      url.searchParams.get("emojis"),
      theme.emoji,
    );
    const pattern = parsePattern(url.searchParams.get("pattern"));

    if (kind === "memory") {
      return await memoryStory(id, theme, anonymous, emojis, pattern);
    }
    if (kind === "album") {
      return await albumStory(id, theme, anonymous, emojis, pattern);
    }
    if (kind === "note") {
      return await noteStory(id, theme, anonymous, emojis, pattern);
    }
    if (kind === "letter") {
      return await letterStory(id, theme, emojis, pattern);
    }

    return new Response("not found", { status: 404 });
  } catch (e) {
    console.error("[story] fatal error", e);
    return new Response(
      `story_error: ${e instanceof Error ? e.message : "unknown"}`,
      { status: 500 },
    );
  }
}

/* ============================ memory ============================ */

async function memoryStory(
  id: string,
  theme: ShareTheme,
  anonymous: boolean,
  emojis: string[],
  pattern: EmojiPattern,
) {
  const d = db();
  const [m] = await d.select().from(memories).where(eq(memories.id, id)).limit(1);
  if (!m) return new Response("not found", { status: 404 });
  const mediaRows = await d
    .select()
    .from(media)
    .where(eq(media.memoryId, m.id))
    .orderBy(media.position)
    .limit(1);
  const [author] = anonymous
    ? [null]
    : await d.select().from(users).where(eq(users.id, m.authorId)).limit(1);

  const photo = mediaRows[0];
  const photoUrl = photo ? await fetchMediaAsDataUrl(photo.r2Key) : null;
  const date =
    m.memoryDate instanceof Date
      ? m.memoryDate
      : new Date((m.memoryDate as unknown as number) * 1000);

  return new ImageResponse(
    (
      <div style={baseStyle(theme)}>
        <Decoration emojis={emojis} pattern={pattern} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            padding: "80px 60px",
          }}
        >
          {/* Photo as polaroid card */}
          {photoUrl ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                background: "#FFFCF6",
                padding: 28,
                paddingBottom: 80,
                borderRadius: 24,
                boxShadow: "0 30px 70px rgba(0,0,0,0.2)",
                transform: "rotate(-2deg)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                width={800}
                height={1000}
                alt=""
                style={{ width: 800, height: 1000, objectFit: "cover", borderRadius: 12 }}
              />
              {m.caption ? (
                <div
                  style={{
                    marginTop: 28,
                    fontSize: 36,
                    color: "#1F1A17",
                    fontStyle: "italic",
                    lineHeight: 1.3,
                    fontFamily: "serif",
                    maxWidth: 800,
                    textAlign: "center",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  {truncate(m.caption, 80)}
                </div>
              ) : null}
            </div>
          ) : (
            <CaptionOnlyCard caption={m.caption} theme={theme} />
          )}
        </div>
        <Footer
          theme={theme}
          line1={
            anonymous
              ? "dari seseorang yang sayang"
              : `dari ${author?.displayName ?? "—"}`
          }
          line2={formatID(date)}
        />
      </div>
    ),
    { width: W, height: H },
  );
}

/* ============================ album ============================ */

async function albumStory(
  id: string,
  theme: ShareTheme,
  _anonymous: boolean,
  emojis: string[],
  pattern: EmojiPattern,
) {
  const d = db();
  const [a] = await d.select().from(albums).where(eq(albums.id, id)).limit(1);
  if (!a) return new Response("not found", { status: 404 });
  const memRows = await d
    .select()
    .from(memories)
    .where(eq(memories.albumId, a.id))
    .orderBy(asc(memories.memoryDate))
    .limit(9);
  const memIds = memRows.map((m) => m.id);
  const coverByMem = new Map<string, string>();
  if (memIds.length > 0) {
    const mediaRows = await d
      .select()
      .from(media)
      .where(inArray(media.memoryId, memIds))
      .orderBy(media.position);
    for (const m of mediaRows) {
      if (!coverByMem.has(m.memoryId)) coverByMem.set(m.memoryId, m.r2Key);
    }
  }
  const photoKeys = memRows
    .map((m) => coverByMem.get(m.id))
    .filter((k): k is string => !!k)
    .slice(0, 9);
  const photos = (
    await Promise.all(photoKeys.map((k) => fetchMediaAsDataUrl(k)))
  ).filter((u): u is string => !!u);

  return new ImageResponse(
    (
      <div style={baseStyle(theme)}>
        <Decoration emojis={emojis} pattern={pattern} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            padding: "100px 60px",
            gap: 40,
          }}
        >
          {/* Title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                fontSize: 22,
                color: theme.storyAccent,
                letterSpacing: 8,
                textTransform: "uppercase",
              }}
            >
              album
            </div>
            <div
              style={{
                fontSize: 72,
                color: theme.storyText,
                fontStyle: "italic",
                fontFamily: "serif",
                textAlign: "center",
                lineHeight: 1.1,
              }}
            >
              {truncate(a.name, 40)}
            </div>
          </div>

          {/* 3x3 collage */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              width: 840,
            }}
          >
            {photos.length > 0
              ? photos.map((dataUrl, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={dataUrl}
                    alt=""
                    width={272}
                    height={272}
                    style={{
                      width: 272,
                      height: 272,
                      objectFit: "cover",
                      borderRadius: 18,
                      boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                    }}
                  />
                ))
              : null}
          </div>

          <div
            style={{
              fontSize: 28,
              color: theme.storyText,
              opacity: 0.7,
              display: "flex",
            }}
          >
            {memRows.length} kenangan tersimpan
          </div>
        </div>
        <Footer theme={theme} line1={"sebuah album dari Dear"} line2="" />
      </div>
    ),
    { width: W, height: H },
  );
}

/* ============================ note ============================ */

async function noteStory(
  id: string,
  theme: ShareTheme,
  anonymous: boolean,
  emojis: string[],
  pattern: EmojiPattern,
) {
  const d = db();
  const [n] = await d.select().from(notes).where(eq(notes.id, id)).limit(1);
  if (!n) return new Response("not found", { status: 404 });
  const [author] = anonymous
    ? [null]
    : await d.select().from(users).where(eq(users.id, n.authorId)).limit(1);

  return new ImageResponse(
    (
      <div style={baseStyle(theme)}>
        <Decoration emojis={emojis} pattern={pattern} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
            padding: "120px 80px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              background: "#FFFCF6",
              padding: 60,
              borderRadius: 32,
              boxShadow: "0 30px 70px rgba(0,0,0,0.18)",
              maxWidth: 880,
              transform: "rotate(-1.5deg)",
            }}
          >
            {n.title ? (
              <div
                style={{
                  fontSize: 56,
                  color: "#1F1A17",
                  fontStyle: "italic",
                  fontFamily: "serif",
                  lineHeight: 1.1,
                  marginBottom: 30,
                  display: "flex",
                }}
              >
                {truncate(n.title, 40)}
              </div>
            ) : null}
            <div
              style={{
                fontSize: 32,
                color: "#3A322D",
                lineHeight: 1.5,
                fontFamily: "serif",
                whiteSpace: "pre-wrap",
                display: "flex",
              }}
            >
              {truncate(n.body, 320)}
            </div>
            <div
              style={{
                marginTop: 36,
                paddingTop: 24,
                borderTop: "1px solid rgba(31,26,23,0.1)",
                fontSize: 26,
                fontStyle: "italic",
                color: "#6B5F57",
                textAlign: "right",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              — {anonymous ? "Anonim" : author?.displayName ?? "—"}
            </div>
          </div>
        </div>
        <Footer theme={theme} line1={"sebuah catatan dari Dear"} line2="" />
      </div>
    ),
    { width: W, height: H },
  );
}

/* ============================ letter ============================ */

async function letterStory(
  id: string,
  theme: ShareTheme,
  emojis: string[],
  pattern: EmojiPattern,
) {
  const d = db();
  const [l] = await d.select().from(letters).where(eq(letters.id, id)).limit(1);
  if (!l) return new Response("not found", { status: 404 });
  const unlockMs =
    l.unlocksAt instanceof Date
      ? l.unlocksAt.getTime()
      : (l.unlocksAt as unknown as number) * 1000;
  const locked = unlockMs > Date.now();

  return new ImageResponse(
    (
      <div style={baseStyle(theme)}>
        <Decoration emojis={emojis} pattern={pattern} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
            padding: "120px 80px",
          }}
        >
          <div style={{ fontSize: 200, marginBottom: 40, display: "flex" }}>
            {locked ? "🔒" : "💌"}
          </div>
          <div
            style={{
              fontSize: 64,
              color: theme.storyText,
              fontStyle: "italic",
              fontFamily: "serif",
              textAlign: "center",
              lineHeight: 1.15,
              maxWidth: 800,
              display: "flex",
              justifyContent: "center",
            }}
          >
            {locked
              ? "Sepucuk surat untuk masa depan."
              : truncate(l.title || "Sebuah surat", 50)}
          </div>
          <div
            style={{
              marginTop: 30,
              fontSize: 28,
              color: theme.storyText,
              opacity: 0.7,
              textAlign: "center",
              display: "flex",
              justifyContent: "center",
            }}
          >
            {locked
              ? `Akan terbuka ${formatID(new Date(unlockMs))}`
              : "Sudah dibuka"}
          </div>
        </div>
        <Footer theme={theme} line1={"sepucuk surat dari Dear"} line2="" />
      </div>
    ),
    { width: W, height: H },
  );
}

/* ============================ helpers ============================ */

function baseStyle(theme: ShareTheme): React.CSSProperties {
  return {
    width: W,
    height: H,
    display: "flex",
    flexDirection: "column",
    background: theme.storyBg,
    position: "relative",
  };
}

function Decoration({
  emojis,
  pattern,
}: {
  emojis: string[];
  pattern: EmojiPattern;
}) {
  if (emojis.length === 0) return null;
  // Generate placements in % coords (0-100), then map to 1080x1920 pixels
  const placements = generateEmojiPlacements(emojis, pattern, 5);
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 1080,
        height: 1920,
        display: "flex",
      }}
    >
      {placements.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: (p.x / 100) * 1080,
            top: (p.y / 100) * 1920,
            fontSize: p.size * 2.4, // scale up for 1080x1920
            opacity: p.opacity,
            transform: `translate(-50%, -50%) rotate(${p.rot}deg)`,
            display: "flex",
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
}

function Footer({
  theme,
  line1,
  line2,
}: {
  theme: ShareTheme;
  line1: string;
  line2: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 60px 100px",
        gap: 10,
      }}
    >
      <div
        style={{
          fontSize: 28,
          color: theme.storyText,
          opacity: 0.65,
          display: "flex",
        }}
      >
        {line1}
      </div>
      {line2 ? (
        <div
          style={{
            fontSize: 22,
            color: theme.storyText,
            opacity: 0.45,
            display: "flex",
          }}
        >
          {line2}
        </div>
      ) : null}
      <div
        style={{
          marginTop: 24,
          fontSize: 44,
          color: theme.storyText,
          fontStyle: "italic",
          fontFamily: "serif",
          display: "flex",
          alignItems: "baseline",
        }}
      >
        <span>Dear</span>
        <span style={{ color: theme.storyAccent }}>.</span>
      </div>
    </div>
  );
}

function CaptionOnlyCard({ caption, theme }: { caption: string; theme: ShareTheme }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#FFFCF6",
        padding: 80,
        borderRadius: 32,
        boxShadow: "0 30px 70px rgba(0,0,0,0.18)",
        maxWidth: 880,
        transform: "rotate(-1.5deg)",
      }}
    >
      <div
        style={{
          fontSize: 56,
          color: "#1F1A17",
          fontStyle: "italic",
          fontFamily: "serif",
          lineHeight: 1.3,
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {truncate(caption || "—", 200)}
      </div>
    </div>
  );
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trim() + "…";
}

function formatID(d: Date): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
