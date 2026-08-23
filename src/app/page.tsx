import Link from "next/link";
import { formatToPar } from "@/lib/format";
import { withLiveScores } from "@/lib/live";
import { rankEntries } from "@/lib/scoring";
import { groupLabel } from "@/lib/types";

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
          Set your club name, lock an admin PIN, then build the handicap groups
          and everyone&apos;s squads.
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
  const winner = standings.find((row) => row.eligible && row.total != null);
  const winners = winner
    ? standings.filter(
        (row) => row.eligible && row.total != null && row.rank === winner.rank,
      )
    : [];
  const message = (pool.settings.winnerMessage ?? "").trim();
  const winnerNames = winners.map((row) => row.entry.name).join(" & ");

  return (
    <section className="mx-auto max-w-2xl">
      <div className="panel overflow-hidden">
        <div className="bg-pine px-6 py-12 text-center text-cream sm:px-10">
          <p className="text-[11px] tracking-[0.28em] text-gold-soft uppercase">
            {pool.settings.year}
            {pool.settings.clubName ? ` · ${pool.settings.clubName}` : ""}
          </p>
          <h1 className="display mt-4 text-5xl leading-none text-cream sm:text-6xl">
            Congratulations
          </h1>
          {winner ? (
            <>
              <p className="display mt-6 text-3xl text-gold-soft sm:text-4xl">
                {winnerNames}
              </p>
              <p className="score mt-3 text-2xl font-semibold">
                {formatToPar(winner.toPar)}
              </p>
              <p className="mt-2 text-sm text-cream/70">
                {winner.tied
                  ? "Tied for first · winner takes all"
                  : `${pool.settings.eventName} champion`}
              </p>
            </>
          ) : (
            <p className="mt-6 text-lg text-cream/80">
              The pool champion will be posted here.
            </p>
          )}
        </div>

        {message ? (
          <div className="border-t border-rule px-6 py-6 sm:px-10">
            <p className="whitespace-pre-wrap text-lg leading-8 text-ink">
              {message}
            </p>
          </div>
        ) : null}

        {winner ? (
          <div className="border-t border-rule px-6 py-6 sm:px-10">
            <p className="text-[11px] tracking-[0.16em] text-gold uppercase">
              {winners.length > 1 ? "Winning squads" : "Winning squad"}
            </p>
            <div className={winners.length > 1 ? "mt-4 grid gap-6" : "mt-3"}>
              {winners.map((row) => (
                <div key={row.entry.id}>
                  {winners.length > 1 ? (
                    <p className="mb-2 font-medium text-pine">
                      {row.entry.name}
                    </p>
                  ) : null}
                  <ul className="space-y-1">
                    {row.picks.map((pick) => (
                      <li
                        key={pick.golferId}
                        className={`flex items-baseline justify-between gap-3 text-sm ${
                          pick.voided ? "text-muted line-through" : "text-ink"
                        }`}
                      >
                        <span>
                          {pick.label}
                          <span className="ml-2 text-xs text-muted">
                            {groupLabel(pick.group)}
                          </span>
                        </span>
                        <span className="score">
                          {formatToPar(pick.toPar)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="border-t border-rule px-6 py-5 text-center">
          <Link
            href="/standings"
            className="inline-flex rounded-sm bg-pine px-5 py-2.5 text-sm font-semibold text-cream"
          >
            View the full leaderboard
          </Link>
        </div>
      </div>
    </section>
  );
}
