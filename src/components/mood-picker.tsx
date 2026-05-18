"use client";

import { MOODS } from "@/lib/utils";

interface Props {
  value: string | null;
  onChange: (val: string | null) => void;
}

export function MoodPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {MOODS.map((m) => {
        const active = value === m.id;
        return (
          <button
            type="button"
            key={m.id}
            onClick={() => onChange(active ? null : m.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
              active
                ? "bg-rose-mist/70 text-ink-900 shadow-soft"
                : "bg-ink-900/[0.04] text-ink-500 hover:bg-rose-mist/40 hover:text-ink-900"
            }`}
          >
            <span className="text-base leading-none">{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
