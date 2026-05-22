"use client";

import { useMemo } from "react";
import {
  generateEmojiPlacements,
  type EmojiPattern,
} from "@/lib/share-themes";

interface Props {
  emojis: string[];
  pattern: EmojiPattern;
  seed?: number;
}

export function EmojiBackdrop({ emojis, pattern, seed = 1 }: Props) {
  const placements = useMemo(
    () => generateEmojiPlacements(emojis, pattern, seed),
    [emojis, pattern, seed],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {placements.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: p.size,
            opacity: p.opacity,
            transform: `translate(-50%, -50%) rotate(${p.rot}deg)`,
            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.08))",
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
