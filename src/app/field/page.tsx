import { LiveRefresh } from "@/components/LiveRefresh";
import { isAdmin } from "@/lib/auth";
import { withLiveScores } from "@/lib/live";
import { formatHandicap, formatScore, formatThru, formatToPar } from "@/lib/format";
import { picksRevealed } from "@/lib/cutoff";
import {
  golferToPar,
  golfersByGroup,
  liveRoundScore,
  pickCounts,
  roundScore,
} from "@/lib/scoring";
import { GROUPS, STATUS_LABEL, groupLabel, teeWindow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FieldPage() {
  const pool = await withLiveScores();
  const grouped = golfersByGroup(pool.golfers);
  const counts = pickCounts(pool);
  const penalty = pool.settings.penaltyScore;
  const showPicks = (await isAdmin()) || picksRevealed(pool.settings);
  const sections = [
    ...GROUPS.filter(
      (group) =>
        group <= pool.settings.groupCount ||
        (grouped.get(group)?.length ?? 0) > 0,
    ).map((group) => ({
      group,
      label: groupLabel(group),
      rows: grouped.get(group) ?? [],
    })),
    {
      group: 0 as const,
      label: "Ungrouped",
      rows: grouped.get(0) ?? [],
    },
  ].filter((section) => section.rows.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] tracking-[0.22em] text-gold uppercase">
          Championship
        </p>
        <h1 className="display mt-2 text-4xl text-pine sm:text-5xl">
          The field
        </h1>
        <p className="mt-2 text-muted">
          {pool.golfers.length} golfers
          {pool.settings.ggEventName
            ? ` · live from ${pool.settings.ggEventName}`
            : ` · pick ${pool.settings.picksPerGroup} from each of ${pool.settings.groupCount} groups`}
        </p>
        <div className="mt-2">
          <LiveRefresh />
        </div>
      </div>
      {sections.length === 0 ? (
        <div className="panel px-4 py-10 text-center text-muted">
          The championship field has not been posted.
        </div>
      ) : (
        sections.map((section) => (
          <section key={section.label} className="panel overflow-x-auto">
            <div className="bg-pine px-4 py-3 text-[11px] tracking-[0.16em] text-gold-soft uppercase">
              {section.label}
              <span className="ml-2 text-cream/70">
                {section.rows.length} golfers
                {teeWindow(section.rows) ? ` · ${teeWindow(section.rows)}` : ""}
              </span>
            </div>
            <table className="w-full min-w-[560px] text-left">
              <thead className="text-[11px] tracking-[0.16em] text-muted uppercase">
                <tr>
                  <th className="px-4 py-2 font-medium">Golfer</th>
                  <th className="px-4 py-2 font-medium">Hcp</th>
                  <th className="px-4 py-2 font-medium">Thru</th>
                  <th className="px-4 py-2 font-medium">Day 1</th>
                  <th className="px-4 py-2 font-medium">Day 2</th>
                  <th className="px-4 py-2 font-medium">Total</th>
                  {showPicks ? (
                    <th className="px-4 py-2 font-medium">Picked</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {section.rows.map((golfer) => (
                  <tr key={golfer.id} className="border-t border-rule">
                    <td className="px-4 py-3 font-medium">
                      {golfer.name}
                      {golfer.status !== "active" ? (
                        <span className="ml-2 text-xs tracking-wide text-danger uppercase">
                          {STATUS_LABEL[golfer.status]}
                        </span>
                      ) : null}
                    </td>
                    <td className="score px-4 py-3 text-muted">
                      {formatHandicap(golfer.handicap)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">
                      {formatThru(golfer.liveThru)}
                      {golfer.liveToPar ? (
                        <span className="score ml-2 text-ink">{golfer.liveToPar}</span>
                      ) : null}
                    </td>
                    <td className="score px-4 py-3">
                      {formatScore(liveRoundScore(golfer, "r1", penalty))}
                    </td>
                    <td className="score px-4 py-3">
                      {formatScore(roundScore(golfer, "r2", penalty))}
                    </td>
                    <td className="score px-4 py-3 font-semibold">
                      {formatToPar(golferToPar(golfer, penalty))}
                    </td>
                    {showPicks ? (
                      <td className="score px-4 py-3 text-muted">
                        {counts.get(golfer.id) ?? 0}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))
      )}
    </div>
  );
}
