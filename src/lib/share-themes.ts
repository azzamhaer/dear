/**
 * Themes for the public share viewer and IG Story image generator.
 * Each theme defines background gradient + accent + default emoji set.
 */

export interface ShareTheme {
  id: string;
  label: string;
  /** Background CSS (gradient or color) — shared by web view and story */
  bg: string;
  /** Tailwind classes applied to the wrapper */
  wrapperClass: string;
  /** Foreground text color class */
  textClass: string;
  /** Card background color (semi-transparent) */
  cardBg: string;
  /** Color for accents (border, dots, wordmark dot) */
  accent: string;
  /** Default emoji set when user doesn't pick custom ones (length 4–6) */
  emoji: string[];
  /** Background gradient for IG Story (1080×1920) */
  storyBg: string;
  storyText: string;
  storyAccent: string;
}

export type EmojiPattern =
  | "scattered"
  | "dense"
  | "diagonal"
  | "spiral"
  | "rain"
  | "edges";

export const PATTERNS: { id: EmojiPattern; label: string }[] = [
  { id: "dense", label: "Bertaburan" },
  { id: "scattered", label: "Acak ringan" },
  { id: "rain", label: "Hujan" },
  { id: "diagonal", label: "Diagonal" },
  { id: "spiral", label: "Spiral" },
  { id: "edges", label: "Bingkai" },
];

export const SHARE_THEMES: ShareTheme[] = [
  // ---- Pastel dove series (lembut, kalem) ----
  {
    id: "dove-rose",
    label: "🪻 Dove Mawar",
    bg: "linear-gradient(160deg, #FFF7F3 0%, #FCE8E2 50%, #F0CCC2 100%)",
    wrapperClass: "text-ink-900",
    textClass: "text-ink-900",
    cardBg: "rgba(255, 252, 246, 0.85)",
    accent: "#D4A5A5",
    emoji: ["🌸", "💗", "🤍", "✨", "🩷", "🌷"],
    storyBg: "linear-gradient(160deg, #FFF7F3 0%, #FCE8E2 50%, #F0CCC2 100%)",
    storyText: "#1F1A17",
    storyAccent: "#D4A5A5",
  },
  {
    id: "dove-lavender",
    label: "💜 Dove Lavender",
    bg: "linear-gradient(160deg, #F8F4FF 0%, #E8DCFF 50%, #CFB8F0 100%)",
    wrapperClass: "text-ink-900",
    textClass: "text-ink-900",
    cardBg: "rgba(255, 252, 252, 0.85)",
    accent: "#A88FD8",
    emoji: ["💜", "🪻", "✨", "🌙", "🦋", "🍇"],
    storyBg: "linear-gradient(160deg, #F8F4FF 0%, #E8DCFF 50%, #CFB8F0 100%)",
    storyText: "#1F1A17",
    storyAccent: "#A88FD8",
  },
  {
    id: "dove-mint",
    label: "🌿 Dove Mint",
    bg: "linear-gradient(160deg, #F2FBF5 0%, #DDF2E4 50%, #B8DCC5 100%)",
    wrapperClass: "text-ink-900",
    textClass: "text-ink-900",
    cardBg: "rgba(255, 252, 246, 0.85)",
    accent: "#7BAE8E",
    emoji: ["🌿", "🍃", "🌱", "🍀", "🌼", "✨"],
    storyBg: "linear-gradient(160deg, #F2FBF5 0%, #DDF2E4 50%, #B8DCC5 100%)",
    storyText: "#1F1A17",
    storyAccent: "#7BAE8E",
  },
  {
    id: "dove-peach",
    label: "🍑 Dove Peach",
    bg: "linear-gradient(160deg, #FFF6EB 0%, #FFE4CC 50%, #F8C8A0 100%)",
    wrapperClass: "text-ink-900",
    textClass: "text-ink-900",
    cardBg: "rgba(255, 252, 246, 0.85)",
    accent: "#E0975E",
    emoji: ["🍑", "🧡", "🌅", "✨", "🌻", "🥧"],
    storyBg: "linear-gradient(160deg, #FFF6EB 0%, #FFE4CC 50%, #F8C8A0 100%)",
    storyText: "#1F1A17",
    storyAccent: "#E0975E",
  },
  {
    id: "dove-sky",
    label: "☁️ Dove Sky",
    bg: "linear-gradient(160deg, #F2F8FF 0%, #DCE9FA 50%, #B6D0EA 100%)",
    wrapperClass: "text-ink-900",
    textClass: "text-ink-900",
    cardBg: "rgba(255, 252, 252, 0.85)",
    accent: "#6E9DCC",
    emoji: ["☁️", "💙", "🩵", "✨", "🌊", "🕊️"],
    storyBg: "linear-gradient(160deg, #F2F8FF 0%, #DCE9FA 50%, #B6D0EA 100%)",
    storyText: "#1F1A17",
    storyAccent: "#6E9DCC",
  },
  {
    id: "dove-vanilla",
    label: "🍦 Dove Vanilla",
    bg: "linear-gradient(160deg, #FFFBE8 0%, #FFF1CC 50%, #F4DEA0 100%)",
    wrapperClass: "text-ink-900",
    textClass: "text-ink-900",
    cardBg: "rgba(255, 252, 246, 0.85)",
    accent: "#D4B05A",
    emoji: ["🍯", "🌼", "🐝", "✨", "🍋", "🤍"],
    storyBg: "linear-gradient(160deg, #FFFBE8 0%, #FFF1CC 50%, #F4DEA0 100%)",
    storyText: "#1F1A17",
    storyAccent: "#D4B05A",
  },
  {
    id: "dove-cocoa",
    label: "🐻 Dove Cocoa",
    bg: "linear-gradient(160deg, #FAF1E8 0%, #ECD9C2 50%, #C8A582 100%)",
    wrapperClass: "text-ink-900",
    textClass: "text-ink-900",
    cardBg: "rgba(255, 252, 246, 0.88)",
    accent: "#8A6748",
    emoji: ["🧸", "🤎", "🍪", "🤍", "🌰", "🍯"],
    storyBg: "linear-gradient(160deg, #FAF1E8 0%, #ECD9C2 50%, #C8A582 100%)",
    storyText: "#1F1A17",
    storyAccent: "#8A6748",
  },
  {
    id: "dove-blush",
    label: "🤍 Dove Blush",
    bg: "linear-gradient(160deg, #FFFAFA 0%, #FFEAEF 50%, #F8C9D6 100%)",
    wrapperClass: "text-ink-900",
    textClass: "text-ink-900",
    cardBg: "rgba(255, 255, 255, 0.88)",
    accent: "#D87FA0",
    emoji: ["🤍", "🩰", "💗", "🌷", "✨", "🦢"],
    storyBg: "linear-gradient(160deg, #FFFAFA 0%, #FFEAEF 50%, #F8C9D6 100%)",
    storyText: "#1F1A17",
    storyAccent: "#D87FA0",
  },

  // ---- Bold / cinematic ----
  {
    id: "moonlight",
    label: "🌙 Cahaya Bulan",
    bg: "linear-gradient(160deg, #1a1530 0%, #2d2348 50%, #3a2a5a 100%)",
    wrapperClass: "text-cream-50",
    textClass: "text-cream-50",
    cardBg: "rgba(40, 30, 70, 0.55)",
    accent: "#E8C9F0",
    emoji: ["🌙", "✨", "⭐", "🌌", "💜", "🪐"],
    storyBg: "linear-gradient(160deg, #1a1530 0%, #2d2348 50%, #3a2a5a 100%)",
    storyText: "#FBF7F1",
    storyAccent: "#E8C9F0",
  },
  {
    id: "midnight",
    label: "🖤 Tengah Malam",
    bg: "linear-gradient(160deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%)",
    wrapperClass: "text-cream-50",
    textClass: "text-cream-50",
    cardBg: "rgba(255, 252, 246, 0.08)",
    accent: "#D4A5A5",
    emoji: ["🌑", "🖤", "✨", "🥀", "🕯️", "🩵"],
    storyBg: "linear-gradient(160deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%)",
    storyText: "#FBF7F1",
    storyAccent: "#D4A5A5",
  },
  {
    id: "bubblegum",
    label: "🩷 Permen Karet",
    bg: "linear-gradient(160deg, #FFE0F0 0%, #FFB8E0 50%, #E090C5 100%)",
    wrapperClass: "text-ink-900",
    textClass: "text-ink-900",
    cardBg: "rgba(255, 252, 246, 0.85)",
    accent: "#C870A8",
    emoji: ["🩷", "🦄", "🌈", "✨", "🍭", "💖"],
    storyBg: "linear-gradient(160deg, #FFE0F0 0%, #FFB8E0 50%, #E090C5 100%)",
    storyText: "#1F1A17",
    storyAccent: "#C870A8",
  },
  {
    id: "sunny",
    label: "🌞 Sore Hangat",
    bg: "linear-gradient(160deg, #FFF7E8 0%, #FFE5B8 50%, #FFC97A 100%)",
    wrapperClass: "text-ink-900",
    textClass: "text-ink-900",
    cardBg: "rgba(255, 252, 246, 0.85)",
    accent: "#E89F3D",
    emoji: ["🌞", "🌻", "🍯", "🧡", "✨", "🌅"],
    storyBg: "linear-gradient(160deg, #FFF7E8 0%, #FFE5B8 50%, #FFC97A 100%)",
    storyText: "#1F1A17",
    storyAccent: "#E89F3D",
  },
];

export function getTheme(id: string | null | undefined): ShareTheme {
  return SHARE_THEMES.find((t) => t.id === id) ?? SHARE_THEMES[0];
}

export interface ShareOptions {
  anonymous?: boolean;
  includeComments?: boolean;
  theme?: string;
  /** User-picked emojis (overrides theme default if set) */
  emojis?: string[];
  /** Layout pattern for emoji backdrop */
  pattern?: EmojiPattern;
}

export function parseOptions(json: string | null | undefined): ShareOptions {
  if (!json) return {};
  try {
    const o = JSON.parse(json) as ShareOptions;
    return {
      ...o,
      emojis: Array.isArray(o.emojis)
        ? o.emojis.filter((e) => typeof e === "string").slice(0, 6)
        : undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Generate a list of emoji positions for the backdrop.
 * Returns an array of placements with x,y as percentages (0-100), size,
 * rotation, and opacity. Used by both web view (EmojiBackdrop component)
 * and IG Story image generator.
 */
export interface EmojiPlacement {
  x: number;
  y: number;
  size: number;
  rot: number;
  opacity: number;
  emoji: string;
}

export function generateEmojiPlacements(
  emojis: string[],
  pattern: EmojiPattern,
  seed = 1,
): EmojiPlacement[] {
  if (emojis.length === 0) return [];
  const rng = mulberry32(seed * 7919);
  const pickEmoji = (i: number) => emojis[i % emojis.length];

  if (pattern === "dense") {
    // Thick scatter — 70 emojis
    const out: EmojiPlacement[] = [];
    for (let i = 0; i < 70; i++) {
      out.push({
        x: rng() * 100,
        y: rng() * 100,
        size: 14 + rng() * 22,
        rot: rng() * 360 - 180,
        opacity: 0.4 + rng() * 0.35,
        emoji: pickEmoji(i),
      });
    }
    return out;
  }

  if (pattern === "scattered") {
    // Medium — 30 emojis
    const out: EmojiPlacement[] = [];
    for (let i = 0; i < 30; i++) {
      out.push({
        x: rng() * 100,
        y: rng() * 100,
        size: 16 + rng() * 18,
        rot: rng() * 40 - 20,
        opacity: 0.5 + rng() * 0.3,
        emoji: pickEmoji(i),
      });
    }
    return out;
  }

  if (pattern === "rain") {
    // Vertical streaks
    const out: EmojiPlacement[] = [];
    const cols = 8;
    for (let c = 0; c < cols; c++) {
      const x = (c + 0.5 + (rng() - 0.5) * 0.6) * (100 / cols);
      const rows = 6 + Math.floor(rng() * 4);
      for (let r = 0; r < rows; r++) {
        out.push({
          x,
          y: (r / rows) * 100 + rng() * 6,
          size: 16 + rng() * 12,
          rot: rng() * 30 - 15,
          opacity: 0.45 + rng() * 0.3,
          emoji: pickEmoji(c * rows + r),
        });
      }
    }
    return out;
  }

  if (pattern === "diagonal") {
    // Multiple diagonal lines
    const out: EmojiPlacement[] = [];
    const lines = 5;
    for (let l = 0; l < lines; l++) {
      const offset = (l - lines / 2) * 22;
      const dotsPerLine = 12;
      for (let i = 0; i < dotsPerLine; i++) {
        const t = i / dotsPerLine;
        out.push({
          x: t * 110 - 5,
          y: t * 100 + offset,
          size: 16 + rng() * 14,
          rot: -28,
          opacity: 0.45 + rng() * 0.3,
          emoji: pickEmoji(l * dotsPerLine + i),
        });
      }
    }
    return out;
  }

  if (pattern === "spiral") {
    // Emanating from center
    const out: EmojiPlacement[] = [];
    const turns = 4;
    const steps = 60;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const angle = t * turns * Math.PI * 2;
      const radius = t * 55;
      out.push({
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius * 1.6,
        size: 14 + t * 18,
        rot: (angle * 180) / Math.PI,
        opacity: 0.4 + (1 - t) * 0.4,
        emoji: pickEmoji(i),
      });
    }
    return out;
  }

  if (pattern === "edges") {
    // Border frame
    const out: EmojiPlacement[] = [];
    const perSide = 12;
    for (let i = 0; i < perSide; i++) {
      const t = (i + 0.5) / perSide;
      // top
      out.push({ x: t * 100, y: 3 + rng() * 4, size: 18 + rng() * 12, rot: rng() * 40 - 20, opacity: 0.5 + rng() * 0.3, emoji: pickEmoji(i) });
      // bottom
      out.push({ x: t * 100, y: 92 + rng() * 5, size: 18 + rng() * 12, rot: rng() * 40 - 20, opacity: 0.5 + rng() * 0.3, emoji: pickEmoji(i + 100) });
      // left
      out.push({ x: 3 + rng() * 4, y: t * 100, size: 18 + rng() * 12, rot: rng() * 40 - 20, opacity: 0.5 + rng() * 0.3, emoji: pickEmoji(i + 200) });
      // right
      out.push({ x: 92 + rng() * 5, y: t * 100, size: 18 + rng() * 12, rot: rng() * 40 - 20, opacity: 0.5 + rng() * 0.3, emoji: pickEmoji(i + 300) });
    }
    return out;
  }

  return [];
}

// Deterministic seeded PRNG
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
