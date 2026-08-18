import { redirect } from "next/navigation";

export default function RootPage() {
  // Cosimo is the default surface (R17) — the root lands straight on it.
  redirect("/app/new-user-pitch");
}
