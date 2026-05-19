"use client";

import Link from "next/link";

export function NewNoteButton() {
  return (
    <Link
      href="/notes/new"
      className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-ink-700"
    >
      + Catatan baru
    </Link>
  );
}
