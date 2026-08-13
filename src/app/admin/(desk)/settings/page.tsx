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
          Scoring is locked to the pool rules: 2 from each of 4 groups, void 2,
          100 for a WD/no-show, winner takes all.
        </p>
      </div>
      <div className="panel p-6 sm:p-8">
        <SettingsForm settings={pool.settings} golfers={pool.golfers} />
      </div>
    </div>
  );
}
