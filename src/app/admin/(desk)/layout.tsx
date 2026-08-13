import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <div>
      <AdminNav />
      {children}
    </div>
  );
}
