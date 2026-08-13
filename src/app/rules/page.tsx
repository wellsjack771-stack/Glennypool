import { RulesList } from "@/components/RulesList";
import { readPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const pool = await readPool();

  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="text-[11px] tracking-[0.22em] text-gold uppercase">
          How it works
        </p>
        <h1 className="display mt-2 text-4xl text-pine sm:text-5xl">
          Pool rules
        </h1>
        <p className="mt-3 text-muted">
          Two-day Club Championship. Winner takes all.
        </p>
      </div>
      <div className="hairline" />
      <RulesList pool={pool} />
    </article>
  );
}
