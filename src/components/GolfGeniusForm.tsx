"use client";

import { useActionState } from "react";
import { connectGolfGenius, disconnectGolfGenius } from "@/app/actions";
import type { Settings } from "@/lib/types";
import { Field } from "./Field";
import { SubmitButton } from "./SubmitButton";

export function GolfGeniusForm({ settings }: { settings: Settings }) {
  const [state, action] = useActionState(connectGolfGenius, null);
  const connected = Boolean(settings.ggEventId);

  return (
    <div className="space-y-6">
      {connected ? (
        <div className="rounded-sm border border-rule bg-card px-4 py-3">
          <p className="text-sm text-ink">
            Connected to{" "}
            <span className="font-medium">{settings.ggEventName}</span>.
            {settings.ggLastSyncStatus
              ? ` Last pull: ${settings.ggLastSyncStatus}.`
              : ""}
          </p>
          <p className="mt-1 text-sm text-muted">
            Disconnect to stop pulling this board. Live scores clear; names and
            groups stay. Connect Glen Arbour when that page is ready.
          </p>
          <form action={disconnectGolfGenius} className="mt-3">
            <button
              type="submit"
              className="rounded-sm border border-rule px-4 py-2 text-sm font-semibold text-danger"
            >
              Disconnect Golf Genius
            </button>
          </form>
        </div>
      ) : (
        <p className="text-sm text-muted">
          Nothing connected. Paste a Golf Genius results page when you have one.
          Until then the pool will not pull live scores.
        </p>
      )}
      <form action={action} className="space-y-5">
        <Field
          label="Golf Genius results page"
          name="ggPageUrl"
          defaultValue={settings.ggPageUrl}
          placeholder="https://www.golfgenius.com/pages/..."
          required
        />
        <Field
          label="Leaderboard name"
          name="ggEventName"
          defaultValue={settings.ggEventName}
          placeholder="Overall - Men's Club Championship"
        />
        <Field
          label="Sync every (minutes)"
          name="ggSyncMinutes"
          type="number"
          min={1}
          max={30}
          defaultValue={settings.ggSyncMinutes || 3}
        />
        {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
        {state?.message ? (
          <p className="text-sm text-fairway">{state.message}</p>
        ) : null}
        <SubmitButton pendingLabel="Checking Golf Genius…">
          {connected ? "Replace leaderboard" : "Connect leaderboard"}
        </SubmitButton>
      </form>
    </div>
  );
}
