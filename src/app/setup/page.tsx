import { redirect } from "next/navigation";
import { SetupForm } from "@/components/SetupForm";
import { readPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const pool = await readPool();
  if (pool.settings.setupComplete) {
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-[11px] tracking-[0.22em] text-gold uppercase">
        First tee
      </p>
      <h1 className="display mt-2 text-4xl text-pine">Set up your pool</h1>
      <p className="mt-3 mb-8 text-muted">
        This is the only time the site is open without a PIN. Choose a PIN you
        can share with a co-chair if you want help posting scores.
      </p>
      <div className="panel p-6 sm:p-8">
        <SetupForm />
      </div>
    </div>
  );
}
