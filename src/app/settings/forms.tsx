"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface UserShape {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export function SettingsForms({ user }: { user: UserShape }) {
  return (
    <div className="space-y-6">
      <ProfileForm user={user} />
      <PasswordForm />
    </div>
  );
}

function ProfileForm({ user }: { user: UserShape }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickAvatar(file: File) {
    setUploading(true);
    setStatus(null);
    try {
      const form = new FormData();
      form.append("files", file);
      const up = await fetch("/api/upload", { method: "POST", body: form });
      if (!up.ok) throw new Error("Upload failed");
      const j = (await up.json()) as {
        uploaded: Array<{ r2Key: string }>;
      };
      const key = j.uploaded[0]?.r2Key;
      if (!key) throw new Error("No key returned");
      const url = `/api/media/${encodeURI(key)}`;
      // Patch profile right away so it sticks
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ avatarKey: key }),
      });
      if (!res.ok) throw new Error("Profile update failed");
      setAvatarUrl(url);
      setStatus("Photo updated.");
      router.refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setUploading(false);
    }
  }

  async function saveName() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Update failed");
      }
      setStatus("Name updated.");
      router.refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass space-y-5 rounded-3xl p-5 shadow-soft sm:p-6">
      <h2 className="font-display text-xl italic">Profile</h2>

      <div className="flex items-center gap-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-rose-blush to-rose-dusty text-2xl font-semibold text-cream-50 shadow-soft">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            user.displayName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickAvatar(f);
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-ink-700 disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Change photo"}
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-400">
          Display name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 outline-none transition focus:border-rose-dusty/40"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-400">
          Username (for login)
        </label>
        <input
          type="text"
          value={user.username}
          readOnly
          className="w-full cursor-not-allowed rounded-2xl border border-ink-900/10 bg-cream-100/60 px-4 py-3 text-ink-500 outline-none"
        />
        <p className="mt-1 text-xs text-ink-400">
          Username can't be changed once set.
        </p>
      </div>

      {status ? (
        <div className="rounded-2xl bg-rose-mist/40 px-4 py-3 text-sm text-ink-700">
          {status}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          onClick={saveName}
          disabled={saving || displayName === user.displayName || !displayName.trim()}
          className="rounded-full bg-ink-900 px-5 py-2.5 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-ink-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </div>
    </section>
  );
}

function PasswordForm() {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    kind: "ok" | "err";
    msg: string;
  } | null>(null);

  async function save() {
    if (newPassword !== confirm) {
      setStatus({ kind: "err", msg: "Passwords don't match." });
      return;
    }
    if (newPassword.length < 8) {
      setStatus({ kind: "err", msg: "New password is too short (min 8)." });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(
          j.error === "wrong_password"
            ? "Current password is wrong."
            : j.error === "too_short"
              ? "New password is too short (min 8)."
              : "Couldn't change password.",
        );
      }
      setStatus({ kind: "ok", msg: "Password changed." });
      setCurrent("");
      setNewPass("");
      setConfirm("");
    } catch (e) {
      setStatus({
        kind: "err",
        msg: e instanceof Error ? e.message : "Something went wrong.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass space-y-5 rounded-3xl p-5 shadow-soft sm:p-6">
      <h2 className="font-display text-xl italic">Password</h2>

      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-400">
          Current password
        </label>
        <input
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrent(e.target.value)}
          className="w-full rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 outline-none transition focus:border-rose-dusty/40"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-400">
          New password
        </label>
        <input
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPass(e.target.value)}
          className="w-full rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 outline-none transition focus:border-rose-dusty/40"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-400">
          Confirm new password
        </label>
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 outline-none transition focus:border-rose-dusty/40"
        />
      </div>

      {status ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            status.kind === "ok"
              ? "bg-rose-mist/40 text-ink-700"
              : "border border-rose-dusty/30 bg-rose-mist/40 text-ink-700"
          }`}
        >
          {status.msg}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={
            saving ||
            !currentPassword ||
            !newPassword ||
            !confirm
          }
          className="rounded-full bg-ink-900 px-5 py-2.5 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-ink-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Change password"}
        </button>
      </div>
    </section>
  );
}
