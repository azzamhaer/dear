import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Nav } from "@/components/nav";
import { ToastHost } from "@/components/toast-host";
import { SpecialDayBanner } from "@/components/special-day";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/cloudflare";
import { users } from "@/db/schema";

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const serif = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  axes: ["opsz"],
});

const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  style: ["italic", "normal"],
  axes: ["opsz"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://dear.web.id";
const SITE_NAME = "Dear";
const SITE_TITLE = "Dear Future Us — kenangan kita berdua";
const SITE_DESCRIPTION =
  "Tempat tenang menyimpan kenangan berdua. Foto, video, surat, catatan, dan tanggal-tanggal kecil yang berarti.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s · Dear",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: [
    "Dear",
    "Dear Future Us",
    "kenangan",
    "pasangan",
    "couple",
    "diary",
    "buku kenangan",
    "album foto",
    "memoir",
    "surat masa depan",
    "memori bersama",
  ],
  authors: [{ name: "Dear" }],
  creator: "Dear",
  publisher: "Dear",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image.svg",
        width: 1200,
        height: 630,
        alt: "Dear — kenangan kita berdua",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image.svg"],
  },
  // Private app — discourage indexing
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: [
      { url: "/apple-icon.svg", type: "image/svg+xml", sizes: "180x180" },
    ],
    shortcut: ["/icon.svg"],
  },
  appleWebApp: {
    capable: true,
    title: "Dear",
    statusBarStyle: "default",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "Dear",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF7F1" },
    { media: "(prefers-color-scheme: dark)", color: "#1F1A17" },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser().catch(() => null);

  // Collect everyone's special dates so we can detect anniversary/birthday.
  // We only need MM-DD comparisons; safe to read all users (just two of us).
  let allBirthdates: string[] = [];
  let coupleStartDate: string | null = null;
  if (user) {
    try {
      const rows = await db()
        .select({
          birthdate: users.birthdate,
          coupleStartDate: users.coupleStartDate,
        })
        .from(users);
      for (const r of rows) {
        if (r.birthdate) allBirthdates.push(r.birthdate);
        if (r.coupleStartDate && !coupleStartDate) {
          coupleStartDate = r.coupleStartDate;
        }
      }
    } catch {
      // schema may not yet be migrated; ignore
    }
  }

  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} ${display.variable}`}
    >
      <body className="font-sans text-ink-900 antialiased">
        {user ? (
          <Nav
            user={{
              username: user.username,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl ?? null,
            }}
          />
        ) : null}
        <main
          className={
            user
              ? "mx-auto w-full max-w-3xl px-4 pb-28 pt-4 sm:px-6 md:pb-12"
              : "min-h-dvh"
          }
        >
          {children}
        </main>
        <ToastHost />
        {user ? (
          <SpecialDayBanner
            birthdates={allBirthdates}
            coupleStartDate={coupleStartDate}
          />
        ) : null}
      </body>
    </html>
  );
}
