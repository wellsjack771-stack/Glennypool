import { cookies } from "next/headers";

const COOKIE = "pool_my_entries";

function readIds(raw: string | undefined) {
  if (!raw) return [] as string[];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export async function rememberEntry(id: string) {
  const jar = await cookies();
  const ids = readIds(jar.get(COOKIE)?.value);
  if (!ids.includes(id)) ids.push(id);
  jar.set(COOKIE, JSON.stringify(ids), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
}

export async function ownsEntry(id: string) {
  const jar = await cookies();
  return readIds(jar.get(COOKIE)?.value).includes(id);
}
