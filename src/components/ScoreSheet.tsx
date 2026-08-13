import { saveAllScores } from "@/app/actions";
import { championshipTotal, golfersByGroup } from "@/lib/scoring";
import { formatScore } from "@/lib/format";
import { GROUPS, groupLabel, type Golfer } from "@/lib/types";
import { SubmitButton } from "./SubmitButton";

export function ScoreSheet({ golfers }: { golfers: Golfer[] }) {
  const grouped = golfersByGroup(golfers);
  const sections: { label: string; rows: Golfer[] }[] = [
    ...GROUPS.map((group) => ({
      label: groupLabel(group),
      rows: grouped.get(group) ?? [],
    })),
    { label: "Ungrouped", rows: grouped.get(0) ?? [] },
  ].filter((section) => section.rows.length > 0);

  return (
    <form action={saveAllScores} className="space-y-4">
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-pine text-[11px] tracking-[0.16em] text-gold-soft uppercase">
            <tr>
              <th className="px-3 py-3 font-medium">Golfer</th>
              <th className="px-3 py-3 font-medium">Hcp</th>
              <th className="px-3 py-3 font-medium">Group</th>
              <th className="px-3 py-3 font-medium">Day 1</th>
              <th className="px-3 py-3 font-medium">Day 2</th>
              <th className="px-3 py-3 font-medium">Total</th>
              <th className="px-3 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {sections.flatMap((section) => [
              <tr key={section.label} className="bg-cream">
                <td
                  colSpan={7}
                  className="px-3 py-2 text-[11px] tracking-[0.16em] text-fairway uppercase"
                >
                  {section.label}
                </td>
              </tr>,
              ...section.rows.map((golfer) => (
                <tr key={golfer.id} className="border-t border-rule">
                  <td className="px-3 py-2 font-medium">{golfer.name}</td>
                  <td className="px-3 py-2">
                    <input
                      name={`handicap:${golfer.id}`}
                      type="number"
                      step="0.1"
                      min={-10}
                      max={54}
                      defaultValue={golfer.handicap ?? ""}
                      className="score w-16 rounded-sm border border-rule bg-paper px-2 py-1"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      name={`group:${golfer.id}`}
                      defaultValue={golfer.group ?? ""}
                      className="rounded-sm border border-rule bg-paper px-2 py-1"
                    >
                      <option value="">—</option>
                      <option value="1">A</option>
                      <option value="2">B</option>
                      <option value="3">C</option>
                      <option value="4">D</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      name={`r1:${golfer.id}`}
                      type="number"
                      min={0}
                      max={200}
                      defaultValue={golfer.r1 ?? ""}
                      className="score w-16 rounded-sm border border-rule bg-paper px-2 py-1"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      name={`r2:${golfer.id}`}
                      type="number"
                      min={0}
                      max={200}
                      defaultValue={golfer.r2 ?? ""}
                      className="score w-16 rounded-sm border border-rule bg-paper px-2 py-1"
                    />
                  </td>
                  <td className="score px-3 py-2">
                    {formatScore(championshipTotal(golfer))}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      name={`status:${golfer.id}`}
                      defaultValue={golfer.status}
                      className="rounded-sm border border-rule bg-paper px-2 py-1"
                    >
                      <option value="active">Active</option>
                      <option value="wd">WD</option>
                      <option value="dns">No show</option>
                      <option value="dq">DQ</option>
                    </select>
                  </td>
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">
        WD or no-show gets 100 for any day without a posted score. Save after
        assigning groups or posting scores.
      </p>
      <SubmitButton pendingLabel="Posting…">Save field & scores</SubmitButton>
    </form>
  );
}
