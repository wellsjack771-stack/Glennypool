import Link from "next/link";
import { PaidMark } from "@/components/PaidMark";
import { formatRank, formatToPar } from "@/lib/format";
import type { RankedEntry } from "@/lib/scoring";
import { groupLabel } from "@/lib/types";

export function StandingsTable({
  standings,
  voidCount,
  hideSquads = false,
  showOwner = false,
}: {
  standings: RankedEntry[];
  voidCount: number;
  hideSquads?: boolean;
  showOwner?: boolean;
}) {
  if (standings.length === 0) {
    return (
      <div className="panel px-6 py-12 text-center text-muted">
        No pool entries yet. The board will fill once squads are in.
      </div>
    );
  }

  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[760px] text-left">
        <thead className="bg-pine text-[11px] tracking-[0.16em] text-gold-soft uppercase">
          <tr>
            <th className="px-4 py-3 font-medium">Pos</th>
            <th className="px-4 py-3 font-medium">Paid</th>
            <th className="px-4 py-3 font-medium">Entry</th>
            {hideSquads ? (
              <th className="px-4 py-3 font-medium">Squad</th>
            ) : (
              <>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Thru</th>
                <th className="px-4 py-3 font-medium">Squad</th>
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
              <td className="score px-4 py-3 text-lg">
                {row.eligible ? formatRank(row.rank, row.tied) : "—"}
              </td>
              <td className="px-4 py-3">
                <PaidMark paid={row.entry.paid} />
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/entries/${row.entry.id}`}
                  className="font-medium hover:text-fairway"
                >
                  {row.entry.name}
                </Link>
                {showOwner && row.entry.ownerName ? (
                  <span className="mt-0.5 block text-xs text-muted">
                    {row.entry.ownerName}
                  </span>
                ) : null}
                {row.tied && row.tiebreakerDiff != null ? (
                  <span className="mt-0.5 block text-xs text-muted">
                    TB {row.tiebreakerDiff} off
                  </span>
                ) : null}
              </td>
              {hideSquads ? (
                <td className="px-4 py-3 text-sm text-muted">
                  Squad sealed until Saturday 7:00 AM
                </td>
              ) : (
                <>
                  <td className="score px-4 py-3 text-lg font-semibold">
                    {formatToPar(row.toPar)}
                  </td>
                  <td className="score px-4 py-3 text-muted">
                    {row.countingCount}/6
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                      {row.picks.map((pick) => (
                        <span
                          key={pick.golferId}
                          className={
                            pick.voided
                              ? "text-muted line-through decoration-gold"
                              : pick.counting
                                ? "text-ink"
                                : "text-muted"
                          }
                          title={groupLabel(pick.group)}
                        >
                          {pick.label}
                          <span className="score ml-1 text-xs">
                            {formatToPar(pick.toPar)}
                          </span>
                        </span>
                      ))}
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-rule px-4 py-3 text-xs text-muted">
        {hideSquads
          ? "Entry names and paid status are public. Squads stay hidden until Saturday 7:00 AM. Unpaid entries are deleted at the first tee."
          : `Struck names are the ${voidCount} voided scores. Lowest remaining to par wins. Ties go to the closest predicted championship score to par. A check mark means the $15 e-transfer is confirmed. Unpaid entries are deleted at the first tee time Saturday.`}
      </p>
    </div>
  );
}
