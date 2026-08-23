"use client";

import { useActionState } from "react";
import { saveSettings } from "@/app/actions";
import type { Golfer, Settings } from "@/lib/types";
import { groupLabel } from "@/lib/types";
import { Field } from "./Field";
import { SubmitButton } from "./SubmitButton";

export function SettingsForm({
  settings,
  golfers,
}: {
  settings: Settings;
  golfers: Golfer[];
}) {
  const [state, action] = useActionState(saveSettings, null);

  return (
    <form action={action} className="space-y-5">
      <Field label="Club name" name="clubName" defaultValue={settings.clubName} required />
      <Field
        label="Pool name"
        name="eventName"
        defaultValue={settings.eventName}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Year" name="year" type="number" defaultValue={settings.year} />
        <Field label="Dates" name="dates" defaultValue={settings.dates} />
      </div>
      <Field label="Course / venue" name="venue" defaultValue={settings.venue} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Entry fee ($)"
          name="entryFee"
          type="number"
          min={0}
          defaultValue={settings.entryFee || 15}
        />
        <Field
          label="E-transfer email"
          name="etransferEmail"
          defaultValue={settings.etransferEmail || "wellsjack771@gmail.com"}
        />
      </div>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-fairway uppercase">
          Number of groups
        </span>
        <select
          name="groupCount"
          defaultValue={settings.groupCount || 4}
          className="w-full rounded-sm border border-rule bg-paper px-3 py-2.5 outline-none focus:border-gold"
        >
          {[2, 3, 4, 5, 6].map((count) => (
            <option key={count} value={count}>
              {count} groups ({settings.picksPerGroup} picks each)
            </option>
          ))}
        </select>
        <span className="mt-1.5 block text-sm text-muted">
          Members pick {settings.picksPerGroup} golfers from each group. Golfers
          already assigned to a dropped group stay there until you reassign
          them.
        </span>
      </label>
      <label className="flex items-start gap-3 rounded-sm border border-rule bg-card px-4 py-3">
        <input
          type="checkbox"
          name="entriesOpen"
          value="1"
          defaultChecked={settings.entriesOpen}
          className="mt-1"
        />
        <span>
          <span className="block text-sm font-medium">
            Accept public entries
          </span>
          <span className="mt-1 block text-sm text-muted">
            On: anyone can submit a squad. Off: no more public entries. You can
            still add from the desk either way.
          </span>
        </span>
      </label>
      <label className="flex items-start gap-3 rounded-sm border border-rule bg-card px-4 py-3">
        <input
          type="checkbox"
          name="picksPublic"
          value="1"
          defaultChecked={settings.picksPublic}
          className="mt-1"
        />
        <span>
          <span className="block text-sm font-medium">
            Publish squads on the public board
          </span>
          <span className="mt-1 block text-sm text-muted">
            Off: only you and the person who entered can see picks. On: everyone
            can see every squad on the leaderboard.
          </span>
        </span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-fairway uppercase">
          Club Championship winner
        </span>
        <select
          name="championId"
          defaultValue={settings.championId}
          className="w-full rounded-sm border border-rule bg-paper px-3 py-2.5 outline-none focus:border-gold"
        >
          <option value="">Not decided yet</option>
          {golfers.map((golfer) => (
            <option key={golfer.id} value={golfer.id}>
              {golfer.name}
              {golfer.group ? ` · ${groupLabel(golfer.group)}` : ""}
            </option>
          ))}
        </select>
        <span className="mt-1.5 block text-sm text-muted">
          Used only to break pool ties. Closest predicted score to par of this
          winner takes the tie.
        </span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-fairway uppercase">
          Congratulations message
        </span>
        <textarea
          name="winnerMessage"
          rows={5}
          defaultValue={settings.winnerMessage ?? ""}
          placeholder="Write anything you want the winner — and everyone else — to see on the homepage."
          className="w-full rounded-sm border border-rule bg-paper px-3 py-2.5 outline-none focus:border-gold"
        />
        <span className="mt-1.5 block text-sm text-muted">
          Shows on the public congratulations page. Leave blank to show nothing
          extra.
        </span>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="New PIN (optional)"
          name="newPin"
          type="password"
          autoComplete="new-password"
        />
        <Field
          label="Confirm new PIN"
          name="confirmPin"
          type="password"
          autoComplete="new-password"
        />
      </div>
      {state?.error ? (
        <p className="text-sm text-danger">{state.error}</p>
      ) : (
        <p className="text-sm text-muted">Leave PIN blank to keep the current one.</p>
      )}
      <SubmitButton>Save settings</SubmitButton>
    </form>
  );
}
