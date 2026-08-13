"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAdmin } from "@/app/actions";

const items = [
  { href: "/admin", label: "Desk" },
  { href: "/admin/golfers", label: "Field & scores" },
  { href: "/admin/entries", label: "Entries" },
  { href: "/admin/live", label: "Live scores" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4">
      <nav className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-sm px-3 py-1.5 text-sm ${
                active
                  ? "bg-pine text-cream"
                  : "border border-rule text-fairway hover:bg-cream"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex gap-2">
        <Link
          href="/"
          className="rounded-sm px-3 py-1.5 text-sm text-muted hover:text-ink"
        >
          View site
        </Link>
        <form action={logoutAdmin}>
          <button
            type="submit"
            className="rounded-sm px-3 py-1.5 text-sm text-danger"
          >
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
