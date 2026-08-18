import { redirect } from "next/navigation";

export default function AppIndexPage() {
  // Cosimo is the default surface — the bare /app path lands straight on it,
  // same as the root (R19).
  redirect("/app/new-user-pitch");
}
