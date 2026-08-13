import { importFromGolfGenius, pullGolfGeniusNow } from "@/app/actions";
import { GolfGeniusForm } from "@/components/GolfGeniusForm";
import { SubmitButton } from "@/components/SubmitButton";
import { readPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LiveSyncPage() {
  const pool = await readPool();
  const last = pool.settings.ggLastSyncAt
    ? new Date(pool.settings.ggLastSyncAt).toLocaleString()
    : "never";

  return (
    <div className="space-y-10">
      <div>
        <p className="text-[11px] tracking-[0.22em] text-gold uppercase">
          Live scoring
        </p>
        <h1 className="display mt-2 text-4xl text-pine">Golf Genius</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Paste a public Golf Genius results page. We read the Overall Men&apos;s
          Club Championship board and pull names and scores every few minutes.
          This weekend we can test against another club&apos;s page — yours will
          wire the same way.
        </p>
      </div>

      <section className="panel p-6 sm:p-8">
        <h2 className="display mb-4 text-2xl text-pine">Connect</h2>
        <GolfGeniusForm settings={pool.settings} />
      </section>

      {pool.settings.ggEventId ? (
        <section className="panel space-y-4 p-6 sm:p-8">
          <h2 className="display text-2xl text-pine">Pull scores</h2>
          <p className="text-sm text-muted">
            Last sync {last}. Anyone watching the public board also triggers a
            pull if the last one is older than {pool.settings.ggSyncMinutes}{" "}
            minutes.
          </p>
          <div className="flex flex-wrap gap-3">
            <form action={importFromGolfGenius}>
              <SubmitButton pendingLabel="Importing…">
                Import field from Golf Genius
              </SubmitButton>
            </form>
            <form action={pullGolfGeniusNow}>
              <button
                type="submit"
                className="rounded-sm border border-rule px-5 py-2.5 text-sm font-semibold text-fairway"
              >
                Pull scores now
              </button>
            </form>
          </div>
        </section>
      ) : null}
    </div>
  );
}
