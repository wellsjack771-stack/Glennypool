import Link from "next/link";
import { PaidMark } from "@/components/PaidMark";
import { formatRank, formatToPar } from "@/lib/format";
import type { PickRow, RankedEntry } from "@/lib/scoring";
import { groupLabel } from "@/lib/types";

function squadByScore(picks: PickRow[]) {
  return [...picks].sort((a, b) => {
    if (a.toPar == null && b.toPar == null) {
      return a.label.localeCompare(b.label);
    }
    if (a.toPar == null) return 1;
    if (b.toPar == null) return -1;
    if (a.toPar !== b.toPar) return a.toPar - b.toPar;
    return a.label.localeCompare(b.label);
  });
}

export function StandingsTable({
  standings,
  voidCount,
  hideSquads = false,
}: {
  standings: RankedEntry[];
  voidCount: number;
  hideSquads?: boolean;
}) {
  if (standings.length === 0) {
    return (
      <div className="panel px-4 py-8 text-center text-sm text-muted">
        No pool entries yet. The board will fill once squads are in.
      </div>
    );
  }

  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="sticky top-0 bg-pine text-[10px] tracking-[0.14em] text-gold-soft uppercase">
          <tr>
            <th className="px-3 py-2 font-medium">Pos</th>
            <th className="px-3 py-2 font-medium">Entry</th>
            {hideSquads ? (
              <th className="px-3 py-2 font-medium">Squad</th>
            ) : (
              <>
                <th className="px-3 py-2 font-medium">Total</th>
                <th className="px-3 py-2 font-medium">Squad</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {standings.map((row, index) => (
            <tr
              key={row.entry.id}
              className={`border-t border-rule ${index === 0 && row.eligible ? "bg-gold-soft/25" : ""}`}
            >
              <td className="score px-3 py-2 align-top text-base">
                {row.eligible ? formatRank(row.rank, row.tied) : "—"}
              </td>
              <td className="px-3 py-2 align-top">
                <div className="flex items-start gap-2">
                  <PaidMark paid={row.entry.paid} />
                  <div className="min-w-0">
                    <Link
                      href={`/entries/${row.entry.id}`}
                      className="font-medium hover:text-fairway"
                    >
                      {row.entry.name}
                    </Link>
                    {row.tied && row.tiebreakerDiff != null ? (
                      <span className="block text-[11px] leading-tight text-muted">
                        TB {row.tiebreakerDiff} off
                      </span>
                    ) : null}
                  </div>
                </div>
              </td>
              {hideSquads ? (
                <td className="px-3 py-2 text-xs text-muted">
                  Squad sealed until Saturday 7:00 AM
                </td>
              ) : (
                <>
                  <td className="score px-3 py-2 align-top text-base font-semibold">
                    <span>{formatToPar(row.toPar)}</span>
                    <span className="mt-0.5 block text-[11px] font-normal text-muted">
                      {row.countingCount}/6
                    </span>
                  </td>
                  <td className="px-3 py-1.5 align-top">
                    <div className="min-w-[160px]">
                      {squadByScore(row.picks).map((pick) => (
                        <div
                          key={pick.golferId}
                          className={`flex items-baseline justify-between gap-3 py-px text-xs leading-5 ${
                            pick.voided
                              ? "text-muted line-through decoration-gold"
                              : pick.counting
                                ? "text-ink"
                                : "text-muted"
                          }`}
                          title={groupLabel(pick.group)}
                        >
                          <span className="truncate">{pick.label}</span>
                          <span className="score shrink-0">
                            {formatToPar(pick.toPar)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-rule px-3 py-2 text-[11px] leading-5 text-muted">
        {hideSquads
          ? "Entry names and paid status are public. Squads stay hidden until Saturday 7:00 AM."
          : `Struck names are the ${voidCount} voided scores. Lowest remaining to par wins. Ties go to the closest predicted championship score to par. Check mark = paid.`}
      </p>
    </div>
  );
}
