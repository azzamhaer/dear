"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavProps {
  user: { displayName: string; avatarUrl: string | null };
}

const links = [
  { href: "/", label: "Beranda" },
  { href: "/albums", label: "Album" },
  { href: "/calendar", label: "Kalender" },
  { href: "/notes", label: "Catatan" },
  { href: "/on-this-day", label: "Hari Ini" },
];

export function Nav({ user }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <header className="sticky top-0 z-30">
      <div className="glass-soft mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-3 rounded-b-2xl border-b border-ink-900/5 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="font-display text-xl italic tracking-tight text-ink-900 sm:text-2xl"
        >
          Dear<span className="text-rose-dusty">.</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm transition",
                isActive(l.href)
                  ? "bg-ink-900/[0.06] text-ink-900"
                  : "text-ink-500 hover:text-ink-900",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/upload"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-3 py-1.5 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-ink-700 sm:px-4"
            aria-label="Kenangan baru"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Kenangan baru</span>
            <span className="sm:hidden">+</span>
          </Link>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-full p-1.5 text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
            aria-label="Menu"
          >
            <Avatar
              src={user.avatarUrl}
              initial={user.displayName.charAt(0).toUpperCase()}
            />
          </button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-3 left-1/2 z-30 -translate-x-1/2 md:hidden">
        <div className="glass flex items-center gap-1 rounded-full px-1.5 py-1.5 shadow-soft">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-2.5 py-1.5 text-[11px] transition",
                isActive(l.href)
                  ? "bg-ink-900 text-cream-50"
                  : "text-ink-500 hover:text-ink-900",
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </nav>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="glass absolute right-3 top-14 w-56 rounded-2xl p-2 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-ink-900/5 px-3 py-2">
              <div className="text-xs uppercase tracking-wider text-ink-400">
                masuk sebagai
              </div>
              <div className="font-medium">{user.displayName}</div>
            </div>
            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-900/5"
            >
              Pengaturan
            </Link>
            <button
              onClick={logout}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-900/5"
            >
              Keluar
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function Avatar({
  src,
  initial,
}: {
  src: string | null;
  initial: string;
}) {
  if (src) {
    return (
      <span className="block h-7 w-7 overflow-hidden rounded-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-rose-blush to-rose-dusty text-[11px] font-semibold text-cream-50">
      {initial}
    </div>
  );
}
