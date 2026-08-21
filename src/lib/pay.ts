import "server-only";

import { readPool } from "./db";
import type { Pool } from "./types";

export async function enforcePayCutoff(pool?: Pool): Promise<Pool> {
  return pool ?? (await readPool());
}
