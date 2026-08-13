import { readPool } from "./db";
import { enforcePayCutoff } from "./pay";
import type { Pool } from "./types";

export async function withLiveScores(): Promise<Pool> {
  const pool = await enforcePayCutoff(await readPool());
  if (!pool.settings.ggEventId) return pool;
  try {
    const { syncGolfGeniusScores } = await import("./golfgenius");
    return await syncGolfGeniusScores(false);
  } catch {
    return pool;
  }
}
