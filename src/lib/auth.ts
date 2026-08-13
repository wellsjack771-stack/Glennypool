import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import type { Settings } from "./types";

const SECRET_PATH = path.join(process.cwd(), "data", "secret");
const COOKIE_NAME = "pool_admin";
const SESSION_DAYS = 14;

async function getSecret(): Promise<string> {
  try {
    return (await readFile(SECRET_PATH, "utf8")).trim();
  } catch {
    const secret = randomBytes(32).toString("hex");
    await mkdir(path.dirname(SECRET_PATH), { recursive: true });
    await writeFile(SECRET_PATH, secret, "utf8");
    return secret;
  }
}

export function hashPin(pin: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(pin, salt, 32).toString("hex");
  return { hash, salt };
}

export function verifyPin(pin: string, settings: Settings) {
  if (!settings.pinHash || !settings.pinSalt) return false;
  const { hash } = hashPin(pin, settings.pinSalt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(settings.pinHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function createAdminSession() {
  const secret = await getSecret();
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = String(expires);
  const token = `${payload}.${sign(payload, secret)}`;
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const secret = await getSecret();
  const expected = sign(payload, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const expires = Number(payload);
  return Number.isFinite(expires) && expires > Date.now();
}
