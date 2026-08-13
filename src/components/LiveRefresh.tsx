"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function LiveRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();
  const [updated, setUpdated] = useState<string>("");

  useEffect(() => {
    const stamp = () =>
      setUpdated(
        new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      );
    stamp();
    const id = setInterval(() => {
      router.refresh();
      stamp();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);

  return (
    <p className="text-xs tracking-wide text-moss">
      Live board · refreshes every {seconds}s
      {updated ? ` · ${updated}` : ""}
    </p>
  );
}
