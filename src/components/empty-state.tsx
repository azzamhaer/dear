import Link from "next/link";
import { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  cta?: { href: string; label: string };
  icon?: ReactNode;
}

export function EmptyState({ title, description, cta, icon }: Props) {
  return (
    <div className="glass mx-auto my-10 max-w-md rounded-3xl px-6 py-10 text-center shadow-soft">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-rose-mist/60 text-2xl">
        {icon ?? "🤍"}
      </div>
      <h3 className="font-display text-2xl italic text-ink-900">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
          {description}
        </p>
      ) : null}
      {cta ? (
        <Link
          href={cta.href}
          className="mt-5 inline-flex items-center rounded-full bg-ink-900 px-5 py-2 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-ink-700"
        >
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}
