"use client";

import { useActionState, useMemo, useState } from "react";
import { saveEntry } from "@/app/actions";
import { formatHandicap, formatToPar, TIEBREAKER_OPTIONS } from "@/lib/format";
import { groupCounts } from "@/lib/scoring";
import {
  GROUPS,
  groupLabel,
  picksCount,
  teeWindow,
  type Entry,
  type Golfer,
  type GroupId,
  type Settings,
} from "@/lib/types";
import { Field } from "./Field";
import { PayBox } from "./PayBox";
import { SubmitButton } from "./SubmitButton";

function sortGolfers(a: Golfer, b: Golfer) {
  const hcp = (a.handicap ?? 99) - (b.handicap ?? 99);
  if (hcp !== 0) return hcp;
  return a.name.localeCompare(b.name);
}

export function EntryPicker({
  golfers,
  entry,
  settings,
  publicEntry = false,
  cutoff = "the first tee time Saturday",
}: {
  golfers: Golfer[];
  entry?: Entry;
  settings: Pick<
    Settings,
    | "groupCount"
    | "picksPerGroup"
    | "entryFee"
    | "etransferEmail"
    | "dates"
    | "year"
  >;
  publicEntry?: boolean;
  cutoff?: string;
}) {
  const [state, action] = useActionState(saveEntry, null);
  const [selected, setSelected] = useState<string[]>(entry?.golferIds ?? []);
  const [query, setQuery] = useState("");
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const byId = useMemo(
    () => new Map(golfers.map((golfer) => [golfer.id, golfer])),
    [golfers],
  );
  const counts = groupCounts(selected, byId);
  const totalNeeded = picksCount(settings);
  const needle = query.trim().toLowerCase();

  function toggle(id: string, group: GroupId) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      const inGroup = current.filter((value) => byId.get(value)?.group === group);
      if (inGroup.length >= settings.picksPerGroup) return current;
      return [...current, id];
    });
  }

  const grouped = GROUPS.slice(0, settings.groupCount).map((group) => {
    const list = golfers
      .filter((golfer) => golfer.group === group)
      .sort(sortGolfers)
      .filter(
        (golfer) =>
          !needle ||
          golfer.name.toLowerCase().includes(needle) ||
          formatHandicap(golfer.handicap).includes(needle),
      );
    return {
      group,
      golfers: list,
      window: teeWindow(golfers.filter((golfer) => golfer.group === group)),
    };
  });
  const ungrouped = golfers.filter((golfer) => golfer.group == null);
  const ready = grouped.every(
    ({ group }) => golfers.some((golfer) => golfer.group === group),
  );

  return (
    <form action={action} className="space-y-6">
      {entry ? <input type="hidden" name="id" value={entry.id} /> : null}
      {publicEntry ? <input type="hidden" name="source" value="public" /> : null}
      {selected.map((id) => (
        <input key={id} type="hidden" name="golferIds" value={id} />
      ))}
      <Field
        label={publicEntry ? "Your name" : "Pool entry name"}
        name="name"
        defaultValue={entry?.name}
        required
      />
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-fairway uppercase">
          Tiebreaker · champion&apos;s 36-hole score to par
        </span>
        <select
          name="tiebreakerScore"
          required
          defaultValue={
            entry?.tiebreakerScore != null ? String(entry.tiebreakerScore) : ""
          }
          className="w-full rounded-sm border border-rule bg-paper px-3 py-2.5 outline-none focus:border-gold"
        >
          <option value="" disabled>
            Even, −1, +1…
          </option>
          {TIEBREAKER_OPTIONS.map((rel) => (
            <option key={rel} value={rel}>
              {formatToPar(rel)}
            </option>
          ))}
        </select>
      </label>
      {!ready ? (
        <p className="text-sm text-danger">
          Assign every golfer to Group A–D before taking entries. Each squad
          needs 2 from each group.
        </p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-4">
        {grouped.map(({ group }) => {
          const picks = selected
            .map((id) => byId.get(id))
            .filter((golfer): golfer is Golfer => golfer?.group === group);
          return (
            <div key={group} className="border border-rule bg-card px-3 py-2">
              <p className="text-[11px] tracking-[0.16em] text-gold uppercase">
                {groupLabel(group)} · {picks.length}/{settings.picksPerGroup}
              </p>
              {picks.length === 0 ? (
                <p className="mt-1 text-sm text-muted">Pick 2</p>
              ) : (
                <ul className="mt-1 space-y-0.5 text-sm">
                  {picks.map((golfer) => (
                    <li key={golfer.id}>{golfer.name}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="block flex-1">
          <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-fairway uppercase">
            Find a golfer
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or handicap"
            className="w-full rounded-sm border border-rule bg-paper px-3 py-2.5 outline-none focus:border-gold"
          />
        </label>
        <p className="score text-sm text-muted">
          {selected.length}/{totalNeeded}
        </p>
      </div>

      <div className="space-y-5">
        {grouped.map(({ group, golfers: list, window }) => {
          const taken = counts.get(group) ?? 0;
          const full = taken >= settings.picksPerGroup;
          return (
            <section key={group} className="border border-rule">
              <div className="flex items-center justify-between bg-pine px-4 py-2.5 text-[11px] tracking-[0.16em] text-gold-soft uppercase">
                <span>
                  {groupLabel(group)}
                  {window ? ` · ${window}` : ""}
                </span>
                <span className="score">
                  {taken}/{settings.picksPerGroup}
                </span>
              </div>
              <div className="max-h-[28rem] overflow-y-auto">
                {list.map((golfer) => {
                  const on = selectedSet.has(golfer.id);
                  const locked = full && !on;
                  return (
                    <button
                      key={golfer.id}
                      type="button"
                      disabled={locked}
                      onClick={() => toggle(golfer.id, group)}
                      className={`flex w-full items-center justify-between gap-3 border-b border-rule px-4 py-2.5 text-left text-sm last:border-b-0 ${
                        on
                          ? "bg-gold-soft/35"
                          : locked
                            ? "bg-card text-muted"
                            : "bg-card hover:bg-cream"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="font-medium">{golfer.name}</span>
                        {golfer.liveThru ? (
                          <span className="ml-2 text-xs text-muted">
                            {golfer.liveThru}
                          </span>
                        ) : null}
                      </span>
                      <span className="flex shrink-0 items-center gap-3">
                        <span className="score text-muted">
                          {formatHandicap(golfer.handicap)}
                        </span>
                        <span className="w-16 text-right text-xs tracking-[0.14em] text-gold uppercase">
                          {on ? "Selected" : locked ? "Full" : "Add"}
                        </span>
                      </span>
                    </button>
                  );
                })}
                {list.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-muted">
                    {needle ? "No matches in this group." : "No golfers yet."}
                  </p>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
      {ungrouped.length > 0 ? (
        <p className="text-sm text-muted">
          {ungrouped.length} golfer{ungrouped.length === 1 ? "" : "s"} still
          ungrouped and cannot be picked.
        </p>
      ) : null}
      {publicEntry ? (
        <PayBox
          fee={settings.entryFee || 15}
          email={settings.etransferEmail || "wellsjack771@gmail.com"}
          cutoff={cutoff}
          confirm
        />
      ) : (
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="paid"
            value="1"
            defaultChecked={Boolean(entry?.paid)}
            className="mt-1"
          />
          <span>Already paid — show a check mark on the board.</span>
        </label>
      )}
      {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <SubmitButton>
        {entry ? "Save entry" : publicEntry ? "Lock in my squad" : "Add entry"}
      </SubmitButton>
    </form>
  );
}
