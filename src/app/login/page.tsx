import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "./form";

export const runtime = "edge";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const [user, sp] = await Promise.all([
    getCurrentUser().catch(() => null),
    searchParams,
  ]);
  if (user) redirect(sp.from || "/");

  return (
    <div className="relative min-h-dvh">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-rose-blush/40 blur-3xl" />
        <div className="absolute -right-24 bottom-24 h-72 w-72 rounded-full bg-sand-200/50 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-16">
        <div className="mb-10 text-center">
          <div className="mb-3 font-display text-5xl italic text-ink-900">
            Dear<span className="text-rose-dusty">.</span>
          </div>
          <p className="text-sm text-ink-500">A quiet place for the two of us.</p>
        </div>

        <div className="glass w-full rounded-3xl p-6 shadow-soft sm:p-8">
          <LoginForm redirectTo={sp.from} />
        </div>

        <p className="mt-8 text-center text-xs text-ink-400">
          private · just us
        </p>
      </div>
    </div>
  );
}
