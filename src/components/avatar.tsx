interface Props {
  src: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
}

/** Reusable avatar — image if available, gradient initial otherwise. */
export function Avatar({ src, name, size = 36, className = "" }: Props) {
  const initial = (name || "—").charAt(0).toUpperCase();
  const style = { width: size, height: size };
  if (src) {
    return (
      <span
        style={style}
        className={`block shrink-0 overflow-hidden rounded-full ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <div
      style={style}
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-blush to-rose-dusty font-semibold text-cream-50 ${className}`}
    >
      <span style={{ fontSize: size * 0.4 }}>{initial}</span>
    </div>
  );
}
