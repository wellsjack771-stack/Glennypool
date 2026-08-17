import {
  looksLikeTeeTime,
  formatClock,
  teeTimeMinutes,
  type Golfer,
  type Settings,
} from "./types";

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

export function earliestTeeMinutes(golfers: Pick<Golfer, "liveThru">[]) {
  const times = golfers
    .map((golfer) => teeTimeMinutes(golfer.liveThru ?? ""))
    .filter((value): value is number => value != null);
  return times.length > 0 ? Math.min(...times) : 7 * 60;
}

export function payCutoffAt(
  settings: Pick<Settings, "dates" | "year">,
  golfers: Pick<Golfer, "liveThru">[],
) {
  const match = settings.dates.match(/([A-Za-z]+)\s+(\d{1,2})/);
  if (!match) return null;
  const month = MONTHS[match[1].toLowerCase()];
  if (!month) return null;
  const day = Number(match[2]);
  const mins = earliestTeeMinutes(golfers);
  const hour = String(Math.floor(mins / 60)).padStart(2, "0");
  const minute = String(mins % 60).padStart(2, "0");
  const stamp = `${settings.year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${hour}:${minute}:00-03:00`;
  const date = new Date(stamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function payCutoffLabel(
  golfers: Pick<Golfer, "liveThru">[],
  settings?: Pick<Settings, "dates" | "year">,
  fallback = "the first tee time Saturday",
) {
  const cutoff = settings ? payCutoffAt(settings, golfers) : null;
  if (cutoff) {
    const when = cutoff.toLocaleString("en-CA", {
      timeZone: "America/Halifax",
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    return `the first tee time Saturday (${when} AT)`;
  }
  const times = golfers
    .map((golfer) => teeTimeMinutes(golfer.liveThru ?? ""))
    .filter((value): value is number => value != null);
  if (times.length === 0) return fallback;
  return `the first tee time Saturday (${formatClock(Math.min(...times))})`;
}

export function revealAt(settings: Pick<Settings, "dates" | "year">) {
  const match = settings.dates.match(/([A-Za-z]+)\s+(\d{1,2})/);
  if (!match) return null;
  const month = MONTHS[match[1].toLowerCase()];
  if (!month) return null;
  const day = Number(match[2]);
  const stamp = `${settings.year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T07:00:00-03:00`;
  const date = new Date(stamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function playHasStarted(
  settings: Pick<Settings, "dates" | "year">,
  golfers: Pick<Golfer, "r1" | "r2" | "liveThru" | "liveToPar">[],
) {
  const at = revealAt(settings);
  if (at && Date.now() >= at.getTime()) return true;
  const cutoff = payCutoffAt(settings, golfers);
  if (cutoff && Date.now() >= cutoff.getTime()) return true;
  return golfers.some((golfer) => {
    if (golfer.r1 != null || golfer.r2 != null) return true;
    const thru = golfer.liveThru ?? "";
    if (thru && !looksLikeTeeTime(thru)) return true;
    const toPar = (golfer.liveToPar ?? "").trim();
    return Boolean(toPar && toPar !== "-" && toPar !== "—");
  });
}

export function picksRevealed(
  settings: Pick<Settings, "dates" | "year">,
  golfers: Pick<Golfer, "r1" | "r2" | "liveThru" | "liveToPar">[] = [],
) {
  return playHasStarted(settings, golfers);
}

export function revealLabel(settings: Pick<Settings, "dates" | "year">) {
  const at = revealAt(settings);
  if (!at) return "Saturday at 7:00 AM";
  return at.toLocaleString("en-CA", {
    timeZone: "America/Halifax",
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
