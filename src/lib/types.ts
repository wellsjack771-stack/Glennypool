export type GolferStatus = "active" | "wd" | "dq" | "dns";

export const ROUND_PAR = 72;
export const EVENT_PAR = ROUND_PAR * 2;

export const GROUPS = [1, 2, 3, 4] as const;
export type GroupId = (typeof GROUPS)[number];

export type Settings = {
  clubName: string;
  eventName: string;
  year: number;
  venue: string;
  dates: string;
  groupCount: number;
  picksPerGroup: number;
  voidCount: number;
  penaltyScore: number;
  championId: string;
  ggPageUrl: string;
  ggLeagueId: string;
  ggEventId: string;
  ggEventName: string;
  ggSyncMinutes: number;
  ggLastSyncAt: string;
  ggLastSyncStatus: string;
  ggLastSyncCount: number;
  setupComplete: boolean;
  entriesOpen: boolean;
  entryFee: number;
  etransferEmail: string;
  pinHash: string;
  pinSalt: string;
};

export type Golfer = {
  id: string;
  name: string;
  handicap: number | null;
  group: GroupId | null;
  r1: number | null;
  r2: number | null;
  status: GolferStatus;
  ggId: string;
  liveThru: string;
  liveToPar: string;
};

export type Entry = {
  id: string;
  name: string;
  ownerName?: string;
  golferIds: string[];
  tiebreakerScore: number | null;
  paid: boolean;
  createdAt: string;
};

export type Pool = {
  settings: Settings;
  golfers: Golfer[];
  entries: Entry[];
};

export const DEFAULT_SETTINGS: Omit<Settings, "pinHash" | "pinSalt"> = {
  clubName: "",
  eventName: "Club Championship Pool",
  year: new Date().getFullYear(),
  venue: "",
  dates: "",
  groupCount: 4,
  picksPerGroup: 2,
  voidCount: 2,
  penaltyScore: 100,
  championId: "",
  ggPageUrl: "",
  ggLeagueId: "",
  ggEventId: "",
  ggEventName: "",
  ggSyncMinutes: 3,
  ggLastSyncAt: "",
  ggLastSyncStatus: "",
  ggLastSyncCount: 0,
  setupComplete: false,
  entriesOpen: true,
  entryFee: 15,
  etransferEmail: "wellsjack771@gmail.com",
};

export const STATUS_LABEL: Record<GolferStatus, string> = {
  active: "Active",
  wd: "WD",
  dq: "DQ",
  dns: "DNS",
};

export function picksCount(settings: Pick<Settings, "groupCount" | "picksPerGroup">) {
  return settings.groupCount * settings.picksPerGroup;
}

export function groupLabel(group: GroupId | null | undefined) {
  if (!group) return "Ungrouped";
  return `Group ${"ABCD"[group - 1] ?? group}`;
}

export function teeTimeMinutes(raw: string) {
  const match = raw.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  return hour * 60 + Number(match[2]);
}

export function formatClock(minutes: number) {
  const hour24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour = hour24 % 12 || 12;
  return `${hour}:${String(mins).padStart(2, "0")} ${suffix}`;
}

export function teeWindow(golfers: { liveThru?: string }[]) {
  const times = golfers
    .map((golfer) => teeTimeMinutes(golfer.liveThru ?? ""))
    .filter((value): value is number => value != null)
    .sort((a, b) => a - b);
  if (times.length === 0) return "";
  return `${formatClock(times[0])} – ${formatClock(times[times.length - 1])}`;
}

export function assignGroupsByTeeTime<T extends { liveThru?: string; name: string; group: GroupId | null }>(
  golfers: T[],
) {
  const waves = new Map<number, T[]>();
  const unknown: T[] = [];
  for (const golfer of golfers) {
    const minutes = teeTimeMinutes(golfer.liveThru ?? "");
    if (minutes == null) {
      unknown.push(golfer);
      continue;
    }
    const wave = waves.get(minutes) ?? [];
    wave.push(golfer);
    waves.set(minutes, wave);
  }
  const ordered = [...waves.entries()].sort((a, b) => a[0] - b[0]);
  const total = golfers.length - unknown.length;
  const target = total / 4;
  let group = 1 as GroupId;
  let inGroup = 0;
  for (const [, wave] of ordered) {
    if (group < 4 && inGroup > 0 && inGroup + wave.length / 2 > target) {
      group = (group + 1) as GroupId;
      inGroup = 0;
    }
    for (const golfer of wave) golfer.group = group;
    inGroup += wave.length;
  }
  for (const golfer of unknown) golfer.group = 4;
}

export function parseGroup(raw: string): GroupId | null {
  const text = raw.trim().toUpperCase().replace(/^GROUP\s+/, "");
  if (text === "A" || text === "1") return 1;
  if (text === "B" || text === "2") return 2;
  if (text === "C" || text === "3") return 3;
  if (text === "D" || text === "4") return 4;
  return null;
}
