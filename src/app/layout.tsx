import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import { isAdmin } from "@/lib/auth";
import { readPool } from "@/lib/db";
import { enforcePayCutoff } from "@/lib/pay";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const score = IBM_Plex_Mono({
  variable: "--font-score",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export async function generateMetadata(): Promise<Metadata> {
  const pool = await readPool();
  const title = pool.settings.clubName
    ? `${pool.settings.clubName} · ${pool.settings.eventName}`
    : "Club Championship Pool";
  return {
    title: {
      default: title,
      template: `%s · ${pool.settings.clubName || "Golf Pool"}`,
    },
    description:
      "Club Championship golf pool — pick 8, drop the two worst scores, lowest total wins.",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [pool, admin] = await Promise.all([enforcePayCutoff(), isAdmin()]);

  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${score.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        <SiteHeader settings={pool.settings} admin={admin} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
          {children}
        </main>
        <SiteFooter settings={pool.settings} />
      </body>
    </html>
  );
}
