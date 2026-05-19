import Link from "next/link";

export const runtime = "edge";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <div className="font-display text-5xl italic">404</div>
      <p className="mt-2 text-ink-500">
        Kenangan itu tidak di sini — atau mungkin memang tidak pernah ada.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-full bg-ink-900 px-5 py-2 text-sm font-medium text-cream-50 shadow-soft hover:bg-ink-700"
      >
        Kembali ke beranda
      </Link>
    </div>
  );
}
