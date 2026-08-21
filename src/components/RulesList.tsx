import { picksCount, type Pool } from "@/lib/types";

export function RulesList({
  pool,
  compact = false,
}: {
  pool: Pool;
  compact?: boolean;
}) {
  const totalPicks = picksCount(pool.settings);
  const counting = totalPicks - pool.settings.voidCount;
  const penalty = pool.settings.penaltyScore;
  const fee = pool.settings.entryFee;
  const email = pool.settings.etransferEmail;

  const items = [
    {
      n: "01",
      title: `${pool.settings.groupCount} groups`,
      body: `Golfers are split into ${pool.settings.groupCount} groups. You pick from those groups.`,
    },
    {
      n: "02",
      title: `${pool.settings.picksPerGroup} from each group`,
      body: `Select exactly ${pool.settings.picksPerGroup} golfers from each group — ${totalPicks} in all. More than one entry may pick the same golfer.`,
    },
    {
      n: "03",
      title: `Void the worst ${pool.settings.voidCount}`,
      body: `After both days, add each golfer’s two-round total. The ${pool.settings.voidCount} highest (worst) scores are voided.`,
    },
    {
      n: "04",
      title: `Lowest ${counting} wins`,
      body: `Your pool score is the sum of the remaining ${counting} totals. Lowest score wins. Winner takes all.`,
    },
    {
      n: "05",
      title: "Withdrawals and no-shows",
      body: `WD, DNF, DNS, NS, or no-show is a ${penalty} for that day. Finish day 1 then withdraw: keep day 1, take ${penalty} on day 2.`,
    },
    {
      n: "06",
      title: "Tiebreaker",
      body: "Guess the Club Championship winner’s 36-hole score to par (Even, −1, +2). Closest prediction wins a tie.",
    },
    {
      n: "07",
      title: "Picks stay private",
      body: "Squads stay hidden until the admin publishes them. Public entries stay open until the admin turns them off.",
    },
    {
      n: "08",
      title: `$${fee} e-transfer`,
      body: `Send $${fee} to ${email}. Unpaid entries stay on the board until the admin marks them paid or removes them.`,
    },
  ];

  return (
    <ol className={compact ? "space-y-4" : "space-y-6"}>
      {items.map((item) => (
        <li key={item.n} className="grid grid-cols-[auto_1fr] gap-4">
          <span className="score text-gold">{item.n}</span>
          <div>
            <h2
              className={`display text-pine ${compact ? "text-xl" : "text-2xl"}`}
            >
              {item.title}
            </h2>
            <p
              className={`text-muted ${compact ? "mt-1 leading-6" : "mt-2 leading-7"}`}
            >
              {item.body}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
