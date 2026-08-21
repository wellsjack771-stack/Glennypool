import Link from "next/link";
import { LiveRefresh } from "@/components/LiveRefresh";
import { StandingsTable } from "@/components/StandingsTable";
import { isAdmin } from "@/lib/auth";
import { withLiveScores } from "@/lib/live";
import { formatRank, formatToPar } from "@/lib/format";
import { picksRevealed, revealLabel } from "@/lib/cutoff";
import { postedRoundCount, rankEntries } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const pool = await withLiveScores();
  if (!pool.settings.setupComplete) {
    return (
      <section className="mx-auto max-w-2xl">
        <p className="text-[11px] tracking-[0.22em] text-gold uppercase">
          New pool
        </p>
        <h1 className="display mt-2 text-5xl text-pine">
          Open the championship books.
        </h1>
        <p className="mt-4 max-w-lg text-lg leading-8 text-muted">
          Set your club name, lock an admin PIN, then build the four handicap
          groups and everyone&apos;s squads. Members get a live leaderboard — no
          accounts required.
        </p>
        <Link
          href="/setup"
          className="mt-8 inline-flex rounded-sm bg-pine px-5 py-3 text-sm font-semibold tracking-wide text-cream"
        >
          Set up the pool
        </Link>
      </section>
    );
  }

  const standings = rankEntries(pool);
  const leader = standings.find((row) => row.eligible && row.total != null);
  const posted = postedRoundCount(pool.golfers);
  const admin = await isAdmin();
  const revealed = admin || picksRevealed(pool.settings);

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] tracking-[0.22em] text-gold uppercase">
            {pool.settings.dates || `${pool.settings.year} · Two-day event`}
            {pool.settings.venue ? ` · ${pool.settings.venue}` : ""}
          </p>
          <h1 className="display mt-1 text-3xl leading-none text-pine sm:text-4xl">
            Live leaderboard
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <LiveRefresh />
            {pool.settings.entriesOpen ? (
              <Link
                href="/enter"
                className="rounded-sm bg-pine px-3 py-1.5 text-sm font-semibold text-cream"
              >
                Enter your squad
              </Link>
            ) : null}
          </div>
        </div>
        <div className="panel min-w-[200px] px-4 py-3">
          <p className="text-[10px] tracking-[0.16em] text-gold uppercase">
            {revealed ? "Leader" : "In the book"}
          </p>
          {revealed && leader ? (
            <div className="mt-0.5 flex items-baseline gap-3">
              <p className="display text-xl text-pine">{leader.entry.name}</p>
              <p className="score text-xl font-semibold">
                {formatToPar(leader.toPar)}
              </p>
              <p className="text-xs text-muted">
                {formatRank(leader.rank, leader.tied)}
                {leader.tied ? " · TB" : ""}
              </p>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted">
              {revealed
                ? "Waiting on scores."
                : `${pool.entries.length} squad${pool.entries.length === 1 ? "" : "s"} locked in. Picks stay hidden until ${revealLabel()}.`}
            </p>
          )}
        </div>
      </section>

      <div className="panel flex flex-wrap gap-x-6 gap-y-1 px-4 py-2 text-sm">
        <Mini label="Day 1" value={`${posted.r1}/${posted.field || 0}`} />
        <Mini label="Day 2" value={`${posted.r2}/${posted.field || 0}`} />
        <Mini label="Entries" value={pool.entries.length} />
        <Mini
          label="Unpaid"
          value={pool.entries.filter((entry) => !entry.paid).length}
        />
      </div>

      <StandingsTable
        standings={standings.map((row) => ({
          ...row,
          entry: { ...row.entry, ownerName: undefined },
        }))}
        voidCount={pool.settings.voidCount}
        hideSquads={!revealed}
      />
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <p className="text-muted">
      {label}{" "}
      <span className="score text-ink">{value}</span>
    </p>
  );
}
