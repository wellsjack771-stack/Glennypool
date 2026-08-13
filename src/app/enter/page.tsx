import Link from "next/link";
import { EntryPicker } from "@/components/EntryPicker";
import { RulesList } from "@/components/RulesList";
import { payCutoffLabel } from "@/lib/cutoff";
import { enforcePayCutoff } from "@/lib/pay";

export const dynamic = "force-dynamic";

export default async function EnterPage() {
  const pool = await enforcePayCutoff();
  const grouped = pool.golfers.some((golfer) => golfer.group != null);

  if (!pool.settings.setupComplete) {
    return (
      <Closed
        title="Pool is not open yet"
        body="The committee is still setting up the championship field."
      />
    );
  }

  if (!pool.settings.entriesOpen) {
    return (
      <Closed
        title="Entries are closed"
        body="The books are locked. Watch the live leaderboard once play starts."
        href="/"
        link="Leaderboard"
      />
    );
  }

  if (pool.golfers.length === 0 || !grouped) {
    return (
      <Closed
        title="Field not ready"
        body="Golfers still need to be grouped before squads can be entered."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-[11px] tracking-[0.22em] text-gold uppercase">
          {pool.settings.clubName}
        </p>
        <h1 className="display mt-2 text-4xl text-pine sm:text-5xl">
          Enter your squad
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Read the rules, pick 2 from each group, then send $
          {pool.settings.entryFee} e-transfer to {pool.settings.etransferEmail}.
          Unpaid entries are deleted at{" "}
          {payCutoffLabel(pool.golfers, pool.settings)}.
        </p>
        <a
          href="#picks"
          className="mt-4 inline-block text-sm text-fairway underline decoration-gold/60"
        >
          Skip to picks
        </a>
      </div>
      <section className="panel p-6">
        <h2 className="display text-2xl text-pine">How it works</h2>
        <p className="mt-1 mb-5 text-sm text-muted">
          Two-day Club Championship. Winner takes all.
        </p>
        <RulesList pool={pool} compact />
      </section>
      <div id="picks" className="panel p-6 scroll-mt-8">
        <h2 className="display mb-5 text-2xl text-pine">Your squad</h2>
        <EntryPicker
          golfers={pool.golfers}
          settings={pool.settings}
          cutoff={payCutoffLabel(pool.golfers, pool.settings)}
          publicEntry
        />
      </div>
    </div>
  );
}

function Closed({
  title,
  body,
  href,
  link,
}: {
  title: string;
  body: string;
  href?: string;
  link?: string;
}) {
  return (
    <section className="mx-auto max-w-xl">
      <p className="text-[11px] tracking-[0.22em] text-gold uppercase">
        Championship pool
      </p>
      <h1 className="display mt-2 text-4xl text-pine">{title}</h1>
      <p className="mt-4 text-lg leading-8 text-muted">{body}</p>
      {href && link ? (
        <Link
          href={href}
          className="mt-8 inline-flex rounded-sm bg-pine px-5 py-3 text-sm font-semibold tracking-wide text-cream"
        >
          {link}
        </Link>
      ) : null}
    </section>
  );
}
