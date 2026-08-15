import { readPool, updatePool } from "./db";
import type { Golfer, GolferStatus, Pool } from "./types";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export type GGBoard = {
  name: string;
  eventId: string;
  specId: string;
};

export type GGPlayer = {
  name: string;
  aggregateId: string;
  position: string;
  toPar: string;
  r1: number | null;
  r2: number | null;
  thru: string;
  status: GolferStatus;
  roundInProgress: boolean;
};

export type GGSnapshot = {
  eventName: string;
  eventId: string;
  rounds: { name: string; date?: string; inProgress: boolean }[];
  players: GGPlayer[];
  fetchedAt: string;
};

function decodeEntities(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function nameKey(name: string) {
  const parts = name
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");
  if (parts.length >= 3 && parts[1].length === 1) {
    return `${parts[0]} ${parts.slice(2).join(" ")}`;
  }
  return parts.join(" ");
}

async function getText(
  url: string,
  accept?: string,
  extra?: Record<string, string>,
) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: accept ?? "text/html,application/xhtml+xml",
      ...extra,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Golf Genius request failed (${response.status})`);
  }
  return response.text();
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Golf Genius request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function parsePageId(input: string) {
  const trimmed = input.trim();
  const page = trimmed.match(/golfgenius\.com\/pages\/(\d+)/i);
  if (page) return { kind: "page" as const, id: page[1] };
  const event = trimmed.match(/v2tournaments\/(\d+)/i);
  if (event) return { kind: "event" as const, id: event[1] };
  if (/^\d+$/.test(trimmed)) return { kind: "page" as const, id: trimmed };
  return null;
}

export async function discoverBoards(pageUrl: string): Promise<{
  pageUrl: string;
  leagueId: string;
  boards: GGBoard[];
}> {
  const parsed = parsePageId(pageUrl);
  if (!parsed) {
    throw new Error("Paste a Golf Genius results page URL.");
  }
  if (parsed.kind === "event") {
    const json = await getJson<{ event?: { name?: string; id_str?: string; id?: number } }>(
      `https://www.golfgenius.com/v2tournaments/${parsed.id}`,
    );
    const name = json.event?.name?.trim() || "Leaderboard";
    return {
      pageUrl,
      leagueId: "",
      boards: [{ name, eventId: parsed.id, specId: "" }],
    };
  }

  const html = await getText(`https://www.golfgenius.com/pages/${parsed.id}`);
  const league = html.match(/\/leagues\/(\d+)\/widgets\/tournament_results/);
  if (!league) {
    throw new Error("No tournament results widget found on that page.");
  }
  const widget = await getText(
    `https://www.golfgenius.com/leagues/${league[1]}/widgets/tournament_results?shared=false`,
  );
  const boards: GGBoard[] = [];
  const re =
    /data-tournament-spec-id="(\d+)"\s+data-tournament-event-id="(\d+)"[^>]*>\s*([^<]+)/g;
  for (const match of widget.matchAll(re)) {
    boards.push({
      specId: match[1],
      eventId: match[2],
      name: decodeEntities(match[3]).replace(/\s+/g, " ").trim(),
    });
  }
  if (boards.length === 0) {
    throw new Error("No leaderboards found on that Golf Genius page.");
  }
  return {
    pageUrl: `https://www.golfgenius.com/pages/${parsed.id}`,
    leagueId: league[1],
    boards,
  };
}

function parseStroke(raw: string | number | null | undefined): number | null {
  if (raw == null) return null;
  const text = String(raw)
    .replace(/<[^>]+>/g, " ")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text || text === "-" || text === "—") return null;
  if (/^\d{2,3}$/.test(text)) {
    const value = Number(text);
    return value >= 18 && value <= 130 ? value : null;
  }
  return null;
}

function parseThru(raw: string) {
  return raw.replace(/\s+/g, " ").trim();
}

function isTeeTime(thru: string) {
  return /\d{1,2}:\d{2}\s*(AM|PM)/i.test(thru);
}

function roundFinished(thru: string) {
  const t = thru.toUpperCase();
  return t === "F" || t === "18" || t === "F*" || t.includes("18");
}

function mapDisposition(
  raw: string | null | undefined,
  thru: string,
  roundInProgress: boolean,
): GolferStatus {
  const value = (raw || "").toUpperCase();
  if (value === "WD" || value === "WD/RET" || value === "RET") return "wd";
  if (value === "DQ") return "dq";
  if (value === "DNS" || value === "NS" || value === "DNP") {
    if (roundInProgress && (isTeeTime(thru) || !thru)) return "active";
    return "dns";
  }
  return "active";
}

type GGJson = {
  event?: {
    name?: string;
    id_str?: string;
    id?: number;
    rounds?: { name?: string; date?: string; in_progress?: boolean }[];
    scopes?: {
      aggregates?: {
        name?: string;
        id_str?: string;
        position?: string;
        score?: string;
        disposition?: string;
        rounds?: {
          name?: string;
          score?: string;
          thru?: string;
          total?: string;
        }[];
      }[];
    }[];
  };
};

function unescapeJsHtml(js: string) {
  const marker = '", "';
  const start = js.indexOf(marker);
  if (start < 0) return "";
  let html = js.slice(start + marker.length);
  const end = html.lastIndexOf('");');
  if (end >= 0) html = html.slice(0, end);
  return html
    .replace(/\\n/g, "\n")
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\//g, "/");
}

function cellText(html: string) {
  return decodeEntities(
    html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  );
}

function parseTablePlayers(html: string) {
  const headerRow = html.match(/<tr class='header[\s\S]*?<\/tr>/i)?.[0] ?? "";
  const headers = [...headerRow.matchAll(/<th[\s\S]*?<\/th>/gi)].map((match) =>
    cellText(match[0]).replace(/\s+/g, " "),
  );
  const r1Index = headers.findIndex((h) => /^R1$/i.test(h));
  const r2Index = headers.findIndex((h) => /^R2$/i.test(h));
  const thruIndex = headers.findIndex((h) => /thru/i.test(h));
  const toParIndex = headers.findIndex((h) => /to par/i.test(h));

  const rows = [...html.matchAll(/<tr class='aggregate-row[\s\S]*?<\/tr>/gi)];
  const byName = new Map<
    string,
    { r1: number | null; r2: number | null; thru: string; toPar: string }
  >();
  for (const row of rows) {
    const name =
      row[0].match(/data-aggregate-name='([^']+)'/)?.[1] ||
      cellText(row[0].match(/<td class='name'[\s\S]*?<\/td>/)?.[0] ?? "");
    if (!name) continue;
    const cells = [...row[0].matchAll(/<td[\s\S]*?<\/td>/gi)].map((match) =>
      cellText(match[0]),
    );
    byName.set(nameKey(decodeEntities(name)), {
      r1: r1Index >= 0 ? parseStroke(cells[r1Index]) : null,
      r2: r2Index >= 0 ? parseStroke(cells[r2Index]) : null,
      thru: thruIndex >= 0 ? parseThru(cells[thruIndex]) : "",
      toPar: toParIndex >= 0 ? cells[toParIndex] ?? "" : "",
    });
  }
  return byName;
}

export async function fetchLeaderboard(eventId: string): Promise<GGSnapshot> {
  const [json, js] = await Promise.all([
    getJson<GGJson>(`https://www.golfgenius.com/v2tournaments/${eventId}`),
    getText(
      `https://www.golfgenius.com/v2tournaments/${eventId}?player_stats_for_portal=true&round_index=1`,
      "text/javascript, application/javascript, */*; q=0.01",
      { "X-Requested-With": "XMLHttpRequest" },
    ),
  ]);
  const event = json.event;
  if (!event) throw new Error("Golf Genius did not return a leaderboard.");
  const htmlPlayers = parseTablePlayers(unescapeJsHtml(js));
  const rounds = (event.rounds ?? []).map((round) => ({
    name: round.name || "",
    date: round.date,
    inProgress: Boolean(round.in_progress),
  }));
  const roundInProgress = rounds.some((round) => round.inProgress);
  const players: GGPlayer[] = [];

  for (const agg of event.scopes?.[0]?.aggregates ?? []) {
    const name = (agg.name || "").trim();
    if (!name) continue;
    const fromHtml = htmlPlayers.get(nameKey(name));
    const r1Json = agg.rounds?.find((round) => /^R1$/i.test(round.name || ""));
    const r2Json = agg.rounds?.find((round) => /^R2$/i.test(round.name || ""));
    const thru = parseThru(fromHtml?.thru || r1Json?.thru || r2Json?.thru || "");
    const toPar = fromHtml?.toPar || agg.score || "";
    const r1 =
      fromHtml?.r1 ??
      parseStroke(r1Json?.total) ??
      parseStroke(r1Json?.score);
    const r2 =
      fromHtml?.r2 ??
      parseStroke(r2Json?.total) ??
      parseStroke(r2Json?.score);
    players.push({
      name,
      aggregateId: String(agg.id_str || ""),
      position: agg.position || "",
      toPar: toPar === "-" ? "" : toPar,
      r1,
      r2,
      thru,
      status: mapDisposition(agg.disposition, thru, roundInProgress),
      roundInProgress,
    });
  }

  return {
    eventName: (event.name || "").trim(),
    eventId: String(event.id_str || eventId),
    rounds,
    players,
    fetchedAt: new Date().toISOString(),
  };
}

export function pickDefaultBoard(boards: GGBoard[]) {
  const exact = boards.find((board) =>
    /overall\s*[-–]\s*men'?s\s*club championship/i.test(board.name),
  );
  if (exact) return exact;
  const overallMen = boards.find(
    (board) => /overall/i.test(board.name) && /men/i.test(board.name),
  );
  return overallMen ?? boards[0];
}

export function applySnapshot(pool: Pool, snapshot: GGSnapshot) {
  const byKey = new Map(snapshot.players.map((player) => [nameKey(player.name), player]));
  let matched = 0;
  let scored = 0;
  for (const golfer of pool.golfers) {
    const player = byKey.get(nameKey(golfer.name));
    if (!player) continue;
    matched += 1;
    golfer.ggId = player.aggregateId;
    const finished = roundFinished(player.thru);
    golfer.liveThru = player.thru;
    golfer.liveToPar = player.toPar === "-" ? "" : player.toPar;
    golfer.status = player.status;
    if (player.r1 != null && (finished || player.r1 >= 55)) {
      golfer.r1 = player.r1;
      scored += 1;
    } else if (player.status === "active" && !finished) {
      golfer.r1 = golfer.r1 != null && golfer.r1 >= 55 ? golfer.r1 : null;
      if (golfer.liveToPar) scored += 1;
    }
    if (player.r2 != null && (player.r2 >= 55 || /r2/i.test(player.thru))) {
      golfer.r2 = player.r2;
    }
  }
  pool.settings.ggLastSyncAt = snapshot.fetchedAt;
  pool.settings.ggLastSyncStatus = `${snapshot.eventName}: ${matched} matched, ${scored} with a posted round`;
  pool.settings.ggLastSyncCount = snapshot.players.length;
  return { matched, scored, total: snapshot.players.length };
}

let syncing: Promise<Pool> | null = null;

export async function syncGolfGeniusScores(force = false) {
  if (syncing) return syncing;
  syncing = (async () => {
    const pool = await readPool();
    if (!pool.settings.ggEventId) return pool;
    if (!force) {
      const last = Date.parse(pool.settings.ggLastSyncAt || "") || 0;
      const wait = Math.max(1, pool.settings.ggSyncMinutes || 3) * 60 * 1000;
      if (Date.now() - last < wait) return pool;
    }
    const snapshot = await fetchLeaderboard(pool.settings.ggEventId);
    return updatePool((next) => {
      applySnapshot(next, snapshot);
    });
  })().finally(() => {
    syncing = null;
  });
  return syncing;
}

export async function importGolfGeniusField(snapshot: GGSnapshot) {
  return updatePool((pool) => {
    const existing = new Set(pool.golfers.map((golfer) => nameKey(golfer.name)));
    for (const player of snapshot.players) {
      const key = nameKey(player.name);
      if (existing.has(key)) continue;
      existing.add(key);
      pool.golfers.push({
        id: crypto.randomUUID(),
        name: player.name,
        handicap: null,
        group: null,
        r1: player.r1,
        r2: player.r2,
        status: player.status,
        ggId: player.aggregateId,
        liveThru: player.thru,
        liveToPar: player.toPar === "-" ? "" : player.toPar,
      });
    }
    pool.golfers.sort((a, b) => a.name.localeCompare(b.name));
    applySnapshot(pool, snapshot);
  });
}

export function golferLiveLabel(golfer: Golfer) {
  if (golfer.liveThru) return golfer.liveThru;
  if (golfer.r1 != null && golfer.r2 != null) return "F";
  if (golfer.r1 != null) return "R1";
  return "";
}
