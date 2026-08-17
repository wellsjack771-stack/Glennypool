import "server-only";

import { playHasStarted } from "./cutoff";
import { readPool, updatePool } from "./db";
import type { Pool } from "./types";

export async function enforcePayCutoff(pool?: Pool): Promise<Pool> {
  const current = pool ?? (await readPool());
  const started = playHasStarted(current.settings, current.golfers);
  if (!started || !current.settings.entriesOpen) return current;
  return updatePool((next) => {
    next.settings.entriesOpen = false;
  });
}
