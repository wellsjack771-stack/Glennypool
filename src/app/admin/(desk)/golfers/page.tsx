import { addGolfers, deleteGolfer, updateHandicaps } from "@/app/actions";
import { ScoreSheet } from "@/components/ScoreSheet";
import { SubmitButton } from "@/components/SubmitButton";
import { readPool } from "@/lib/db";
import { formatHandicap } from "@/lib/format";
import { groupLabel, groupRangeLabel } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GolfersAdminPage() {
  const pool = await readPool();
  const ungrouped = pool.golfers.filter((golfer) => golfer.group == null).length;

  return (
    <div className="space-y-10">
      <div>
        <p className="text-[11px] tracking-[0.22em] text-gold uppercase">
          Championship field
        </p>
        <h1 className="display mt-2 text-4xl text-pine">Golfers & scores</h1>
        <p className="mt-2 text-muted">
          Paste the roster, assign {groupRangeLabel(pool.settings.groupCount)}{" "}
          groups, then post day 1 and day 2 as they come in. The public board
          updates live.
        </p>
      </div>

      <section className="panel p-6">
        <h2 className="display text-2xl text-pine">Paste handicaps</h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          If Golf Genius Players is sign-in only, copy the list from Pairings →
          Players and paste it here. One player per line:{" "}
          <span className="italic">Jamie Sweet, 1.2</span> or{" "}
          <span className="italic">Jamie Sweet 1.2</span>
        </p>
        <form action={updateHandicaps} className="space-y-4">
          <textarea
            name="handicaps"
            rows={8}
            placeholder={"Jamie Sweet, 1.2\nMiles Chute, 3.4"}
            className="w-full rounded-sm border border-rule bg-paper px-3 py-2.5 outline-none focus:border-gold"
          />
          <SubmitButton pendingLabel="Matching…">Apply handicaps</SubmitButton>
        </form>
      </section>

      <section className="panel p-6">
        <h2 className="display text-2xl text-pine">Add golfers</h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          One name per line. Optional handicap and group after commas — e.g.{" "}
          <span className="italic">Jane Doe, 8.2, A</span>
        </p>
        <form action={addGolfers} className="space-y-4">
          <textarea
            name="names"
            rows={6}
            placeholder={"Alex Morgan, 4.1, A\nSam Rivera, 11.8, B"}
            className="w-full rounded-sm border border-rule bg-paper px-3 py-2.5 outline-none focus:border-gold"
          />
          <SubmitButton pendingLabel="Adding…">Add to field</SubmitButton>
        </form>
      </section>

      {ungrouped > 0 ? (
        <p className="text-sm text-danger">
          {ungrouped} golfer{ungrouped === 1 ? " is" : "s are"} still ungrouped.
          Assign {groupRangeLabel(pool.settings.groupCount)} before taking pool
          entries.
        </p>
      ) : null}

      {pool.golfers.length > 0 ? (
        <section className="space-y-4">
          <h2 className="display text-2xl text-pine">Groups & scorecard</h2>
          <ScoreSheet
            golfers={pool.golfers}
            groupCount={pool.settings.groupCount}
          />
        </section>
      ) : null}

      {pool.golfers.length > 0 ? (
        <section>
          <h2 className="display mb-3 text-2xl text-pine">Remove</h2>
          <ul className="panel divide-y divide-rule">
            {pool.golfers.map((golfer) => (
              <li
                key={golfer.id}
                className="flex items-center justify-between px-4 py-2 text-sm"
              >
                <span>
                  {golfer.name}
                  <span className="ml-2 text-muted">
                    {groupLabel(golfer.group)}
                    {golfer.handicap != null
                      ? ` · ${formatHandicap(golfer.handicap)}`
                      : ""}
                  </span>
                </span>
                <form action={deleteGolfer}>
                  <input type="hidden" name="id" value={golfer.id} />
                  <button type="submit" className="text-danger">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
