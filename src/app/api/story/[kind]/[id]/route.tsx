import { ImageResponse } from "next/og";
import { eq, inArray, asc } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { albums, letters, media, memories, notes, users } from "@/db/schema";
import { getTheme, type ShareTheme } from "@/lib/share-themes";

export const runtime = "edge";

const W = 1080;
const H = 1920;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id } = await params;
  const url = new URL(req.url);
  const themeId = url.searchParams.get("theme") ?? "rose";
  const anonymous = url.searchParams.get("anonymous") === "1";
  const theme = getTheme(themeId);
  const origin = `${url.protocol}//${url.host}`;

  if (kind === "memory") {
    return await memoryStory(id, theme, anonymous, origin);
  }
  if (kind === "album") {
    return await albumStory(id, theme, anonymous, origin);
  }
  if (kind === "note") {
    return await noteStory(id, theme, anonymous, origin);
  }
  if (kind === "letter") {
    return await letterStory(id, theme, anonymous, origin);
  }

  return new Response("not found", { status: 404 });
}

/* ============================ memory ============================ */

async function memoryStory(
  id: string,
  theme: ShareTheme,
  anonymous: boolean,
  origin: string,
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
  const photoUrl = photo ? `${origin}/api/media/${photo.r2Key}` : null;
  const date =
    m.memoryDate instanceof Date
      ? m.memoryDate
      : new Date((m.memoryDate as unknown as number) * 1000);

  return new ImageResponse(
    (
      <div style={baseStyle(theme)}>
        <Decoration theme={theme} />
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
  anonymous: boolean,
  origin: string,
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
  const photos = memRows
    .map((m) => coverByMem.get(m.id))
    .filter((k): k is string => !!k)
    .slice(0, 9);

  return new ImageResponse(
    (
      <div style={baseStyle(theme)}>
        <Decoration theme={theme} />
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
              ? photos.map((key, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={`${origin}/api/media/${key}`}
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
  origin: string,
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
        <Decoration theme={theme} />
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
  anonymous: boolean,
  origin: string,
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
        <Decoration theme={theme} />
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

function Decoration({ theme }: { theme: ShareTheme }) {
  // Sprinkle 8 emojis in fixed-ish positions
  const positions = [
    { top: 80, left: 60, size: 70, rot: -8 },
    { top: 140, right: 80, size: 56, rot: 10 },
    { top: 380, left: 50, size: 64, rot: -6 },
    { top: 1280, right: 70, size: 60, rot: 12 },
    { top: 1480, left: 80, size: 56, rot: -10 },
    { top: 1620, right: 120, size: 68, rot: 6 },
    { top: 720, right: 60, size: 50, rot: -4 },
    { top: 1100, left: 70, size: 54, rot: 8 },
  ];
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
      }}
    >
      {positions.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: p.top,
            left: (p as { left?: number }).left,
            right: (p as { right?: number }).right,
            fontSize: p.size,
            opacity: 0.55,
            transform: `rotate(${p.rot}deg)`,
            display: "flex",
          }}
        >
          {theme.emoji[i % theme.emoji.length]}
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
