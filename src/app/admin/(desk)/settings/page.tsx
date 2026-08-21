import { SettingsForm } from "@/components/SettingsForm";
import { readPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const pool = await readPool();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-[11px] tracking-[0.22em] text-gold uppercase">
          House rules
        </p>
        <h1 className="display mt-2 text-4xl text-pine">Settings</h1>
        <p className="mt-2 text-sm text-muted">
          Open or close public entries, choose when squads go public, and set
          how many groups people pick from. Scoring stays best{" "}
          {pool.settings.groupCount * pool.settings.picksPerGroup -
            pool.settings.voidCount}{" "}
          of {pool.settings.groupCount * pool.settings.picksPerGroup}, with{" "}
          {pool.settings.penaltyScore} for a WD/no-show.
        </p>
      </div>
      <div className="panel p-6 sm:p-8">
        <SettingsForm settings={pool.settings} golfers={pool.golfers} />
      </div>
    </div>
  );
}
