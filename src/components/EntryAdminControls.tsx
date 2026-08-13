"use client";

import { deleteEntry, setEntryPaid } from "@/app/actions";

export function EntryAdminControls({
  id,
  name,
  paid,
}: {
  id: string;
  name: string;
  paid: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <form action={setEntryPaid}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="paid" value={paid ? "0" : "1"} />
        <button
          type="submit"
          className={paid ? "text-muted" : "font-semibold text-fairway"}
        >
          {paid ? "Undo paid" : "Mark paid"}
        </button>
      </form>
      <form
        action={deleteEntry}
        onSubmit={(event) => {
          if (!window.confirm(`Delete ${name}'s entry? This cannot be undone.`)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="text-danger">
          Delete
        </button>
      </form>
    </div>
  );
}
