interface Props {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  right?: React.ReactNode;
}

export function PageHeader({ title, subtitle, eyebrow, right }: Props) {
  return (
    <header className="flex items-start justify-between gap-4 pb-6 pt-6 sm:pt-10">
      <div>
        {eyebrow ? (
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-ink-400">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="font-display text-3xl italic leading-tight text-ink-900 sm:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-md text-sm text-ink-500">{subtitle}</p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </header>
  );
}
