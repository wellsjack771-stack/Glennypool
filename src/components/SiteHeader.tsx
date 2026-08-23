import Link from "next/link";
import { Crest } from "./Crest";
import type { Settings } from "@/lib/types";

export function SiteHeader({
  settings,
  admin,
}: {
  settings: Pick<
    Settings,
    "clubName" | "eventName" | "year" | "setupComplete" | "entriesOpen"
  >;
  admin: boolean;
}) {
  const title = settings.clubName || "Club Championship Pool";
  const links = [
    { href: "/standings", label: "Leaderboard" },
    { href: "/field", label: "Field" },
    ...(settings.setupComplete && settings.entriesOpen
      ? [{ href: "/enter", label: "Enter" }]
      : []),
    { href: "/rules", label: "Rules" },
  ];

  return (
    <header className="border-b border-rule bg-pine text-cream">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Crest className="h-11 w-11" />
          <span>
            <span className="block text-[10px] tracking-[0.22em] text-gold-soft uppercase">
              {settings.setupComplete ? `${settings.year} Pool` : "Golf Pool"}
            </span>
            <span className="display block text-lg leading-tight sm:text-xl">
              {title}
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-sm px-2 py-1 text-cream/85 transition hover:text-gold-soft"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={admin ? "/admin" : "/admin/login"}
            className="rounded-sm border border-gold/40 px-2.5 py-1 text-gold-soft transition hover:bg-gold/10"
          >
            {admin ? "Desk" : "Admin"}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter({
  settings,
}: {
  settings: Pick<Settings, "clubName" | "eventName">;
}) {
  return (
    <footer className="mt-auto border-t border-rule bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-xs tracking-wide text-muted uppercase sm:px-6">
        <span>{settings.eventName}</span>
        <span>2 from each group · Void 2 · Winner takes all</span>
      </div>
    </footer>
  );
}
