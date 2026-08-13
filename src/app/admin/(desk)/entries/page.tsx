import Link from "next/link";
import { EntryAdminControls } from "@/components/EntryAdminControls";
import { EntryPicker } from "@/components/EntryPicker";
import { PaidMark } from "@/components/PaidMark";
import { readPool } from "@/lib/db";
import { formatToPar } from "@/lib/format";
import { isValidSquad } from "@/lib/scoring";
import { picksCount } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EntriesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const pool = await readPool();
  const editing = pool.entries.find((entry) => entry.id === edit);
  const golfersById = new Map(pool.golfers.map((golfer) => [golfer.id, golfer]));
  const needed = picksCount(pool.settings);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
      <section>
        <p className="text-[11px] tracking-[0.22em] text-gold uppercase">
          Pool book
        </p>
        <h1 className="display mt-2 text-4xl text-pine">
          {editing ? `Edit ${editing.name}` : "Entries"}
        </h1>
        <p className="mt-2 mb-6 text-muted">
          2 golfers from each group, plus the champion&apos;s 36-hole score to
          par as the tiebreaker (Even, −1, +2).
          {pool.settings.entriesOpen ? (
            <>
              {" "}
              Members can also enter themselves at{" "}
              <Link href="/enter" className="text-fairway">
                /enter
              </Link>
              .
            </>
          ) : (
            " Public entries are closed."
          )}
        </p>
        {pool.golfers.length === 0 ? (
          <p className="text-muted">
            Add the championship field and assign groups before taking entries.
          </p>
        ) : (
          <div className="panel p-6">
            <EntryPicker
              key={editing?.id ?? "new"}
              golfers={pool.golfers}
              entry={editing}
              settings={pool.settings}
            />
          </div>
        )}
      </section>
      <section>
        <h2 className="display mb-4 text-2xl text-pine">
          {pool.entries.length} in the pool
        </h2>
        <p className="mb-3 text-sm text-muted">
          Mark paid when the ${pool.settings.entryFee} e-transfer lands. Unpaid
          names show on the public board until you confirm. At the first tee
          time Saturday, unpaid entries are deleted.
        </p>
        <ul className="panel divide-y divide-rule">
          {pool.entries.length === 0 ? (
            <li className="px-4 py-8 text-muted">No entries yet.</li>
          ) : (
            pool.entries.map((entry) => {
              const valid = isValidSquad(
                entry.golferIds,
                golfersById,
                pool.settings,
              );
              return (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <PaidMark paid={entry.paid} />
                    <div>
                      <p className="font-medium">{entry.name}</p>
                      <p className="text-xs text-muted">
                        {entry.golferIds.length}/{needed} picks
                        {entry.tiebreakerScore != null
                          ? ` · TB ${formatToPar(entry.tiebreakerScore)}`
                          : " · no TB"}
                        {valid ? "" : " · incomplete"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Link
                      href={`/admin/entries?edit=${entry.id}`}
                      className="text-sm text-fairway"
                    >
                      Edit
                    </Link>
                    <EntryAdminControls
                      id={entry.id}
                      name={entry.name}
                      paid={entry.paid}
                    />
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
}
