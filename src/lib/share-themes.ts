/**
 * Themes for the public share viewer and IG Story image generator.
 * Each theme defines background gradient + accent + decorative emoji.
 */

export interface ShareTheme {
  id: string;
  label: string;
  /** Background CSS (gradient or color) */
  bg: string;
  /** Tailwind classes applied to the wrapper */
  wrapperClass: string;
  /** Foreground text color */
  textClass: string;
  /** Card background color (semi-transparent) */
  cardBg: string;
  /** Color for accents (border, dots) */
  accent: string;
  /** Floating decorative emojis */
  emoji: string[];
  /** SVG/CSS pattern for IG Story background */
  storyBg: string;
  storyText: string;
  storyAccent: string;
}

export const SHARE_THEMES: ShareTheme[] = [
  {
    id: "rose",
    label: "🌸 Mawar Senja",
    bg: "linear-gradient(160deg, #FBF7F1 0%, #F4E2E2 50%, #E8C9C9 100%)",
    wrapperClass: "text-ink-900",
    textClass: "text-ink-900",
    cardBg: "rgba(255, 252, 246, 0.85)",
    accent: "#D4A5A5",
    emoji: ["💗", "🌸", "✨", "🌷", "🤍"],
    storyBg: "linear-gradient(160deg, #FBF7F1 0%, #F4E2E2 50%, #E8C9C9 100%)",
    storyText: "#1F1A17",
    storyAccent: "#D4A5A5",
  },
  {
    id: "moonlight",
    label: "🌙 Cahaya Bulan",
    bg: "linear-gradient(160deg, #1a1530 0%, #2d2348 50%, #3a2a5a 100%)",
    wrapperClass: "text-cream-50",
    textClass: "text-cream-50",
    cardBg: "rgba(40, 30, 70, 0.55)",
    accent: "#E8C9F0",
    emoji: ["🌙", "✨", "⭐", "🌌", "💜"],
    storyBg: "linear-gradient(160deg, #1a1530 0%, #2d2348 50%, #3a2a5a 100%)",
    storyText: "#FBF7F1",
    storyAccent: "#E8C9F0",
  },
  {
    id: "sunny",
    label: "🌞 Sore Hangat",
    bg: "linear-gradient(160deg, #FFF7E8 0%, #FFE5B8 50%, #FFC97A 100%)",
    wrapperClass: "text-ink-900",
    textClass: "text-ink-900",
    cardBg: "rgba(255, 252, 246, 0.85)",
    accent: "#E89F3D",
    emoji: ["🌞", "🌻", "🍯", "🧡", "✨"],
    storyBg: "linear-gradient(160deg, #FFF7E8 0%, #FFE5B8 50%, #FFC97A 100%)",
    storyText: "#1F1A17",
    storyAccent: "#E89F3D",
  },
  {
    id: "ocean",
    label: "🌊 Ombak Biru",
    bg: "linear-gradient(160deg, #E0F4FF 0%, #B8DFFF 50%, #7FBDED 100%)",
    wrapperClass: "text-ink-900",
    textClass: "text-ink-900",
    cardBg: "rgba(255, 255, 255, 0.85)",
    accent: "#5B9BD5",
    emoji: ["🌊", "💙", "🐚", "✨", "🩵"],
    storyBg: "linear-gradient(160deg, #E0F4FF 0%, #B8DFFF 50%, #7FBDED 100%)",
    storyText: "#1F1A17",
    storyAccent: "#5B9BD5",
  },
  {
    id: "garden",
    label: "🌿 Taman Pagi",
    bg: "linear-gradient(160deg, #F0F7E8 0%, #D5E8C5 50%, #A8C887 100%)",
    wrapperClass: "text-ink-900",
    textClass: "text-ink-900",
    cardBg: "rgba(255, 252, 246, 0.85)",
    accent: "#7BA661",
    emoji: ["🌿", "🌱", "🍃", "🌼", "💚"],
    storyBg: "linear-gradient(160deg, #F0F7E8 0%, #D5E8C5 50%, #A8C887 100%)",
    storyText: "#1F1A17",
    storyAccent: "#7BA661",
  },
  {
    id: "bubblegum",
    label: "🩷 Permen Karet",
    bg: "linear-gradient(160deg, #FFE0F0 0%, #FFB8E0 50%, #E090C5 100%)",
    wrapperClass: "text-ink-900",
    textClass: "text-ink-900",
    cardBg: "rgba(255, 252, 246, 0.85)",
    accent: "#C870A8",
    emoji: ["🩷", "🦄", "🌈", "✨", "🍭"],
    storyBg: "linear-gradient(160deg, #FFE0F0 0%, #FFB8E0 50%, #E090C5 100%)",
    storyText: "#1F1A17",
    storyAccent: "#C870A8",
  },
  {
    id: "coffee",
    label: "☕ Kopi Sore",
    bg: "linear-gradient(160deg, #F5EBE0 0%, #D5B89C 50%, #8B6F50 100%)",
    wrapperClass: "text-ink-900",
    textClass: "text-ink-900",
    cardBg: "rgba(255, 252, 246, 0.88)",
    accent: "#7A5A40",
    emoji: ["☕", "🤎", "📖", "🍪", "🌰"],
    storyBg: "linear-gradient(160deg, #F5EBE0 0%, #D5B89C 50%, #8B6F50 100%)",
    storyText: "#1F1A17",
    storyAccent: "#7A5A40",
  },
  {
    id: "midnight",
    label: "🖤 Tengah Malam",
    bg: "linear-gradient(160deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%)",
    wrapperClass: "text-cream-50",
    textClass: "text-cream-50",
    cardBg: "rgba(255, 252, 246, 0.08)",
    accent: "#D4A5A5",
    emoji: ["🌑", "🖤", "✨", "🥀", "🕯️"],
    storyBg: "linear-gradient(160deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%)",
    storyText: "#FBF7F1",
    storyAccent: "#D4A5A5",
  },
];

export function getTheme(id: string | null | undefined): ShareTheme {
  return SHARE_THEMES.find((t) => t.id === id) ?? SHARE_THEMES[0];
}

export interface ShareOptions {
  anonymous?: boolean;
  includeComments?: boolean;
  theme?: string;
}

export function parseOptions(json: string | null | undefined): ShareOptions {
  if (!json) return {};
  try {
    return JSON.parse(json) as ShareOptions;
  } catch {
    return {};
  }
}
