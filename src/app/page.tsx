import Link from "next/link";
import { LiveRefresh } from "@/components/LiveRefresh";
import { StandingsTable } from "@/components/StandingsTable";
import { isAdmin } from "@/lib/auth";
import { withLiveScores } from "@/lib/live";
import { formatRank, formatScore } from "@/lib/format";
import { picksRevealed, revealLabel } from "@/lib/cutoff";
import { postedRoundCount, rankEntries } from "@/lib/scoring";
import { picksCount } from "@/lib/types";

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
  const needed = picksCount(pool.settings) - pool.settings.voidCount;
  const admin = await isAdmin();
  const revealed = admin || picksRevealed(pool.settings, pool.golfers);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] tracking-[0.22em] text-gold uppercase">
            {pool.settings.dates || `${pool.settings.year} · Two-day event`}
            {pool.settings.venue ? ` · ${pool.settings.venue}` : ""}
          </p>
          <h1 className="display mt-2 text-4xl leading-none text-pine sm:text-5xl">
            Live leaderboard
          </h1>
          <p className="mt-3 max-w-xl text-muted">
            2 picks from each of 4 groups. Worst {pool.settings.voidCount}{" "}
            scores voided. Lowest {needed}-score total wins the pool.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <LiveRefresh />
            {pool.settings.entriesOpen ? (
              <Link
                href="/enter"
                className="rounded-sm bg-pine px-4 py-2 text-sm font-semibold text-cream"
              >
                Enter your squad
              </Link>
            ) : null}
          </div>
        </div>
        <div className="panel min-w-[220px] p-5">
          <p className="text-[11px] tracking-[0.18em] text-gold uppercase">
            {revealed ? "Leader" : "In the book"}
          </p>
          {revealed && leader ? (
            <>
              <p className="display mt-1 text-2xl text-pine">
                {leader.entry.name}
              </p>
              <p className="score text-3xl font-semibold">
                {formatScore(leader.total)}
              </p>
              <p className="mt-1 text-sm text-muted">
                {formatRank(leader.rank, leader.tied)}
                {leader.tied ? " · tiebreaker in play" : ""}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">
              {revealed
                ? "Waiting on scores."
                : `${pool.entries.length} squad${pool.entries.length === 1 ? "" : "s"} locked in. Picks stay hidden until ${revealLabel(pool.settings)} AT.`}
            </p>
          )}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-4">
        <Mini label="Day 1 posted" value={`${posted.r1}/${posted.field || 0}`} />
        <Mini label="Day 2 posted" value={`${posted.r2}/${posted.field || 0}`} />
        <Mini label="Entries" value={pool.entries.length} />
        <Mini
          label="Unpaid"
          value={pool.entries.filter((entry) => !entry.paid).length}
        />
      </div>

      <StandingsTable
        standings={standings}
        voidCount={pool.settings.voidCount}
        hideSquads={!revealed}
        showOwner={admin}
      />
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="panel px-4 py-3">
      <p className="text-[11px] tracking-[0.16em] text-muted uppercase">{label}</p>
      <p className="score mt-1 text-xl text-pine">{value}</p>
    </div>
  );
}
