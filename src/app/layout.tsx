import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Nav } from "@/components/nav";
import { getCurrentUser } from "@/lib/session";

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
  title: "Dear — kenangan kita",
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
      </body>
    </html>
  );
}
