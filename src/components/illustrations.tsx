// Hand-drawn-feel illustrations for empty states.
// Soft palette, consistent rose/cream tones, friendly hand-drawn linework.

type IconProps = { className?: string };

const stroke = "#3A322D"; // ink-700
const rose = "#D4A5A5";
const blush = "#F4E2E2";
const cream = "#FBF7F1";

export function PolaroidEmpty({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 110" className={className} fill="none">
      <g transform="rotate(-4 60 55)">
        <rect
          x="22"
          y="20"
          width="76"
          height="76"
          rx="6"
          fill={cream}
          stroke={stroke}
          strokeWidth="1.4"
        />
        <rect x="28" y="26" width="64" height="48" rx="3" fill={blush} />
        <circle cx="58" cy="50" r="8" fill={rose} />
        <path
          d="M40 70 L 52 56 L 60 64 L 72 50 L 84 70"
          stroke={stroke}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M28 80 L 92 80"
          stroke={stroke}
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.4"
        />
      </g>
      <path
        d="M88 18 C 94 14 99 18 96 24 C 99 22 102 26 99 30"
        stroke={rose}
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="103" cy="32" r="1.2" fill={rose} />
      <circle cx="18" cy="92" r="1.2" fill={rose} />
    </svg>
  );
}

export function AlbumEmpty({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 110" className={className} fill="none">
      <rect x="22" y="18" width="74" height="78" rx="5" fill={cream} stroke={stroke} strokeWidth="1.4" />
      <path d="M22 30 L 96 30" stroke={stroke} strokeWidth="1" opacity="0.4" />
      <rect x="30" y="38" width="58" height="22" rx="2" fill={blush} />
      <circle cx="40" cy="49" r="4" fill={rose} />
      <path d="M30 60 L 44 50 L 60 56 L 88 44 L 88 60 Z" fill={rose} opacity="0.7" />
      <path d="M30 70 L 88 70" stroke={stroke} strokeWidth="0.8" opacity="0.3" />
      <path d="M30 78 L 88 78" stroke={stroke} strokeWidth="0.8" opacity="0.3" />
      <path d="M30 86 L 70 86" stroke={stroke} strokeWidth="0.8" opacity="0.3" />
    </svg>
  );
}

export function NoteEmpty({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 110" className={className} fill="none">
      <g transform="rotate(-3 60 55)">
        <rect x="26" y="18" width="62" height="80" rx="4" fill={cream} stroke={stroke} strokeWidth="1.4" />
        <path d="M34 32 L 80 32" stroke={stroke} strokeWidth="0.9" opacity="0.45" />
        <path d="M34 42 L 80 42" stroke={stroke} strokeWidth="0.9" opacity="0.45" />
        <path d="M34 52 L 76 52" stroke={stroke} strokeWidth="0.9" opacity="0.45" />
        <path d="M34 62 L 80 62" stroke={stroke} strokeWidth="0.9" opacity="0.45" />
        <path d="M34 72 L 64 72" stroke={stroke} strokeWidth="0.9" opacity="0.45" />
      </g>
      <g transform="rotate(28 88 86)">
        <rect x="80" y="60" width="4" height="34" rx="1.5" fill={rose} />
        <path d="M80 60 L 84 60 L 82 54 Z" fill={stroke} />
      </g>
    </svg>
  );
}

export function CalendarEmpty({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 110" className={className} fill="none">
      <rect x="22" y="24" width="76" height="68" rx="5" fill={cream} stroke={stroke} strokeWidth="1.4" />
      <path d="M22 38 L 98 38" stroke={stroke} strokeWidth="1" />
      <rect x="32" y="18" width="3" height="12" rx="1" fill={stroke} />
      <rect x="85" y="18" width="3" height="12" rx="1" fill={stroke} />
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3, 4].map((col) => (
          <circle
            key={`${row}-${col}`}
            cx={32 + col * 14}
            cy={50 + row * 10}
            r="2"
            fill={row === 1 && col === 2 ? rose : stroke}
            opacity={row === 1 && col === 2 ? 1 : 0.25}
          />
        )),
      )}
      <path
        d="M70 78 C 76 74 84 78 80 84 C 84 82 88 86 84 90"
        stroke={rose}
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function LetterEmpty({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 110" className={className} fill="none">
      <rect x="20" y="32" width="80" height="56" rx="4" fill={cream} stroke={stroke} strokeWidth="1.4" />
      <path
        d="M20 36 L 60 64 L 100 36"
        stroke={stroke}
        strokeWidth="1.3"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M50 56 C 50 50 60 46 60 54 C 60 46 70 50 70 56 C 70 64 60 70 60 70 C 60 70 50 64 50 56 Z"
        fill={rose}
      />
      <circle cx="20" cy="22" r="1.5" fill={rose} />
      <circle cx="100" cy="20" r="1.5" fill={rose} />
      <path
        d="M14 100 L 20 96 L 24 100 L 30 96 L 36 100"
        stroke={rose}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function MoonEmpty({ className }: IconProps) {
  // for on-this-day no echoes yet
  return (
    <svg viewBox="0 0 120 110" className={className} fill="none">
      <circle cx="60" cy="56" r="32" fill={blush} />
      <path
        d="M76 36 C 60 32 50 50 60 66 C 70 80 86 76 90 64 C 78 76 60 62 76 36 Z"
        fill={rose}
      />
      <circle cx="30" cy="30" r="1.4" fill={rose} />
      <circle cx="95" cy="30" r="1.4" fill={rose} />
      <circle cx="22" cy="80" r="1.4" fill={rose} />
      <circle cx="100" cy="84" r="1.4" fill={rose} />
    </svg>
  );
}
