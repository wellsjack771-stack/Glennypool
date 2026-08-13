"use client";

import { useActionState } from "react";
import { connectGolfGenius } from "@/app/actions";
import type { Settings } from "@/lib/types";
import { Field } from "./Field";
import { SubmitButton } from "./SubmitButton";

export function GolfGeniusForm({ settings }: { settings: Settings }) {
  const [state, action] = useActionState(connectGolfGenius, null);

  return (
    <form action={action} className="space-y-5">
      <Field
        label="Golf Genius results page"
        name="ggPageUrl"
        defaultValue={
          settings.ggPageUrl ||
          "https://www.golfgenius.com/pages/12344124114598913219"
        }
        placeholder="https://www.golfgenius.com/pages/..."
        required
      />
      <Field
        label="Leaderboard name"
        name="ggEventName"
        defaultValue={settings.ggEventName || "Overall - Men's Club Championship"}
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
      {state?.message ? <p className="text-sm text-fairway">{state.message}</p> : null}
      {settings.ggEventId ? (
        <p className="text-sm text-muted">
          Connected to <span className="text-ink">{settings.ggEventName}</span>.
          {settings.ggLastSyncStatus ? ` Last pull: ${settings.ggLastSyncStatus}.` : ""}
        </p>
      ) : null}
      <SubmitButton pendingLabel="Checking Golf Genius…">
        Connect leaderboard
      </SubmitButton>
    </form>
  );
}
