import { readPool } from "./db";
import { enforcePayCutoff } from "./pay";
import type { Pool } from "./types";

export async function withLiveScores(): Promise<Pool> {
  let pool = await enforcePayCutoff(await readPool());
  if (!pool.settings.ggEventId) return pool;
  try {
    const { syncGolfGeniusScores } = await import("./golfgenius");
    pool = await syncGolfGeniusScores(false);
    return enforcePayCutoff(pool);
  } catch {
    return pool;
  }
}
