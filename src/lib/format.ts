import { roundScore } from "./scoring";
import { parseGroup, ROUND_PAR, type Golfer, type GroupId } from "./types";

export { EVENT_PAR, ROUND_PAR } from "./types";

export function toPar(total: number | null, par = ROUND_PAR) {
  if (total == null) return "—";
  return formatToPar(total - par);
}

export function formatToPar(rel: number | null | undefined) {
  if (rel == null) return "—";
  if (rel === 0) return "Even";
  if (rel > 0) return `+${rel}`;
  return String(rel);
}

export function parseToPar(raw: FormDataEntryValue | string | null) {
  if (raw == null) return null;
  const text = String(raw).trim().toLowerCase();
  if (!text) return null;
  if (text === "even" || text === "e") return 0;
  const value = Number(text);
  if (!Number.isFinite(value) || value < -30 || value > 40) return null;
  return Math.round(value);
}

export const TIEBREAKER_OPTIONS = Array.from({ length: 51 }, (_, i) => i - 20);

export function formatScore(value: number | null | undefined) {
  if (value == null) return "—";
  return String(value);
}

export function formatHandicap(value: number | null | undefined) {
  if (value == null) return "—";
  if (value < 0) return `+${Math.abs(value).toFixed(1)}`;
  return value.toFixed(1);
}

export function formatRank(rank: number, tied: boolean) {
  return tied ? `T${rank}` : String(rank);
}

export function roundLabel(golfer: Golfer, round: "r1" | "r2", penalty = 100) {
  return formatScore(roundScore(golfer, round, penalty));
}

export function parseHandicap(raw: FormDataEntryValue | string | null) {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;
  const plus = text.startsWith("+");
  const value = Number(plus ? text.slice(1) : text);
  if (!Number.isFinite(value) || value < -10 || value > 54) return null;
  const handicap = plus ? -Math.abs(value) : value;
  return Math.round(handicap * 10) / 10;
}

export function parseGroupField(raw: FormDataEntryValue | null): GroupId | null {
  if (raw == null) return null;
  return parseGroup(String(raw));
}

export function parseGolferLine(line: string) {
  const cleaned = line.replace(/\t+/g, ",").trim();
  if (
    /^(player|name|golfer)\b/i.test(cleaned) &&
    /hcp|index|handicap/i.test(cleaned)
  ) {
    return { name: "", handicap: null, group: null };
  }
  let parts = cleaned.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 1) {
    const match = parts[0].match(/^(.+?)\s+(\+?-?\d+(?:\.\d+)?)\s*$/);
    if (match) parts = [match[1], match[2]];
  }
  const name = parts[0] ?? "";
  let handicap: number | null = null;
  let group: GroupId | null = null;
  for (const part of parts.slice(1)) {
    const parsedGroup = parseGroup(part);
    if (parsedGroup) {
      group = parsedGroup;
      continue;
    }
    const parsedHcp = parseHandicap(part);
    if (parsedHcp != null) handicap = parsedHcp;
  }
  return { name, handicap, group };
}

export function parseScore(raw: FormDataEntryValue | null): number | null {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;
  const value = Number(text);
  if (!Number.isFinite(value) || value < 0 || value > 200) return null;
  return Math.round(value);
}

export function parseLines(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
