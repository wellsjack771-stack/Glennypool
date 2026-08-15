import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveRefresh } from "@/components/LiveRefresh";
import { PaidMark } from "@/components/PaidMark";
import { PayBox } from "@/components/PayBox";
import { isAdmin } from "@/lib/auth";
import { readPool } from "@/lib/db";
import { formatRank, formatScore, formatToPar } from "@/lib/format";
import { ownsEntry } from "@/lib/mine";
import { payCutoffLabel, picksRevealed, revealLabel } from "@/lib/cutoff";
import { rankEntries, liveRoundScore, roundScore } from "@/lib/scoring";
import { groupLabel } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ locked?: string }>;
}) {
  const { id } = await params;
  const { locked } = await searchParams;
  const pool = await readPool();
  const standings = rankEntries(pool);
  const row = standings.find((item) => item.entry.id === id);
  if (!row) notFound();
  const penalty = pool.settings.penaltyScore;
  const admin = await isAdmin();
  const mine = await ownsEntry(id);
  const revealed = admin || mine || picksRevealed(pool.settings, pool.golfers);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-sm text-fairway">
          ← Leaderboard
        </Link>
        <p className="mt-4 text-[11px] tracking-[0.22em] text-gold uppercase">
          Pool entry
        </p>
        <h1 className="mt-2 flex flex-wrap items-center gap-3 display text-4xl text-pine sm:text-5xl">
          {revealed ? row.entry.name : "Hidden entry"}
          {revealed ? <PaidMark paid={row.entry.paid} /> : null}
        </h1>
        {admin && row.entry.ownerName ? (
          <p className="mt-1 text-sm text-muted">Entered by {row.entry.ownerName}</p>
        ) : null}
        <p className="mt-2 text-muted">
          {revealed ? (
            <>
              {row.eligible ? formatRank(row.rank, row.tied) : "Unranked"} ·
              total{" "}
              <span className="score text-ink">{formatScore(row.total)}</span>
              {row.entry.tiebreakerScore != null ? (
                <>
                  {" "}
                  · TB{" "}
                  <span className="score">
                    {formatToPar(row.entry.tiebreakerScore)}
                  </span>
                </>
              ) : null}
            </>
          ) : (
            <>
              Squads stay private until {revealLabel(pool.settings)} AT.
            </>
          )}
        </p>
        <div className="mt-2">
          <LiveRefresh />
        </div>
      </div>
      {mine && !row.entry.paid ? (
        <PayBox
          fee={pool.settings.entryFee || 15}
          email={pool.settings.etransferEmail || "wellsjack771@gmail.com"}
          cutoff={payCutoffLabel(pool.golfers, pool.settings)}
          locked={locked === "1"}
        />
      ) : null}
      {!revealed ? (
        <div className="panel px-6 py-10 text-center text-muted">
          This squad is sealed until Saturday 7:00 AM.
        </div>
      ) : (
      <div className="panel overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-pine text-[11px] tracking-[0.16em] text-gold-soft uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Golfer</th>
              <th className="px-4 py-3 font-medium">Group</th>
              <th className="px-4 py-3 font-medium">Day 1</th>
              <th className="px-4 py-3 font-medium">Day 2</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Used</th>
            </tr>
          </thead>
          <tbody>
            {row.picks.map((pick) => (
              <tr
                key={pick.golferId}
                className={`border-t border-rule ${pick.voided ? "text-muted" : ""}`}
              >
                <td
                  className={`px-4 py-3 ${pick.voided ? "line-through" : "font-medium"}`}
                >
                  {pick.label}
                </td>
                <td className="px-4 py-3 text-sm text-muted">
                  {groupLabel(pick.group)}
                </td>
                <td className="score px-4 py-3">
                  {formatScore(
                    pick.golfer ? liveRoundScore(pick.golfer, "r1", penalty) : null,
                  )}
                </td>
                <td className="score px-4 py-3">
                  {formatScore(
                    pick.golfer ? roundScore(pick.golfer, "r2", penalty) : null,
                  )}
                </td>
                <td className="score px-4 py-3 font-semibold">
                  {formatScore(pick.total)}
                </td>
                <td className="px-4 py-3 text-xs tracking-[0.14em] uppercase">
                  {pick.voided ? "Void" : pick.counting ? "Counts" : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
