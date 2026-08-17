import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_SETTINGS, isGolferStatus, parseGroup, type Entry, type Golfer, type Pool } from "./types";

const DATA_DIR = path.resolve(
  /* turbopackIgnore: true */ process.env.DATA_DIR ||
    path.join(process.cwd(), "data"),
);
const DATA_PATH = path.join(DATA_DIR, "pool.json");
const TMP_PATH = path.join(DATA_DIR, "pool.json.tmp");

function emptyPool(): Pool {
  return {
    settings: {
      ...DEFAULT_SETTINGS,
      pinHash: "",
      pinSalt: "",
    },
    golfers: [],
    entries: [],
  };
}

function normalizeGolfer(raw: Partial<Golfer> & { flight?: string }): Golfer {
  const fromFlight = raw.group ?? parseGroup(String(raw.flight ?? ""));
  const status = String(raw.status ?? "");
  return {
    id: raw.id ?? crypto.randomUUID(),
    name: raw.name ?? "",
    handicap: typeof raw.handicap === "number" ? raw.handicap : null,
    group: fromFlight,
    r1: raw.r1 ?? null,
    r2: raw.r2 ?? null,
    status: isGolferStatus(status) ? status : "active",
    ggId: raw.ggId ?? "",
    liveThru: raw.liveThru ?? "",
    liveToPar: raw.liveToPar ?? "",
  };
}

function normalizeEntry(raw: Partial<Entry>): Entry {
  return {
    id: raw.id ?? crypto.randomUUID(),
    name: raw.name ?? "",
    ownerName: String(raw.ownerName ?? "").trim(),
    golferIds: raw.golferIds ?? [],
    tiebreakerScore:
      typeof raw.tiebreakerScore === "number" ? raw.tiebreakerScore : null,
    paid: Boolean(raw.paid),
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

let writeChain: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function readPool(): Promise<Pool> {
  try {
    const raw = await readFile(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw) as Pool;
    return {
      settings: { ...emptyPool().settings, ...parsed.settings },
      golfers: (parsed.golfers ?? []).map(normalizeGolfer),
      entries: (parsed.entries ?? []).map(normalizeEntry),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return emptyPool();
    }
    throw error;
  }
}

export async function updatePool(
  mutator: (pool: Pool) => void | Promise<void>,
): Promise<Pool> {
  return withLock(async () => {
    const pool = await readPool();
    await mutator(pool);
    await mkdir(DATA_DIR, { recursive: true });
    const payload = `${JSON.stringify(pool, null, 2)}\n`;
    await writeFile(TMP_PATH, payload, "utf8");
    await rename(TMP_PATH, DATA_PATH);
    return pool;
  });
}
