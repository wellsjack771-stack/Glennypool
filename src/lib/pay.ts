import "server-only";

import { playHasStarted, payCutoffAt } from "./cutoff";
import { readPool, updatePool } from "./db";
import type { Pool } from "./types";

export async function enforcePayCutoff(pool?: Pool): Promise<Pool> {
  const current = pool ?? (await readPool());
  const cutoff = payCutoffAt(current.settings, current.golfers);
  const started = playHasStarted(current.settings, current.golfers);
  const pastFirstTee = Boolean(cutoff && Date.now() >= cutoff.getTime());
  const dropUnpaid = pastFirstTee && current.entries.some((entry) => !entry.paid);
  const closeBooks = started && current.settings.entriesOpen;
  if (!dropUnpaid && !closeBooks) return current;
  return updatePool((next) => {
    if (dropUnpaid) {
      next.entries = next.entries.filter((entry) => entry.paid);
    }
    if (started) next.settings.entriesOpen = false;
  });
}
