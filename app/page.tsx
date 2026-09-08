import { redirect } from "next/navigation";

export default function RootPage() {
  // Return exp1 · v2 is the default surface (user call, 2026-09-08) — the root
  // lands straight on it, and its Entry flag defaults to the Feed.
  redirect("/app/return-exp1-v2");
}
