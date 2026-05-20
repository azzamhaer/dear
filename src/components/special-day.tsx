"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { todayWibIso, monthDay, daysBetween, wibToday } from "@/lib/wib";

interface Props {
  birthdates: string[]; // YYYY-MM-DD for all users
  coupleStartDate: string | null; // YYYY-MM-DD
}

interface DayEvent {
  kind: "anniversary" | "birthday" | "monthsary";
  message: string;
  detail: string;
}

const STORAGE_PREFIX = "dear:dismissed:";

export function SpecialDayBanner({ birthdates, coupleStartDate }: Props) {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [petalsOpen, setPetalsOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const event = useMemo<DayEvent | null>(() => {
    const today = todayWibIso();
    const todayMd = monthDay(today);

    // Anniversary (same MM-DD as couple start)
    if (coupleStartDate && monthDay(coupleStartDate) === todayMd) {
      const yearsTogether =
        wibToday().year - Number(coupleStartDate.slice(0, 4));
      return {
        kind: "anniversary",
        message: yearsTogether > 0
          ? `${yearsTogether} tahun bersama. ✨`
          : "Hari yang sama, dulu kita mulai.",
        detail: "Selamat ulang tahun hubungan kita.",
      };
    }

    // Birthday (MM-DD matches any user's birthdate)
    for (const bd of birthdates) {
      if (monthDay(bd) === todayMd) {
        return {
          kind: "birthday",
          message: "Selamat ulang tahun, sayang. 🎈",
          detail: "Hari ini punyamu seutuhnya.",
        };
      }
    }

    // Monthsary — same DAY of month as couple start (skip if it's anniversary day)
    if (coupleStartDate) {
      const startDay = Number(coupleStartDate.slice(8, 10));
      if (startDay === wibToday().day) {
        const months = monthsBetween(coupleStartDate, today);
        if (months > 0) {
          return {
            kind: "monthsary",
            message: `${months} bulan kita. 💗`,
            detail: "Tanggal yang sama, di bulan yang berbeda.",
          };
        }
      }
    }

    return null;
  }, [birthdates, coupleStartDate]);

  // Check dismissal from localStorage (key per day to allow re-trigger next year)
  useEffect(() => {
    if (!event) return;
    const key = `${STORAGE_PREFIX}${event.kind}:${todayWibIso()}`;
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      // First time seeing this banner today — open petals briefly
      setPetalsOpen(true);
      setTimeout(() => setPetalsOpen(false), 7000);
    } else {
      setDismissed(stored === "1");
    }
  }, [event]);

  function dismiss() {
    if (!event) return;
    setDismissed(true);
    const key = `${STORAGE_PREFIX}${event.kind}:${todayWibIso()}`;
    try {
      window.localStorage.setItem(key, "1");
    } catch {}
  }

  if (!mounted || !event) return null;

  const banner = (
    <>
      <AnimatePresence>
        {!dismissed ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed inset-x-0 top-20 z-[9990] flex justify-center px-4 sm:top-24"
          >
            <div className="glass-strong pointer-events-auto flex max-w-md items-center gap-3 rounded-3xl px-4 py-3 shadow-glow">
              <span className="text-2xl leading-none">
                {event.kind === "anniversary" || event.kind === "monthsary"
                  ? "💗"
                  : "🎈"}
              </span>
              <div className="flex-1">
                <div className="font-display text-base italic text-ink-900">
                  {event.message}
                </div>
                <div className="text-xs text-ink-500">{event.detail}</div>
              </div>
              <button
                onClick={dismiss}
                aria-label="Tutup"
                className="grid h-7 w-7 place-items-center rounded-full text-ink-400 transition hover:bg-ink-900/5 hover:text-ink-700"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <PetalRain open={petalsOpen} />
    </>
  );

  return createPortal(banner, document.body);
}

/* ============================ petals ============================ */

const PETAL_COUNT = 36;

function PetalRain({ open }: { open: boolean }) {
  const petals = useMemo(() => {
    return Array.from({ length: PETAL_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2.5,
      duration: 7 + Math.random() * 6,
      drift: (Math.random() - 0.5) * 80,
      size: 12 + Math.random() * 10,
      hue: Math.random() > 0.5 ? "#D4A5A5" : "#E8C9C9",
      rotate: Math.random() * 360,
    }));
  }, []);

  if (!open) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9989] overflow-hidden"
    >
      {petals.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: 0,
            width: p.size,
            height: p.size,
            transform: `rotate(${p.rotate}deg)`,
            animation: `dear-petal-fall ${p.duration}s linear ${p.delay}s forwards`,
            ["--drift" as string]: `${p.drift}px`,
          }}
        >
          <svg viewBox="0 0 24 24" width={p.size} height={p.size}>
            <path
              d="M12 3 C 18 3, 22 9, 18 14 C 22 14, 22 20, 16 21 C 14 21, 12 19, 12 17 C 12 19, 10 21, 8 21 C 2 20, 2 14, 6 14 C 2 9, 6 3, 12 3 Z"
              fill={p.hue}
              opacity="0.85"
            />
          </svg>
        </span>
      ))}
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}

function monthsBetween(startIso: string, endIso: string): number {
  const [ys, ms, ds] = startIso.split("-").map(Number);
  const [ye, me, de] = endIso.split("-").map(Number);
  let months = (ye - ys) * 12 + (me - ms);
  if (de < ds) months -= 1;
  return months;
}
