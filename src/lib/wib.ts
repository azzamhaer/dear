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

/** Format a Date for display: "May 18, 2026 · 10:30 WIB". */
export function formatWibDisplay(d: Date): string {
  const shifted = new Date(d.getTime() + WIB_OFFSET_MINUTES * 60_000);
  const month = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ][shifted.getUTCMonth()];
  const day = shifted.getUTCDate();
  const year = shifted.getUTCFullYear();
  const hh = String(shifted.getUTCHours()).padStart(2, "0");
  const mm = String(shifted.getUTCMinutes()).padStart(2, "0");
  return `${month} ${day}, ${year} · ${hh}:${mm} WIB`;
}
