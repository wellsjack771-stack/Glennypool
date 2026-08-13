import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { isAdmin } from "@/lib/auth";
import { readPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const pool = await readPool();
  if (!pool.settings.setupComplete) redirect("/setup");
  if (await isAdmin()) redirect("/admin");

  return (
    <div className="mx-auto max-w-md">
      <p className="text-[11px] tracking-[0.22em] text-gold uppercase">
        Committee desk
      </p>
      <h1 className="display mt-2 text-4xl text-pine">Admin</h1>
      <p className="mt-3 mb-8 text-muted">
        Enter the pool PIN to add golfers, post scores, and manage entries.
      </p>
      <div className="panel p-6 sm:p-8">
        <LoginForm />
      </div>
    </div>
  );
}
