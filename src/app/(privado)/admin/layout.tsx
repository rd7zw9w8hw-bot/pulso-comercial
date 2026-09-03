import type { ReactNode } from "react";
import { requerirAdmin } from "@/lib/auth";

export default async function LayoutAdmin({
  children,
}: {
  children: ReactNode;
}) {
  await requerirAdmin();
  return <>{children}</>;
}
