export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "untitled";
}

export function toUnixSeconds(date: Date | string | number): number {
  const d =
    date instanceof Date
      ? date
      : typeof date === "number"
        ? new Date(date)
        : new Date(date);
  return Math.floor(d.getTime() / 1000);
}

export function fromUnixSeconds(s: number): Date {
  return new Date(s * 1000);
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function formatLongDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatRelative(d: Date): string {
  const now = Date.now();
  const diff = now - d.getTime();
  const seconds = Math.round(diff / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  if (seconds < 60) return "baru saja";
  if (minutes < 60) return `${minutes}m lalu`;
  if (hours < 24) return `${hours}j lalu`;
  if (days < 7) return `${days}h lalu`;
  return formatLongDate(d);
}

export const MOODS = [
  { id: "love", emoji: "💗", label: "jatuh cinta" },
  { id: "happy", emoji: "🌞", label: "bahagia" },
  { id: "calm", emoji: "🌿", label: "tenang" },
  { id: "nostalgic", emoji: "🍂", label: "rindu" },
  { id: "bittersweet", emoji: "🌙", label: "haru" },
  { id: "grateful", emoji: "✨", label: "bersyukur" },
  { id: "silly", emoji: "🎈", label: "kocak" },
  { id: "cozy", emoji: "🍵", label: "warm" },
] as const;

export type MoodId = (typeof MOODS)[number]["id"];

export function moodLabel(id: string | null | undefined): string | null {
  if (!id) return null;
  return MOODS.find((m) => m.id === id)?.label ?? id;
}

export function moodEmoji(id: string | null | undefined): string | null {
  if (!id) return null;
  return MOODS.find((m) => m.id === id)?.emoji ?? null;
}

export const REACTION_EMOJIS = ["heart", "cry", "hug", "moon"] as const;
export const REACTION_DISPLAY: Record<(typeof REACTION_EMOJIS)[number], string> = {
  heart: "💗",
  cry: "😭",
  hug: "🫂",
  moon: "🌙",
};
