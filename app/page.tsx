import { redirect } from "next/navigation";

export default function RootPage() {
  // The transaction category update is the default surface (user pin
  // 2026-10-16: "make this default, load when vercel is loaded"); Return exp1
  // · v2 was before it (user call, 2026-09-08).
  redirect("/app/recat");
}
