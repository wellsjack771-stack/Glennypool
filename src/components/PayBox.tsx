"use client";

import { useState } from "react";

export function PayBox({
  fee,
  email,
  confirm = false,
  locked = false,
}: {
  fee: number;
  email: string;
  cutoff?: string;
  confirm?: boolean;
  locked?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  function fallbackCopy(text: string) {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "0";
    field.style.left = "0";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.focus();
    field.select();
    field.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(field);
    if (!ok) throw new Error("copy failed");
  }

  async function copy() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
      } else {
        fallbackCopy(email);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        fallbackCopy(email);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        window.prompt("Copy this e-transfer email:", email);
      }
    }
  }

  return (
    <div className="border border-gold bg-gold-soft/25 px-4 py-4">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-gold uppercase">
        {locked ? "Squad locked · now pay" : `${fee} e-transfer`}
      </p>
      <p className="mt-2 text-sm leading-6 text-ink">
        Send an Interac e-transfer of{" "}
        <span className="font-semibold">${fee}</span> to{" "}
        <a
          href={`mailto:${email}?subject=Club%20Championship%20Pool`}
          className="font-semibold text-fairway underline decoration-gold/60"
        >
          {email}
        </a>
        . You stay unpaid on the leaderboard until Jack confirms it.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className="rounded-sm border border-rule bg-card px-3 py-1.5 text-sm text-fairway"
        >
          {copied ? "Copied" : "Copy email"}
        </button>
        <a
          href={`mailto:${email}?subject=Club%20Championship%20Pool&body=Here%20is%20my%20%24${fee}%20pool%20entry.`}
          className="rounded-sm bg-pine px-3 py-1.5 text-sm font-semibold text-cream"
        >
          Open mail
        </a>
      </div>
      {confirm ? (
        <label className="mt-4 flex items-start gap-3 text-sm">
          <input type="checkbox" name="willPay" value="1" required className="mt-1" />
          <span>
            I will send ${fee} e-transfer to {email} now.
          </span>
        </label>
      ) : null}
    </div>
  );
}
