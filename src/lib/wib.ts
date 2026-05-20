// Asia/Jakarta = UTC+7. Used so the form/UI always works in WIB regardless of
// where the user's browser timezone is set.

export const WIB_OFFSET_MINUTES = 7 * 60;

/** Current time in WIB, formatted for <input type="datetime-local"> (yyyy-MM-ddTHH:mm). */
export function nowWibLocal(): string {
  return dateToWibLocal(new Date());
}

/** Format a Date as WIB-local string for <input type="datetime-local">. */
export function dateToWibLocal(d: Date): string {
  // Shift the UTC time by +7h, then read the ISO string's date+time portion.
  const shifted = new Date(d.getTime() + WIB_OFFSET_MINUTES * 60_000);
  return shifted.toISOString().slice(0, 16);
}

/**
 * Convert a value from <input type="datetime-local"> (interpreted as WIB) into
 * an ISO string in UTC, suitable for sending to the API.
 */
export function wibLocalToIso(local: string): string {
  // "2026-05-18T10:30" → "2026-05-18T10:30:00+07:00" → real UTC
  if (!local) return new Date().toISOString();
  const padded = local.length === 16 ? `${local}:00` : local;
  return new Date(`${padded}+07:00`).toISOString();
}

/** Current WIB date as { year, month, day } (1-based month/day). */
export function wibToday(): { year: number; month: number; day: number } {
  const wib = new Date(Date.now() + WIB_OFFSET_MINUTES * 60_000);
  return {
    year: wib.getUTCFullYear(),
    month: wib.getUTCMonth() + 1,
    day: wib.getUTCDate(),
  };
}

/** Days between two YYYY-MM-DD strings (b - a). Positive = a was in the past. */
export function daysBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso + "T00:00:00+07:00").getTime();
  const b = new Date(bIso + "T00:00:00+07:00").getTime();
  return Math.round((b - a) / (24 * 3600 * 1000));
}

/** Today's WIB date as YYYY-MM-DD. */
export function todayWibIso(): string {
  const { year, month, day } = wibToday();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Extract MM-DD from a YYYY-MM-DD string. */
export function monthDay(iso: string): string {
  return iso.length >= 10 ? iso.slice(5, 10) : iso;
}

/** Format a Date for display: "18 Mei 2026 · 10:30 WIB". */
export function formatWibDisplay(d: Date): string {
  const shifted = new Date(d.getTime() + WIB_OFFSET_MINUTES * 60_000);
  const month = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ][shifted.getUTCMonth()];
  const day = shifted.getUTCDate();
  const year = shifted.getUTCFullYear();
  const hh = String(shifted.getUTCHours()).padStart(2, "0");
  const mm = String(shifted.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} · ${hh}:${mm} WIB`;
}
