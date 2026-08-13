import { redirect } from "next/navigation";
import { readPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pool = await readPool();
  if (!pool.settings.setupComplete) redirect("/setup");
  return children;
}
