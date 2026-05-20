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

export const metadata: Metadata = {
  title: "Dear Future Us",
  description: "Tempat tenang untuk berdua.",
  icons: {
    icon: "/favicon.svg",
  },
  appleWebApp: {
    title: "Dear",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#FBF7F1",
  width: "device-width",
  initialScale: 1,
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
