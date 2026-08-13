import "server-only";

import { payCutoffAt } from "./cutoff";
import { readPool, updatePool } from "./db";
import type { Pool } from "./types";

export async function enforcePayCutoff(pool?: Pool): Promise<Pool> {
  const current = pool ?? (await readPool());
  const cutoff = payCutoffAt(current.settings, current.golfers);
  if (!cutoff || Date.now() < cutoff.getTime()) return current;
  const unpaid = current.entries.some((entry) => !entry.paid);
  if (!unpaid && !current.settings.entriesOpen) return current;
  return updatePool((next) => {
    next.entries = next.entries.filter((entry) => entry.paid);
    next.settings.entriesOpen = false;
  });
}
