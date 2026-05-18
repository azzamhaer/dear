"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function CalendarView({
  initialYear,
  initialMonth,
}: {
  initialYear: number;
  initialMonth: number;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/calendar?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((j) => setCounts(j.counts ?? {}))
      .finally(() => setLoading(false));
  }, [year, month]);

  const days = useMemo(() => buildMonth(year, month), [year, month]);

  function shift(by: number) {
    const next = new Date(Date.UTC(year, month - 1 + by, 1));
    setYear(next.getUTCFullYear());
    setMonth(next.getUTCMonth() + 1);
  }

  return (
    <div className="glass rounded-3xl p-5 shadow-soft sm:p-6">
      <header className="flex items-center justify-between pb-4">
        <button
          onClick={() => shift(-1)}
          className="rounded-full p-2 text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
          aria-label="Previous month"
        >
          <ChevIcon className="h-4 w-4 -scale-x-100" />
        </button>
        <div className="text-center">
          <div className="font-display text-xl italic">
            {MONTHS[month - 1]}
          </div>
          <div className="text-xs text-ink-400">{year}</div>
        </div>
        <button
          onClick={() => shift(1)}
          className="rounded-full p-2 text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
          aria-label="Next month"
        >
          <ChevIcon className="h-4 w-4" />
        </button>
      </header>

      <div className="grid grid-cols-7 gap-1 pb-2 text-center text-[10px] uppercase tracking-wider text-ink-400">
        {WEEKDAYS.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          if (!d) return <div key={i} className="aspect-square" />;
          const ymd = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const count = counts[ymd] ?? 0;
          const isToday =
            new Date().toISOString().slice(0, 10) === ymd;
          const tone =
            count >= 4
              ? "bg-rose-dusty text-cream-50"
              : count === 3
              ? "bg-rose-dustier/80 text-cream-50"
              : count === 2
              ? "bg-rose-blush text-ink-900"
              : count === 1
              ? "bg-rose-mist text-ink-900"
              : "bg-transparent text-ink-700";
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: loading ? 0.4 : 1 }}
              transition={{ duration: 0.3 }}
              className="aspect-square"
            >
              <Link
                href={`/calendar/${ymd}`}
                className={`grid h-full w-full place-items-center rounded-xl text-sm transition hover:scale-[1.03] ${tone} ${
                  isToday ? "ring-2 ring-ink-900/30" : ""
                }`}
                title={count ? `${count} memor${count === 1 ? "y" : "ies"}` : ""}
              >
                {d}
              </Link>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs text-ink-400">
        Darker days hold more memories.
      </p>
    </div>
  );
}

function buildMonth(year: number, month: number): (number | null)[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const startDow = first.getUTCDay(); // 0 = Sun
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  return cells;
}

function ChevIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
