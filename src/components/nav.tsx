"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface NavProps {
  user: { username: string; displayName: string; avatarUrl: string | null };
}

/* Desktop nav links — Hari Ini lives in the profile dropdown */
const desktopLinks = [
  { href: "/", label: "Beranda" },
  { href: "/albums", label: "Album" },
  { href: "/calendar", label: "Kalender" },
  { href: "/notes", label: "Catatan" },
];

/* Mobile bottom nav — icons only, 4 items */
const mobileLinks: Array<{
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { href: "/", label: "Beranda", Icon: HomeIcon },
  { href: "/albums", label: "Album", Icon: GridIcon },
  { href: "/calendar", label: "Kalender", Icon: CalendarIcon },
  { href: "/notes", label: "Catatan", Icon: NoteIcon },
];

export function Nav({ user }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menu on outside click / Esc
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

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
          {desktopLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition",
                isActive(l.href)
                  ? "bg-ink-900/[0.06] text-ink-900"
                  : "text-ink-500 hover:text-ink-900",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/upload"
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-ink-900 px-3 py-1.5 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-ink-700 sm:px-4"
            aria-label="Kenangan baru"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Kenangan baru</span>
          </Link>

          {/* Avatar dropdown — anchored relative to its container.
             Using inline styles to ensure positioning works regardless of
             Tailwind JIT picking up arbitrary values. */}
          <div
            ref={menuRef}
            style={{ position: "relative" }}
            className="shrink-0"
          >
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-full p-1 transition hover:bg-ink-900/[0.05]"
              aria-label="Menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <AvatarChip
                src={user.avatarUrl}
                initial={user.displayName.charAt(0).toUpperCase()}
              />
            </button>

            {menuOpen ? (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: 8,
                  width: 240,
                  zIndex: 50,
                }}
                className="glass-strong rounded-2xl p-1.5 shadow-soft animate-fade-in"
              >
                <div className="border-b border-ink-900/5 px-3 py-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-ink-400">
                    masuk sebagai
                  </div>
                  <div className="font-medium text-ink-900">
                    {user.displayName}
                  </div>
                </div>
                <Link
                  href={`/profile/${user.username}`}
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-ink-900/5"
                >
                  <UserIcon className="h-4 w-4 text-ink-400" />
                  Profil saya
                </Link>
                <Link
                  href="/on-this-day"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-ink-900/5"
                >
                  <SunIcon className="h-4 w-4 text-ink-400" />
                  Hari ini, di waktu lain
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-ink-900/5"
                >
                  <CogIcon className="h-4 w-4 text-ink-400" />
                  Pengaturan
                </Link>
                <div className="my-1 border-t border-ink-900/5" />
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-900/5"
                >
                  <LogoutIcon className="h-4 w-4 text-ink-400" />
                  Keluar
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav — icons only, liquid glass */}
      <nav
        className="liquid-bar fixed bottom-3 left-1/2 z-30 w-[calc(100%-1.5rem)] max-w-[440px] -translate-x-1/2 md:hidden bottom-safe"
        aria-label="Navigasi utama"
      >
        <div className="liquid-bar-inner flex items-center justify-around gap-1 rounded-[28px] px-2 py-2">
          {mobileLinks.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-label={l.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative grid h-12 w-12 place-items-center rounded-2xl transition",
                  active
                    ? "text-ink-900"
                    : "text-ink-400 hover:text-ink-700",
                )}
              >
                {active ? (
                  <span className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/85 to-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_14px_-4px_rgba(31,26,23,0.18)]" />
                ) : null}
                <l.Icon className={cn("relative h-[22px] w-[22px] transition", active ? "scale-105" : "")} />
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

/* ============================ avatars ============================ */

function AvatarChip({
  src,
  initial,
}: {
  src: string | null;
  initial: string;
}) {
  if (src) {
    return (
      <span className="block h-8 w-8 overflow-hidden rounded-full ring-1 ring-ink-900/[0.06]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-rose-blush to-rose-dusty text-[12px] font-semibold text-cream-50 ring-1 ring-ink-900/[0.06]">
      {initial}
    </div>
  );
}

/* ============================ icons ============================ */

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.2 11.6 12 4l8.8 7.6" />
      <path d="M5.5 10.4V20a1 1 0 0 0 1 1H10v-5.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V21h3.5a1 1 0 0 0 1-1v-9.6" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3.5v3M16 3.5v3" />
    </svg>
  );
}

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4.5h11l3 3V19a1.5 1.5 0 0 1-1.5 1.5h-12.5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5Z" />
      <path d="M16 4.5v3.5h3" />
      <path d="M7.5 12h8M7.5 15.5h6" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </svg>
  );
}

function CogIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 14.6a1.5 1.5 0 0 0 .3 1.6l.1.1a1.8 1.8 0 1 1-2.6 2.6l-.1-.1a1.5 1.5 0 0 0-1.6-.3 1.5 1.5 0 0 0-.9 1.4V20a1.8 1.8 0 1 1-3.6 0v-.1a1.5 1.5 0 0 0-1-1.4 1.5 1.5 0 0 0-1.6.3l-.1.1A1.8 1.8 0 1 1 4.7 16.3l.1-.1a1.5 1.5 0 0 0 .3-1.6 1.5 1.5 0 0 0-1.4-.9H3.5a1.8 1.8 0 1 1 0-3.6h.1a1.5 1.5 0 0 0 1.4-1 1.5 1.5 0 0 0-.3-1.6l-.1-.1A1.8 1.8 0 1 1 7.2 4.7l.1.1a1.5 1.5 0 0 0 1.6.3h.1a1.5 1.5 0 0 0 .9-1.4V3.5a1.8 1.8 0 1 1 3.6 0v.1a1.5 1.5 0 0 0 .9 1.4 1.5 1.5 0 0 0 1.6-.3l.1-.1a1.8 1.8 0 1 1 2.6 2.6l-.1.1a1.5 1.5 0 0 0-.3 1.6v.1a1.5 1.5 0 0 0 1.4.9h.1a1.8 1.8 0 1 1 0 3.6h-.1a1.5 1.5 0 0 0-1.4.9Z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4.5h3.5A1.5 1.5 0 0 1 19 6v12a1.5 1.5 0 0 1-1.5 1.5H14" />
      <path d="M10 8l-4 4 4 4" />
      <path d="M6 12h11" />
    </svg>
  );
}
