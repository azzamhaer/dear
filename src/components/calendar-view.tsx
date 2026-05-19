"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const WEEKDAYS = ["M", "S", "S", "R", "K", "J", "S"];

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
      .then((r) => r.json() as Promise<{ counts: Record<string, number> }>)
      .then((j) => setCounts(j.counts ?? {}))
      .finally(() => setLoading(false));
  }, [year, month]);

  const days = useMemo(() => buildMonth(year, month), [year, month]);

  const todayYmd = useMemo(() => {
    const wib = new Date(Date.now() + 7 * 3600 * 1000);
    return `${wib.getUTCFullYear()}-${String(wib.getUTCMonth() + 1).padStart(2, "0")}-${String(wib.getUTCDate()).padStart(2, "0")}`;
  }, []);

  function shift(by: number) {
    const next = new Date(Date.UTC(year, month - 1 + by, 1));
    setYear(next.getUTCFullYear());
    setMonth(next.getUTCMonth() + 1);
  }

  // Year range: from 2000 to current+1
  const wibNow = useMemo(() => new Date(Date.now() + 7 * 3600 * 1000), []);
  const currentYear = wibNow.getUTCFullYear();
  const years = useMemo(() => {
    const out: number[] = [];
    for (let y = currentYear + 1; y >= 2000; y--) out.push(y);
    return out;
  }, [currentYear]);

  return (
    <div className="glass rounded-3xl p-5 shadow-soft sm:p-6">
      <header className="flex items-center justify-between gap-2 pb-4">
        <button
          onClick={() => shift(-1)}
          className="rounded-full p-2 text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
          aria-label="Bulan sebelumnya"
        >
          <ChevIcon className="h-4 w-4 -scale-x-100" />
        </button>

        <div className="flex items-center gap-1.5">
          <PickerSelect
            ariaLabel="Pilih bulan"
            value={month}
            onChange={setMonth}
            options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))}
            className="font-display text-lg italic"
          />
          <PickerSelect
            ariaLabel="Pilih tahun"
            value={year}
            onChange={setYear}
            options={years.map((y) => ({ value: y, label: String(y) }))}
            className="text-sm tabular-nums"
          />
        </div>

        <button
          onClick={() => shift(1)}
          className="rounded-full p-2 text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
          aria-label="Bulan berikutnya"
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
          const isToday = todayYmd === ymd;
          const intensity =
            count >= 6 ? 5 : count >= 4 ? 4 : count >= 2 ? 3 : count === 1 ? 2 : 1;

          const bgByIntensity: Record<number, string> = {
            1: "bg-transparent text-ink-700",
            2: "bg-rose-mist/70 text-ink-900",
            3: "bg-rose-blush text-ink-900",
            4: "bg-rose-dustier text-cream-50 shadow-soft",
            5: "bg-rose-dusty text-cream-50 shadow-glow",
          };

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
                className={`relative grid h-full w-full place-items-center rounded-xl text-sm transition hover:scale-[1.04] active:scale-[0.97] ${bgByIntensity[intensity]} ${isToday ? "ring-2 ring-ink-900/40" : ""
                  }`}
                title={
                  count ? `${count} kenangan di tanggal ${d}` : `tanggal ${d}`
                }
              >
                <span className="font-medium">{d}</span>
                {count > 0 ? (
                  <span
                    className={`absolute -bottom-0.5 right-1 text-[9px] font-semibold tabular-nums ${intensity >= 4 ? "text-cream-50/90" : "text-ink-700/70"
                      }`}
                  >
                    {count}
                  </span>
                ) : null}
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-ink-400">
        <button
          onClick={() => {
            setYear(currentYear);
            setMonth(wibNow.getUTCMonth() + 1);
          }}
          className="rounded-full bg-ink-900/[0.05] px-3 py-1 text-ink-500 hover:bg-ink-900/[0.08]"
        >
          Hari ini
        </button>
        <span>Memento mori, jadi jangan lupa bahagia.</span>
      </div>
    </div>
  );
}

function PickerSelect<T extends string | number>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div className="relative">
      <select
        aria-label={ariaLabel}
        value={String(value)}
        onChange={(e) => {
          const raw = e.target.value;
          const next =
            typeof value === "number" ? (Number(raw) as T) : (raw as T);
          onChange(next);
        }}
        className={`cursor-pointer appearance-none rounded-2xl bg-cream-50/70 px-3 py-1.5 pr-7 backdrop-blur transition hover:bg-cream-50 ${className ?? ""}`}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-400">
        <ChevIcon className="h-3 w-3 rotate-90" />
      </span>
    </div>
  );
}

function buildMonth(year: number, month: number): (number | null)[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const startDow = first.getUTCDay();
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
