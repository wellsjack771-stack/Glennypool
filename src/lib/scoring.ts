import {
  EVENT_PAR,
  GROUPS,
  picksCount,
  type Entry,
  type Golfer,
  type GroupId,
  type Pool,
  type Settings,
} from "./types";

export type PickRow = {
  golfer: Golfer | null;
  golferId: string;
  total: number | null;
  posted: boolean;
  voided: boolean;
  counting: boolean;
  label: string;
  group: GroupId | null;
};

export type EntryResult = {
  entry: Entry;
  picks: PickRow[];
  total: number | null;
  countingCount: number;
  complete: boolean;
  eligible: boolean;
  tiebreakerDiff: number | null;
};

export type RankedEntry = EntryResult & {
  rank: number;
  tied: boolean;
};

export function roundScore(
  golfer: Golfer,
  round: "r1" | "r2",
  penalty = 100,
): number | null {
  const posted = golfer[round];
  if (golfer.status !== "active") return posted ?? penalty;
  return posted;
}

export function golferRoundTotal(golfer: Golfer, penalty = 100): number | null {
  const r1 = roundScore(golfer, "r1", penalty);
  const r2 = roundScore(golfer, "r2", penalty);
  if (golfer.status !== "active") {
    return (r1 ?? penalty) + (r2 ?? penalty);
  }
  if (r1 == null && r2 == null) return null;
  return (r1 ?? 0) + (r2 ?? 0);
}

export function championshipTotal(golfer: Golfer, penalty = 100): number | null {
  return golferRoundTotal(golfer, penalty);
}

export function groupCounts(golferIds: string[], golfersById: Map<string, Golfer>) {
  const counts = new Map<GroupId, number>();
  for (const group of GROUPS) counts.set(group, 0);
  for (const id of golferIds) {
    const group = golfersById.get(id)?.group;
    if (group) counts.set(group, (counts.get(group) ?? 0) + 1);
  }
  return counts;
}

export function isValidSquad(
  golferIds: string[],
  golfersById: Map<string, Golfer>,
  settings: Pick<Settings, "groupCount" | "picksPerGroup">,
) {
  if (golferIds.length !== picksCount(settings)) return false;
  if (new Set(golferIds).size !== golferIds.length) return false;
  const counts = groupCounts(golferIds, golfersById);
  return GROUPS.slice(0, settings.groupCount).every(
    (group) => counts.get(group) === settings.picksPerGroup,
  );
}

export function scoreEntry(
  entry: Entry,
  golfersById: Map<string, Golfer>,
  settings: Settings,
  championTotal: number | null,
): EntryResult {
  const penalty = settings.penaltyScore || 100;
  const picks: PickRow[] = entry.golferIds.map((golferId) => {
    const golfer = golfersById.get(golferId) ?? null;
    const total = golfer ? golferRoundTotal(golfer, penalty) : null;
    return {
      golfer,
      golferId,
      total,
      posted: total != null,
      voided: false,
      counting: false,
      label: golfer?.name ?? "Missing golfer",
      group: golfer?.group ?? null,
    };
  });

  picks.sort((a, b) => {
    const groupDiff = (a.group ?? 99) - (b.group ?? 99);
    if (groupDiff !== 0) return groupDiff;
    return a.label.localeCompare(b.label);
  });

  const eligible = isValidSquad(entry.golferIds, golfersById, settings);

  const unposted = picks.filter((pick) => !pick.posted);
  const posted = picks
    .filter((pick) => pick.posted)
    .sort((a, b) => {
      const diff = (b.total ?? 0) - (a.total ?? 0);
      if (diff !== 0) return diff;
      return a.label.localeCompare(b.label);
    });

  let remainingVoids = settings.voidCount;
  for (const pick of unposted) {
    if (remainingVoids <= 0) break;
    pick.voided = true;
    remainingVoids -= 1;
  }
  for (const pick of posted) {
    if (remainingVoids <= 0) break;
    pick.voided = true;
    remainingVoids -= 1;
  }

  let total = 0;
  let countingCount = 0;
  for (const pick of picks) {
    if (pick.voided || !pick.posted || pick.total == null) continue;
    pick.counting = true;
    total += pick.total;
    countingCount += 1;
  }

  const complete = eligible && picks.every((pick) => pick.posted);
  const championToPar =
    championTotal != null ? championTotal - EVENT_PAR : null;
  const tiebreakerDiff =
    championToPar != null && entry.tiebreakerScore != null
      ? Math.abs(entry.tiebreakerScore - championToPar)
      : null;

  return {
    entry,
    picks,
    total: countingCount > 0 ? total : null,
    countingCount,
    complete,
    eligible,
    tiebreakerDiff,
  };
}

export function fieldLeader(golfers: Golfer[], penalty = 100): Golfer | null {
  const ranked = fieldLeaderboard(golfers, penalty).filter(
    (golfer) => golfer.status === "active" && championshipTotal(golfer, penalty) != null,
  );
  return ranked[0] ?? null;
}

export function championTotal(pool: Pool): number | null {
  const penalty = pool.settings.penaltyScore || 100;
  const champion =
    pool.golfers.find((golfer) => golfer.id === pool.settings.championId) ??
    null;
  if (champion) return championshipTotal(champion, penalty);
  const leader = fieldLeader(pool.golfers, penalty);
  if (leader && leader.r1 != null && leader.r2 != null) {
    return championshipTotal(leader, penalty);
  }
  return null;
}

export function rankEntries(pool: Pool): RankedEntry[] {
  const golfersById = new Map(pool.golfers.map((golfer) => [golfer.id, golfer]));
  const winningScore = championTotal(pool);
  const results = pool.entries
    .map((entry) => scoreEntry(entry, golfersById, pool.settings, winningScore))
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      if (a.total == null && b.total == null) {
        return a.entry.name.localeCompare(b.entry.name);
      }
      if (a.total == null) return 1;
      if (b.total == null) return -1;
      if (a.total !== b.total) return a.total - b.total;
      if (a.tiebreakerDiff != null && b.tiebreakerDiff != null) {
        if (a.tiebreakerDiff !== b.tiebreakerDiff) {
          return a.tiebreakerDiff - b.tiebreakerDiff;
        }
      } else if (a.tiebreakerDiff != null) return -1;
      else if (b.tiebreakerDiff != null) return 1;
      if (a.countingCount !== b.countingCount) {
        return b.countingCount - a.countingCount;
      }
      return a.entry.name.localeCompare(b.entry.name);
    });

  const ranked: RankedEntry[] = [];
  for (let i = 0; i < results.length; i++) {
    const current = results[i];
    const previous = ranked[i - 1];
    const sameAsPrev =
      previous &&
      current.eligible &&
      previous.eligible &&
      current.total != null &&
      previous.total != null &&
      current.total === previous.total &&
      current.tiebreakerDiff === previous.tiebreakerDiff &&
      current.countingCount === previous.countingCount;
    const rank = sameAsPrev ? previous.rank : i + 1;
    ranked.push({ ...current, rank, tied: false });
  }

  for (let i = 0; i < ranked.length; i++) {
    const current = ranked[i];
    const next = ranked[i + 1];
    const prev = ranked[i - 1];
    current.tied = Boolean(
      (next && next.rank === current.rank) ||
        (prev && prev.rank === current.rank),
    );
  }

  return ranked;
}

export function fieldLeaderboard(golfers: Golfer[], penalty = 100): Golfer[] {
  return [...golfers].sort((a, b) => {
    const aTotal = championshipTotal(a, penalty);
    const bTotal = championshipTotal(b, penalty);
    if (a.status !== "active" && b.status === "active") return 1;
    if (b.status !== "active" && a.status === "active") return -1;
    if (aTotal == null && bTotal == null) {
      const groupDiff = (a.group ?? 99) - (b.group ?? 99);
      if (groupDiff !== 0) return groupDiff;
      const hcp = (a.handicap ?? 99) - (b.handicap ?? 99);
      if (hcp !== 0) return hcp;
      return a.name.localeCompare(b.name);
    }
    if (aTotal == null) return 1;
    if (bTotal == null) return -1;
    if (aTotal !== bTotal) return aTotal - bTotal;
    return a.name.localeCompare(b.name);
  });
}

export function golfersByGroup(golfers: Golfer[]) {
  const map = new Map<GroupId | 0, Golfer[]>();
  map.set(0, []);
  for (const group of GROUPS) map.set(group, []);
  for (const golfer of golfers) {
    const key = golfer.group ?? 0;
    map.get(key)?.push(golfer);
  }
  for (const list of map.values()) {
    list.sort((a, b) => {
      const hcp = (a.handicap ?? 99) - (b.handicap ?? 99);
      if (hcp !== 0) return hcp;
      return a.name.localeCompare(b.name);
    });
  }
  return map;
}

export function pickCounts(pool: Pool): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entry of pool.entries) {
    for (const golferId of entry.golferIds) {
      counts.set(golferId, (counts.get(golferId) ?? 0) + 1);
    }
  }
  return counts;
}

export function postedRoundCount(golfers: Golfer[]) {
  const r1 = golfers.filter((golfer) => golfer.r1 != null || golfer.status !== "active").length;
  const r2 = golfers.filter((golfer) => golfer.r2 != null || golfer.status !== "active").length;
  return { r1, r2, field: golfers.length };
}
