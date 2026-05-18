"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(
          j.error === "invalid_credentials"
            ? "That doesn't match what we have."
            : "Couldn't sign you in. Try again?",
        );
      }
      router.push(redirectTo || "/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-400">
          Name
        </label>
        <input
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 text-base outline-none transition focus:border-rose-dusty/40"
          placeholder="who are you?"
          required
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-400">
          Password
        </label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 text-base outline-none transition focus:border-rose-dusty/40"
          placeholder="••••••••"
          required
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-dusty/30 bg-rose-mist/40 px-4 py-3 text-sm text-ink-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 w-full rounded-2xl bg-ink-900 px-4 py-3 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-ink-700 disabled:opacity-60"
      >
        {submitting ? "Opening the door…" : "Come in"}
      </button>
    </form>
  );
}
