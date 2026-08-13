"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearAdminSession,
  createAdminSession,
  hashPin,
  isAdmin,
  verifyPin,
} from "@/lib/auth";
import { readPool, updatePool } from "@/lib/db";
import {
  parseGolferLine,
  parseGroupField,
  parseHandicap,
  parseLines,
  parseScore,
  parseToPar,
} from "@/lib/format";
import { nameKey } from "@/lib/golfgenius";
import { rememberEntry } from "@/lib/mine";
import { isValidSquad } from "@/lib/scoring";
import type { GolferStatus } from "@/lib/types";

function refresh() {
  revalidatePath("/", "layout");
}

async function requireAdmin() {
  if (!(await isAdmin())) {
    throw new Error("Admin PIN required.");
  }
}

export async function completeSetup(
  _prev: { error?: string } | null,
  formData: FormData,
) {
  const pool = await readPool();
  if (pool.settings.setupComplete) {
    redirect("/admin/login");
  }

  const clubName = String(formData.get("clubName") ?? "").trim();
  const eventName =
    String(formData.get("eventName") ?? "").trim() || "Club Championship Pool";
  const year = Number(formData.get("year")) || new Date().getFullYear();
  const venue = String(formData.get("venue") ?? "").trim();
  const dates = String(formData.get("dates") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");
  const confirm = String(formData.get("confirmPin") ?? "");

  if (!clubName) return { error: "Club name is required." };
  if (pin.length < 4) return { error: "PIN must be at least 4 characters." };
  if (pin !== confirm) return { error: "PINs do not match." };

  const { hash, salt } = hashPin(pin);
  await updatePool((next) => {
    next.settings.clubName = clubName;
    next.settings.eventName = eventName;
    next.settings.year = year;
    next.settings.venue = venue;
    next.settings.dates = dates;
    next.settings.pinHash = hash;
    next.settings.pinSalt = salt;
    next.settings.setupComplete = true;
  });

  await createAdminSession();
  refresh();
  redirect("/admin");
}

export async function loginAdmin(
  _prev: { error?: string } | null,
  formData: FormData,
) {
  const pin = String(formData.get("pin") ?? "");
  const pool = await readPool();
  if (!verifyPin(pin, pool.settings)) {
    return { error: "That PIN is not correct." };
  }
  await createAdminSession();
  refresh();
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  refresh();
  redirect("/");
}

export async function saveSettings(
  _prev: { error?: string } | null,
  formData: FormData,
) {
  await requireAdmin();
  const clubName = String(formData.get("clubName") ?? "").trim();
  const eventName =
    String(formData.get("eventName") ?? "").trim() || "Club Championship Pool";
  const year = Number(formData.get("year")) || new Date().getFullYear();
  const venue = String(formData.get("venue") ?? "").trim();
  const dates = String(formData.get("dates") ?? "").trim();
  const championId = String(formData.get("championId") ?? "").trim();
  const newPin = String(formData.get("newPin") ?? "");
  const confirmPin = String(formData.get("confirmPin") ?? "");

  if (!clubName) return { error: "Club name is required." };
  if (newPin && newPin !== confirmPin) {
    return { error: "New PINs do not match." };
  }
  if (newPin && newPin.length < 4) {
    return { error: "PIN must be at least 4 characters." };
  }

  const entriesOpen = formData.get("entriesOpen") === "1";
  const entryFee = Math.max(0, Number(formData.get("entryFee")) || 15);
  const etransferEmail =
    String(formData.get("etransferEmail") ?? "").trim() ||
    "wellsjack771@gmail.com";

  await updatePool((pool) => {
    pool.settings.clubName = clubName;
    pool.settings.eventName = eventName;
    pool.settings.year = year;
    pool.settings.venue = venue;
    pool.settings.dates = dates;
    pool.settings.championId = championId;
    pool.settings.entriesOpen = entriesOpen;
    pool.settings.entryFee = entryFee;
    pool.settings.etransferEmail = etransferEmail;
    if (newPin) {
      const { hash, salt } = hashPin(newPin);
      pool.settings.pinHash = hash;
      pool.settings.pinSalt = salt;
    }
  });
  refresh();
  return {};
}

export async function addGolfers(formData: FormData) {
  await requireAdmin();
  const raw = String(formData.get("names") ?? "");
  const lines = parseLines(raw);
  if (lines.length === 0) throw new Error("Add at least one golfer.");

  await updatePool((pool) => {
    const existing = new Set(
      pool.golfers.map((golfer) => golfer.name.toLowerCase()),
    );
    for (const line of lines) {
      const parsed = parseGolferLine(line);
      if (!parsed.name || existing.has(parsed.name.toLowerCase())) continue;
      existing.add(parsed.name.toLowerCase());
      pool.golfers.push({
        id: crypto.randomUUID(),
        name: parsed.name,
        handicap: parsed.handicap,
        group: parsed.group,
        r1: null,
        r2: null,
        status: "active",
        ggId: "",
        liveThru: "",
        liveToPar: "",
      });
    }
    pool.golfers.sort((a, b) => a.name.localeCompare(b.name));
  });
  refresh();
}

export async function saveAllScores(formData: FormData) {
  await requireAdmin();
  await updatePool((pool) => {
    const byId = new Map(pool.golfers.map((golfer) => [golfer.id, golfer]));
    for (const [key, value] of formData.entries()) {
      const [field, id] = key.split(":");
      const golfer = byId.get(id);
      if (!golfer) continue;
      if (field === "r1") golfer.r1 = parseScore(value);
      if (field === "r2") golfer.r2 = parseScore(value);
      if (field === "handicap") golfer.handicap = parseHandicap(value);
      if (field === "group") golfer.group = parseGroupField(value);
      if (field === "status") {
        const status = String(value) as GolferStatus;
        golfer.status = ["active", "wd", "dq", "dns"].includes(status)
          ? status
          : golfer.status;
      }
    }
  });
  refresh();
}

export async function updateHandicaps(formData: FormData) {
  await requireAdmin();
  const lines = parseLines(String(formData.get("handicaps") ?? ""));
  if (lines.length === 0) throw new Error("Paste at least one name and handicap.");

  await updatePool((pool) => {
    const byKey = new Map(
      pool.golfers.map((golfer) => [nameKey(golfer.name), golfer]),
    );
    for (const line of lines) {
      const parsed = parseGolferLine(line);
      if (!parsed.name || parsed.handicap == null) continue;
      const golfer = byKey.get(nameKey(parsed.name));
      if (golfer) golfer.handicap = parsed.handicap;
    }
  });
  refresh();
}

export async function deleteGolfer(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await updatePool((pool) => {
    pool.golfers = pool.golfers.filter((golfer) => golfer.id !== id);
    for (const entry of pool.entries) {
      entry.golferIds = entry.golferIds.filter((golferId) => golferId !== id);
    }
    if (pool.settings.championId === id) pool.settings.championId = "";
  });
  refresh();
}

export async function saveEntry(
  _prev: { error?: string } | null,
  formData: FormData,
) {
  const admin = await isAdmin();
  const publicSubmit = String(formData.get("source")) === "public";
  const id = admin && !publicSubmit ? String(formData.get("id") ?? "") : "";
  const name = String(formData.get("name") ?? "").trim();
  const tiebreakerScore = parseToPar(formData.get("tiebreakerScore"));
  const golferIds = formData
    .getAll("golferIds")
    .map((value) => String(value))
    .filter(Boolean);
  const uniqueIds = [...new Set(golferIds)];

  if (!name) return { error: "Entry name is required." };
  if (tiebreakerScore == null) {
    return { error: "Pick a tiebreaker (Even, −1, +2, etc.)." };
  }
  if (publicSubmit && formData.get("willPay") !== "1") {
    return { error: "Confirm you will send the e-transfer." };
  }

  const pool = await readPool();
  if ((!admin || publicSubmit) && !pool.settings.entriesOpen) {
    return { error: "Entries are closed." };
  }
  if (publicSubmit && id) {
    return { error: "Only the desk can edit an existing entry." };
  }

  const golfersById = new Map(pool.golfers.map((golfer) => [golfer.id, golfer]));
  const picks = uniqueIds.filter((golferId) => golfersById.has(golferId));
  if (!isValidSquad(picks, golfersById, pool.settings)) {
    return {
      error: "Pick 2 golfers from each of the 4 groups.",
    };
  }

  const taken = pool.entries.some(
    (entry) =>
      entry.id !== id && entry.name.toLowerCase() === name.toLowerCase(),
  );
  if (taken) {
    return { error: "That name is already in the pool. Add a last name or initial." };
  }

  const entryId = id || crypto.randomUUID();
  const markPaid = admin && !publicSubmit && formData.get("paid") === "1";
  await updatePool((next) => {
    if (id) {
      const entry = next.entries.find((row) => row.id === id);
      if (!entry) throw new Error("Entry not found.");
      entry.name = name;
      entry.golferIds = picks;
      entry.tiebreakerScore = tiebreakerScore;
      if (admin && !publicSubmit) entry.paid = markPaid;
    } else {
      next.entries.push({
        id: entryId,
        name,
        golferIds: picks,
        tiebreakerScore,
        paid: markPaid,
        createdAt: new Date().toISOString(),
      });
    }
    next.entries.sort((a, b) => a.name.localeCompare(b.name));
  });
  await rememberEntry(entryId);
  refresh();
  redirect(
    admin && !publicSubmit
      ? "/admin/entries"
      : `/entries/${entryId}?locked=1`,
  );
}

export async function setEntryPaid(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const paid = formData.get("paid") === "1";
  await updatePool((pool) => {
    const entry = pool.entries.find((row) => row.id === id);
    if (entry) entry.paid = paid;
  });
  refresh();
}

export async function deleteEntry(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await updatePool((pool) => {
    pool.entries = pool.entries.filter((entry) => entry.id !== id);
  });
  refresh();
}

export async function connectGolfGenius(
  _prev: { error?: string; message?: string } | null,
  formData: FormData,
) {
  await requireAdmin();
  const pageUrl = String(formData.get("ggPageUrl") ?? "").trim();
  const requestedName = String(formData.get("ggEventName") ?? "").trim();
  const minutes = Math.max(1, Number(formData.get("ggSyncMinutes")) || 3);
  if (!pageUrl) return { error: "Paste a Golf Genius results page URL." };

  try {
    const { discoverBoards, pickDefaultBoard } = await import("@/lib/golfgenius");
    const discovered = await discoverBoards(pageUrl);
    const named = requestedName
      ? discovered.boards.find((board) =>
          board.name.toLowerCase().includes(requestedName.toLowerCase()),
        )
      : null;
    const board = named ?? pickDefaultBoard(discovered.boards);
    await updatePool((pool) => {
      pool.settings.ggPageUrl = discovered.pageUrl;
      pool.settings.ggLeagueId = discovered.leagueId;
      pool.settings.ggEventId = board.eventId;
      pool.settings.ggEventName = board.name;
      pool.settings.ggSyncMinutes = minutes;
    });
    refresh();
    return {
      message: `Connected to ${board.name} (${discovered.boards.length} boards on that page).`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not reach Golf Genius.",
    };
  }
}

export async function importFromGolfGenius() {
  await requireAdmin();
  const pool = await readPool();
  if (!pool.settings.ggEventId) {
    throw new Error("Connect a Golf Genius leaderboard first.");
  }
  const { fetchLeaderboard, importGolfGeniusField } = await import(
    "@/lib/golfgenius"
  );
  const snapshot = await fetchLeaderboard(pool.settings.ggEventId);
  await importGolfGeniusField(snapshot);
  refresh();
}

export async function pullGolfGeniusNow() {
  await requireAdmin();
  const { syncGolfGeniusScores } = await import("@/lib/golfgenius");
  await syncGolfGeniusScores(true);
  refresh();
}
