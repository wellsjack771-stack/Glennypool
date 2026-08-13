"use client";

import { useActionState } from "react";
import { completeSetup } from "@/app/actions";
import { Field } from "./Field";
import { SubmitButton } from "./SubmitButton";

export function SetupForm() {
  const [state, action] = useActionState(completeSetup, null);
  const year = new Date().getFullYear();

  return (
    <form action={action} className="space-y-5">
      <Field
        label="Club name"
        name="clubName"
        placeholder="Riverside Golf Club"
        required
        autoFocus
      />
      <Field
        label="Pool name"
        name="eventName"
        defaultValue="Club Championship Pool"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Year" name="year" type="number" defaultValue={year} />
        <Field label="Dates" name="dates" placeholder="Aug 22–23" />
      </div>
      <Field
        label="Course / venue"
        name="venue"
        placeholder="Championship course"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Admin PIN"
          name="pin"
          type="password"
          required
          autoComplete="new-password"
        />
        <Field
          label="Confirm PIN"
          name="confirmPin"
          type="password"
          required
          autoComplete="new-password"
        />
      </div>
      {state?.error ? (
        <p className="text-sm text-danger">{state.error}</p>
      ) : null}
      <SubmitButton pendingLabel="Opening the books…">
        Open the pool
      </SubmitButton>
    </form>
  );
}
