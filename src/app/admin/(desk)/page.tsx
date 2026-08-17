import Link from "next/link";
import { PaidMark } from "@/components/PaidMark";
import { readPool } from "@/lib/db";
import { formatToPar } from "@/lib/format";
import { isValidSquad, postedRoundCount, rankEntries } from "@/lib/scoring";
import { picksCount } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDeskPage() {
  const pool = await readPool();
  const standings = rankEntries(pool);
  const posted = postedRoundCount(pool.golfers);
  const golfersById = new Map(pool.golfers.map((golfer) => [golfer.id, golfer]));
  const incomplete = pool.entries.filter(
    (entry) => !isValidSquad(entry.golferIds, golfersById, pool.settings),
  ).length;
  const ungrouped = pool.golfers.filter((golfer) => golfer.group == null).length;
  const needed = picksCount(pool.settings);
  const unpaid = pool.entries.filter((entry) => !entry.paid).length;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] tracking-[0.22em] text-gold uppercase">
          Committee desk
        </p>
        <h1 className="display mt-2 text-4xl text-pine">
          {pool.settings.clubName}
        </h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Golfers" value={pool.golfers.length} href="/admin/golfers" />
        <Stat
          label="Day 1 / Day 2"
          value={`${posted.r1}/${posted.r2}`}
          href="/admin/golfers"
        />
        <Stat label="Entries" value={pool.entries.length} href="/admin/entries" />
        <Stat label="Unpaid" value={unpaid} href="/admin/entries" />
      </div>
      {ungrouped > 0 ? (
        <p className="text-sm text-danger">
          {ungrouped} golfer{ungrouped === 1 ? "" : "s"} still need a group
          before entries can be completed.
        </p>
      ) : null}
      {incomplete > 0 ? (
        <p className="text-sm text-danger">
          {incomplete} {incomplete === 1 ? "entry still needs" : "entries still need"}{" "}
          a full {needed}-golfer squad (2 from each group).
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/golfers"
          className="rounded-sm bg-pine px-4 py-2.5 text-sm font-semibold text-cream"
        >
          Post scores
        </Link>
        <Link
          href="/admin/entries"
          className="rounded-sm border border-rule px-4 py-2.5 text-sm text-fairway"
        >
          Add an entry
        </Link>
        {pool.settings.entriesOpen ? (
          <Link
            href="/enter"
            className="rounded-sm px-4 py-2.5 text-sm text-muted"
          >
            Public enter page
          </Link>
        ) : null}
        <Link
          href="/admin/live"
          className="rounded-sm px-4 py-2.5 text-sm text-muted"
        >
          Golf Genius
        </Link>
      </div>
      <div className="panel divide-y divide-rule">
        {standings.slice(0, 10).map((row) => (
          <div
            key={row.entry.id}
            className="flex items-center justify-between px-5 py-3"
          >
            <span className="flex items-center gap-2">
              <PaidMark paid={row.entry.paid} />
              <span>
                <span className="block">{row.entry.name}</span>
                {row.entry.ownerName ? (
                  <span className="text-xs text-muted">{row.entry.ownerName}</span>
                ) : null}
              </span>
            </span>
            <span className="score">{formatToPar(row.toPar)}</span>
          </div>
        ))}
        {standings.length === 0 ? (
          <p className="px-5 py-8 text-muted">No entries yet.</p>
        ) : null}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href: string;
}) {
  return (
    <Link href={href} className="panel p-5">
      <p className="text-[11px] tracking-[0.16em] text-muted uppercase">{label}</p>
      <p className="display mt-2 text-3xl text-pine">{value}</p>
    </Link>
  );
}
