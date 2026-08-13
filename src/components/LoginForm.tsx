"use client";

import { useActionState } from "react";
import { loginAdmin } from "@/app/actions";
import { Field } from "./Field";
import { SubmitButton } from "./SubmitButton";

export function LoginForm() {
  const [state, action] = useActionState(loginAdmin, null);

  return (
    <form action={action} className="space-y-5">
      <Field
        label="Admin PIN"
        name="pin"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
      />
      {state?.error ? (
        <p className="text-sm text-danger">{state.error}</p>
      ) : null}
      <SubmitButton pendingLabel="Checking…">Enter</SubmitButton>
    </form>
  );
}
