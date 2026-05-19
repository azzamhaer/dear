"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface UserShape {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
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
  const [bio, setBio] = useState(user.bio);
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
      if (!up.ok) throw new Error("Foto belum bisa diunggah.");
      const j = (await up.json()) as {
        uploaded: Array<{ r2Key: string }>;
      };
      const key = j.uploaded[0]?.r2Key;
      if (!key) throw new Error("Foto tidak terbaca.");
      const url = `/api/media/${encodeURI(key)}`;
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ avatarKey: key }),
      });
      if (!res.ok) throw new Error("Foto profil belum bisa diganti.");
      setAvatarUrl(url);
      setStatus("Foto diganti.");
      router.refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Ada yang tidak beres.");
    } finally {
      setUploading(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName, bio }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Belum bisa diganti.");
      }
      setStatus("Tersimpan.");
      router.refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Ada yang tidak beres.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass space-y-5 rounded-3xl p-5 shadow-soft sm:p-6">
      <h2 className="font-display text-xl italic">Profil</h2>

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
            {uploading ? "Mengunggah…" : "Ganti foto"}
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-400">
          Nama tampilan
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
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="Beberapa kata tentangmu, sependek atau sepanjang yang kamu mau…"
          className="w-full rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 font-serif text-[15.5px] leading-relaxed outline-none transition focus:border-rose-dusty/40"
        />
        <p className="mt-1 text-right text-xs text-ink-400">
          {bio.length}/300
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-400">
          Username (untuk masuk)
        </label>
        <input
          type="text"
          value={user.username}
          readOnly
          className="w-full cursor-not-allowed rounded-2xl border border-ink-900/10 bg-cream-100/60 px-4 py-3 text-ink-500 outline-none"
        />
        <p className="mt-1 text-xs text-ink-400">
          Untuk alasan cinta, username tidak bisa diubah setelah dibuat.
        </p>
      </div>

      {status ? (
        <div className="rounded-2xl bg-rose-mist/40 px-4 py-3 text-sm text-ink-700">
          {status}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          onClick={saveProfile}
          disabled={
            saving ||
            !displayName.trim() ||
            (displayName === user.displayName && bio === user.bio)
          }
          className="rounded-full bg-ink-900 px-5 py-2.5 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-ink-700 disabled:opacity-60"
        >
          {saving ? "Menyimpan…" : "Simpan profil"}
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
      setStatus({ kind: "err", msg: "Kata sandi tidak cocok." });
      return;
    }
    if (newPassword.length < 8) {
      setStatus({
        kind: "err",
        msg: "Kata sandi terlalu pendek (minimal 8 karakter).",
      });
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
            ? "Kata sandi sekarang salah."
            : j.error === "too_short"
              ? "Kata sandi terlalu pendek (minimal 8 karakter)."
              : "Belum bisa mengganti kata sandi.",
        );
      }
      setStatus({ kind: "ok", msg: "Kata sandi diganti." });
      setCurrent("");
      setNewPass("");
      setConfirm("");
    } catch (e) {
      setStatus({
        kind: "err",
        msg: e instanceof Error ? e.message : "Ada yang tidak beres.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass space-y-5 rounded-3xl p-5 shadow-soft sm:p-6">
      <h2 className="font-display text-xl italic">Kata sandi</h2>

      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-400">
          Kata sandi sekarang
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
          Kata sandi baru
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
          Konfirmasi kata sandi baru
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
          className={`rounded-2xl px-4 py-3 text-sm ${status.kind === "ok"
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
          disabled={saving || !currentPassword || !newPassword || !confirm}
          className="rounded-full bg-ink-900 px-5 py-2.5 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-ink-700 disabled:opacity-60"
        >
          {saving ? "Menyimpan…" : "Ganti kata sandi"}
        </button>
      </div>
    </section>
  );
}
